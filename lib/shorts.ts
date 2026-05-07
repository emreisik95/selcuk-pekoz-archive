// Server-side data layer for shorts. Reads data/shorts.json (written by
// `npm run sync`); empty array if absent.

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Short } from "./types";

type ShortsFile = {
  syncedAt: string;
  channelId: string;
  channelTitle: string;
  handle: string;
  shorts: Short[];
};

const PATH = join(process.cwd(), "data", "shorts.json");
let cache: { mtimeMs: number; data: ShortsFile } | null = null;

function load(): ShortsFile | null {
  if (!existsSync(PATH)) return null;
  let mtimeMs: number;
  try {
    mtimeMs = statSync(PATH).mtimeMs;
  } catch {
    return null;
  }
  if (cache && cache.mtimeMs === mtimeMs) return cache.data;
  try {
    const data = JSON.parse(readFileSync(PATH, "utf8")) as ShortsFile;
    cache = { mtimeMs, data };
    return data;
  } catch {
    return null;
  }
}

export function getShorts(): Short[] {
  return load()?.shorts ?? [];
}
