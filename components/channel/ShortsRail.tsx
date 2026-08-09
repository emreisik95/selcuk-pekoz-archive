import Link from "next/link";
import { duration, relTR, views } from "@/lib/fmt";
import type { Short } from "@/lib/types";

type Props = {
  items: Short[];
  now: Date;
};

export function ShortsRail({ items, now }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="overflow-hidden border-b border-hair bg-broadcast py-12 text-paper md:py-16 lg:py-20">
      <div className="flex items-end justify-between gap-5 px-5 md:px-8 lg:px-10">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-phosphor">
            Dikey frekans
          </p>
          <h2 className="font-display mt-2 text-[38px] font-bold leading-none tracking-[-0.05em] md:text-[58px]">
            Kısa sinyaller
          </h2>
        </div>
        <Link
          href="/shorts"
          className="signal-link inline-flex items-center gap-2 text-[12px] font-semibold text-paper/60 hover:text-paper"
        >
          Tüm Shorts <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div
        className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] md:mt-10 md:gap-4 md:px-8 lg:px-10 [&::-webkit-scrollbar]:hidden"
        aria-label="En yeni Shorts videoları"
      >
        {items.map((item, index) => (
          <a
            key={item.id}
            href={`https://www.youtube.com/shorts/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-[44vw] max-w-[250px] shrink-0 snap-start sm:w-[29vw] lg:w-[18vw]"
          >
            <div className="relative aspect-[9/16] overflow-hidden rounded-[20px] bg-surface/5">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
              <span className="absolute left-3 top-3 grid size-7 place-items-center rounded-full border border-white/25 bg-black/30 font-mono text-[8px] text-white backdrop-blur-sm">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="absolute inset-x-3 bottom-3">
                <h3 className="line-clamp-3 text-[13px] font-semibold leading-snug text-white md:text-[14px]">
                  {item.title}
                </h3>
                <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.08em] text-white/60">
                  {item.durationSec ? `${duration(item.durationSec)} / ` : ""}
                  {item.viewCount ? `${views(item.viewCount)} / ` : ""}
                  {relTR(item.publishedAt, now)}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
