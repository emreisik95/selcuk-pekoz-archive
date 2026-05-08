import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MCard } from "@/components/MCard";
import { Thumb } from "@/components/Thumb";
import { Countdown } from "@/components/Countdown";
import { BellIcon, ExtIcon, ArrowIcon } from "@/components/Icon";
import {
  getAllStreams,
  getNextStream,
  getNow,
  getPastStreams,
  getUpcomingStreams,
  isUsingMockData,
} from "@/lib/streams";
import { getAdminConfig } from "@/lib/admin-config";
import { dateTR, relTR, views as fmtViews } from "@/lib/fmt";
import Link from "next/link";
import type { Stream } from "@/lib/types";
import { TwitterTimeline } from "@/components/TwitterTimeline";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Tailwind needs concrete class strings — use a static map.
const COLS_DESKTOP: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};

function PastWeekSection({ past, now }: { past: Stream[]; now: Date }) {
  const cutoff = now.getTime() - WEEK_MS;
  const week = past.filter((s) => {
    const t = new Date(s.actualStartAt ?? s.scheduledAt).getTime();
    return t >= cutoff && t <= now.getTime();
  });

  if (past.length === 0) return null;

  if (week.length === 0) {
    return (
      <section className="px-5 md:px-10 pt-5 md:pt-7 pb-9 border-t border-hair">
        <div className="flex items-baseline justify-between mb-4">
          <div
            className="font-mono text-[10px] md:text-[11px] uppercase text-muted"
            style={{ letterSpacing: "0.12em" }}
          >
            Geçen hafta nelere bakmış
          </div>
          <Link
            href="/arsiv"
            className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-text"
          >
            <span className="hidden md:inline">Tüm arşiv</span>
            <span className="md:hidden">Arşiv</span>{" "}
            ({past.length}) <ArrowIcon />
          </Link>
        </div>
        <p className="font-mono text-[12px] text-muted">
          Geçen hafta yayın olmamış. En son yayın {relTR(past[0].scheduledAt, now)}.
        </p>
      </section>
    );
  }

  const count = Math.min(week.length, 6);
  const colsCls = COLS_DESKTOP[count];
  // Mobile: 1 card → cols-1; otherwise 2.
  const mobileCols = week.length === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <section className="px-5 md:px-10 pt-5 md:pt-7 pb-9 border-t border-hair">
      <div className="flex items-baseline justify-between mb-4">
        <div
          className="font-mono text-[10px] md:text-[11px] uppercase text-muted"
          style={{ letterSpacing: "0.12em" }}
        >
          Geçen hafta nelere bakmış — {week.length} yayın
        </div>
        <Link
          href="/arsiv"
          className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-text"
        >
          <span className="hidden md:inline">Tüm arşiv</span>
          <span className="md:hidden">Arşiv</span>{" "}
          ({past.length}) <ArrowIcon />
        </Link>
      </div>
      <div className={`grid ${mobileCols} ${colsCls} gap-3 md:gap-4`}>
        {week.slice(0, 6).map((s) => (
          <MCard key={s.id} stream={s} now={now} />
        ))}
      </div>
    </section>
  );
}

function PinnedSection({ stream, now }: { stream: Stream; now: Date }) {
  const d = dateTR(stream.scheduledAt);
  return (
    <section className="border-t border-hair px-5 md:px-10 pt-6 md:pt-9 pb-5 md:pb-7">
      <div
        className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-4"
        style={{ letterSpacing: "0.12em" }}
      >
        ★ Sabitlenmiş yayın
      </div>
      <Link href={`/y/${stream.id}`} className="group grid grid-cols-1 md:grid-cols-[420px_1fr] gap-5 md:gap-8 items-start">
        <div className="aspect-video rounded-[2px] overflow-hidden bg-black">
          <Thumb stream={stream} />
        </div>
        <div>
          <h2
            className="font-serif text-[22px] md:text-[28px] font-medium leading-[1.15] text-balance group-hover:underline decoration-hair underline-offset-4"
            style={{ letterSpacing: "-0.02em" }}
          >
            {stream.title}
          </h2>
          <div
            className="mt-2 font-mono text-[11px] md:text-[12px] text-muted uppercase"
            style={{ letterSpacing: "0.04em" }}
          >
            {d.weekday} · {d.day} {d.monthLong} {d.year}
            {stream.viewCount ? ` · ${fmtViews(stream.viewCount)} izlenme` : ""}
            {" · "}{relTR(stream.scheduledAt, now)}
          </div>
          {stream.description && (
            <p className="mt-3 text-[13px] text-muted leading-relaxed line-clamp-3 max-w-[640px]">
              {stream.description}
            </p>
          )}
        </div>
      </Link>
    </section>
  );
}

export const revalidate = 60;

export default function HomePage() {
  const upcoming = getUpcomingStreams();
  const past = getPastStreams();
  const next = getNextStream();
  const now = getNow();
  const pinned = isUsingMockData();
  const cfg = getAdminConfig();
  const pinnedStream = cfg.pinnedVideoId
    ? getAllStreams().find((s) => s.id === cfg.pinnedVideoId)
    : undefined;

  if (!next) {
    const last = past[0];
    return (
      <>
        <Nav />
        <main className="flex-1">
          <section className="border-b border-hair px-5 md:px-10 pt-6 md:pt-12 pb-9">
            <div
              className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-4"
              style={{ letterSpacing: "0.12em" }}
            >
              Selçuk ne zaman yayında?
            </div>
            <h1
              className="font-serif text-[26px] md:text-[32px] font-medium text-balance"
              style={{ letterSpacing: "-0.02em" }}
            >
              Şu an planlanmış bir yayın yok
            </h1>
            {last && (
              <p className="mt-2 font-mono text-[12px] text-muted">
                Son yayın {relTR(last.scheduledAt, now)}
              </p>
            )}
            {last && (
              <div className="mt-6 max-w-md">
                <MCard stream={last} now={now} />
              </div>
            )}
          </section>
          {past.length > 0 && (
            <section className="px-5 md:px-10 pt-5 md:pt-7 pb-9">
              <div
                className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-4"
                style={{ letterSpacing: "0.12em" }}
              >
                Geçen hafta nelere bakmış
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
                {past.slice(0, 12).map((s) => (
                  <MCard key={s.id} stream={s} now={now} />
                ))}
              </div>
            </section>
          )}
        </main>
        <Footer />
      </>
    );
  }

  const d = dateTR(next.scheduledAt);
  const isLive = next.kind === "live";

  return (
    <>
      <Nav />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-hair px-5 md:px-10 pt-6 md:pt-12 pb-9 md:pb-9">
          <div
            className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-4 md:mb-6"
            style={{ letterSpacing: "0.12em" }}
          >
            {isLive ? "Selçuk şu an yayında" : "Selçuk ne zaman yayında?"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-8 md:gap-12 md:items-end">
            <div>
              {isLive ? (
                <div className="flex items-baseline gap-4 md:gap-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <span
                      className="live-dot inline-block rounded-full bg-red"
                      style={{ width: 18, height: 18 }}
                      aria-hidden
                    />
                    <span
                      className="font-serif font-semibold text-red leading-none"
                      style={{
                        fontSize: "clamp(56px, 8vw, 88px)",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      CANLI
                    </span>
                  </div>
                  {next.concurrentViewers ? (
                    <span
                      className="font-mono text-[11px] md:text-[13px] text-muted uppercase"
                      style={{ letterSpacing: "0.08em" }}
                    >
                      {next.concurrentViewers.toLocaleString("tr-TR")} izleyici
                    </span>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Countdown
                      targetISO={next.scheduledAt}
                      nowISO={now.toISOString()}
                      pinned={pinned}
                      big
                    />
                  </div>
                  <div className="md:hidden">
                    <Countdown
                      targetISO={next.scheduledAt}
                      nowISO={now.toISOString()}
                      pinned={pinned}
                      big={false}
                    />
                  </div>
                </>
              )}
              <h1
                className="mt-5 md:mt-9 font-serif text-[22px] md:text-[32px] font-medium leading-[1.15] md:leading-[1.1] text-balance max-w-[540px]"
                style={{ letterSpacing: "-0.02em" }}
              >
                {next.title}
              </h1>
              <div
                className="mt-2 md:mt-3 font-mono text-[11px] md:text-[12px] text-muted uppercase"
                style={{ letterSpacing: "0.04em" }}
              >
                {isLive
                  ? `${d.time}'de başladı (TRT)`
                  : `${d.weekday} · ${d.day} ${d.monthLong} · ${d.time} (TRT)`}
              </div>
              <div className="mt-4 md:mt-7 md:hidden aspect-video rounded-[2px] overflow-hidden bg-black">
                <Thumb stream={next} />
              </div>
              <div className="mt-4 md:mt-7 flex flex-col md:flex-row gap-3">
                <a
                  href={`https://youtube.com/watch?v=${next.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-ink text-bg text-[13px] font-medium px-4 md:px-[18px] py-3 md:py-[11px] rounded-[2px]"
                >
                  {isLive ? (
                    <>
                      <span
                        className="live-dot inline-block w-2 h-2 rounded-full"
                        style={{ background: "#dc2626" }}
                        aria-hidden
                      />
                      YouTube&apos;da izle
                    </>
                  ) : (
                    <>
                      <BellIcon />
                      YouTube&apos;da hatırlatıcı kur
                    </>
                  )}
                  <ExtIcon />
                </a>
                {!isLive && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center border border-hair bg-transparent text-[13px] text-text font-medium px-4 md:px-[18px] py-3 md:py-[10px] rounded-[2px] hover:bg-hair/40"
                  >
                    Takvime ekle
                  </button>
                )}
              </div>
            </div>
            <div className="hidden md:block aspect-video rounded-[2px] overflow-hidden bg-black">
              <Thumb stream={next} />
            </div>
          </div>
        </section>

        {/* Pinned stream */}
        {pinnedStream && pinnedStream.id !== next?.id && (
          <PinnedSection stream={pinnedStream} now={now} />
        )}

        {/* Upcoming strip */}
        <section className="px-5 md:px-10 pt-6 md:pt-9 pb-5 md:pb-7">
          <div className="flex items-baseline justify-between mb-4">
            <div
              className="font-mono text-[10px] md:text-[11px] uppercase text-muted"
              style={{ letterSpacing: "0.12em" }}
            >
              Yaklaşan — {upcoming.length} yayın
            </div>
            <Link
              href="/takvim"
              className="hidden md:inline-flex items-center gap-1 text-[12px] text-muted hover:text-text"
            >
              Takvimde gör <ArrowIcon />
            </Link>
          </div>
          <div className="md:hidden -mx-5 px-5 flex gap-3 overflow-x-auto snap-x">
            {upcoming.slice(0, 5).map((s) => (
              <div key={s.id} className="w-[200px] shrink-0 snap-start">
                <MCard stream={s} now={now} />
              </div>
            ))}
          </div>
          <div className="hidden md:grid grid-cols-5 gap-4">
            {upcoming.slice(0, 5).map((s) => (
              <MCard key={s.id} stream={s} now={now} />
            ))}
          </div>
        </section>

        {/* Past — last 7 days, grid auto-sizes to count */}
        <PastWeekSection past={past} now={now} />

        {/* Twitter timeline */}
        {cfg.twitterTimeline?.enabled && cfg.twitterTimeline.handle && (
          <section className="border-t border-hair px-5 md:px-10 pt-6 md:pt-9 pb-9">
            <div className="flex items-baseline justify-between mb-4">
              <div
                className="font-mono text-[10px] md:text-[11px] uppercase text-muted"
                style={{ letterSpacing: "0.12em" }}
              >
                X.com&apos;dan son
              </div>
              <a
                href={`https://x.com/${cfg.twitterTimeline.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-muted hover:text-text"
              >
                @{cfg.twitterTimeline.handle} ↗
              </a>
            </div>
            <div className="max-w-[640px]">
              <TwitterTimeline handle={cfg.twitterTimeline.handle} height={500} />
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
