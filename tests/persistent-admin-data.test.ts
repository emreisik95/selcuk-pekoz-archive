import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminConfigRepository,
  type AdminConfig,
} from "../lib/admin-config";
import { createManualEventRepository } from "../lib/manual";
import type { JsonStore } from "../lib/persistent-json";

function memoryStore() {
  const values = new Map<string, unknown>();
  let writes = 0;
  const store: JsonStore = {
    async get<T>(key: string) {
      return (values.get(key) as T | undefined) ?? null;
    },
    async put<T>(key: string, value: T) {
      writes += 1;
      values.set(key, structuredClone(value));
    },
  };
  return { store, writes: () => writes };
}

test("admin configuration survives repository instances", async () => {
  const backend = memoryStore();
  const first = createAdminConfigRepository(backend.store);

  await first.patch({
    banner: {
      message: "Bu akşam canlı",
      tone: "info",
      updatedAt: "2026-08-09T12:00:00.000Z",
    },
    hiddenVideoIds: ["hidden-video"],
  });

  const second = createAdminConfigRepository(backend.store);
  const restored: AdminConfig = await second.get();
  assert.equal(restored.banner?.message, "Bu akşam canlı");
  assert.deepEqual(restored.hiddenVideoIds, ["hidden-video"]);
});

test("recurring manual events persist in one durable write", async () => {
  const backend = memoryStore();
  const repository = createManualEventRepository(backend.store);
  const inputs = [0, 1, 2].map((week) => ({
    title: `Hafta ${week + 1}`,
    scheduledAt: new Date(Date.UTC(2026, 7, 10 + week * 7, 17)).toISOString(),
  }));

  const created = await repository.addMany(inputs);
  const restored = await createManualEventRepository(backend.store).list();

  assert.equal(created.length, 3);
  assert.deepEqual(restored.map((event) => event.title), ["Hafta 1", "Hafta 2", "Hafta 3"]);
  assert.equal(backend.writes(), 1);
});
