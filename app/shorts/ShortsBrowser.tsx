"use client";

import { useMemo, useState } from "react";
import { duration as fmtDuration, views as fmtViews, relTR } from "@/lib/fmt";
import type { Short } from "@/lib/types";

type ItemWithTags = Short & { tags: string[] };

export function ShortsBrowser({ items }: { items: ItemWithTags[] }) {
  const [tag, setTag] = useState<"all" | string>("all");

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) for (const t of it.tags) set.add(t);
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (tag === "all") return items;
    return items.filter((it) => it.tags.includes(tag));
  }, [items, tag]);

  return (
    <>
      <div className="px-5 md:px-10 pt-5 md:pt-8 pb-5 md:pb-6 border-b border-hair">
        <div
          className="font-mono text-[10px] md:text-[11px] uppercase text-muted"
          style={{ letterSpacing: "0.12em" }}
        >
          Shorts — {items.length} kısa video
        </div>
        <h1
          className="font-serif text-[26px] md:text-[38px] font-medium mt-1.5"
          style={{ letterSpacing: "-0.025em" }}
        >
          Selçuk&apos;un Shorts&apos;ları
        </h1>

        {allTags.length > 0 && (
          <div className="mt-4 -mx-5 px-5 md:mx-0 md:px-0 flex gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setTag("all")}
              className={
                "shrink-0 border text-[11px] px-2.5 py-1 rounded-[2px] " +
                (tag === "all"
                  ? "bg-ink text-bg border-ink"
                  : "border-hair text-text hover:border-text")
              }
            >
              Tümü
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={
                  "shrink-0 border text-[11px] px-2.5 py-1 rounded-[2px] whitespace-nowrap " +
                  (tag === t
                    ? "bg-ink text-bg border-ink"
                    : "border-hair text-text hover:border-text")
                }
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 md:px-10 pt-4 md:pt-6 pb-9">
        {filtered.length === 0 ? (
          <p className="font-mono text-[12px] text-muted py-12 text-center">
            Bu etikete ait short yok.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {filtered.map((it) => (
              <ShortCard key={it.id} item={it} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ShortCard({ item }: { item: ItemWithTags }) {
  return (
    <a
      href={`https://www.youtube.com/shorts/${item.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="relative w-full overflow-hidden rounded-[2px] bg-black aspect-[9/16]">
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {item.durationSec ? (
          <div
            className="absolute bottom-1.5 right-1.5 px-[5px] py-[2px] font-mono text-[9px] font-semibold text-white"
            style={{ background: "rgba(0,0,0,0.78)", borderRadius: 2 }}
          >
            {fmtDuration(item.durationSec)}
          </div>
        ) : null}
        {item.tags.length > 0 && (
          <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="px-1.5 py-[2px] text-[9px] font-medium text-white rounded-[1px] backdrop-blur-sm"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  letterSpacing: "0.04em",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-2">
        <h3 className="text-[13px] font-medium leading-tight line-clamp-2 group-hover:underline decoration-hair underline-offset-2">
          {item.title}
        </h3>
        <p
          className="mt-1 font-mono text-[11px] text-muted"
          style={{ letterSpacing: "0.02em" }}
        >
          {relTR(item.publishedAt)}
          {item.viewCount ? ` · ${fmtViews(item.viewCount)} izlenme` : ""}
        </p>
      </div>
    </a>
  );
}
