// Tiny rolling log of recent sync runs, persisted to data/sync-log.json.
// Both `npm run sync` and `npm run check-live` append entries via this lib.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

export type SyncLogEntry = {
  startedAt: string;
  finishedAt: string;
  kind: "full" | "live-check" | "manual-trigger";
  ok: boolean;
  durationMs: number;
  message: string;
  counts?: Record<string, number>;
  error?: string;
};

const PATH = join(process.cwd(), "data", "sync-log.json");
const MAX_ENTRIES = 50;

export function readLog(): SyncLogEntry[] {
  if (!existsSync(PATH)) return [];
  try {
    const data = JSON.parse(readFileSync(PATH, "utf8")) as {
      entries?: SyncLogEntry[];
    };
    return data.entries ?? [];
  } catch {
    return [];
  }
}

export function appendLog(entry: SyncLogEntry) {
  const entries = readLog();
  entries.unshift(entry);
  const trimmed = entries.slice(0, MAX_ENTRIES);
  mkdirSync(dirname(PATH), { recursive: true });
  writeFileSync(PATH, JSON.stringify({ entries: trimmed }, null, 2));
}
