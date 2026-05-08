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
  return NextResponse.json(getAdminConfig());
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
  }>;

  // Banner
  if (b.banner !== undefined) {
    if (b.banner === null) {
      patchAdminConfig({ banner: null });
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
      patchAdminConfig({
        banner: { message: msg, tone, updatedAt: new Date().toISOString() },
      });
    }
  }

  if (b.pinnedVideoId !== undefined) {
    patchAdminConfig({ pinnedVideoId: b.pinnedVideoId || null });
  }

  if (b.hideVideoId) hideVideo(b.hideVideoId);
  if (b.unhideVideoId) unhideVideo(b.unhideVideoId);

  if (b.override) {
    setOverride(b.override.videoId, {
      title: b.override.title,
      description: b.override.description,
      thumbnailUrl: b.override.thumbnailUrl,
    });
  }

  if (b.rotateWebhook) {
    generateWebhookToken();
  }

  return NextResponse.json(getAdminConfig());
}
