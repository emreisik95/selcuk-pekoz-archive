import Link from "next/link";
import { CalendarButton } from "@/components/CalendarButton";
import { Countdown } from "@/components/Countdown";
import { Thumb } from "@/components/Thumb";
import type { ChannelSnapshot } from "@/lib/channel-snapshot";
import { dateTR, duration, relTR, views } from "@/lib/fmt";

type Props = {
  snapshot: ChannelSnapshot;
  now: Date;
  freezeCountdown?: boolean;
};

const state = {
  live: {
    label: "ŞİMDİ CANLI",
    eyebrow: "Yayın açık, kapı burada",
    tone: "text-on-air",
  },
  upcoming: {
    label: "SIRADAKİ YAYIN",
    eyebrow: "Takvimdeki bir sonraki buluşma",
    tone: "text-switch",
  },
  latest: {
    label: "SON SİNYAL",
    eyebrow: "En son burada kaldık",
    tone: "text-paper",
  },
  empty: {
    label: "YAYIN BEKLENİYOR",
    eyebrow: "Yeni sinyal geldiğinde burada olacak",
    tone: "text-console",
  },
} as const;

export function ChannelHero({ snapshot, now, freezeCountdown }: Props) {
  const active = snapshot.active;
  const copy = state[snapshot.mode];

  if (!active) {
    return (
      <section className="signal-grid grid min-h-[520px] place-items-center border-b border-hair bg-broadcast px-5 py-20 text-paper md:min-h-[640px]">
        <div className="max-w-xl text-center">
          <p className={`font-mono text-[10px] font-semibold tracking-[0.22em] ${copy.tone}`}>
            {copy.label}
          </p>
          <h1 className="font-display mt-5 text-balance text-[48px] font-bold leading-[0.92] md:text-[82px]">
            Bir sonraki yayın için hat açık.
          </h1>
          <p className="mx-auto mt-6 max-w-md text-[15px] leading-7 text-paper/60">
            Bu sırada geçmiş yayınların, Shorts&apos;ların ve kanal rakamlarının tamamı arşivde.
          </p>
          <Link
            href="/arsiv"
            className="signal-link mt-8 inline-flex rounded-full bg-paper px-5 py-3 text-[13px] font-semibold text-broadcast"
          >
            Arşivi keşfet <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    );
  }

  const d = dateTR(active.actualStartAt ?? active.scheduledAt);
  const youtubeUrl = `https://youtube.com/watch?v=${active.id}`;
  const meta = [
    `${d.day} ${d.monthLong} ${d.year} · ${d.time} TRT`,
    active.durationSec ? duration(active.durationSec) : null,
    active.viewCount ? `${views(active.viewCount)} izlenme` : null,
  ].filter(Boolean);

  return (
    <section className="grid border-b border-hair bg-broadcast text-paper lg:min-h-[min(760px,calc(100svh-64px))] lg:grid-cols-[minmax(0,1.55fr)_minmax(360px,.75fr)]">
      <div className="channel-signal relative min-h-[310px] overflow-hidden sm:min-h-[430px] lg:min-h-full">
        <Thumb
          stream={active}
          className="signal-image absolute inset-0"
          showLive={false}
          loading="eager"
        />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(9,10,12,0.02)_35%,rgba(9,10,12,0.82)_100%)]" />
        <div className="signal-grid absolute inset-0 z-[1] opacity-30" />
        <div className="absolute inset-x-5 bottom-5 z-[2] flex items-end justify-between gap-4 md:inset-x-8 md:bottom-7">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/70">
            SP—{String(active.episodeNo).padStart(3, "0")} · {relTR(active.actualStartAt ?? active.scheduledAt, now)}
          </span>
          <span className="hidden h-px flex-1 bg-white/25 sm:block" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/70">
            YouTube arşivi
          </span>
        </div>
      </div>

      <div className="signal-grid relative flex flex-col justify-between border-t border-white/10 px-5 py-7 sm:px-8 sm:py-9 lg:border-l lg:border-t-0 lg:px-10 lg:py-11">
        <div>
          <div className="flex items-center justify-between gap-4">
            <p className={`font-mono text-[10px] font-semibold tracking-[0.2em] ${copy.tone}`}>
              {copy.label}
            </p>
            {snapshot.mode === "live" && (
              <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-paper/55">
                <span className="live-dot size-2 rounded-full bg-on-air" />
                On air
              </span>
            )}
          </div>
          <p className="mt-3 text-[12px] text-paper/45">{copy.eyebrow}</p>

          {snapshot.mode === "upcoming" && (
            <div className="mt-8 overflow-hidden text-paper [&_.font-serif]:!font-display [&_.font-serif]:!text-[clamp(34px,4vw,58px)] [&_.font-mono]:!text-paper/45">
              <Countdown
                targetISO={active.scheduledAt}
                nowISO={now.toISOString()}
                pinned={freezeCountdown}
                big={false}
              />
            </div>
          )}

          <h1 className="font-display mt-7 text-balance text-[clamp(38px,4vw,68px)] font-bold leading-[0.94] tracking-[-0.055em]">
            {active.title}
          </h1>
          <p className="mt-5 font-mono text-[9px] uppercase leading-5 tracking-[0.11em] text-paper/50">
            {meta.join("  /  ")}
            {snapshot.mode === "live" && active.concurrentViewers
              ? `  /  ${active.concurrentViewers.toLocaleString("tr-TR")} kişi izliyor`
              : ""}
          </p>
        </div>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:mt-12">
          {snapshot.mode === "upcoming" ? (
            <>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="signal-link inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-switch px-5 text-[13px] font-semibold text-white"
              >
                YouTube&apos;da hatırlat <span aria-hidden="true">↗</span>
              </a>
              <CalendarButton stream={active} />
            </>
          ) : (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`signal-link inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-semibold ${
                snapshot.mode === "live"
                  ? "bg-on-air text-white"
                  : "bg-paper text-broadcast"
              }`}
            >
              {snapshot.mode === "live" ? "Canlı yayına git" : "YouTube’da izle"}
              <span aria-hidden="true">↗</span>
            </a>
          )}
          <Link
            href={`/y/${active.id}`}
            className="signal-link inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-5 text-[13px] font-medium text-paper hover:bg-white/10"
          >
            Yayın detayları
          </Link>
        </div>
      </div>
    </section>
  );
}
