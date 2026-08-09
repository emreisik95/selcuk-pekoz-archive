import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type JsonStore = {
  get<T>(key: string): Promise<T | null>;
  put<T>(key: string, value: T): Promise<void>;
};

type KvNamespace = {
  get<T>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string): Promise<void>;
};

const FILE_NAMES: Record<string, string> = {
  "admin-config": "admin-config.json",
  "manual-events": "manual.json",
  "sync-log": "sync-log.json",
};

function fileStore(): JsonStore {
  return {
    async get<T>(key: string) {
      const path = join(process.cwd(), "data", FILE_NAMES[key] ?? `${key}.json`);
      if (!existsSync(path)) return null;
      try {
        return JSON.parse(readFileSync(path, "utf8")) as T;
      } catch {
        return null;
      }
    },
    async put<T>(key: string, value: T) {
      const path = join(process.cwd(), "data", FILE_NAMES[key] ?? `${key}.json`);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify(value, null, 2));
    },
  };
}

function kvStore(kv: KvNamespace): JsonStore {
  return {
    get<T>(key: string) {
      return kv.get<T>(key, "json");
    },
    put<T>(key: string, value: T) {
      return kv.put(key, JSON.stringify(value));
    },
  };
}

export async function getPersistentJsonStore(): Promise<JsonStore> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    const env = context.env as unknown as { ADMIN_DATA?: KvNamespace };
    if (env.ADMIN_DATA) return kvStore(env.ADMIN_DATA);
  } catch {
    // Standard Node.js development, scripts and tests use JSON files.
  }
  return fileStore();
}

export class JsonDocument<T> {
  constructor(
    private readonly store: JsonStore,
    private readonly key: string,
    private readonly fallback: T,
    private readonly normalize: (value: T) => T = (value) => value,
  ) {}

  async read(): Promise<T> {
    const value = await this.store.get<T>(this.key);
    return this.normalize(value ?? structuredClone(this.fallback));
  }

  async write(value: T): Promise<T> {
    const normalized = this.normalize(value);
    await this.store.put(this.key, normalized);
    return normalized;
  }

  async update(update: (current: T) => T): Promise<T> {
    return this.write(update(await this.read()));
  }
}
