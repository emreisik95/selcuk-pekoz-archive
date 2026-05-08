import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getAdminConfig } from "@/lib/admin-config";
import {
  subscribeToChannel,
  unsubscribeFromChannel,
} from "@/lib/pubsub";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  return NextResponse.json(getAdminConfig().pubsub);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const { action, channelId } = body as {
    action: "subscribe" | "unsubscribe";
    channelId?: string;
  };

  if (action === "subscribe") {
    if (!channelId || !channelId.startsWith("UC")) {
      return NextResponse.json(
        { error: "Geçerli bir kanal ID gerekli (UC...)" },
        { status: 400 },
      );
    }
    const r = await subscribeToChannel(channelId);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 });
    return NextResponse.json({ ok: true, pending: true });
  }

  if (action === "unsubscribe") {
    const r = await unsubscribeFromChannel();
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Bilinmeyen aksiyon" }, { status: 400 });
}
