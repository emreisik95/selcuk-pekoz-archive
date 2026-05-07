"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MCard } from "@/components/MCard";
import { useFavorites } from "@/lib/favorites";
import type { Stream } from "@/lib/types";

type Props = {
  streams: Stream[];
  nowISO: string;
};

export function FavoritesBrowser({ streams, nowISO }: Props) {
  const favSet = useFavorites();
  const now = useMemo(() => new Date(nowISO), [nowISO]);

  const favStreams = useMemo(() => {
    if (favSet.size === 0) return [];
    return streams
      .filter((s) => favSet.has(s.id))
      .sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() -
          new Date(a.scheduledAt).getTime(),
      );
  }, [streams, favSet]);

  return (
    <>
      <div className="px-5 md:px-10 pt-5 md:pt-8 pb-5 md:pb-6 border-b border-hair">
        <div
          className="font-mono text-[10px] md:text-[11px] uppercase text-muted"
          style={{ letterSpacing: "0.12em" }}
        >
          Favorilerim
          {favStreams.length > 0 && ` — ${favStreams.length} yayın`}
        </div>
        <h1
          className="font-serif text-[26px] md:text-[38px] font-medium mt-1.5"
          style={{ letterSpacing: "-0.025em" }}
        >
          Sonra izlemek için kaydettiklerin
        </h1>
      </div>

      <div className="px-5 md:px-10 pt-4 md:pt-6 pb-9">
        {favStreams.length === 0 ? (
          <div className="py-16 text-center">
            <p
              className="font-mono text-[12px] uppercase text-muted mb-3"
              style={{ letterSpacing: "0.08em" }}
            >
              Henüz favori yayınlar yok
            </p>
            <p className="text-[14px] text-muted mb-5 max-w-sm mx-auto leading-relaxed">
              Bir yayın kartının üzerine geldiğinde sağ üstteki kalp ikonuna
              tıklayarak buraya ekleyebilirsin.
            </p>
            <Link
              href="/arsiv"
              className="font-mono text-[11px] uppercase text-text underline decoration-hair underline-offset-4 hover:decoration-text"
              style={{ letterSpacing: "0.08em" }}
            >
              Arşive göz at
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-[18px]">
            {favStreams.map((s) => (
              <MCard key={s.id} stream={s} now={now} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
