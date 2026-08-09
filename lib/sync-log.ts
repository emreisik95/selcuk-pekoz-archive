// Tiny rolling log of recent sync runs, persisted to data/sync-log.json.
// Both `npm run sync` and `npm run check-live` append entries via this lib.

import { getPersistentJsonStore, JsonDocument } from "./persistent-json";
import { getBundledSyncLogFile } from "./bundled-channel-data";

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

const MAX_ENTRIES = 50;

async function document() {
  return new JsonDocument<{ entries: SyncLogEntry[] }>(
    await getPersistentJsonStore(),
    "sync-log",
    getBundledSyncLogFile() as { entries: SyncLogEntry[] },
  );
}

export async function readLog(): Promise<SyncLogEntry[]> {
  return (await (await document()).read()).entries;
}

export async function appendLog(entry: SyncLogEntry): Promise<void> {
  await (await document()).update((data) => ({
    entries: [entry, ...data.entries].slice(0, MAX_ENTRIES),
  }));
}
