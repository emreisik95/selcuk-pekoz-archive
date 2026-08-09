import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Thumb } from "@/components/Thumb";
import { dateTR, duration, relTR, views } from "@/lib/fmt";
import type { Stream } from "@/lib/types";

type Props = {
  recent: Stream[];
  upcoming: Stream[];
  pinned?: Stream | null;
  now: Date;
};

function BroadcastMeta({ stream, now }: { stream: Stream; now: Date }) {
  const bits = [
    relTR(stream.actualStartAt ?? stream.scheduledAt, now),
    stream.durationSec ? duration(stream.durationSec) : null,
    stream.viewCount ? `${views(stream.viewCount)} izlenme` : null,
  ].filter(Boolean);

  return (
    <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
      {bits.join("  /  ")}
    </p>
  );
}

export function BroadcastGrid({ recent, upcoming, pinned, now }: Props) {
  if (recent.length === 0 && upcoming.length === 0 && !pinned) return null;

  const lead = recent[0];
  const supporting = recent.slice(1, 5);

  return (
    <section className="border-b border-hair px-5 py-12 md:px-8 md:py-16 lg:px-10 lg:py-20">
      <div className="mb-7 flex items-end justify-between gap-5 md:mb-10">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-red">
            Kayıt defteri
          </p>
          <h2 className="font-display mt-2 text-[38px] font-bold leading-none tracking-[-0.05em] md:text-[58px]">
            Son yayınlar
          </h2>
        </div>
        <Link
          href="/arsiv"
          className="signal-link inline-flex items-center gap-2 text-[12px] font-semibold text-muted hover:text-text"
        >
          Tüm arşiv <span aria-hidden="true">↗</span>
        </Link>
      </div>

      {pinned && (
        <Link
          href={`/y/${pinned.id}`}
          className="group mb-6 grid overflow-hidden rounded-[18px] border border-hair bg-surface sm:grid-cols-[180px_1fr]"
        >
          <div className="aspect-video overflow-hidden sm:aspect-auto">
            <Thumb stream={pinned} showLive={false} />
          </div>
          <div className="flex items-center justify-between gap-5 px-5 py-4 md:px-6">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-red">
                Editörün seçimi
              </p>
              <h3 className="font-display mt-1.5 text-[22px] font-semibold leading-tight group-hover:underline">
                {pinned.title}
              </h3>
            </div>
            <span className="shrink-0 text-xl" aria-hidden="true">↗</span>
          </div>
        </Link>
      )}

      {lead && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
          <Link href={`/y/${lead.id}`} className="group block">
            <div className="relative aspect-video overflow-hidden rounded-[22px] bg-broadcast">
              <Thumb
                stream={lead}
                className="transition-transform duration-500 ease-out group-hover:scale-[1.025]"
              />
              <FavoriteButton videoId={lead.id} />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
              <span className="absolute bottom-4 left-4 rounded-full bg-paper px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-broadcast md:bottom-5 md:left-5">
                En yeni kayıt
              </span>
            </div>
            <h3 className="font-display mt-4 max-w-4xl text-balance text-[28px] font-bold leading-[1.02] tracking-[-0.04em] group-hover:underline md:text-[38px]">
              {lead.title}
            </h3>
            <BroadcastMeta stream={lead} now={now} />
          </Link>

          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 lg:grid-rows-2">
            {supporting.map((stream) => (
              <Link key={stream.id} href={`/y/${stream.id}`} className="group min-w-0">
                <div className="relative aspect-video overflow-hidden rounded-[12px] bg-broadcast">
                  <Thumb
                    stream={stream}
                    className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <FavoriteButton videoId={stream.id} />
                </div>
                <h3 className="mt-2.5 line-clamp-2 text-[13px] font-semibold leading-snug group-hover:underline md:text-[14px]">
                  {stream.title}
                </h3>
                <BroadcastMeta stream={stream} now={now} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mt-12 border-t border-hair pt-6 md:mt-16">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue">
              Takvimde sırada
            </h3>
            <Link href="/takvim" className="text-[11px] font-medium text-muted hover:text-text">
              Takvimi aç ↗
            </Link>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[16px] border border-hair bg-hair md:grid-cols-3">
            {upcoming.map((stream) => {
              const d = dateTR(stream.scheduledAt);
              return (
                <Link
                  key={stream.id}
                  href={`/y/${stream.id}`}
                  className="group flex min-w-0 items-center gap-4 bg-surface p-4 hover:bg-bg md:p-5"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-switch text-center text-white">
                    <span className="font-display text-[18px] font-bold leading-none">{d.day}</span>
                    <span className="font-mono text-[7px] uppercase tracking-[0.08em]">{d.month}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[13px] font-semibold leading-snug group-hover:underline">
                      {stream.title}
                    </span>
                    <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                      {d.weekday} · {d.time} TRT
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
