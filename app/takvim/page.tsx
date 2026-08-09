import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Thumb } from "@/components/Thumb";
import {
  getAllStreams,
  getNow,
  getPastStreams,
  getUpcomingStreams,
} from "@/lib/streams";
import { dateTR, TR_WEEKDAYS_SHORT_MON_FIRST } from "@/lib/fmt";
import { buildMonthGrid } from "@/lib/calendar";
import { listManualEvents } from "@/lib/manual";
import { isAdmin } from "@/lib/auth";
import type { Stream } from "@/lib/types";
import { CalendarActions } from "./CalendarActions";

// Manual events that haven't matched a YouTube video yet show up as planned
// "tentative" entries on the calendar.
function manualToStream(m: import("@/lib/types").ManualEvent): Stream {
  return {
    id: `manual:${m.id}`,
    kind: "upcoming",
    title: m.title,
    scheduledAt: m.scheduledAt,
    actualStartAt: null,
    actualEndAt: null,
    durationSec: m.durationMin ? m.durationMin * 60 : null,
    viewCount: null,
    palette: ["#1a1815", "#a8a39c", "#6b6660"],
    episodeNo: 0,
    description: m.description,
  };
}

export const revalidate = 60;

type View = "ay" | "ajanda";

type DateParts = { year: number; month: number; date: number };

function todayInIstanbul(now: Date): DateParts {
  const t = new Date(now.getTime() + 3 * 3600 * 1000);
  return {
    year: t.getUTCFullYear(),
    month: t.getUTCMonth(),
    date: t.getUTCDate(),
  };
}

function parseMonthParam(
  raw: string | undefined,
  fallback: DateParts,
): { year: number; month: number } {
  if (!raw) return { year: fallback.year, month: fallback.month };
  const m = raw.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return { year: fallback.year, month: fallback.month };
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  if (year < 2005 || year > 2100 || month < 0 || month > 11) {
    return { year: fallback.year, month: fallback.month };
  }
  return { year, month };
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

function fmtMonthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

const MONTHS_LONG = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function MonthView({
  streams,
  visible,
  today,
}: {
  streams: Stream[];
  visible: { year: number; month: number };
  today: DateParts;
}) {
  const cells = buildMonthGrid(streams, visible.year, visible.month);
  const todayMs = Date.UTC(today.year, today.month, today.date);
  return (
    <>
      <div className="px-5 md:px-10 grid grid-cols-7 border-b border-hair">
        {TR_WEEKDAYS_SHORT_MON_FIRST.map((w) => (
          <div
            key={w}
            className="px-3 py-2.5 font-mono text-[10px] uppercase text-muted"
            style={{ letterSpacing: "0.1em" }}
          >
            {w}
          </div>
        ))}
      </div>
      <div
        className="px-5 md:px-10 grid grid-cols-7"
        style={{ gridAutoRows: "108px" }}
      >
        {cells.map((c, i) => {
          const isToday =
            c.inMonth &&
            c.date.getUTCFullYear() === today.year &&
            c.date.getUTCMonth() === today.month &&
            c.date.getUTCDate() === today.date;
          const isPast = c.inMonth && c.date.getTime() < todayMs;
          const isLast = (i + 1) % 7 === 0;
          return (
            <div
              key={i}
              className={
                "relative px-2 pt-2 pb-1.5 border-b border-hair " +
                (isLast ? "" : "border-r border-hair ")
              }
            >
              <div
                className={
                  "mb-1.5 font-mono text-[12px] " +
                  (!c.inMonth ? "opacity-30 " : "") +
                  (isToday
                    ? "text-red font-bold"
                    : isPast
                      ? "text-faint"
                      : "text-text")
                }
              >
                {c.date.getUTCDate()}
                {isToday && (
                  <span
                    className="ml-1.5 text-[9px]"
                    style={{ letterSpacing: "0.1em" }}
                  >
                    BUGÜN
                  </span>
                )}
              </div>
              {c.inMonth &&
                c.events.slice(0, 2).map((s) => (
                  <EventChip
                    key={s.id}
                    stream={s}
                    isPast={isPast}
                    colIdx={i % 7}
                  />
                ))}
              {c.inMonth && c.events.length > 2 && (
                <div className="ml-1.5 mt-0.5 text-[10px] text-muted">
                  +{c.events.length - 2}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function EventChip({
  stream,
  isPast,
  colIdx,
}: {
  stream: Stream;
  isPast: boolean;
  colIdx: number;
}) {
  const time = dateTR(stream.scheduledAt).time;
  const d = dateTR(stream.scheduledAt);
  const cls =
    stream.kind === "live"
      ? "bg-red text-white"
      : isPast
        ? "bg-event-past text-muted"
        : "bg-ink text-bg";
  const desc = (stream.description ?? "").trim();
  const trunc = desc.length > 240 ? desc.slice(0, 240).trim() + "…" : desc;
  // Anchor preview to right edge for last 3 columns to avoid clipping
  const anchorRight = colIdx >= 4;

  return (
    <div className="relative group/chip mb-[3px]">
      <Link
        href={`/y/${stream.id}`}
        aria-label={`${time} — ${stream.title}`}
        className={
          "block px-[5px] py-[3px] text-[10px] font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis " +
          cls
        }
        style={{ borderRadius: 1 }}
      >
        {stream.kind === "live" && "● "}
        {time} {stream.title}
      </Link>
      <div
        role="tooltip"
        className={
          "hidden md:block absolute z-50 top-[calc(100%+4px)] w-64 " +
          (anchorRight ? "right-0" : "left-0") +
          " p-2.5 bg-bg border border-hair rounded-[2px] " +
          "shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] " +
          "opacity-0 translate-y-1 pointer-events-none " +
          "group-hover/chip:opacity-100 group-hover/chip:translate-y-0 group-hover/chip:pointer-events-auto " +
          "group-focus-within/chip:opacity-100 group-focus-within/chip:translate-y-0 group-focus-within/chip:pointer-events-auto " +
          "transition-[opacity,transform] duration-150 delay-150"
        }
      >
        <div className="aspect-video rounded-[2px] overflow-hidden bg-black mb-2">
          <Thumb stream={stream} showLive={stream.kind === "live"} />
        </div>
        <div
          className="font-mono text-[9px] uppercase text-muted mb-1"
          style={{ letterSpacing: "0.08em" }}
        >
          {stream.kind === "live" ? "● CANLI · " : ""}
          {d.weekday} · {d.day} {d.monthLong} · {d.time}
        </div>
        <div className="text-[12px] font-medium leading-snug text-text mb-1.5 text-pretty">
          {stream.title}
        </div>
        {trunc && (
          <p
            className="text-[11px] text-muted leading-snug"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {trunc}
          </p>
        )}
      </div>
    </div>
  );
}

function AgendaView({
  visible,
  streams,
}: {
  visible: { year: number; month: number };
  streams: Stream[];
}) {
  const inMonth = streams.filter((s) => {
    const d = dateTR(s.scheduledAt);
    return d.year === visible.year && d.monthIdx === visible.month;
  });
  inMonth.sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  type Group = { date: ReturnType<typeof dateTR>; items: Stream[] };
  const groups = new Map<string, Group>();
  for (const s of inMonth) {
    const d = dateTR(s.scheduledAt);
    const key = `${d.year}-${d.monthIdx}-${d.day}`;
    const g = groups.get(key) ?? { date: d, items: [] };
    g.items.push(s);
    groups.set(key, g);
  }

  if (groups.size === 0) {
    return (
      <div className="px-5 md:px-10 pb-12 pt-6">
        <p className="font-mono text-[12px] text-muted">
          Bu ay yayın yok.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 md:px-10 pb-6">
      {[...groups.values()].map((g) => (
        <div
          key={`${g.date.year}-${g.date.monthIdx}-${g.date.day}`}
          className="mb-5"
        >
          <div className="border-b border-hair pb-1.5 mb-2.5 flex items-baseline gap-2">
            <div className="font-serif text-[22px] font-medium">
              {g.date.day}
            </div>
            <div
              className="font-mono text-[10px] uppercase text-muted"
              style={{ letterSpacing: "0.1em" }}
            >
              {g.date.weekday} · {g.date.monthLong}
            </div>
          </div>
          {g.items.map((s) => {
            const time = dateTR(s.scheduledAt).time;
            return (
              <Link
                key={s.id}
                href={`/y/${s.id}`}
                className="flex gap-3 mb-3 group"
              >
                <div className="w-[60px] shrink-0 aspect-video rounded-[2px] overflow-hidden bg-black">
                  <Thumb stream={s} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={
                      "font-mono text-[10px] uppercase " +
                      (s.kind === "live" ? "text-red" : "text-muted")
                    }
                    style={{ letterSpacing: "0.06em" }}
                  >
                    {s.kind === "live" ? "● CANLI" : time}
                  </div>
                  <div className="text-[13px] font-medium leading-tight mt-0.5 group-hover:underline decoration-hair underline-offset-2">
                    {s.title}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; ay?: string }>;
}) {
  const { view: viewRaw, ay: ayRaw } = await searchParams;
  const now = getNow();
  const today = todayInIstanbul(now);
  const visible = parseMonthParam(ayRaw, today);
  const view: View = viewRaw === "ajanda" ? "ajanda" : "ay";
  const [realStreams, manuals] = await Promise.all([
    getAllStreams(),
    listManualEvents(),
  ]);
  const realIds = new Set(realStreams.map((s) => s.id));
  // Skip manuals that have already been merged with a YouTube video.
  const unmatchedManualStreams = manuals
    .filter((m) => !m.youtubeId || !realIds.has(m.youtubeId))
    .map(manualToStream);
  const allStreams = [...realStreams, ...unmatchedManualStreams];
  const adminLogged = await isAdmin();

  const prev = shiftMonth(visible.year, visible.month, -1);
  const next = shiftMonth(visible.year, visible.month, 1);
  const isThisMonth =
    visible.year === today.year && visible.month === today.month;

  const linkFor = (overrides: { view?: View; ay?: string }) => {
    const v = overrides.view ?? view;
    const a = overrides.ay ?? fmtMonthParam(visible.year, visible.month);
    const params = new URLSearchParams();
    if (v !== "ay") params.set("view", v);
    if (!(visible.year === today.year && visible.month === today.month && !overrides.ay)) {
      params.set("ay", a);
    }
    const qs = params.toString();
    return qs ? `/takvim?${qs}` : "/takvim";
  };

  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="px-5 md:px-10 pt-5 md:pt-8 pb-3 md:pb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div
              className="font-mono text-[10px] md:text-[11px] uppercase text-muted"
              style={{ letterSpacing: "0.12em" }}
            >
              Takvim
            </div>
            <div className="flex items-baseline gap-3 md:gap-4 mt-1 flex-wrap">
              <h1
                className="font-serif text-[26px] md:text-[38px] font-medium"
                style={{ letterSpacing: "-0.025em" }}
              >
                {MONTHS_LONG[visible.month]} {visible.year}
              </h1>
              <div className="flex items-center gap-1">
                <Link
                  href={linkFor({ ay: fmtMonthParam(prev.year, prev.month) })}
                  aria-label="Önceki ay"
                  className="inline-flex w-7 h-7 items-center justify-center border border-hair rounded-[2px] text-muted hover:text-text hover:border-text"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M6.5 2 3 5l3.5 3" />
                  </svg>
                </Link>
                <Link
                  href={linkFor({ ay: fmtMonthParam(next.year, next.month) })}
                  aria-label="Sonraki ay"
                  className="inline-flex w-7 h-7 items-center justify-center border border-hair rounded-[2px] text-muted hover:text-text hover:border-text"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M3.5 2 7 5l-3.5 3" />
                  </svg>
                </Link>
                {!isThisMonth && (
                  <Link
                    href={linkFor({
                      ay: fmtMonthParam(today.year, today.month),
                    })}
                    className="ml-2 font-mono text-[10px] uppercase text-muted hover:text-text"
                    style={{ letterSpacing: "0.08em" }}
                  >
                    Bugüne dön
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex w-full md:w-auto">
              {(["ay", "ajanda"] as const).map((v, i) => {
                const active = view === v;
                return (
                  <Link
                    key={v}
                    href={linkFor({ view: v })}
                    className={
                      "border border-hair text-[12px] px-3 py-1.5 rounded-[2px] flex-1 md:flex-none text-center capitalize " +
                      (active
                        ? "bg-ink text-bg border-ink"
                        : "bg-transparent text-text") +
                      (i > 0 ? " -ml-px" : "")
                    }
                    aria-current={active ? "page" : undefined}
                  >
                    {v === "ay" ? "Ay" : "Ajanda"}
                  </Link>
                );
              })}
            </div>
            <div className="hidden md:block w-px h-5 bg-hair mx-2" />
            <CalendarActions />
            {adminLogged && (
              <Link
                href="/admin/panel"
                className="hidden md:inline-flex border border-hair text-[12px] px-3 py-1.5 rounded-[2px] text-muted hover:text-text hover:border-text"
              >
                Yönet
              </Link>
            )}
          </div>
        </div>
        {view === "ay" ? (
          <MonthView streams={allStreams} visible={visible} today={today} />
        ) : (
          <AgendaView visible={visible} streams={allStreams} />
        )}
      </main>
      <Footer />
    </>
  );
}
