import { NextResponse } from "next/server";
import { getPastStreams } from "@/lib/streams";

export const revalidate = 0;

export async function GET(req: Request) {
  const past = getPastStreams();
  if (past.length === 0) {
    return NextResponse.json({ error: "yayın yok" }, { status: 404 });
  }
  const pick = past[Math.floor(Math.random() * past.length)];
  const url = new URL(req.url);
  if (url.searchParams.get("redirect") === "1") {
    return NextResponse.redirect(new URL(`/y/${pick.id}`, req.url), 302);
  }
  return NextResponse.json({ id: pick.id, title: pick.title });
}
