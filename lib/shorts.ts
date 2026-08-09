// Server-side data layer for shorts. Reads data/shorts.json (written by
// `npm run sync`) or its build-time copy on filesystem-less runtimes.

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Short } from "./types";
import {
  getBundledShortsFile,
  type BundledShortsFile,
} from "./bundled-channel-data";

type ShortsFile = BundledShortsFile;

const PATH = join(process.cwd(), "data", "shorts.json");
let cache: { mtimeMs: number; data: ShortsFile } | null = null;

function load(): ShortsFile {
  if (!existsSync(PATH)) return getBundledShortsFile();
  let mtimeMs: number;
  try {
    mtimeMs = statSync(PATH).mtimeMs;
  } catch {
    return getBundledShortsFile();
  }
  if (cache && cache.mtimeMs === mtimeMs) return cache.data;
  try {
    const data = JSON.parse(readFileSync(PATH, "utf8")) as ShortsFile;
    cache = { mtimeMs, data };
    return data;
  } catch {
    return getBundledShortsFile();
  }
}

export function getShorts(): Short[] {
  return load().shorts;
}
