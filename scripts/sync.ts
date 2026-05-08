// Run with: `npm run sync`
// Pulls all streams from a YouTube channel using yt-dlp (no API key needed).
// Writes data/streams.json + data/channel.json.

import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { config as loadEnv } from "dotenv";
import type { Short, Stream, StreamKind } from "../lib/types";
import { listManualEvents, updateManualEvent } from "../lib/manual";
import { appendLog } from "../lib/sync-log";
import { resolveCookiesPath } from "../lib/cookies";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE ?? "@SelçukPeköz";
const PLAYLIST_END = Number(process.env.SYNC_LIMIT ?? "5000");
const SHORTS_LIMIT = Number(process.env.SHORTS_LIMIT ?? "60");
const STREAMS_OUT = join(process.cwd(), "data", "streams.json");
const SHORTS_OUT = join(process.cwd(), "data", "shorts.json");
const CHANNEL_OUT = join(process.cwd(), "data", "channel.json");

type YtDlpEntry = {
  id: string;
  title: string;
  description?: string | null;
  live_status?: "is_live" | "is_upcoming" | "was_live" | "not_live" | null;
  is_live?: boolean;
  release_timestamp?: number | null;
  release_date?: string | null;
  upload_date?: string | null;
  timestamp?: number | null;
  duration?: number | null;
  view_count?: number | null;
  concurrent_view_count?: number | null;
  thumbnail?: string | null;
  thumbnails?: Array<{ url: string; width?: number; height?: number }>;
  channel?: string | null;
  channel_id?: string | null;
  webpage_url?: string | null;
};

const PALETTE_POOL: Array<[string, string, string]> = [
  ["#1a1a2e", "#e94560", "#0f3460"],
  ["#2d1b3d", "#ff6b35", "#1a1a2e"],
  ["#0f0f1e", "#00d4ff", "#7c3aed"],
  ["#1a0f1f", "#fbbf24", "#dc2626"],
  ["#0a1929", "#10b981", "#1e3a8a"],
  ["#1f1a17", "#f97316", "#7c2d12"],
  ["#16101e", "#ec4899", "#312e81"],
  ["#0d1421", "#06b6d4", "#1e293b"],
  ["#211a0f", "#eab308", "#422006"],
  ["#1c0e15", "#ef4444", "#450a0a"],
  ["#0f1c14", "#22c55e", "#14532d"],
];

function paletteFor(id: string): [string, string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PALETTE_POOL[Math.abs(h) % PALETTE_POOL.length];
}

function bestThumb(e: YtDlpEntry): string {
  if (e.thumbnail) return e.thumbnail;
  if (e.thumbnails && e.thumbnails.length > 0) {
    // Pick widest with reasonable height (avoid banner crops)
    const sorted = [...e.thumbnails]
      .filter((t) => (t.height ?? 0) >= 80)
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
    if (sorted[0]) return sorted[0].url;
    return e.thumbnails[e.thumbnails.length - 1].url;
  }
  return `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg`;
}

function isoFromYtDlp(e: YtDlpEntry): string {
  const ts = e.release_timestamp ?? e.timestamp ?? null;
  if (typeof ts === "number") return new Date(ts * 1000).toISOString();
  // YYYYMMDD fallback
  const ds = e.release_date ?? e.upload_date ?? null;
  if (ds && /^\d{8}$/.test(ds)) {
    const y = ds.slice(0, 4);
    const m = ds.slice(4, 6);
    const d = ds.slice(6, 8);
    return `${y}-${m}-${d}T00:00:00.000Z`;
  }
  return new Date().toISOString();
}

function kindFromLiveStatus(e: YtDlpEntry): StreamKind | null {
  switch (e.live_status) {
    case "is_live":
      return "live";
    case "is_upcoming":
      return "upcoming";
    case "was_live":
      return "completed";
    case "not_live":
    default:
      return null; // not a livestream — skip
  }
}

function entryToStream(e: YtDlpEntry): Stream | null {
  const kind = kindFromLiveStatus(e);
  if (!kind) return null;
  const scheduledAt = isoFromYtDlp(e);
  return {
    id: e.id,
    kind,
    title: e.title,
    scheduledAt,
    actualStartAt: kind === "live" || kind === "completed" ? scheduledAt : null,
    actualEndAt: null,
    durationSec: kind === "completed" ? (e.duration ?? null) : null,
    viewCount: e.view_count ?? null,
    concurrentViewers: e.concurrent_view_count ?? null,
    palette: paletteFor(e.id),
    episodeNo: 0,
    thumbnailUrl: bestThumb(e),
    description: e.description ?? "",
  };
}

type ChannelInfo = { id: string; title: string };

async function ytDlpStream(
  url: string,
  limit: number,
): Promise<{ entries: YtDlpEntry[]; channel?: ChannelInfo }> {
  return new Promise((resolve, reject) => {
    const args = [
      "-j",
      "--skip-download",
      "--no-warnings",
      "--ignore-errors",
      "--playlist-end",
      String(limit),
    ];
    const cookies = resolveCookiesPath();
    if (cookies) args.push("--cookies", cookies);
    args.push(url);
    const child = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
    const entries: YtDlpEntry[] = [];
    let channel: ChannelInfo | undefined;
    let buf = "";
    let stderr = "";
    let n = 0;

    child.stdout.on("data", (chunk) => {
      buf += chunk.toString("utf8");
      let i: number;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        try {
          const obj = JSON.parse(line) as YtDlpEntry;
          if (obj.id && obj.title !== undefined) {
            entries.push(obj);
            if (!channel && obj.channel_id && obj.channel) {
              channel = { id: obj.channel_id, title: obj.channel };
            }
            n++;
            if (n % 10 === 0) process.stdout.write(`  · ${n}…\n`);
          }
        } catch {
          /* ignore non-JSON lines (progress, etc.) */
        }
      }
    });

    child.stderr.on("data", (c) => {
      stderr += c.toString("utf8");
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0 && entries.length === 0) {
        reject(
          new Error(`yt-dlp ${code} hatasıyla çıktı:\n${stderr.slice(0, 800)}`),
        );
        return;
      }
      resolve({ entries, channel });
    });
  });
}

// Match a manual event to a YouTube stream that started within ±1 hour.
// At that range we don't require title similarity — Selçuk almost never
// runs two streams an hour apart, so proximity is enough. If multiple
// candidates fall in the window we still prefer the one with the most
// shared title words.
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

  // Multiple in window — pick best by shared title tokens, tiebreak by time.
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
    // Each shared token worth 1 hour of proximity
    const score = shared * 3600000 - dt;
    if (!best || score > best.score) best = { s, score };
  }
  return best?.s ?? null;
}

function entryToShort(e: YtDlpEntry): Short | null {
  if (!e.id || !e.title) return null;
  // yt-dlp shorts entries often look like videos with a short duration but
  // we trust the URL came from /shorts.
  const ts = e.release_timestamp ?? e.timestamp ?? null;
  const publishedAt = isoFromYtDlp(e);
  void ts;
  return {
    id: e.id,
    title: e.title,
    publishedAt,
    durationSec: e.duration ?? null,
    viewCount: e.view_count ?? null,
    thumbnailUrl: bestThumb(e),
    description: e.description ?? "",
  };
}

async function main() {
  // Confirm yt-dlp exists with a quick check
  // (spawn will throw a clearer error if missing)
  const handleNoAt = HANDLE.replace(/^@/, "");
  const streamsUrl = `https://www.youtube.com/@${handleNoAt}/streams`;
  const shortsUrl = `https://www.youtube.com/@${handleNoAt}/shorts`;

  console.log(`→ Yayınlar (live/completed/upcoming) çekiliyor…`);
  console.log(`  ${streamsUrl}  (max ${PLAYLIST_END})`);

  const { entries, channel } = await ytDlpStream(streamsUrl, PLAYLIST_END);
  console.log(`✓ ${entries.length} yayın entry alındı`);

  if (channel) {
    mkdirSync(dirname(CHANNEL_OUT), { recursive: true });
    writeFileSync(
      CHANNEL_OUT,
      JSON.stringify({ handle: HANDLE, ...channel }, null, 2),
    );
    console.log(`✓ Kanal: ${channel.title} (${channel.id})`);
  }

  const streams: Stream[] = [];
  let skipped = 0;
  for (const e of entries) {
    const s = entryToStream(e);
    if (s) streams.push(s);
    else skipped++;
  }

  // Sort newest first; assign episode numbers oldest-to-newest so they're stable.
  streams.sort(
    (a, b) =>
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );
  const oldestFirst = [...streams].reverse();
  oldestFirst.forEach((s, i) => {
    s.episodeNo = i + 1;
  });

  mkdirSync(dirname(STREAMS_OUT), { recursive: true });
  writeFileSync(
    STREAMS_OUT,
    JSON.stringify(
      {
        syncedAt: new Date().toISOString(),
        channelId: channel?.id ?? "",
        channelTitle: channel?.title ?? "",
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
    `  upcoming=${counts.upcoming ?? 0}  live=${counts.live ?? 0}  completed=${counts.completed ?? 0}  atlanan=${skipped}`,
  );

  // ── Manual events auto-link ───────────────────────────────────────────
  const manuals = listManualEvents().filter((m) => !m.youtubeId);
  if (manuals.length > 0) {
    console.log(`\n→ Manuel yayınlar eşleştiriliyor (${manuals.length} aday)…`);
    let matched = 0;
    for (const m of manuals) {
      const match = findMatchingStream(m.title, m.scheduledAt, streams);
      if (match) {
        updateManualEvent(m.id, {
          youtubeId: match.id,
          matchedAt: new Date().toISOString(),
        });
        console.log(`  ✓ ${m.title.slice(0, 50)} → ${match.id}`);
        matched++;
      }
    }
    console.log(`  ${matched}/${manuals.length} eşleşti`);
  }

  // ── Shorts ─────────────────────────────────────────────────────────────
  console.log(`\n→ Shorts çekiliyor…`);
  console.log(`  ${shortsUrl}  (max ${SHORTS_LIMIT})`);
  try {
    const { entries: shortEntries } = await ytDlpStream(shortsUrl, SHORTS_LIMIT);
    const shorts: Short[] = [];
    for (const e of shortEntries) {
      const s = entryToShort(e);
      if (s) shorts.push(s);
    }
    shorts.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    writeFileSync(
      SHORTS_OUT,
      JSON.stringify(
        {
          syncedAt: new Date().toISOString(),
          channelId: channel?.id ?? "",
          channelTitle: channel?.title ?? "",
          handle: HANDLE,
          shorts,
        },
        null,
        2,
      ),
    );
    console.log(`✓ ${shorts.length} short yazıldı: ${SHORTS_OUT}`);
  } catch (err) {
    console.error(
      "× Shorts çekilemedi (yayınlar yine yazıldı):",
      (err as Error).message,
    );
  }
}

const startedAt = new Date();
main()
  .then(() => {
    const finishedAt = new Date();
    appendLog({
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      kind: process.env.SYNC_TRIGGER === "manual" ? "manual-trigger" : "full",
      ok: true,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      message: "Sync tamamlandı",
    });
  })
  .catch((err) => {
    const finishedAt = new Date();
    const errMsg = (err && (err.message ?? String(err))) || "bilinmeyen hata";
    console.error("× Sync başarısız:", errMsg);
    appendLog({
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
