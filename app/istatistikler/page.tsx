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
  const heat = buildYearHeatmap(past, now, 53);
  const heatMobile = buildYearHeatmap(past, now, 26);
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
          {/* Primary triple — biggest numbers */}
          <div className="mt-6 md:mt-10 grid grid-cols-1 md:grid-cols-3 gap-y-6 md:gap-x-10 md:gap-y-0 md:divide-x md:divide-hair">
            <BigStat
              label="Toplam yayın"
              value={t.count.toLocaleString("tr-TR")}
              suffix=""
            />
            <BigStat
              label="Toplam süre"
              value={t.totalHours.toLocaleString("tr-TR")}
              suffix="saat"
            />
            <BigStat
              label="Toplam izlenme"
              value={fmtViews(t.totalViews) || "—"}
              suffix=""
            />
          </div>

          {/* Secondary trio — supporting context */}
          <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-hair grid grid-cols-3 gap-x-4 md:gap-x-10">
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

        </section>

        {/* Fun facts grid */}
        <section className="px-5 md:px-10 pt-7 md:pt-10 pb-7">
          <div
            className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-4"
            style={{ letterSpacing: "0.12em" }}
          >
            Eğlenceli bilgiler
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ten.days > 0 && (
              <FunFact
                icon="calendar"
                label="Kaç senedir yayında"
                value={ten.readable}
                detail={
                  firstStream
                    ? `İlk yayın ${fmtShortDate(new Date(firstStream.scheduledAt))} — bugüne ${ten.days.toLocaleString("tr-TR")} gün`
                    : `${ten.days.toLocaleString("tr-TR")} gündür yayında`
                }
              />
            )}
            {thisYear.count > 0 && (
              <FunFact
                icon="trend"
                label={`${thisYear.year} yılında`}
                value={`${thisYear.count} yayın`}
                detail="Bu yıl şu ana kadar"
              />
            )}
            {activeDays > 0 && (
              <FunFact
                icon="check"
                label="Aktif gün sayısı"
                value={`${activeDays.toLocaleString("tr-TR")} gün`}
                detail="Yayın açtığı farklı takvim günü"
              />
            )}
            {mostActive.count > 1 && mostActive.date && (
              <FunFact
                icon="target"
                label="En aktif tek gün"
                value={`${mostActive.count} yayın`}
                detail={fmtShortDate(mostActive.date)}
              />
            )}
            {vh > 0 && (
              <FunFact
                icon="people"
                label="İzleyici-saat"
                value={fmtBigNumber(vh)}
                detail="Σ(izlenme × süre_saat)"
              />
            )}
            {avgV > 0 && (
              <FunFact
                icon="eye"
                label="Yayın başına ortalama izlenme"
                value={fmtBigNumber(avgV)}
                detail={`Tamamlanmış ${past.length} yayın için`}
              />
            )}
            {hRange.earliest !== undefined && hRange.latest !== undefined && (
              <FunFact
                icon="clock"
                label="Yayın saati aralığı"
                value={`${String(hRange.earliest).padStart(2, "0")}:00–${String(hRange.latest).padStart(2, "0")}:00`}
                detail="En erken ve en geç başlangıç (TRT)"
              />
            )}
            {nightPct > 0 && (
              <FunFact
                icon="moon"
                label="Gece kuşu oranı"
                value={`% ${nightPct}`}
                detail="Toplam yayın süresinin 21:00–04:00 arasında geçen kısmı"
              />
            )}
            {wkSplit.weekday + wkSplit.weekend > 0 && (
              <FunFact
                icon="split"
                label="Hafta içi vs. hafta sonu"
                value={`% ${wkSplit.weekdayPct} – % ${100 - wkSplit.weekdayPct}`}
                detail={`Pzt–Cum: ${wkSplit.weekday} · Cmt–Paz: ${wkSplit.weekend}`}
              />
            )}
            {topTag && firstOfTopTag && (
              <FunFact
                icon="star"
                label="Favori konu"
                value={`${topTag.tag} (${topTag.count})`}
                detail={`İlki: ${fmtShortDate(new Date(firstOfTopTag.scheduledAt))}`}
              />
            )}
            {streaks.longestStreak.days > 0 && (
              <FunFact
                icon="flame"
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
                icon="pause"
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
                icon="plane"
                label="Uçuş kıyası"
                value={`~${flights} uçuş`}
                detail="İstanbul–Tokyo (≈11s) sefer eşdeğeri"
              />
            )}
            {awake > 0 && (
              <FunFact
                icon="zzz"
                label="Uyku metaforu"
                value={`${awake} gün`}
                detail="Tüm yayını izleyen biri uyumadan geçirir"
              />
            )}
            {stream100 && (
              <FunFact
                icon="medal"
                label="100. yayın"
                value={fmtShortDate(new Date(stream100.scheduledAt))}
                detail={stream100.title.slice(0, 60) + (stream100.title.length > 60 ? "…" : "")}
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
            <span className="md:hidden">Son 6 ay · gün gün</span>
            <span className="hidden md:inline">Son 12 ay · gün gün</span>
          </div>
          <div className="md:hidden">
            <Heatmap
              cells={heatMobile.cells}
              max={heatMobile.max}
              weeks={heatMobile.weeks}
            />
          </div>
          <div className="hidden md:block">
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
                desc="Toplam yayın dakikasının 21:00–04:00 arasında geçen oranı. 20:00'de başlayıp 5 saat süren yayın doğru şekilde çoğunlukla gece sayılır."
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

type IconKey =
  | "calendar"
  | "trend"
  | "check"
  | "target"
  | "people"
  | "eye"
  | "clock"
  | "moon"
  | "split"
  | "star"
  | "flame"
  | "pause"
  | "plane"
  | "zzz"
  | "medal";

function StatIcon({ name }: { name: IconKey }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "calendar":
      return (
        <svg {...common}>
          <rect x="2.5" y="3.5" width="11" height="10" rx="1" />
          <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
        </svg>
      );
    case "trend":
      return (
        <svg {...common}>
          <path d="M2 12 6 8l3 3 5-7" />
          <path d="M10 4h4v4" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" />
          <path d="m5.5 8 2 2 3-4" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" />
          <circle cx="8" cy="8" r="3" />
          <circle cx="8" cy="8" r="0.5" fill="currentColor" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2" />
          <path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" />
          <circle cx="11" cy="5" r="1.6" />
          <path d="M10 9.3a3.5 3.5 0 0 1 4 3.7" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path d="M1.5 8s2.5-4 6.5-4 6.5 4 6.5 4-2.5 4-6.5 4-6.5-4-6.5-4Z" />
          <circle cx="8" cy="8" r="1.8" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" />
          <path d="M8 4.5V8l2.5 1.5" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3 6 6 0 1 0 13 9.5Z" />
        </svg>
      );
    case "split":
      return (
        <svg {...common}>
          <path d="M3 13V7M8 13V3M13 13v-3" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M8 2.5 9.7 6l3.8.5-2.8 2.6.7 3.7L8 11l-3.4 1.8.7-3.7L2.5 6.5 6.3 6Z" />
        </svg>
      );
    case "flame":
      return (
        <svg {...common}>
          <path d="M8 14c-2.8 0-4.5-2-4.5-4.3 0-1.4.8-2.5 1.7-3.4-.2.9.3 1.6 1 1.6.5 0 .8-.3.8-.8C7 5.7 6 4.5 6.5 2.5c.4-.1 1.5.5 2.5 2 1 1.5 2.5 3 2.5 5.2C11.5 12 9.8 14 8 14Z" />
        </svg>
      );
    case "pause":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="2.5" height="10" rx="0.5" />
          <rect x="9.5" y="3" width="2.5" height="10" rx="0.5" />
        </svg>
      );
    case "plane":
      return (
        <svg {...common}>
          <path d="M2 9.5 14 5l-1 4-9 3 1.5-2L2 9.5Z" />
        </svg>
      );
    case "zzz":
      return (
        <svg {...common}>
          <path d="M3 4h4l-4 5h4M9 8h3.5l-3.5 4h3.5" />
        </svg>
      );
    case "medal":
      return (
        <svg {...common}>
          <circle cx="8" cy="10" r="3.5" />
          <path d="M5.5 7.5 4 2.5h8L10.5 7.5" />
        </svg>
      );
  }
}

function FunFact({
  icon,
  label,
  value,
  detail,
}: {
  icon: IconKey;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div
      className="group relative bg-[color-mix(in_oklab,var(--color-event-past)_60%,transparent)] border border-transparent hover:border-hair px-4 py-3.5 rounded-[2px] transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-bg text-text border border-hair">
          <StatIcon name={icon} />
        </span>
        <span
          className="font-mono text-[10px] uppercase text-muted"
          style={{ letterSpacing: "0.1em" }}
        >
          {label}
        </span>
      </div>
      <div
        className="font-serif text-[22px] md:text-[24px] font-semibold leading-[1.1]"
        style={{ letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      {detail && (
        <div
          className="mt-1.5 text-[11px] text-muted leading-snug"
          style={{ letterSpacing: "0.01em" }}
        >
          {detail}
        </div>
      )}
    </div>
  );
}

function BigStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="md:px-2 first:md:pl-0">
      <div
        className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-2"
        style={{ letterSpacing: "0.12em" }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="font-serif text-[44px] md:text-[64px] font-semibold leading-[0.95] tabular"
          style={{ letterSpacing: "-0.035em" }}
        >
          {value}
        </span>
        {suffix && (
          <span
            className="font-mono text-[12px] md:text-[14px] text-muted uppercase"
            style={{ letterSpacing: "0.08em" }}
          >
            {suffix}
          </span>
        )}
      </div>
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
    <div
      className="w-full grid grid-rows-7 gap-[3px]"
      style={{
        gridAutoFlow: "column",
        gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
      }}
    >
      {cells.map((c, i) => {
        const weekIdx = Math.floor(i / 7);
        // Anchor tooltip away from the page edges so it doesn't cause
        // horizontal scroll on the first/last weeks of the grid.
        const anchor =
          weekIdx < 6
            ? "left-0"
            : weekIdx > weeks - 7
              ? "right-0"
              : "left-1/2 -translate-x-1/2";
        return (
          <div
            key={i}
            className="relative group/heat aspect-square"
            tabIndex={c.inRange ? 0 : -1}
          >
            <div
              className={
                "absolute inset-0 rounded-[1px] " +
                intensity(c.count) +
                (c.inRange ? "" : " opacity-30")
              }
            />
            <div
              role="tooltip"
              className={
                "absolute z-50 bottom-[calc(100%+4px)] " +
                anchor +
                " min-w-[150px] px-2 py-1.5 rounded-[2px] " +
                "bg-ink text-bg text-[11px] font-mono uppercase whitespace-nowrap " +
                "shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] " +
                "opacity-0 pointer-events-none translate-y-1 " +
                "group-hover/heat:opacity-100 group-hover/heat:translate-y-0 " +
                "group-focus-within/heat:opacity-100 group-focus-within/heat:translate-y-0 " +
                "transition-[opacity,transform] duration-100 delay-75"
              }
              style={{ letterSpacing: "0.04em" }}
            >
              <span className="text-bg">
                {c.date.toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="text-faint mx-1.5">/</span>
              <span className="text-bg">
                {c.count > 0 ? `${c.count} yayın` : "yayın yok"}
              </span>
            </div>
          </div>
        );
      })}
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
