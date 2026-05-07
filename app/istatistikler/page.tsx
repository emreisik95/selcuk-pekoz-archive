import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Thumb } from "@/components/Thumb";
import {
  getAllStreams,
  getNow,
  getPastStreams,
} from "@/lib/streams";
import {
  totals,
  dayOfWeekDistribution,
  hourDistribution,
  monthlyTrend,
  buildYearHeatmap,
  topLists,
  yearTotals,
  streakStats,
  viewerHours,
  tenure,
  distinctActiveDays,
  mostActiveDay,
  thisYearTotals,
  hourRange,
  avgViewers,
  weekdayWeekendSplit,
  nightOwlPercent,
  flightEquivalents,
  awakeDays,
  nthStream,
  firstByTitle,
} from "@/lib/stats";
import { TAG_RULES, tagCounts } from "@/lib/tags";
import { duration as fmtDuration, views as fmtViews } from "@/lib/fmt";
import type { Stream } from "@/lib/types";

export const revalidate = 60;

export const metadata = {
  title: "İstatistikler — Selçuk Peköz Yayın Arşivi",
};

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_SHORT = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

export default function StatsPage() {
  const all = getAllStreams();
  const past = getPastStreams();
  const now = getNow();

  const t = totals(all);
  const dow = dayOfWeekDistribution(past);
  const hours = hourDistribution(past);
  const months = monthlyTrend(past, 12, now);
  const heat = buildYearHeatmap(past, now);
  const tops = topLists(past);
  const years = yearTotals(past);
  const streaks = streakStats(past);
  const tags = tagCounts(past).slice(0, 10);

  // New fun-fact computations
  const vh = viewerHours(past);
  const ten = tenure(past, now);
  const activeDays = distinctActiveDays(past);
  const mostActive = mostActiveDay(past);
  const thisYear = thisYearTotals(past, now);
  const hRange = hourRange(past);
  const avgV = avgViewers(past);
  const wkSplit = weekdayWeekendSplit(past);
  const nightPct = nightOwlPercent(past);
  const flights = flightEquivalents(t.totalSec);
  const awake = awakeDays(t.totalSec);
  const stream100 = nthStream(past, 100);
  const firstStream = nthStream(past, 1);
  const topTag = tags[0];
  const firstOfTopTag = topTag
    ? firstByTitle(
        past,
        TAG_RULES.find((r) => r.tag === topTag.tag)?.pattern ?? /$^/,
      )
    : undefined;

  const dowMax = Math.max(...dow);
  const hourMax = Math.max(...hours);
  const monthMax = Math.max(...months.map((m) => m.count));
  const yearMax = years.length ? Math.max(...years.map((y) => y.count)) : 0;
  const tagMax = tags.length ? tags[0].count : 0;

  return (
    <>
      <Nav />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-hair px-5 md:px-10 pt-5 md:pt-10 pb-7 md:pb-10">
          <div
            className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-2"
            style={{ letterSpacing: "0.12em" }}
          >
            İstatistikler
          </div>
          <h1
            className="font-serif text-[28px] md:text-[42px] font-semibold leading-[1.1]"
            style={{ letterSpacing: "-0.025em" }}
          >
            Selçuk&apos;un yayın özeti
          </h1>
          <div className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-5">
            <Stat label="Toplam yayın" value={t.count.toLocaleString("tr-TR")} />
            <Stat
              label="Toplam süre"
              value={`${t.totalHours.toLocaleString("tr-TR")} saat`}
            />
            <Stat
              label="Toplam izlenme"
              value={fmtViews(t.totalViews) || "—"}
            />
            <Stat
              label="Ortalama süre"
              value={t.avgSec ? fmtDuration(t.avgSec) : "—"}
            />
            <Stat
              label="İlk yayın"
              value={
                t.oldest
                  ? new Date(t.oldest.scheduledAt).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "short",
                    })
                  : "—"
              }
            />
            <Stat
              label="Son yayın"
              value={
                t.newest
                  ? new Date(t.newest.scheduledAt).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "short",
                    })
                  : "—"
              }
            />
          </div>

          {/* Fun facts grid — primary insights */}
          <div className="mt-7 md:mt-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {ten.days > 0 && (
              <FunFact
                label="Yayın tenure"
                value={ten.readable}
                detail={`${ten.days.toLocaleString("tr-TR")} gün — ${firstStream ? fmtShortDate(new Date(firstStream.scheduledAt)) : ""} tarihinden bugüne`}
              />
            )}
            {thisYear.count > 0 && (
              <FunFact
                label={`${thisYear.year} yılında`}
                value={`${thisYear.count} yayın`}
                detail="Bu yıl şu ana kadar"
              />
            )}
            {activeDays > 0 && (
              <FunFact
                label="Aktif gün sayısı"
                value={`${activeDays.toLocaleString("tr-TR")} gün`}
                detail="Yayın açtığı farklı takvim günü"
              />
            )}
            {mostActive.count > 1 && mostActive.date && (
              <FunFact
                label="En aktif tek gün"
                value={`${mostActive.count} yayın`}
                detail={fmtShortDate(mostActive.date)}
              />
            )}
            {vh > 0 && (
              <FunFact
                label="İzleyici-saat"
                value={fmtBigNumber(vh)}
                detail="Σ(izlenme × süre_saat) — toplam izleyici-saat"
              />
            )}
            {avgV > 0 && (
              <FunFact
                label="Yayın başına ortalama izlenme"
                value={fmtBigNumber(avgV)}
                detail={`Tamamlanmış ${past.length} yayın için`}
              />
            )}
            {hRange.earliest !== undefined && hRange.latest !== undefined && (
              <FunFact
                label="Yayın saati aralığı"
                value={`${String(hRange.earliest).padStart(2, "0")}:00 – ${String(hRange.latest).padStart(2, "0")}:00`}
                detail="En erken ve en geç başlangıç saati (TRT)"
              />
            )}
            {nightPct > 0 && (
              <FunFact
                label="Gece kuşu oranı"
                value={`% ${nightPct}`}
                detail="Yayınların 21:00–04:00 arasındaki oranı"
              />
            )}
            {wkSplit.weekday + wkSplit.weekend > 0 && (
              <FunFact
                label="Hafta içi vs. hafta sonu"
                value={`% ${wkSplit.weekdayPct} – % ${100 - wkSplit.weekdayPct}`}
                detail={`Pzt–Cum: ${wkSplit.weekday} · Cmt–Paz: ${wkSplit.weekend}`}
              />
            )}
            {topTag && firstOfTopTag && (
              <FunFact
                label="Favori konu"
                value={`${topTag.tag} (${topTag.count})`}
                detail={`İlki: ${fmtShortDate(new Date(firstOfTopTag.scheduledAt))}`}
              />
            )}
            {streaks.longestStreak.days > 0 && (
              <FunFact
                label="En uzun streak"
                value={`${streaks.longestStreak.days} gün üst üste`}
                detail={
                  streaks.longestStreak.from && streaks.longestStreak.to
                    ? `${fmtShortDate(streaks.longestStreak.from)} – ${fmtShortDate(streaks.longestStreak.to)}`
                    : ""
                }
              />
            )}
            {streaks.longestGap.days > 1 && (
              <FunFact
                label="En uzun ara"
                value={`${streaks.longestGap.days} gün`}
                detail={
                  streaks.longestGap.from && streaks.longestGap.to
                    ? `${fmtShortDate(streaks.longestGap.from)} – ${fmtShortDate(streaks.longestGap.to)}`
                    : ""
                }
              />
            )}
            {flights > 0 && (
              <FunFact
                label="Uçuş kıyası"
                value={`~${flights} uçuş`}
                detail="İstanbul–Tokyo (≈11 saat) sefer eşdeğeri"
              />
            )}
            {awake > 0 && (
              <FunFact
                label="Uyku metaforu"
                value={`${awake} gün`}
                detail="Tüm yayını izleyen biri uyumadan geçirir (16s/gün)"
              />
            )}
            {stream100 && (
              <FunFact
                label="100. yayın"
                value={fmtShortDate(new Date(stream100.scheduledAt))}
                detail={stream100.title.slice(0, 50) + (stream100.title.length > 50 ? "…" : "")}
              />
            )}
          </div>
        </section>

        {/* Heatmap */}
        <section className="px-5 md:px-10 pt-7 md:pt-10 pb-7">
          <div
            className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-3"
            style={{ letterSpacing: "0.12em" }}
          >
            Son 12 ay · gün gün
          </div>
          <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
            <Heatmap cells={heat.cells} max={heat.max} weeks={heat.weeks} />
          </div>
          <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase text-muted">
            <span>Az</span>
            <span className="w-2.5 h-2.5 bg-hair rounded-[1px]" />
            <span className="w-2.5 h-2.5 bg-faint rounded-[1px]" />
            <span className="w-2.5 h-2.5 bg-muted rounded-[1px]" />
            <span className="w-2.5 h-2.5 bg-text rounded-[1px]" />
            <span className="w-2.5 h-2.5 bg-ink rounded-[1px]" />
            <span>Çok</span>
          </div>
        </section>

        {/* Day + Hour */}
        <section className="px-5 md:px-10 pt-3 pb-9 grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-hair">
          <div>
            <div
              className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-4 mt-7"
              style={{ letterSpacing: "0.12em" }}
            >
              Hangi günlerde yayın yapıyor
            </div>
            <div className="space-y-1.5">
              {DAY_LABELS.map((label, i) => {
                const count = dow[i];
                const pct = dowMax ? (count / dowMax) * 100 : 0;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className="w-9 font-mono text-[11px] uppercase text-muted"
                      style={{ letterSpacing: "0.08em" }}
                    >
                      {label}
                    </div>
                    <div className="flex-1 h-5 bg-hair/40 relative rounded-[1px]">
                      <div
                        className="h-full bg-ink rounded-[1px] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-10 text-right font-mono text-[11px] tabular text-text">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div
              className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-4 mt-7"
              style={{ letterSpacing: "0.12em" }}
            >
              Yayın başlangıç saatleri
            </div>
            <HourBars hours={hours} max={hourMax} />
          </div>
        </section>

        {/* Monthly trend */}
        <section className="px-5 md:px-10 pt-7 pb-9 border-t border-hair">
          <div
            className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-4"
            style={{ letterSpacing: "0.12em" }}
          >
            Son 12 ay · aylık yayın sayısı
          </div>
          <div className="flex items-end gap-1 md:gap-2 h-32">
            {months.map((m) => {
              const heightPx = monthMax
                ? Math.max(m.count > 0 ? 2 : 0, Math.round((m.count / monthMax) * 100))
                : 0;
              return (
                <div
                  key={`${m.year}-${m.month}`}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-ink rounded-[1px] transition-all"
                    style={{ height: heightPx }}
                    title={`${MONTH_SHORT[m.month]} ${m.year}: ${m.count}`}
                  />
                  <div
                    className="font-mono text-[9px] uppercase text-muted"
                    style={{ letterSpacing: "0.06em" }}
                  >
                    {MONTH_SHORT[m.month]}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Year + tag */}
        <section className="px-5 md:px-10 pt-7 pb-7 border-t border-hair grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <div
              className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-4"
              style={{ letterSpacing: "0.12em" }}
            >
              Yıl bazlı yayın sayısı
            </div>
            <div className="space-y-1.5">
              {years.map((y) => {
                const pct = yearMax ? (y.count / yearMax) * 100 : 0;
                return (
                  <div key={y.year} className="flex items-center gap-3">
                    <div className="w-12 font-mono text-[11px] tabular text-muted">
                      {y.year}
                    </div>
                    <div className="flex-1 h-5 bg-hair/40 relative rounded-[1px]">
                      <div
                        className="h-full bg-ink rounded-[1px]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-24 text-right font-mono text-[11px] tabular text-text">
                      {y.count}{" "}
                      <span className="text-muted">· {y.hours}s</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div
              className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-4"
              style={{ letterSpacing: "0.12em" }}
            >
              En sık etiketler
            </div>
            {tags.length === 0 ? (
              <p className="font-mono text-[12px] text-muted">Veri yok.</p>
            ) : (
              <div className="space-y-1.5">
                {tags.map((tg) => {
                  const pct = tagMax ? (tg.count / tagMax) * 100 : 0;
                  return (
                    <Link
                      key={tg.tag}
                      href={`/arsiv?etiket=${encodeURIComponent(tg.tag)}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-28 text-[12px] text-text group-hover:underline decoration-hair underline-offset-2 truncate">
                        {tg.tag}
                      </div>
                      <div className="flex-1 h-5 bg-hair/40 relative rounded-[1px]">
                        <div
                          className="h-full bg-ink rounded-[1px]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-12 text-right font-mono text-[11px] tabular text-text">
                        {tg.count}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Top lists */}
        <section className="px-5 md:px-10 pt-7 pb-12 border-t border-hair grid grid-cols-1 md:grid-cols-3 gap-8">
          <TopList
            label="En uzun yayınlar"
            streams={tops.longest}
            metric={(s) => fmtDuration(s.durationSec)}
          />
          <TopList
            label="En kısa yayınlar"
            streams={tops.shortest}
            metric={(s) => fmtDuration(s.durationSec)}
          />
          <TopList
            label="En çok izlenenler"
            streams={tops.mostViewed}
            metric={(s) => `${fmtViews(s.viewCount)} izlenme`}
          />
        </section>

        {/* Methods / verification */}
        <section className="px-5 md:px-10 pt-7 pb-12 border-t border-hair">
          <details className="group">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-3 hover:text-text">
              <div>
                <div
                  className="font-mono text-[10px] md:text-[11px] uppercase text-muted"
                  style={{ letterSpacing: "0.12em" }}
                >
                  Yöntemler ve Doğruluk
                </div>
                <div
                  className="font-serif text-[18px] font-medium mt-1"
                  style={{ letterSpacing: "-0.015em" }}
                >
                  Bu sayılar nasıl hesaplandı?
                </div>
              </div>
              <span
                className="font-mono text-[11px] uppercase text-muted group-open:rotate-180 transition-transform"
                style={{ letterSpacing: "0.08em" }}
              >
                ▾
              </span>
            </summary>
            <dl className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 text-[13px] leading-relaxed">
              <Method
                term="Toplam yayın"
                desc="streams.json'daki tüm yayın kayıtlarının sayısı (live + completed + upcoming)."
              />
              <Method
                term="Toplam süre"
                desc="Σ tamamlanmış yayınların duration_sec / 3600. Live ve upcoming yayın sürelerini içermez."
              />
              <Method
                term="Toplam izlenme"
                desc="Σ tamamlanmış yayınların viewCount değerleri."
              />
              <Method
                term="İzleyici-saat"
                desc="Σ(viewCount × durationSec/3600). Yayın × ortalama izlenme süresi yaklaşık değeri."
              />
              <Method
                term="Aktif gün sayısı"
                desc="En az bir yayın açılan farklı TRT takvim günü sayısı."
              />
              <Method
                term="En aktif tek gün"
                desc="Tek bir TRT takvim gününde açılan en yüksek yayın sayısı."
              />
              <Method
                term="Streak / Ara"
                desc="Streak: peş peşe yayın açılan en uzun gün dizisi. Ara: yayın yapılmayan en uzun ardışık aralık."
              />
              <Method
                term="Gece kuşu oranı"
                desc="Saat 21:00–04:00 arasında başlayan yayınların oranı (TRT)."
              />
              <Method
                term="Hafta içi/sonu"
                desc="Pzt–Cum vs. Cmt–Paz oranı, başlangıç gününe göre."
              />
              <Method
                term="Uçuş eşdeğeri"
                desc="Toplam yayın saati / 11 saat (İstanbul–Tokyo direkt sefer süresi)."
              />
              <Method
                term="Uyku metaforu"
                desc="Toplam yayın saati / 16 saat (günde uyanık geçen tipik süre)."
              />
              <Method
                term="Etiketler"
                desc="Yayın başlığında geçen anahtar kelimelerle eşleşen kategoriler. Spesifik bir oyun varsa platform tag'i (Switch/Wii/Nintendo) eklenmiyor."
              />
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/api/stats.json"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 border border-hair px-3 py-2 text-[12px] rounded-[2px] hover:border-text"
              >
                <code className="font-mono text-[11px]">/api/stats.json</code>
                <span className="text-muted">— ham hesaplamalar</span>
              </a>
              <p
                className="font-mono text-[11px] uppercase text-faint self-center"
                style={{ letterSpacing: "0.04em" }}
              >
                Top listelerdeki video bağlantıları YouTube'a açılır — süre/izlenme orada doğrulanabilir
              </p>
            </div>
          </details>
        </section>
      </main>
      <Footer />
    </>
  );
}

function fmtShortDate(d: Date): string {
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtBigNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + " B";
  return n.toLocaleString("tr-TR");
}

function Method({ term, desc }: { term: string; desc: string }) {
  return (
    <div>
      <dt
        className="font-mono text-[10px] uppercase text-muted mb-1"
        style={{ letterSpacing: "0.08em" }}
      >
        {term}
      </dt>
      <dd className="text-text">{desc}</dd>
    </div>
  );
}

function FunFact({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="border border-hair px-4 py-3 rounded-[2px]">
      <div
        className="font-mono text-[10px] uppercase text-muted"
        style={{ letterSpacing: "0.1em" }}
      >
        {label}
      </div>
      <div
        className="font-serif text-[20px] font-semibold mt-1"
        style={{ letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      {detail && (
        <div
          className="mt-1 font-mono text-[11px] uppercase text-faint"
          style={{ letterSpacing: "0.04em" }}
        >
          {detail}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="font-mono text-[10px] uppercase text-muted"
        style={{ letterSpacing: "0.1em" }}
      >
        {label}
      </div>
      <div
        className="font-serif text-[24px] md:text-[28px] font-semibold mt-1"
        style={{ letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
    </div>
  );
}

function Heatmap({
  cells,
  max,
  weeks,
}: {
  cells: import("@/lib/stats").HeatmapCell[];
  max: number;
  weeks: number;
}) {
  // Convert flat cells (Monday-first, 7 rows × N cols) to col-major rendering
  const cellSize = 11;
  const gap = 2;
  const intensity = (count: number) => {
    if (count === 0) return "bg-hair";
    if (max <= 1) return "bg-ink";
    const t = count / max;
    if (t < 0.25) return "bg-faint";
    if (t < 0.55) return "bg-muted";
    if (t < 0.85) return "bg-text";
    return "bg-ink";
  };

  return (
    <div className="inline-block">
      <div
        className="grid grid-rows-7"
        style={{
          gridAutoFlow: "column",
          gridTemplateColumns: `repeat(${weeks}, ${cellSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {cells.map((c, i) => (
          <div
            key={i}
            className={
              "rounded-[1px] " +
              intensity(c.count) +
              (c.inRange ? "" : " opacity-30")
            }
            style={{ width: cellSize, height: cellSize }}
            title={
              c.count
                ? `${c.date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })} — ${c.count} yayın`
                : c.date.toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
            }
          />
        ))}
      </div>
    </div>
  );
}

function HourBars({ hours, max }: { hours: number[]; max: number }) {
  const PLOT_H = 110;
  return (
    <div className="flex items-end gap-[2px] h-32">
      {hours.map((count, h) => {
        const heightPx = max
          ? Math.max(count > 0 ? 2 : 0, Math.round((count / max) * PLOT_H))
          : 0;
        const showLabel = h % 4 === 0;
        return (
          <div
            key={h}
            className="flex-1 flex flex-col items-center gap-1"
            title={`${String(h).padStart(2, "0")}:00 — ${count} yayın`}
          >
            <div
              className="w-full bg-ink rounded-[1px]"
              style={{ height: heightPx }}
            />
            <div
              className="font-mono text-[9px] text-muted"
              style={{
                visibility: showLabel ? "visible" : "hidden",
                letterSpacing: "0.04em",
              }}
            >
              {String(h).padStart(2, "0")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopList({
  label,
  streams,
  metric,
}: {
  label: string;
  streams: Stream[];
  metric: (s: Stream) => string;
}) {
  return (
    <div>
      <div
        className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-4"
        style={{ letterSpacing: "0.12em" }}
      >
        {label}
      </div>
      <ol className="space-y-3">
        {streams.map((s, i) => (
          <li key={s.id}>
            <Link
              href={`/y/${s.id}`}
              className="flex items-start gap-3 group"
            >
              <span
                className="font-serif text-[22px] font-semibold text-faint w-6 text-right tabular shrink-0"
                style={{ letterSpacing: "-0.02em" }}
              >
                {i + 1}
              </span>
              <div className="w-16 shrink-0 aspect-video rounded-[2px] overflow-hidden bg-black">
                <Thumb stream={s} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium leading-tight line-clamp-2 group-hover:underline decoration-hair underline-offset-2">
                  {s.title}
                </div>
                <div
                  className="mt-1 font-mono text-[10px] uppercase text-muted"
                  style={{ letterSpacing: "0.04em" }}
                >
                  {metric(s)}
                </div>
              </div>
            </Link>
          </li>
        ))}
        {streams.length === 0 && (
          <li className="font-mono text-[12px] text-muted">Veri yok.</li>
        )}
      </ol>
    </div>
  );
}
