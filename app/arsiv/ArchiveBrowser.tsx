"use client";

import { useMemo, useState } from "react";
import { MCard } from "@/components/MCard";
import { SearchIcon } from "@/components/Icon";
import { dateTR } from "@/lib/fmt";
import { streamTags } from "@/lib/tags";
import type { Stream } from "@/lib/types";

type SortKey =
  | "newest"
  | "oldest"
  | "longest"
  | "shortest"
  | "mostViews"
  | "leastViews";

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "newest", label: "Yeniden eskiye" },
  { value: "oldest", label: "Eskiden yeniye" },
  { value: "longest", label: "En uzun yayın" },
  { value: "shortest", label: "En kısa yayın" },
  { value: "mostViews", label: "En çok izlenen" },
  { value: "leastViews", label: "En az izlenen" },
];

const MONTH_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: "Ocak" },
  { value: 1, label: "Şubat" },
  { value: 2, label: "Mart" },
  { value: 3, label: "Nisan" },
  { value: 4, label: "Mayıs" },
  { value: 5, label: "Haziran" },
  { value: 6, label: "Temmuz" },
  { value: 7, label: "Ağustos" },
  { value: 8, label: "Eylül" },
  { value: 9, label: "Ekim" },
  { value: 10, label: "Kasım" },
  { value: 11, label: "Aralık" },
];

type Props = {
  streams: Stream[];
  totalHours: number;
  nowISO: string;
  tags: string[];
  initialTag: string | null;
};

const DEFAULT_SORT: SortKey = "newest";

export function ArchiveBrowser({
  streams,
  totalHours,
  nowISO,
  tags,
  initialTag,
}: Props) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<"all" | number>("all");
  const [month, setMonth] = useState<"all" | number>("all");
  const [sort, setSort] = useState<SortKey>(DEFAULT_SORT);
  const [tag, setTag] = useState<"all" | string>(
    initialTag && tags.includes(initialTag) ? initialTag : "all",
  );

  const now = useMemo(() => new Date(nowISO), [nowISO]);

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const s of streams) set.add(dateTR(s.scheduledAt).year);
    return [...set].sort((a, b) => b - a);
  }, [streams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    let out = streams.filter((s) => {
      if (q && !s.title.toLocaleLowerCase("tr-TR").includes(q)) return false;
      const d = dateTR(s.scheduledAt);
      if (year !== "all" && d.year !== year) return false;
      if (month !== "all" && d.monthIdx !== month) return false;
      if (tag !== "all") {
        if (!streamTags(s).includes(tag)) return false;
      }
      return true;
    });

    out = [...out];
    switch (sort) {
      case "newest":
        out.sort(
          (a, b) =>
            new Date(b.scheduledAt).getTime() -
            new Date(a.scheduledAt).getTime(),
        );
        break;
      case "oldest":
        out.sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        );
        break;
      case "longest":
        out.sort((a, b) => (b.durationSec ?? 0) - (a.durationSec ?? 0));
        break;
      case "shortest":
        // null durations sink to the bottom
        out.sort(
          (a, b) =>
            (a.durationSec ?? Number.POSITIVE_INFINITY) -
            (b.durationSec ?? Number.POSITIVE_INFINITY),
        );
        break;
      case "mostViews":
        out.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
        break;
      case "leastViews":
        out.sort(
          (a, b) =>
            (a.viewCount ?? Number.POSITIVE_INFINITY) -
            (b.viewCount ?? Number.POSITIVE_INFINITY),
        );
        break;
    }
    return out;
  }, [streams, query, year, month, sort, tag]);

  const isFiltered =
    query.trim() !== "" ||
    year !== "all" ||
    month !== "all" ||
    sort !== DEFAULT_SORT ||
    tag !== "all";

  const resetAll = () => {
    setQuery("");
    setYear("all");
    setMonth("all");
    setSort(DEFAULT_SORT);
    setTag("all");
  };

  return (
    <>
      <div className="px-5 md:px-10 pt-5 md:pt-8 pb-5 md:pb-6 border-b border-hair">
        <div
          className="font-mono text-[10px] md:text-[11px] uppercase text-muted"
          style={{ letterSpacing: "0.12em" }}
        >
          Arşiv — {streams.length} yayın · {totalHours} saat
        </div>
        <h1
          className="font-serif text-[26px] md:text-[38px] font-medium mt-1.5"
          style={{ letterSpacing: "-0.025em" }}
        >
          <span className="md:hidden">Geçmiş yayınlar</span>
          <span className="hidden md:inline">Geçmiş yayınların hepsi</span>
        </h1>

        <div className="mt-4 md:mt-5 flex flex-wrap gap-2 md:gap-3 items-stretch md:items-center">
          <div className="flex items-center gap-2 border border-hair px-3 py-2 rounded-[2px] flex-1 md:flex-none md:w-[280px] min-w-[200px]">
            <SearchIcon className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Başlıkta ara…"
              className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Aramayı temizle"
                className="text-muted hover:text-text"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </button>
            )}
          </div>

          <FilterSelect
            label="Yıl"
            value={year === "all" ? "all" : String(year)}
            onChange={(v) => setYear(v === "all" ? "all" : Number(v))}
            options={[
              { value: "all", label: "Tümü" },
              ...years.map((y) => ({ value: String(y), label: String(y) })),
            ]}
          />
          <FilterSelect
            label="Ay"
            value={month === "all" ? "all" : String(month)}
            onChange={(v) => setMonth(v === "all" ? "all" : Number(v))}
            options={[
              { value: "all", label: "Tümü" },
              ...MONTH_OPTIONS.map((m) => ({
                value: String(m.value),
                label: m.label,
              })),
            ]}
          />
          <FilterSelect
            label="Sıralama"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={SORT_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />

          {isFiltered && (
            <button
              type="button"
              onClick={resetAll}
              className="font-mono text-[11px] uppercase text-muted hover:text-text px-2"
              style={{ letterSpacing: "0.08em" }}
            >
              Sıfırla
            </button>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mt-3 -mx-5 px-5 md:mx-0 md:px-0 flex gap-1.5 overflow-x-auto pb-1">
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
            {tags.map((t) => (
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

        {isFiltered && (
          <div
            className="mt-3 font-mono text-[11px] text-muted"
            style={{ letterSpacing: "0.04em" }}
          >
            {filtered.length} sonuç
            {streams.length !== filtered.length && ` · ${streams.length} arasından`}
          </div>
        )}
      </div>

      <div className="px-5 md:px-10 pt-4 md:pt-6 pb-9">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-mono text-[12px] text-muted mb-3">
              Bu filtreye uyan yayın yok.
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="font-mono text-[11px] uppercase text-text underline decoration-hair underline-offset-4"
              style={{ letterSpacing: "0.08em" }}
            >
              Filtreleri sıfırla
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-[18px]">
            {filtered.map((s) => (
              <MCard key={s.id} stream={s} now={now} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="relative inline-flex items-center border border-hair px-3 py-2 rounded-[2px] gap-2 hover:border-text focus-within:border-text cursor-pointer">
      <span
        className="font-mono text-[10px] uppercase text-muted"
        style={{ letterSpacing: "0.06em" }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent text-[12px] text-text outline-none pr-4 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="absolute right-3 text-muted pointer-events-none"
      >
        <path d="M2 3l2 2 2-2" />
      </svg>
    </label>
  );
}
