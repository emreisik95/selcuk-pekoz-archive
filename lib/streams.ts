// Single source of truth for stream data on the server.
// Reads data/streams.json (written by `npm run sync`); falls back to mock
// data when the file is absent so the app stays usable before first sync.

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Stream } from "./types";
import {
  allStreams as mockAll,
  liveStreams as mockLive,
  pastStreams as mockPast,
  upcomingStreams as mockUpcoming,
  NOW as MOCK_NOW,
} from "./mock-data";

type StreamFile = {
  syncedAt: string;
  channelId: string;
  channelTitle: string;
  handle: string;
  streams: Stream[];
};

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

function loadOnce(): StreamFile | null {
  if (!existsSync(STREAMS_PATH)) return null;
  let mtimeMs: number;
  try {
    mtimeMs = statSync(STREAMS_PATH).mtimeMs;
  } catch {
    return null;
  }
  if (cache && cache.mtimeMs === mtimeMs) return cache.data;
  try {
    const data = JSON.parse(readFileSync(STREAMS_PATH, "utf8")) as StreamFile;
    for (const s of data.streams) {
      s.title = cleanTitle(s.title);
    }
    cache = { mtimeMs, data };
    return data;
  } catch {
    return null;
  }
}

function isMock(): boolean {
  return loadOnce() === null;
}

export function isUsingMockData(): boolean {
  return isMock();
}

export function getNow(): Date {
  // Mock data is pinned to a fixed instant so the demo countdown stays sensible.
  return isMock() ? MOCK_NOW : new Date();
}

export function getChannelMeta(): { title: string; handle: string } | null {
  const f = loadOnce();
  if (!f) return null;
  return { title: f.channelTitle, handle: f.handle };
}

export function getAllStreams(): Stream[] {
  const f = loadOnce();
  return f ? f.streams : mockAll;
}

export function getUpcomingStreams(): Stream[] {
  const f = loadOnce();
  if (!f) return mockUpcoming;
  return f.streams
    .filter((s) => s.kind === "upcoming")
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
}

export function getLiveStreams(): Stream[] {
  const f = loadOnce();
  if (!f) return mockLive;
  return f.streams.filter((s) => s.kind === "live");
}

export function getPastStreams(): Stream[] {
  const f = loadOnce();
  if (!f) return mockPast;
  return f.streams
    .filter((s) => s.kind === "completed")
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    );
}

export function getNextStream(): Stream | null {
  const live = getLiveStreams()[0];
  if (live) return live;
  const upcoming = getUpcomingStreams()[0];
  return upcoming ?? null;
}

export function getStreamById(id: string): Stream | undefined {
  return getAllStreams().find((s) => s.id === id);
}
