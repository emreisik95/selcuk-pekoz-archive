// YouTube Data API v3 thin client.
// Server-side only — never import from client components.

import type { Stream, StreamKind } from "./types";

const API = "https://www.googleapis.com/youtube/v3";

function key() {
  const k = process.env.YT_API_KEY || process.env.YOUTUBE_API_KEY;
  if (!k) throw new Error("YT_API_KEY / YOUTUBE_API_KEY env değişkeni tanımlı değil.");
  return k;
}

async function ytGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", key());
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube ${path} ${res.status}: ${body.slice(0, 400)}`);
  }
  return (await res.json()) as T;
}

type ChannelsListResp = {
  items?: Array<{ id: string; snippet: { title: string } }>;
};

export async function resolveChannelId(handle: string): Promise<{
  id: string;
  title: string;
}> {
  const cleaned = handle.replace(/^@/, "");
  const data = await ytGet<ChannelsListResp>("/channels", {
    part: "snippet",
    forHandle: "@" + cleaned,
  });
  const it = data.items?.[0];
  if (!it) throw new Error(`Kanal bulunamadı: ${handle}`);
  return { id: it.id, title: it.snippet.title };
}

type SearchListResp = {
  items?: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      thumbnails?: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
        standard?: { url: string };
        maxres?: { url: string };
      };
    };
  }>;
  nextPageToken?: string;
};

async function searchChannel(
  channelId: string,
  eventType: "upcoming" | "live" | "completed",
  maxPages = 4,
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const params: Record<string, string> = {
      part: "id",
      channelId,
      type: "video",
      eventType,
      order: "date",
      maxResults: "50",
    };
    if (pageToken) params.pageToken = pageToken;
    const data = await ytGet<SearchListResp & { nextPageToken?: string }>(
      "/search",
      params,
    );
    for (const it of data.items ?? []) {
      if (it.id?.videoId) ids.push(it.id.videoId);
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return ids;
}

type VideosListResp = {
  items?: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      thumbnails?: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
        standard?: { url: string };
        maxres?: { url: string };
      };
    };
    contentDetails?: { duration?: string };
    statistics?: { viewCount?: string };
    liveStreamingDetails?: {
      scheduledStartTime?: string;
      actualStartTime?: string;
      actualEndTime?: string;
      concurrentViewers?: string;
    };
  }>;
};

type Thumbnails = {
  default?: { url: string };
  medium?: { url: string };
  high?: { url: string };
  standard?: { url: string };
  maxres?: { url: string };
};

function bestThumb(t?: Thumbnails): string {
  return (
    t?.maxres?.url ||
    t?.standard?.url ||
    t?.high?.url ||
    t?.medium?.url ||
    t?.default?.url ||
    ""
  );
}

// "PT2H30M15S" → 9015 sec
function parseISODuration(iso?: string): number | null {
  if (!iso) return null;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const [, h, mn, s] = m;
  return (Number(h ?? 0) * 3600) + (Number(mn ?? 0) * 60) + Number(s ?? 0);
}

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

export async function fetchVideos(ids: string[]): Promise<Stream[]> {
  if (ids.length === 0) return [];
  const out: Stream[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const data = await ytGet<VideosListResp>("/videos", {
      part: "snippet,contentDetails,statistics,liveStreamingDetails",
      id: batch.join(","),
    });
    for (const v of data.items ?? []) {
      const live = v.liveStreamingDetails ?? {};
      const isLive = !!live.actualStartTime && !live.actualEndTime;
      const isCompleted = !!live.actualEndTime;
      const kind: StreamKind = isLive
        ? "live"
        : isCompleted
          ? "completed"
          : "upcoming";

      const scheduledAt =
        live.scheduledStartTime ||
        live.actualStartTime ||
        v.snippet.publishedAt;

      out.push({
        id: v.id,
        kind,
        title: v.snippet.title,
        scheduledAt,
        actualStartAt: live.actualStartTime ?? null,
        actualEndAt: live.actualEndTime ?? null,
        durationSec: kind === "completed" ? parseISODuration(v.contentDetails?.duration) : null,
        viewCount: v.statistics?.viewCount ? Number(v.statistics.viewCount) : null,
        concurrentViewers: live.concurrentViewers
          ? Number(live.concurrentViewers)
          : null,
        palette: paletteFor(v.id),
        episodeNo: 0, // assigned after ordering in sync script
        thumbnailUrl: bestThumb(v.snippet.thumbnails),
        description: v.snippet.description ?? "",
      });
    }
  }
  return out;
}

export async function fetchAllStreams(channelId: string): Promise<Stream[]> {
  // 3 search calls × 100 units = 300 units per sync. Fits easily under 10k/day.
  const [upcomingIds, liveIds, completedIds] = await Promise.all([
    searchChannel(channelId, "upcoming", 1),
    searchChannel(channelId, "live", 1),
    // Up to 4 pages = 200 most recent past streams.
    searchChannel(channelId, "completed", 4),
  ]);
  const allIds = [...new Set([...upcomingIds, ...liveIds, ...completedIds])];
  return fetchVideos(allIds);
}
