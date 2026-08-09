// External integrations (Discord bot, IFTTT, etc.) can post manual events
// here. Auth is a single shared token from data/admin-config.json
// (rotate-able from the admin panel). NOT cookie-based — webhooks aren't
// browsers.

import { NextResponse } from "next/server";
import { getAdminConfig } from "@/lib/admin-config";
import { addManualEvent } from "@/lib/manual";

export async function POST(req: Request) {
  const cfg = await getAdminConfig();
  if (!cfg.webhookToken) {
    return NextResponse.json(
      { error: "Webhook devre dışı (admin panelden token oluştur)" },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (provided !== cfg.webhookToken) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const b = body as Partial<{
    title: string;
    scheduledAt: string;
    description: string;
    durationMin: number;
  }>;
  if (!b.title || !b.scheduledAt) {
    return NextResponse.json(
      { error: "title ve scheduledAt gerekli" },
      { status: 400 },
    );
  }
  if (Number.isNaN(new Date(b.scheduledAt).getTime())) {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }
  const event = await addManualEvent({
    title: b.title.trim(),
    scheduledAt: b.scheduledAt,
    description: b.description?.trim() || undefined,
    durationMin:
      b.durationMin && b.durationMin > 0 ? Number(b.durationMin) : undefined,
  });
  return NextResponse.json({ event }, { status: 201 });
}
