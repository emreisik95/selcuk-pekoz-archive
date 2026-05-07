import { NextResponse } from "next/server";
import { checkPassword, setAdminCookie } from "@/lib/auth";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const password = (body as { password?: string }).password ?? "";
  if (!password) {
    return NextResponse.json({ error: "Şifre gerekli" }, { status: 400 });
  }
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Şifre yanlış" }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
