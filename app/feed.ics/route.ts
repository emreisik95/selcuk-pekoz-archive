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
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function dt(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const se = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${mo}${da}T${h}${mi}${se}Z`;
}

// Fold long lines per RFC 5545 §3.1, by UTF-8 octet count.
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
    while (end > cursor && (bytes[end] & 0b1100_0000) === 0b1000_0000) end--;
    chunks.push((chunks.length === 0 ? "" : " ") + dec.decode(bytes.slice(cursor, end)));
    cursor = end;
  }
  return chunks.join("\r\n");
}

// Stable hostname for PRODID + UID — independent of how the server sees the
// request (Coolify forwards via 0.0.0.0:3000 internally). Using a fixed
// domain keeps UIDs stable across syncs and stops Google from re-parsing
// every event on each refresh.
function calendarDomain(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) {
    try {
      return new URL(env).hostname;
    } catch {
      /* fall through */
    }
  }
  return "selcukpekoz-archive";
}

const MAX_DESC_LEN = 800;

function buildEvent(
  s: Stream,
  channelTitle: string,
  domain: string,
): string[] {
  const url = `https://youtube.com/watch?v=${s.id}`;
  const startISO =
    s.actualStartAt ?? s.scheduledAt ?? new Date().toISOString();
  const dtStart = dt(startISO);
  let dtEnd: string;
  if (s.actualEndAt) {
    dtEnd = dt(s.actualEndAt);
  } else if (s.durationSec && s.durationSec > 0) {
    dtEnd = dt(new Date(new Date(startISO).getTime() + s.durationSec * 1000));
  } else {
    dtEnd = dt(new Date(new Date(startISO).getTime() + 2 * 3600 * 1000));
  }

  const liveTag = s.kind === "live" ? "● CANLI · " : "";
  const summary = liveTag + s.title;

  // Keep the description short — Google rejects feeds with overly long
  // event bodies. Strip any leading boilerplate and clamp to MAX_DESC_LEN.
  let desc = (s.description ?? "").replace(/\r/g, "").trim();
  if (desc.length > MAX_DESC_LEN) {
    desc = desc.slice(0, MAX_DESC_LEN).trimEnd() + "…";
  }
  // Append the YouTube link as the last line so it's clickable in clients
  // that linkify URLs in DESCRIPTION.
  desc = (desc ? desc + "\n\n" : "") + `${channelTitle} · YouTube\n${url}`;

  const status = s.kind === "upcoming" ? "TENTATIVE" : "CONFIRMED";

  return [
    "BEGIN:VEVENT",
    foldLine(`UID:${s.id}@${domain}`),
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    foldLine(`SUMMARY:${escapeICS(summary)}`),
    foldLine(`DESCRIPTION:${escapeICS(desc)}`),
    foldLine(`URL:${url}`),
    `STATUS:${status}`,
    "TRANSP:OPAQUE",
    "END:VEVENT",
  ];
}

export async function GET() {
  const meta = getChannelMeta();
  const channelTitle = meta?.title ?? "Selçuk Peköz";
  const calName = `${channelTitle} Yayınları`;
  const domain = calendarDomain();

  const upcoming = getUpcomingStreams();
  const live = getLiveStreams();
  const past = getPastStreams();
  const cutoff = Date.now() - 60 * 24 * 3600 * 1000;
  const recentPast = past.filter(
    (s) => new Date(s.actualStartAt ?? s.scheduledAt).getTime() >= cutoff,
  );
  const events = [...upcoming, ...live, ...recentPast];

  // No METHOD:PUBLISH — Google treats those feeds as proposed-event
  // imports, not as subscriptions. Plain VCALENDAR with VEVENTs is the
  // recommended subscribe shape.
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    foldLine(`PRODID:-//${domain}//Selcuk Pekoz Archive//TR`),
    "CALSCALE:GREGORIAN",
    foldLine(`X-WR-CALNAME:${escapeICS(calName)}`),
    "X-WR-TIMEZONE:Europe/Istanbul",
    foldLine(
      `X-WR-CALDESC:${escapeICS(
        "Selçuk Peköz YouTube canlı yayınları (resmi olmayan fan projesi)",
      )}`,
    ),
    foldLine(`NAME:${escapeICS(calName)}`),
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const s of events) {
    lines.push(...buildEvent(s, channelTitle, domain));
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
