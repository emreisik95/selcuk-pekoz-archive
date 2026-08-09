// Site-wide admin-controlled config: banner, pinned stream, hidden ids,
// per-stream overrides, webhook token. Persisted to data/admin-config.json.

import {
  getPersistentJsonStore,
  JsonDocument,
  type JsonStore,
} from "./persistent-json";

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

function normalize(raw: AdminConfig): AdminConfig {
  return {
    ...DEFAULT,
    ...raw,
    hiddenVideoIds: Array.isArray(raw.hiddenVideoIds) ? raw.hiddenVideoIds : [],
    overrides: raw.overrides && typeof raw.overrides === "object" ? raw.overrides : {},
    socialLinks: Array.isArray(raw.socialLinks) ? raw.socialLinks : DEFAULT.socialLinks,
    about: raw.about ?? DEFAULT.about,
    twitterTimeline: raw.twitterTimeline ?? DEFAULT.twitterTimeline,
    pubsub: raw.pubsub ?? DEFAULT.pubsub,
  };
}

export function createAdminConfigRepository(store: JsonStore) {
  const document = new JsonDocument(store, "admin-config", DEFAULT, normalize);

  return {
    get: () => document.read(),
    patch: (patch: Partial<AdminConfig>) =>
      document.update((current) => ({
        ...current,
        ...patch,
        hiddenVideoIds: patch.hiddenVideoIds ?? current.hiddenVideoIds,
        overrides: patch.overrides ?? current.overrides,
      })),
    hide: (id: string) =>
      document.update((current) =>
        current.hiddenVideoIds.includes(id)
          ? current
          : { ...current, hiddenVideoIds: [...current.hiddenVideoIds, id] },
      ),
    unhide: (id: string) =>
      document.update((current) => ({
        ...current,
        hiddenVideoIds: current.hiddenVideoIds.filter((value) => value !== id),
      })),
    setOverride: (
      id: string,
      override: { title?: string; description?: string; thumbnailUrl?: string },
    ) =>
      document.update((current) => {
        const overrides = { ...current.overrides };
        const clean: (typeof overrides)[string] = {};
        if (override.title?.trim()) clean.title = override.title.trim();
        if (override.description?.trim()) clean.description = override.description.trim();
        if (override.thumbnailUrl?.trim()) clean.thumbnailUrl = override.thumbnailUrl.trim();
        if (Object.keys(clean).length === 0) delete overrides[id];
        else overrides[id] = clean;
        return { ...current, overrides };
      }),
    generateWebhookToken: () =>
      document.update((current) => ({
        ...current,
        webhookToken: `whk_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`,
      })),
  };
}

async function repository() {
  return createAdminConfigRepository(await getPersistentJsonStore());
}

export async function getAdminConfig(): Promise<AdminConfig> {
  return (await repository()).get();
}

export async function patchAdminConfig(patch: Partial<AdminConfig>): Promise<AdminConfig> {
  return (await repository()).patch(patch);
}

export async function hideVideo(id: string): Promise<AdminConfig> {
  return (await repository()).hide(id);
}

export async function unhideVideo(id: string): Promise<AdminConfig> {
  return (await repository()).unhide(id);
}

export async function setOverride(
  id: string,
  override: { title?: string; description?: string; thumbnailUrl?: string },
): Promise<AdminConfig> {
  return (await repository()).setOverride(id, override);
}

export async function generateWebhookToken(): Promise<AdminConfig> {
  return (await repository()).generateWebhookToken();
}
