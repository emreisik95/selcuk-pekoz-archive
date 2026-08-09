// Manual calendar events added by the admin. Stored in data/manual.json.
// Auto-merges with YouTube data when sync finds a matching live broadcast.

import type { ManualEvent } from "./types";
import {
  getPersistentJsonStore,
  JsonDocument,
  type JsonStore,
} from "./persistent-json";

type ManualFile = { events: ManualEvent[] };

type ManualInput = Omit<ManualEvent, "id" | "createdAt">;

export function createManualEventRepository(store: JsonStore) {
  const document = new JsonDocument<ManualFile>(store, "manual-events", { events: [] });
  const makeEvent = (input: ManualInput, index = 0): ManualEvent => ({
    id: `m-${Date.now() + index}-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    ...input,
  });

  return {
    async list() {
      return (await document.read()).events;
    },
    async add(input: ManualInput) {
      const event = makeEvent(input);
      await document.update((data) => ({ events: [...data.events, event] }));
      return event;
    },
    async addMany(inputs: ManualInput[]) {
      const events = inputs.map(makeEvent);
      await document.update((data) => ({ events: [...data.events, ...events] }));
      return events;
    },
    async delete(id: string) {
      let deleted = false;
      await document.update((data) => {
        const events = data.events.filter((event) => event.id !== id);
        deleted = events.length !== data.events.length;
        return deleted ? { events } : data;
      });
      return deleted;
    },
    async update(id: string, patch: Partial<ManualEvent>) {
      let updated: ManualEvent | null = null;
      await document.update((data) => ({
        events: data.events.map((event) => {
          if (event.id !== id) return event;
          updated = { ...event, ...patch };
          return updated;
        }),
      }));
      return updated;
    },
  };
}

async function repository() {
  return createManualEventRepository(await getPersistentJsonStore());
}

export async function listManualEvents(): Promise<ManualEvent[]> {
  return (await repository()).list();
}

export async function addManualEvent(input: ManualInput): Promise<ManualEvent> {
  return (await repository()).add(input);
}

export async function addManualEvents(inputs: ManualInput[]): Promise<ManualEvent[]> {
  return (await repository()).addMany(inputs);
}

export async function deleteManualEvent(id: string): Promise<boolean> {
  return (await repository()).delete(id);
}

export async function updateManualEvent(
  id: string,
  patch: Partial<ManualEvent>,
): Promise<ManualEvent | null> {
  return (await repository()).update(id, patch);
}
