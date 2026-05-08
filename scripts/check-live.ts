// Run with: `npm run check-live`
// Light-weight job: re-fetches only the streams currently flagged `live`
// to detect when they end. Cheaper than a full sync, safe to run every
// few minutes.

import { spawn } from "node:child_process";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Stream, StreamKind } from "../lib/types";

const STREAMS_PATH = join(process.cwd(), "data", "streams.json");

type YtDlpVideo = {
  id: string;
  title?: string;
  live_status?: "is_live" | "is_upcoming" | "was_live" | "not_live" | null;
  duration?: number | null;
  view_count?: number | null;
  concurrent_view_count?: number | null;
  release_timestamp?: number | null;
};

function ytDlpFetch(id: string): Promise<YtDlpVideo | null> {
  return new Promise((resolve) => {
    const child = spawn(
      "yt-dlp",
      [
        "-j",
        "--skip-download",
        "--no-warnings",
        "--ignore-errors",
        `https://www.youtube.com/watch?v=${id}`,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let buf = "";
    child.stdout.on("data", (c) => {
      buf += c.toString("utf8");
    });
    child.on("error", () => resolve(null));
    child.on("close", () => {
      const line = buf.split("\n").find((l) => l.trim().startsWith("{"));
      if (!line) return resolve(null);
      try {
        resolve(JSON.parse(line) as YtDlpVideo);
      } catch {
        resolve(null);
      }
    });
  });
}

function classify(v: YtDlpVideo, prevKind: StreamKind): StreamKind {
  switch (v.live_status) {
    case "is_live":
      return "live";
    case "is_upcoming":
      return "upcoming";
    case "was_live":
      return "completed";
    default:
      // If status missing but stream has finite duration → completed
      if (v.duration && v.duration > 0) return "completed";
      return prevKind;
  }
}

async function main() {
  if (!existsSync(STREAMS_PATH)) {
    console.log("data/streams.json yok, atlandı.");
    return;
  }
  const raw = readFileSync(STREAMS_PATH, "utf8");
  const file = JSON.parse(raw) as { streams: Stream[]; syncedAt?: string };
  const live = file.streams.filter((s) => s.kind === "live");

  if (live.length === 0) {
    console.log("Canlı yayın yok — kontrole gerek yok.");
    return;
  }

  console.log(`→ ${live.length} canlı yayın kontrol ediliyor…`);
  let updated = 0;

  for (const s of live) {
    const v = await ytDlpFetch(s.id);
    if (!v) {
      console.log(`  ? ${s.id} — yt-dlp veri vermedi`);
      continue;
    }
    const newKind = classify(v, s.kind);
    if (newKind !== s.kind) {
      s.kind = newKind;
      if (newKind === "completed") {
        s.actualEndAt = new Date().toISOString();
        s.durationSec = v.duration ?? s.durationSec ?? null;
        if (typeof v.view_count === "number") s.viewCount = v.view_count;
        s.concurrentViewers = null;
      }
      updated++;
      console.log(`  ✓ ${s.id} → ${newKind}`);
    } else if (newKind === "live") {
      // Refresh viewer count even if still live
      if (typeof v.concurrent_view_count === "number") {
        s.concurrentViewers = v.concurrent_view_count;
      }
      if (typeof v.view_count === "number") s.viewCount = v.view_count;
      console.log(
        `  · ${s.id} hala canlı (${v.concurrent_view_count ?? "?"} izleyici)`,
      );
    }
  }

  // Always rewrite — even if just to refresh viewer counts.
  file.syncedAt = new Date().toISOString();
  writeFileSync(STREAMS_PATH, JSON.stringify(file, null, 2));
  console.log(
    updated > 0
      ? `✓ ${updated} yayın güncellendi.`
      : "Durum aynı — sadece izleyici sayıları yenilendi.",
  );
}

main().catch((err) => {
  console.error("× check-live başarısız:", err.message ?? err);
  process.exit(1);
});
