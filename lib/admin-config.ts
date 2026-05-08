// Site-wide admin-controlled config: banner, pinned stream, hidden ids,
// per-stream overrides, webhook token. Persisted to data/admin-config.json.

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  statSync,
} from "node:fs";
import { join, dirname } from "node:path";

export type BannerTone = "info" | "warning" | "celebration";

export type SocialPlatform =
  | "youtube"
  | "twitter"
  | "discord"
  | "reddit"
  | "instagram"
  | "tiktok"
  | "twitch"
  | "website";

export type SocialLink = {
  platform: SocialPlatform;
  url: string;
  label?: string;
};

export type AdminConfig = {
  banner: {
    message: string;
    tone: BannerTone;
    updatedAt: string;
  } | null;
  pinnedVideoId: string | null;
  hiddenVideoIds: string[];
  overrides: Record<
    string,
    {
      title?: string;
      description?: string;
      thumbnailUrl?: string;
    }
  >;
  webhookToken: string | null;
  socialLinks: SocialLink[];
  about: { title: string; body: string } | null;
  twitterTimeline: { handle: string; enabled: boolean } | null;
  pubsub: {
    channelId: string | null;
    active: boolean;
    leaseExpiresAt: string | null;
    lastNotifiedAt: string | null;
    secret: string | null;
  };
};

const DEFAULT: AdminConfig = {
  banner: null,
  pinnedVideoId: null,
  hiddenVideoIds: [],
  overrides: {},
  webhookToken: null,
  socialLinks: [
    { platform: "youtube", url: "https://www.youtube.com/@SelçukPeköz" },
    { platform: "discord", url: "https://discord.gg/UgcedxJjHK" },
    { platform: "twitter", url: "https://x.com/selcukpekoz" },
    {
      platform: "reddit",
      url: "https://www.reddit.com/r/Nintendo_Turkiye/",
      label: "r/Nintendo_Turkiye",
    },
    { platform: "instagram", url: "https://www.instagram.com/pekozselcuk/" },
  ],
  about: null,
  twitterTimeline: { handle: "selcukpekoz", enabled: true },
  pubsub: {
    channelId: null,
    active: false,
    leaseExpiresAt: null,
    lastNotifiedAt: null,
    secret: null,
  },
};

const PATH = join(process.cwd(), "data", "admin-config.json");
let cache: { mtimeMs: number; data: AdminConfig } | null = null;

function readFile(): AdminConfig {
  if (!existsSync(PATH)) return { ...DEFAULT };
  let mtimeMs = 0;
  try {
    mtimeMs = statSync(PATH).mtimeMs;
  } catch {
    return { ...DEFAULT };
  }
  if (cache && cache.mtimeMs === mtimeMs) return cache.data;
  try {
    const raw = JSON.parse(readFileSync(PATH, "utf8")) as Partial<AdminConfig>;
    const merged: AdminConfig = {
      ...DEFAULT,
      ...raw,
      hiddenVideoIds: Array.isArray(raw.hiddenVideoIds)
        ? raw.hiddenVideoIds
        : [],
      overrides: raw.overrides && typeof raw.overrides === "object"
        ? raw.overrides
        : {},
      socialLinks: Array.isArray(raw.socialLinks)
        ? raw.socialLinks
        : DEFAULT.socialLinks,
      about: raw.about ?? DEFAULT.about,
      twitterTimeline: raw.twitterTimeline ?? DEFAULT.twitterTimeline,
      pubsub: raw.pubsub ?? DEFAULT.pubsub,
    };
    cache = { mtimeMs, data: merged };
    return merged;
  } catch {
    return { ...DEFAULT };
  }
}

function writeAtomic(data: AdminConfig) {
  mkdirSync(dirname(PATH), { recursive: true });
  writeFileSync(PATH, JSON.stringify(data, null, 2));
  cache = null; // invalidate
}

export function getAdminConfig(): AdminConfig {
  return readFile();
}

export function patchAdminConfig(patch: Partial<AdminConfig>): AdminConfig {
  const cur = readFile();
  const next: AdminConfig = {
    ...cur,
    ...patch,
    hiddenVideoIds:
      patch.hiddenVideoIds ?? cur.hiddenVideoIds,
    overrides: patch.overrides ?? cur.overrides,
  };
  writeAtomic(next);
  return next;
}

export function hideVideo(id: string): AdminConfig {
  const cur = readFile();
  if (cur.hiddenVideoIds.includes(id)) return cur;
  return patchAdminConfig({
    hiddenVideoIds: [...cur.hiddenVideoIds, id],
  });
}

export function unhideVideo(id: string): AdminConfig {
  const cur = readFile();
  return patchAdminConfig({
    hiddenVideoIds: cur.hiddenVideoIds.filter((x) => x !== id),
  });
}

export function setOverride(
  id: string,
  override: { title?: string; description?: string; thumbnailUrl?: string },
): AdminConfig {
  const cur = readFile();
  const next = { ...cur.overrides };
  // Clean keys with undefined values; if all empty, delete the entry.
  const clean: typeof next[string] = {};
  if (override.title?.trim()) clean.title = override.title.trim();
  if (override.description?.trim()) clean.description = override.description.trim();
  if (override.thumbnailUrl?.trim()) clean.thumbnailUrl = override.thumbnailUrl.trim();
  if (Object.keys(clean).length === 0) {
    delete next[id];
  } else {
    next[id] = clean;
  }
  return patchAdminConfig({ overrides: next });
}

export function generateWebhookToken(): AdminConfig {
  const token = `whk_${Math.random().toString(36).slice(2, 10)}${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  return patchAdminConfig({ webhookToken: token });
}
