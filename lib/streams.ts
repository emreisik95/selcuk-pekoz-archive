// Single source of truth for stream data on the server.
// Reads data/streams.json (written by `npm run sync`). On runtimes without a
// writable Node filesystem, the same tracked data is bundled into the Worker.

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Stream } from "./types";
import { getAdminConfig } from "./admin-config";
import {
  getBundledStreamsFile,
  type BundledStreamsFile,
} from "./bundled-channel-data";

async function applyAdminConfig(streams: Stream[]): Promise<Stream[]> {
  const cfg = await getAdminConfig();
  const hidden = new Set(cfg.hiddenVideoIds);
  return streams
    .filter((s) => !hidden.has(s.id))
    .map((s) => {
      const ov = cfg.overrides[s.id];
      if (!ov) return s;
      return {
        ...s,
        title: ov.title ?? s.title,
        description: ov.description ?? s.description,
        thumbnailUrl: ov.thumbnailUrl ?? s.thumbnailUrl,
      };
    });
}

type StreamFile = BundledStreamsFile;

const STREAMS_PATH = join(process.cwd(), "data", "streams.json");
let cache: { mtimeMs: number; data: StreamFile } | null = null;

// Drop "🔴CANLI:", "CANLI:", any leading red dot, plus the trailing
// "YYYY-MM-DD HH:MM" timestamp YouTube auto-appends to live broadcasts.
const TITLE_PREFIX_RE = /^[\s\u{1F534}🔴]*CANLI[:\s]+/iu;
const TITLE_SUFFIX_RE = /\s+\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\s*$/;

function cleanTitle(t: string): string {
  let out = t;
  // Apply prefix match repeatedly in case of stacked markers (e.g. "🔴 CANLI: 🔴 CANLI: …")
  for (let i = 0; i < 3; i++) {
    const next = out.replace(TITLE_PREFIX_RE, "");
    if (next === out) break;
    out = next;
  }
  out = out.replace(TITLE_SUFFIX_RE, "");
  return out.trim();
}

function cleanStreamFile(data: StreamFile): StreamFile {
  for (const stream of data.streams) {
    stream.title = cleanTitle(stream.title);
  }
  return data;
}

function loadBundled(): StreamFile {
  return cleanStreamFile(getBundledStreamsFile());
}

function loadOnce(): StreamFile {
  if (!existsSync(STREAMS_PATH)) return loadBundled();
  let mtimeMs: number;
  try {
    mtimeMs = statSync(STREAMS_PATH).mtimeMs;
  } catch {
    return loadBundled();
  }
  if (cache && cache.mtimeMs === mtimeMs) return cache.data;
  try {
    const data = cleanStreamFile(
      JSON.parse(readFileSync(STREAMS_PATH, "utf8")) as StreamFile,
    );
    cache = { mtimeMs, data };
    return data;
  } catch {
    return loadBundled();
  }
}

function isMock(): boolean {
  return false;
}

export function isUsingMockData(): boolean {
  return isMock();
}

export function getNow(): Date {
  return new Date();
}

export function getChannelMeta(): { title: string; handle: string } | null {
  const f = loadOnce();
  return { title: f.channelTitle, handle: f.handle };
}

export async function getAllStreams(): Promise<Stream[]> {
  const f = loadOnce();
  return applyAdminConfig(f.streams);
}

// Like getAllStreams but skips the hidden filter — used by the admin
// panel so the operator can still un-hide a video.
export function getAllStreamsRaw(): Stream[] {
  return loadOnce().streams;
}

export async function getUpcomingStreams(): Promise<Stream[]> {
  const f = loadOnce();
  const list = f.streams.filter((s) => s.kind === "upcoming");
  return (await applyAdminConfig(list)).sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
}

export async function getLiveStreams(): Promise<Stream[]> {
  const f = loadOnce();
  const list = f.streams.filter((s) => s.kind === "live");
  return applyAdminConfig(list);
}

export async function getPastStreams(): Promise<Stream[]> {
  const f = loadOnce();
  const list = f.streams.filter((s) => s.kind === "completed");
  return (await applyAdminConfig(list)).sort(
    (a, b) =>
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );
}

export async function getNextStream(): Promise<Stream | null> {
  const live = (await getLiveStreams())[0];
  if (live) return live;
  const upcoming = (await getUpcomingStreams())[0];
  return upcoming ?? null;
}

export async function getStreamById(id: string): Promise<Stream | undefined> {
  return (await getAllStreams()).find((s) => s.id === id);
}
