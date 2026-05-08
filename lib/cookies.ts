// Resolves a YouTube cookies.txt path for yt-dlp, handling both:
//   1. Production (Coolify): env YOUTUBE_COOKIES_TXT carries the whole
//      Netscape-format file inline → we write it to a temp file once.
//   2. Local dev: data/youtube-cookies.txt sits on disk (gitignored).

import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let materialized: string | null | undefined;

export function resolveCookiesPath(): string | null {
  if (materialized !== undefined) return materialized;

  // Prefer base64 — env vars become Dockerfile ARGs in Coolify, and
  // multiline values blow up the build. Plain text is still supported
  // for environments that handle it cleanly.
  const b64 = process.env.YOUTUBE_COOKIES_B64;
  const inline = process.env.YOUTUBE_COOKIES_TXT;
  let content: string | null = null;
  if (b64 && b64.trim().length > 0) {
    try {
      content = Buffer.from(b64.trim(), "base64").toString("utf8");
    } catch {
      content = null;
    }
  } else if (inline && inline.trim().length > 0) {
    content = inline;
  }
  if (content) {
    const dir = mkdtempSync(join(tmpdir(), "yt-cookies-"));
    const path = join(dir, "cookies.txt");
    writeFileSync(path, content, { mode: 0o600 });
    materialized = path;
    return path;
  }

  const candidates = [
    process.env.YOUTUBE_COOKIES_FILE,
    join(process.cwd(), "data", "youtube-cookies.txt"),
  ].filter((p): p is string => Boolean(p));
  for (const p of candidates) {
    if (existsSync(p)) {
      materialized = p;
      return p;
    }
  }

  materialized = null;
  return null;
}
