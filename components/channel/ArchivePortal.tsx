import Link from "next/link";
import { Thumb } from "@/components/Thumb";
import { duration, views } from "@/lib/fmt";
import type { Stream } from "@/lib/types";

type Props = {
  popular: Stream[];
};

const portals = [
  {
    href: "/rastgele",
    kicker: "Zaman makinesi",
    title: "Rastgele bir yayına ışınlan",
    tone: "bg-on-air text-white",
    glyph: "↝",
  },
  {
    href: "/arsiv",
    kicker: "Tam koleksiyon",
    title: "Yıla, oyuna ve tarihe göre tara",
    tone: "bg-switch text-white",
    glyph: "⌁",
  },
  {
    href: "/takvim",
    kicker: "Yayın takvimi",
    title: "Sıradaki buluşmayı kaçırma",
    tone: "bg-phosphor text-broadcast",
    glyph: "◴",
  },
  {
    href: "/istatistikler",
    kicker: "Kanalın hafızası",
    title: "Saatleri, serileri ve ritmi gör",
    tone: "bg-broadcast text-paper border border-white/15",
    glyph: "⌗",
  },
] as const;

export function ArchivePortal({ popular }: Props) {
  return (
    <section className="border-b border-hair px-5 py-12 md:px-8 md:py-16 lg:px-10 lg:py-20">
      <div className="mb-8 md:mb-10">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-blue">
          Tek bir kapı yok
        </p>
        <h2 className="font-display mt-2 text-[38px] font-bold leading-none tracking-[-0.05em] md:text-[58px]">
          Arşive dal
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {portals.map((portal) => (
          <Link
            key={portal.href}
            href={portal.href}
            className={`signal-link group flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[22px] p-5 md:min-h-[270px] md:p-6 ${portal.tone}`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] opacity-65">
                {portal.kicker}
              </p>
              <span className="font-display text-[28px] leading-none opacity-65 transition-transform group-hover:rotate-12 group-hover:scale-110" aria-hidden="true">
                {portal.glyph}
              </span>
            </div>
            <h3 className="font-display max-w-[13ch] text-[27px] font-bold leading-[0.98] tracking-[-0.04em] md:text-[32px]">
              {portal.title}
            </h3>
          </Link>
        ))}
      </div>

      {popular.length > 0 && (
        <div className="mt-12 border-t border-hair pt-7 md:mt-16 md:pt-9">
          <div className="mb-5 flex items-center justify-between gap-5">
            <h3 className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
              Arşivin en çok izlenenleri
            </h3>
            <Link href="/arsiv" className="text-[11px] font-medium text-muted hover:text-text">
              Daha fazlası ↗
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((stream, index) => (
              <Link
                key={stream.id}
                href={`/y/${stream.id}`}
                className="group grid grid-cols-[86px_1fr] items-center gap-3 rounded-[14px] border border-hair bg-surface p-2.5"
              >
                <div className="relative aspect-video overflow-hidden rounded-[8px] bg-broadcast">
                  <Thumb stream={stream} showLive={false} />
                  <span className="absolute left-1 top-1 grid size-5 place-items-center rounded-full bg-paper font-mono text-[7px] font-bold text-broadcast">
                    {index + 1}
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="line-clamp-2 text-[11px] font-semibold leading-snug group-hover:underline">
                    {stream.title}
                  </h4>
                  <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.08em] text-muted">
                    {stream.viewCount ? `${views(stream.viewCount)} izlenme` : ""}
                    {stream.durationSec ? ` / ${duration(stream.durationSec)}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
