// Run with: `npm run sync`
// Pulls all streams from a YouTube channel using the Data API v3.
// Writes data/streams.json + data/channel.json.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { config as loadEnv } from "dotenv";
import type { Short, Stream } from "../lib/types";
import { listManualEvents, updateManualEvent } from "../lib/manual";
import { appendLog } from "../lib/sync-log";
import { fetchAllStreams, resolveChannelId } from "../lib/youtube";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE ?? "@SelçukPeköz";
const SHORTS_LIMIT = Number(process.env.SHORTS_LIMIT ?? "60");
const STREAMS_OUT = join(process.cwd(), "data", "streams.json");
const SHORTS_OUT = join(process.cwd(), "data", "shorts.json");
const CHANNEL_OUT = join(process.cwd(), "data", "channel.json");

function bestThumb(e: { thumbnailUrl?: string }): string {
  return e.thumbnailUrl || "";
}

const MATCH_WINDOW_MS = 1 * 3600 * 1000;

function findMatchingStream(
  manualTitle: string,
  manualISO: string,
  streams: Stream[],
): Stream | null {
  const manualMs = new Date(manualISO).getTime();
  const candidates = streams.filter((s) => {
    const sMs = new Date(s.actualStartAt ?? s.scheduledAt).getTime();
    return Math.abs(sMs - manualMs) <= MATCH_WINDOW_MS;
  });
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const tokenize = (t: string) =>
    t
      .toLocaleLowerCase("tr-TR")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3);
  const manualTokens = new Set(tokenize(manualTitle));

  let best: { s: Stream; score: number } | null = null;
  for (const s of candidates) {
    const sTokens = new Set(tokenize(s.title));
    let shared = 0;
    for (const w of manualTokens) if (sTokens.has(w)) shared++;
    const dt = Math.abs(
      new Date(s.actualStartAt ?? s.scheduledAt).getTime() - manualMs,
    );
    const score = shared * 3600000 - dt;
    if (!best || score > best.score) best = { s, score };
  }
  return best?.s ?? null;
}

async function main() {
  const handleNoAt = HANDLE.replace(/^@/, "");
  const knownChannelId = process.env.YOUTUBE_CHANNEL_ID;

  let channelId: string;
  let channelTitle: string;

  if (knownChannelId) {
    channelId = knownChannelId;
    channelTitle = HANDLE;
    console.log(`→ Kanal ID: ${channelId}`);
  } else {
    console.log(`→ Kanal çözümleniyor: ${HANDLE}`);
    const ch = await resolveChannelId(handleNoAt);
    channelId = ch.id;
    channelTitle = ch.title;
    console.log(`✓ Kanal: ${channelTitle} (${channelId})`);
  }

  mkdirSync(dirname(CHANNEL_OUT), { recursive: true });
  writeFileSync(
    CHANNEL_OUT,
    JSON.stringify({ handle: HANDLE, id: channelId, title: channelTitle }, null, 2),
  );

  console.log(`→ Yayınlar (live/completed/upcoming) çekiliyor…`);
  const streams = await fetchAllStreams(channelId);
  console.log(`✓ ${streams.length} yayın alındı`);

  // Sort newest first; assign episode numbers oldest-to-newest so they're stable.
  streams.sort(
    (a, b) =>
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );
  const oldestFirst = [...streams].reverse();
  oldestFirst.forEach((s, i) => {
    s.episodeNo = i + 1;
  });

  // Safety: refuse to overwrite the live file with a tiny fetch.
  let prevCount = 0;
  if (existsSync(STREAMS_OUT)) {
    try {
      const prev = JSON.parse(readFileSync(STREAMS_OUT, "utf8")) as {
        streams?: Stream[];
      };
      prevCount = prev.streams?.length ?? 0;
    } catch {
      prevCount = 0;
    }
  }
  const minAcceptable = Math.max(10, Math.floor(prevCount * 0.5));
  if (streams.length < minAcceptable) {
    throw new Error(
      `Sync sonucu (${streams.length}) mevcut veriden çok düşük (${prevCount}). ` +
        `Mevcut streams.json korundu.`,
    );
  }

  mkdirSync(dirname(STREAMS_OUT), { recursive: true });
  writeFileSync(
    STREAMS_OUT,
    JSON.stringify(
      {
        syncedAt: new Date().toISOString(),
        channelId,
        channelTitle,
        handle: HANDLE,
        streams,
      },
      null,
      2,
    ),
  );

  const counts = streams.reduce<Record<string, number>>((a, s) => {
    a[s.kind] = (a[s.kind] ?? 0) + 1;
    return a;
  }, {});
  console.log(`✓ Yazıldı: ${STREAMS_OUT}`);
  console.log(
    `  upcoming=${counts.upcoming ?? 0}  live=${counts.live ?? 0}  completed=${counts.completed ?? 0}`,
  );

  // ── Manual events auto-link ───────────────────────────────────────────
  const manuals = (await listManualEvents()).filter((m) => !m.youtubeId);
  if (manuals.length > 0) {
    console.log(`\n→ Manuel yayınlar eşleştiriliyor (${manuals.length} aday)…`);
    let matched = 0;
    for (const m of manuals) {
      const match = findMatchingStream(m.title, m.scheduledAt, streams);
      if (match) {
        await updateManualEvent(m.id, {
          youtubeId: match.id,
          matchedAt: new Date().toISOString(),
        });
        console.log(`  ✓ ${m.title.slice(0, 50)} → ${match.id}`);
        matched++;
      }
    }
    console.log(`  ${matched}/${manuals.length} eşleşti`);
  }
}

const startedAt = new Date();
main()
  .then(async () => {
    const finishedAt = new Date();
    await appendLog({
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      kind: process.env.SYNC_TRIGGER === "manual" ? "manual-trigger" : "full",
      ok: true,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      message: "Sync tamamlandı",
    });
  })
  .catch(async (err) => {
    const finishedAt = new Date();
    const errMsg = (err && (err.message ?? String(err))) || "bilinmeyen hata";
    console.error("× Sync başarısız:", errMsg);
    await appendLog({
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      kind: process.env.SYNC_TRIGGER === "manual" ? "manual-trigger" : "full",
      ok: false,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      message: "Sync başarısız",
      error: errMsg,
    });
    process.exit(1);
  });
