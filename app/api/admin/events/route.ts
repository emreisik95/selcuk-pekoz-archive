import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  addManualEvent,
  deleteManualEvent,
  listManualEvents,
} from "@/lib/manual";

async function requireAdmin() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ events: listManualEvents() });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

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
  const event = addManualEvent({
    title: b.title.trim(),
    scheduledAt: b.scheduledAt,
    description: b.description?.trim() || undefined,
    durationMin: b.durationMin && b.durationMin > 0 ? b.durationMin : undefined,
  });
  return NextResponse.json({ event }, { status: 201 });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }
  const ok = deleteManualEvent(id);
  if (!ok) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
