import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { addManualEvents } from "@/lib/manual";

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
  const b = body as Partial<{
    title: string;
    startDate: string; // YYYY-MM-DD
    time: string; // HH:MM
    count: number; // how many occurrences
    intervalDays: number; // 7 = weekly, 1 = daily, 14 = biweekly
    description?: string;
    durationMin?: number;
  }>;

  if (
    !b.title ||
    !b.startDate ||
    !b.time ||
    !b.count ||
    !b.intervalDays
  ) {
    return NextResponse.json(
      {
        error: "title, startDate, time, count, intervalDays gerekli",
      },
      { status: 400 },
    );
  }
  if (b.count < 1 || b.count > 52) {
    return NextResponse.json(
      { error: "count 1–52 arası olmalı" },
      { status: 400 },
    );
  }
  if (![1, 2, 3, 7, 14, 28, 30].includes(b.intervalDays)) {
    return NextResponse.json(
      { error: "intervalDays şu değerlerden olmalı: 1,2,3,7,14,28,30" },
      { status: 400 },
    );
  }

  const [hh, mm] = b.time.split(":").map(Number);
  const [yy, mo, dd] = b.startDate.split("-").map(Number);
  if (
    !Number.isFinite(hh) ||
    !Number.isFinite(mm) ||
    !Number.isFinite(yy) ||
    !Number.isFinite(mo) ||
    !Number.isFinite(dd)
  ) {
    return NextResponse.json({ error: "Tarih/saat hatalı" }, { status: 400 });
  }

  const inputs = [];
  for (let i = 0; i < b.count; i++) {
    // TRT input → ISO UTC. TRT is UTC+3, no DST.
    const utcDate = new Date(
      Date.UTC(yy, mo - 1, dd + i * b.intervalDays, hh - 3, mm, 0),
    );
    inputs.push({
      title: b.title.trim(),
      scheduledAt: utcDate.toISOString(),
      description: b.description?.trim() || undefined,
      durationMin:
        b.durationMin && b.durationMin > 0 ? b.durationMin : undefined,
    });
  }
  const created = await addManualEvents(inputs);
  return NextResponse.json({ created }, { status: 201 });
}
