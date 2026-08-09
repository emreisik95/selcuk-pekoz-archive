import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  generateWebhookToken,
  getAdminConfig,
  hideVideo,
  patchAdminConfig,
  setOverride,
  unhideVideo,
  type BannerTone,
} from "@/lib/admin-config";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  return NextResponse.json(await getAdminConfig());
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const b = body as Partial<{
    banner: { message: string; tone: BannerTone } | null;
    pinnedVideoId: string | null;
    hideVideoId: string;
    unhideVideoId: string;
    override: {
      videoId: string;
      title?: string;
      description?: string;
      thumbnailUrl?: string;
    };
    rotateWebhook: boolean;
    socialLinks: Array<{ platform: string; url: string; label?: string }>;
    about: { title: string; body: string } | null;
    twitterTimeline: { handle: string; enabled: boolean } | null;
  }>;

  // Banner
  if (b.banner !== undefined) {
    if (b.banner === null) {
      await patchAdminConfig({ banner: null });
    } else {
      const msg = b.banner.message?.trim();
      const tone =
        b.banner.tone === "warning" || b.banner.tone === "celebration"
          ? b.banner.tone
          : "info";
      if (!msg) {
        return NextResponse.json(
          { error: "Banner mesajı gerekli" },
          { status: 400 },
        );
      }
      await patchAdminConfig({
        banner: { message: msg, tone, updatedAt: new Date().toISOString() },
      });
    }
  }

  if (b.pinnedVideoId !== undefined) {
    await patchAdminConfig({ pinnedVideoId: b.pinnedVideoId || null });
  }

  if (b.hideVideoId) await hideVideo(b.hideVideoId);
  if (b.unhideVideoId) await unhideVideo(b.unhideVideoId);

  if (b.override) {
    await setOverride(b.override.videoId, {
      title: b.override.title,
      description: b.override.description,
      thumbnailUrl: b.override.thumbnailUrl,
    });
  }

  if (b.rotateWebhook) {
    await generateWebhookToken();
  }

  if (b.socialLinks !== undefined) {
    const VALID_PLATFORMS = new Set([
      "youtube",
      "twitter",
      "discord",
      "reddit",
      "instagram",
      "tiktok",
      "twitch",
      "website",
    ]);
    const cleaned = b.socialLinks
      .filter(
        (l) =>
          l &&
          typeof l.url === "string" &&
          l.url.startsWith("http") &&
          VALID_PLATFORMS.has(l.platform),
      )
      .map((l) => ({
        platform: l.platform as
          | "youtube"
          | "twitter"
          | "discord"
          | "reddit"
          | "instagram"
          | "tiktok"
          | "twitch"
          | "website",
        url: l.url.trim(),
        label: l.label?.trim() || undefined,
      }));
    await patchAdminConfig({ socialLinks: cleaned });
  }

  if (b.about !== undefined) {
    if (b.about === null) {
      await patchAdminConfig({ about: null });
    } else if (b.about.body?.trim()) {
      await patchAdminConfig({
        about: {
          title: b.about.title?.trim() || "Hakkında",
          body: b.about.body.trim(),
        },
      });
    }
  }

  if (b.twitterTimeline !== undefined) {
    if (b.twitterTimeline === null) {
      await patchAdminConfig({ twitterTimeline: null });
    } else {
      const handle = b.twitterTimeline.handle
        ?.trim()
        .replace(/^@/, "")
        .replace(/[^a-zA-Z0-9_]/g, "");
      if (handle) {
        await patchAdminConfig({
          twitterTimeline: {
            handle,
            enabled: !!b.twitterTimeline.enabled,
          },
        });
      }
    }
  }

  return NextResponse.json(await getAdminConfig());
}
