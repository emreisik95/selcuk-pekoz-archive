import type { Stream } from "./types";

export type MonthCell = {
  date: Date;
  dayOfMonth: number;
  inMonth: boolean;
  events: Stream[];
};

export function buildMonthGrid(
  streams: Stream[],
  year: number,
  month: number,
): MonthCell[] {
  const first = new Date(Date.UTC(year, month, 1));
  const firstDow = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: MonthCell[] = [];
  for (let i = 0; i < 35; i++) {
    const dayOfMonth = i - firstDow + 1;
    const inMonth = dayOfMonth >= 1 && dayOfMonth <= daysInMonth;
    const date = new Date(Date.UTC(year, month, dayOfMonth));
    const events = streams.filter((s) => {
      const d = new Date(new Date(s.scheduledAt).getTime() + 3 * 3600 * 1000);
      return (
        d.getUTCFullYear() === date.getUTCFullYear() &&
        d.getUTCMonth() === date.getUTCMonth() &&
        d.getUTCDate() === date.getUTCDate()
      );
    });
    cells.push({ date, dayOfMonth, inMonth, events });
  }
  return cells;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function generateICS(params: {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  uid: string;
}): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const desc = params.description
    ? params.description.replace(/\n/g, "\\n").replace(/,/g, "\\,")
    : "";
  const loc = params.location ? params.location.replace(/,/g, "\\,") : "";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Selcuk Pekoz Yayin Arsivi//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(params.start)}`,
    `DTEND:${fmt(params.end)}`,
    `SUMMARY:${params.title.replace(/,/g, "\\,")}`,
    ...(desc ? [`DESCRIPTION:${desc}`] : []),
    ...(loc ? [`LOCATION:${loc}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function googleCalendarUrl(params: {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${fmt(params.start)}/${fmt(params.end)}`,
    ...(params.description ? { details: params.description } : {}),
    ...(params.location ? { location: params.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function appleCalendarUrl(params: {
  title: string;
  start: Date;
  end: Date;
}): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const p = new URLSearchParams({
    title: params.title,
    start: fmt(params.start),
    end: fmt(params.end),
  });
  return `https://calendar.apple.com/calendar/v2/events/new?${p.toString()}`;
}

export function downloadICS(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}