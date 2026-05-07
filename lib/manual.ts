// Manual calendar events added by the admin. Stored in data/manual.json.
// Auto-merges with YouTube data when sync finds a matching live broadcast.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { ManualEvent } from "./types";

const PATH = join(process.cwd(), "data", "manual.json");

type ManualFile = { events: ManualEvent[] };

function readFile(): ManualFile {
  if (!existsSync(PATH)) return { events: [] };
  try {
    return JSON.parse(readFileSync(PATH, "utf8")) as ManualFile;
  } catch {
    return { events: [] };
  }
}

function writeFileAtomic(data: ManualFile) {
  mkdirSync(dirname(PATH), { recursive: true });
  writeFileSync(PATH, JSON.stringify(data, null, 2));
}

export function listManualEvents(): ManualEvent[] {
  return readFile().events;
}

export function addManualEvent(input: Omit<ManualEvent, "id" | "createdAt">): ManualEvent {
  const data = readFile();
  const now = new Date().toISOString();
  const event: ManualEvent = {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    ...input,
  };
  data.events.push(event);
  writeFileAtomic(data);
  return event;
}

export function deleteManualEvent(id: string): boolean {
  const data = readFile();
  const idx = data.events.findIndex((e) => e.id === id);
  if (idx < 0) return false;
  data.events.splice(idx, 1);
  writeFileAtomic(data);
  return true;
}

export function updateManualEvent(
  id: string,
  patch: Partial<ManualEvent>,
): ManualEvent | null {
  const data = readFile();
  const e = data.events.find((x) => x.id === id);
  if (!e) return null;
  Object.assign(e, patch);
  writeFileAtomic(data);
  return e;
}
