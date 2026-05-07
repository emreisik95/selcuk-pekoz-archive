import { NextResponse } from "next/server";
import {
  getLiveStreams,
  getPastStreams,
  getUpcomingStreams,
  getChannelMeta,
} from "@/lib/streams";
import type { Stream } from "@/lib/types";

export const revalidate = 60;

// RFC 5545 escaping for SUMMARY / DESCRIPTION / LOCATION fields.
function escapeICS(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function dt(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  // YYYYMMDDTHHMMSSZ
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const se = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${mo}${da}T${h}${mi}${se}Z`;
}

// Fold long lines per RFC 5545 §3.1. We fold by UTF-8 octet count (not JS
// code units) to stay conformant for non-ASCII titles. Continuation lines
// begin with a single space.
function foldLine(line: string): string {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const bytes = enc.encode(line);
  if (bytes.length <= 75) return line;

  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < bytes.length) {
    const limit = chunks.length === 0 ? 75 : 74;
    let end = Math.min(cursor + limit, bytes.length);
    // Don't split a UTF-8 multibyte sequence
    while (end > cursor && (bytes[end] & 0b1100_0000) === 0b1000_0000) end--;
    const chunk = dec.decode(bytes.slice(cursor, end));
    chunks.push((chunks.length === 0 ? "" : " ") + chunk);
    cursor = end;
  }
  return chunks.join("\r\n");
}

function buildEvent(
  s: Stream,
  channelTitle: string,
  prodIdHost: string,
): string[] {
  const url = `https://youtube.com/watch?v=${s.id}`;
  const startISO =
    s.actualStartAt ?? s.scheduledAt ?? new Date().toISOString();
  const dtStart = dt(startISO);
  // End: prefer actualEnd, else start + duration, else 2h default for upcoming.
  let dtEnd: string;
  if (s.actualEndAt) {
    dtEnd = dt(s.actualEndAt);
  } else if (s.durationSec) {
    dtEnd = dt(new Date(new Date(startISO).getTime() + s.durationSec * 1000));
  } else {
    dtEnd = dt(new Date(new Date(startISO).getTime() + 2 * 3600 * 1000));
  }
  const summary = (s.kind === "live" ? "● CANLI · " : "") + s.title;
  const desc =
    (s.description?.trim() ? s.description.trim() + "\n\n" : "") +
    `${channelTitle} · YouTube\n${url}`;
  const status =
    s.kind === "completed"
      ? "CONFIRMED"
      : s.kind === "live"
        ? "CONFIRMED"
        : "TENTATIVE";

  return [
    "BEGIN:VEVENT",
    foldLine(`UID:${s.id}@${prodIdHost}`),
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    foldLine(`SUMMARY:${escapeICS(summary)}`),
    foldLine(`DESCRIPTION:${escapeICS(desc)}`),
    foldLine(`URL:${url}`),
    `STATUS:${status}`,
    s.kind === "live" ? "TRANSP:OPAQUE" : "TRANSP:OPAQUE",
    "END:VEVENT",
  ];
}

export async function GET(req: Request) {
  const meta = getChannelMeta();
  const channelTitle = meta?.title ?? "Selçuk Peköz";
  const calName = `${channelTitle} Yayınları`;
  const host =
    new URL(req.url).host.replace(/[^a-z0-9.-]/gi, "") || "selcukpekoz-archive";

  const upcoming = getUpcomingStreams();
  const live = getLiveStreams();
  const past = getPastStreams();
  // Include 60 days of recent past so users can backfill their calendar.
  const cutoff = Date.now() - 60 * 24 * 3600 * 1000;
  const recentPast = past.filter(
    (s) => new Date(s.actualStartAt ?? s.scheduledAt).getTime() >= cutoff,
  );
  const events = [...upcoming, ...live, ...recentPast];

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    foldLine(`PRODID:-//${host}//Selcuk Pekoz Archive//TR`),
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`NAME:${escapeICS(calName)}`),
    foldLine(`X-WR-CALNAME:${escapeICS(calName)}`),
    "X-WR-TIMEZONE:Europe/Istanbul",
    foldLine(
      `X-WR-CALDESC:${escapeICS("Selçuk Peköz YouTube canlı yayınları (resmi olmayan fan projesi)")}`,
    ),
  ];
  for (const s of events) {
    lines.push(...buildEvent(s, channelTitle, host));
  }
  lines.push("END:VCALENDAR");

  const body = lines.join("\r\n") + "\r\n";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="selcuk-pekoz.ics"',
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
