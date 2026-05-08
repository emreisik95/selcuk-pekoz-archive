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

  const inline = process.env.YOUTUBE_COOKIES_TXT;
  if (inline && inline.trim().length > 0) {
    const dir = mkdtempSync(join(tmpdir(), "yt-cookies-"));
    const path = join(dir, "cookies.txt");
    writeFileSync(path, inline, { mode: 0o600 });
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
