import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Stream } from "../lib/types";
import { appendLog } from "../lib/sync-log";

const STREAMS_PATH = join(process.cwd(), "data", "streams.json");
const API = "https://www.googleapis.com/youtube/v3";

function key(): string {
  return (
    process.env.YT_API_KEY ||
    process.env.YOUTUBE_API_KEY ||
    ""
  );
}

async function fetchVideoStatus(
  id: string,
): Promise<{ isLive: boolean; isCompleted: boolean; concurrentViewers: number | null; viewCount: number | null } | null> {
  const k = key();
  if (!k) return null;
  const url = `${API}/videos?part=liveStreamingDetails,statistics&id=${id}&key=${k}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      items?: Array<{
        liveStreamingDetails?: {
          actualStartTime?: string;
          actualEndTime?: string;
          concurrentViewers?: string;
        };
        statistics?: { viewCount?: string };
      }>;
    };
    const v = data.items?.[0];
    if (!v) return null;
    const live = v.liveStreamingDetails;
    if (!live) return { isLive: false, isCompleted: true, concurrentViewers: null, viewCount: null };
    return {
      isLive: !!live.actualStartTime && !live.actualEndTime,
      isCompleted: !!live.actualEndTime,
      concurrentViewers: live.concurrentViewers ? Number(live.concurrentViewers) : null,
      viewCount: v.statistics?.viewCount ? Number(v.statistics.viewCount) : null,
    };
  } catch {
    return null;
  }
}

async function main() {
  if (!existsSync(STREAMS_PATH)) {
    console.log("data/streams.json yok, atlandı.");
    return;
  }

  if (!key()) {
    console.log("YT_API_KEY tanımlı değil, kontrol atlandı.");
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
    const status = await fetchVideoStatus(s.id);
    if (!status) {
      console.log(`  ? ${s.id} — API veri vermedi`);
      continue;
    }
    if (status.isCompleted || (!status.isLive && s.kind === "live")) {
      s.kind = "completed";
      s.actualEndAt = new Date().toISOString();
      if (status.viewCount != null) s.viewCount = status.viewCount;
      s.concurrentViewers = null;
      updated++;
      console.log(`  ✓ ${s.id} → completed`);
    } else if (status.isLive) {
      if (status.concurrentViewers != null) s.concurrentViewers = status.concurrentViewers;
      if (status.viewCount != null) s.viewCount = status.viewCount;
      console.log(`  · ${s.id} hala canlı (${status.concurrentViewers ?? "?"} izleyici)`);
    }
  }

  file.syncedAt = new Date().toISOString();
  writeFileSync(STREAMS_PATH, JSON.stringify(file, null, 2));
  console.log(
    updated > 0
      ? `✓ ${updated} yayın güncellendi.`
      : "Durum aynı — sadece izleyici sayıları yenilendi.",
  );
}

const startedAt = new Date();
main()
  .then(async () => {
    const finishedAt = new Date();
    await appendLog({
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      kind: "live-check",
      ok: true,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      message: "Canlı yayın kontrolü tamamlandı",
    });
  })
  .catch(async (err) => {
    const finishedAt = new Date();
    const errMsg = (err && (err.message ?? String(err))) || "bilinmeyen hata";
    console.error("× check-live başarısız:", errMsg);
    await appendLog({
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      kind: "live-check",
      ok: false,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      message: "Canlı yayın kontrolü başarısız",
      error: errMsg,
    });
    process.exit(1);
  });
