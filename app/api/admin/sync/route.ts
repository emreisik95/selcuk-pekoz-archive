import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { isAdmin } from "@/lib/auth";
import { readLog } from "@/lib/sync-log";

// Track in-flight admin-triggered runs to avoid double spawn.
let inflight = false;

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  return NextResponse.json({ entries: readLog(), inflight });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") === "live" ? "live" : "full";

  if (inflight) {
    return NextResponse.json(
      { error: "Bir sync işlemi zaten çalışıyor" },
      { status: 409 },
    );
  }
  inflight = true;

  const script = kind === "live" ? "scripts/check-live.ts" : "scripts/sync.ts";
  // Build the path at runtime so Turbopack doesn't try to resolve cli.mjs
  // as a build-time module dependency.
  const tsxBin = ["node_modules", "tsx", "dist", "cli.mjs"].join("/");
  const child = spawn("node", [tsxBin, script], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, SYNC_TRIGGER: "manual" },
  });
  child.on("close", () => {
    inflight = false;
  });
  child.on("error", () => {
    inflight = false;
  });
  child.unref();

  return NextResponse.json({ ok: true, kind });
}
