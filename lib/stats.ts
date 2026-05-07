// Pure stat computations for the /istatistikler page.
// All time bucketing is done in Europe/Istanbul (UTC+3, no DST).

import type { Stream } from "./types";

const TRT_OFFSET_MS = 3 * 3600 * 1000;

function trt(d: Date): Date {
  return new Date(d.getTime() + TRT_OFFSET_MS);
}

export type StatsTotals = {
  count: number;
  totalSec: number;
  totalHours: number;
  avgSec: number;
  totalViews: number;
  oldest?: Stream;
  newest?: Stream;
};

export function totals(streams: Stream[]): StatsTotals {
  const completed = streams.filter((s) => s.kind === "completed");
  const totalSec = completed.reduce((a, s) => a + (s.durationSec ?? 0), 0);
  const totalViews = completed.reduce(
    (a, s) => a + (s.viewCount ?? 0),
    0,
  );
  const sorted = [...streams].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
  return {
    count: streams.length,
    totalSec,
    totalHours: Math.round(totalSec / 3600),
    avgSec: completed.length > 0 ? Math.round(totalSec / completed.length) : 0,
    totalViews,
    oldest: sorted[0],
    newest: sorted[sorted.length - 1],
  };
}

// Year totals — number of streams + hours per year
export type YearBucket = {
  year: number;
  count: number;
  hours: number;
  views: number;
};

export function yearTotals(streams: Stream[]): YearBucket[] {
  const map = new Map<number, YearBucket>();
  for (const s of streams) {
    const y = trt(new Date(s.scheduledAt)).getUTCFullYear();
    const b = map.get(y) ?? { year: y, count: 0, hours: 0, views: 0 };
    b.count++;
    b.hours += (s.durationSec ?? 0) / 3600;
    b.views += s.viewCount ?? 0;
    map.set(y, b);
  }
  return [...map.values()]
    .map((b) => ({ ...b, hours: Math.round(b.hours) }))
    .sort((a, b) => a.year - b.year);
}

// Longest consecutive streaming days + longest gap with no stream
export type StreakStats = {
  longestStreak: { days: number; from?: Date; to?: Date };
  longestGap: { days: number; from?: Date; to?: Date };
};

export function streakStats(streams: Stream[]): StreakStats {
  if (streams.length === 0) {
    return {
      longestStreak: { days: 0 },
      longestGap: { days: 0 },
    };
  }

  // Convert to TRT calendar day strings
  const dayKey = (d: Date) => {
    const t = trt(d);
    return `${t.getUTCFullYear()}-${t.getUTCMonth()}-${t.getUTCDate()}`;
  };
  const dayMs = (d: Date) =>
    Date.UTC(
      trt(d).getUTCFullYear(),
      trt(d).getUTCMonth(),
      trt(d).getUTCDate(),
    );

  const days = new Set<string>();
  for (const s of streams) days.add(dayKey(new Date(s.scheduledAt)));

  // Sort unique day timestamps
  const sortedTs = [...streams]
    .map((s) => dayMs(new Date(s.scheduledAt)))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => a - b);

  // Longest consecutive streak
  let bestStreak = 0;
  let curStreak = 1;
  let bestStreakStart = sortedTs[0];
  let bestStreakEnd = sortedTs[0];
  let curStart = sortedTs[0];
  for (let i = 1; i < sortedTs.length; i++) {
    if (sortedTs[i] - sortedTs[i - 1] === 86400000) {
      curStreak++;
    } else {
      if (curStreak > bestStreak) {
        bestStreak = curStreak;
        bestStreakStart = curStart;
        bestStreakEnd = sortedTs[i - 1];
      }
      curStreak = 1;
      curStart = sortedTs[i];
    }
  }
  if (curStreak > bestStreak) {
    bestStreak = curStreak;
    bestStreakStart = curStart;
    bestStreakEnd = sortedTs[sortedTs.length - 1];
  }

  // Longest gap
  let bestGap = 0;
  let bestGapFrom = sortedTs[0];
  let bestGapTo = sortedTs[0];
  for (let i = 1; i < sortedTs.length; i++) {
    const diff = (sortedTs[i] - sortedTs[i - 1]) / 86400000;
    if (diff > bestGap) {
      bestGap = diff;
      bestGapFrom = sortedTs[i - 1];
      bestGapTo = sortedTs[i];
    }
  }

  return {
    longestStreak: {
      days: bestStreak,
      from: new Date(bestStreakStart),
      to: new Date(bestStreakEnd),
    },
    longestGap: {
      days: Math.round(bestGap),
      from: new Date(bestGapFrom),
      to: new Date(bestGapTo),
    },
  };
}

// Pzt=0, Paz=6 (TR convention)
export function dayOfWeekDistribution(streams: Stream[]): number[] {
  const out = [0, 0, 0, 0, 0, 0, 0];
  for (const s of streams) {
    const d = trt(new Date(s.scheduledAt));
    const dow = (d.getUTCDay() + 6) % 7;
    out[dow]++;
  }
  return out;
}

// Hours 0-23 in TRT
export function hourDistribution(streams: Stream[]): number[] {
  const out = new Array(24).fill(0);
  for (const s of streams) {
    const d = trt(new Date(s.scheduledAt));
    out[d.getUTCHours()]++;
  }
  return out;
}

export type MonthlyBucket = { year: number; month: number; count: number };

// Returns last `months` months in chronological order (oldest → newest)
export function monthlyTrend(
  streams: Stream[],
  months: number,
  now: Date,
): MonthlyBucket[] {
  const buckets: MonthlyBucket[] = [];
  const t = trt(now);
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - i, 1),
    );
    buckets.push({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      count: 0,
    });
  }
  for (const s of streams) {
    const d = trt(new Date(s.scheduledAt));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const b = buckets.find((x) => x.year === y && x.month === m);
    if (b) b.count++;
  }
  return buckets;
}

// One year of daily counts ending on `endDate` (inclusive).
// Returns array sorted oldest → newest, exactly 53*7 entries (some may be in
// the future on either end of the displayed grid).
export type HeatmapCell = {
  date: Date;
  inRange: boolean;
  count: number;
};

export function buildYearHeatmap(
  streams: Stream[],
  endDate: Date,
): { cells: HeatmapCell[]; weeks: number; max: number } {
  // Anchor end on a Sunday (last day of grid week)
  const endTrt = trt(endDate);
  const endDow = (endTrt.getUTCDay() + 6) % 7; // Pzt=0..Paz=6
  const lastSunday = new Date(
    Date.UTC(
      endTrt.getUTCFullYear(),
      endTrt.getUTCMonth(),
      endTrt.getUTCDate() + (6 - endDow),
    ),
  );
  // 53 weeks back from lastSunday to firstMonday
  const totalDays = 53 * 7;
  const firstMonday = new Date(
    lastSunday.getTime() - (totalDays - 1) * 86400000,
  );

  // Bucket streams by ISO date (TRT calendar day)
  const counts = new Map<string, number>();
  for (const s of streams) {
    const d = trt(new Date(s.scheduledAt));
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const cells: HeatmapCell[] = [];
  const inRangeStart = trt(
    new Date(endDate.getTime() - 365 * 86400000),
  ).getTime();
  const inRangeEnd = endTrt.getTime();
  let max = 0;
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(firstMonday.getTime() + i * 86400000);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    const count = counts.get(key) ?? 0;
    if (count > max) max = count;
    cells.push({
      date: d,
      inRange: d.getTime() >= inRangeStart && d.getTime() <= inRangeEnd,
      count,
    });
  }
  return { cells, weeks: 53, max };
}

// Σ(viewers × duration_hours). A rough "audience-time delivered" measure.
export function viewerHours(streams: Stream[]): number {
  let total = 0;
  for (const s of streams) {
    if (s.kind !== "completed") continue;
    if (!s.viewCount || !s.durationSec) continue;
    total += s.viewCount * (s.durationSec / 3600);
  }
  return Math.round(total);
}

// Days from oldest stream to now, plus a human-readable "X yıl Y ay" form.
export function tenure(
  streams: Stream[],
  now: Date,
): { days: number; readable: string } {
  if (streams.length === 0) return { days: 0, readable: "—" };
  const oldest = streams.reduce(
    (a, s) =>
      new Date(s.scheduledAt).getTime() < new Date(a.scheduledAt).getTime()
        ? s
        : a,
    streams[0],
  );
  const days = Math.floor(
    (now.getTime() - new Date(oldest.scheduledAt).getTime()) / 86400000,
  );
  const years = Math.floor(days / 365);
  const months = Math.floor((days - years * 365) / 30);
  const readable =
    years > 0
      ? months > 0
        ? `${years} yıl ${months} ay`
        : `${years} yıl`
      : `${months} ay`;
  return { days, readable };
}

// Number of distinct calendar days (TRT) on which any stream was published.
export function distinctActiveDays(streams: Stream[]): number {
  const set = new Set<string>();
  for (const s of streams) {
    const t = trt(new Date(s.scheduledAt));
    set.add(`${t.getUTCFullYear()}-${t.getUTCMonth()}-${t.getUTCDate()}`);
  }
  return set.size;
}

// Single TRT calendar day with the most streams (and how many).
export function mostActiveDay(
  streams: Stream[],
): { date?: Date; count: number } {
  const counts = new Map<string, { date: Date; count: number }>();
  for (const s of streams) {
    const t = trt(new Date(s.scheduledAt));
    const key = `${t.getUTCFullYear()}-${t.getUTCMonth()}-${t.getUTCDate()}`;
    const dt = new Date(
      Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()),
    );
    const cur = counts.get(key) ?? { date: dt, count: 0 };
    cur.count++;
    counts.set(key, cur);
  }
  let best: { date: Date; count: number } | undefined;
  for (const v of counts.values()) {
    if (!best || v.count > best.count) best = v;
  }
  return best ?? { count: 0 };
}

export function thisYearTotals(
  streams: Stream[],
  now: Date,
): { count: number; year: number } {
  const year = trt(now).getUTCFullYear();
  const count = streams.filter(
    (s) => trt(new Date(s.scheduledAt)).getUTCFullYear() === year,
  ).length;
  return { count, year };
}

// Earliest and latest TRT hour observed across streams (start times).
export function hourRange(
  streams: Stream[],
): { earliest?: number; latest?: number } {
  let earliest: number | undefined;
  let latest: number | undefined;
  for (const s of streams) {
    const h = trt(new Date(s.scheduledAt)).getUTCHours();
    if (earliest === undefined || h < earliest) earliest = h;
    if (latest === undefined || h > latest) latest = h;
  }
  return { earliest, latest };
}

// % of streams that started at 21:00 or later (gece kuşu).
export function nightOwlPercent(streams: Stream[]): number {
  if (streams.length === 0) return 0;
  let night = 0;
  for (const s of streams) {
    const h = trt(new Date(s.scheduledAt)).getUTCHours();
    if (h >= 21 || h < 4) night++;
  }
  return Math.round((night / streams.length) * 100);
}

// Find first stream whose title matches a tag pattern.
export function firstByTitle(
  streams: Stream[],
  pattern: RegExp,
): Stream | undefined {
  const sorted = [...streams].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
  return sorted.find((s) => pattern.test(s.title));
}

// Stream at the Nth position chronologically (1-indexed).
export function nthStream(streams: Stream[], n: number): Stream | undefined {
  const sorted = [...streams].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
  return sorted[n - 1];
}

// Audience-time as plane flight equivalents. Istanbul→Tokyo ≈ 11h direct.
const FLIGHT_HOURS = 11;
export function flightEquivalents(totalSec: number): number {
  return Math.round(totalSec / 3600 / FLIGHT_HOURS);
}

// Days awake equivalent — 16h waking hours per day.
const WAKING_HOURS = 16;
export function awakeDays(totalSec: number): number {
  return Math.round(totalSec / 3600 / WAKING_HOURS);
}

// Last 7 days (rolling) summary.
export function lastWeek(
  streams: Stream[],
  now: Date,
): { count: number; hours: number; views: number } {
  const cutoff = now.getTime() - 7 * 86400000;
  const inRange = streams.filter(
    (s) => new Date(s.scheduledAt).getTime() >= cutoff,
  );
  const sec = inRange.reduce((a, s) => a + (s.durationSec ?? 0), 0);
  const views = inRange.reduce((a, s) => a + (s.viewCount ?? 0), 0);
  return {
    count: inRange.length,
    hours: Math.round(sec / 3600),
    views,
  };
}

// Average concurrent viewers per completed stream (rough proxy via viewCount).
export function avgViewers(streams: Stream[]): number {
  const completed = streams.filter(
    (s) => s.kind === "completed" && (s.viewCount ?? 0) > 0,
  );
  if (completed.length === 0) return 0;
  const sum = completed.reduce((a, s) => a + (s.viewCount ?? 0), 0);
  return Math.round(sum / completed.length);
}

// Weekday vs weekend split. Mon=0..Sun=6 (TR convention).
export function weekdayWeekendSplit(
  streams: Stream[],
): { weekday: number; weekend: number; weekdayPct: number } {
  let weekday = 0;
  let weekend = 0;
  for (const s of streams) {
    const t = trt(new Date(s.scheduledAt));
    const dow = (t.getUTCDay() + 6) % 7;
    if (dow >= 5) weekend++;
    else weekday++;
  }
  const total = weekday + weekend;
  return {
    weekday,
    weekend,
    weekdayPct: total > 0 ? Math.round((weekday / total) * 100) : 0,
  };
}

export type TopList = {
  longest: Stream[];
  shortest: Stream[];
  mostViewed: Stream[];
};

export function topLists(streams: Stream[], n = 5): TopList {
  const completed = streams.filter(
    (s) => s.kind === "completed" && (s.durationSec ?? 0) > 0,
  );
  const longest = [...completed]
    .sort((a, b) => (b.durationSec ?? 0) - (a.durationSec ?? 0))
    .slice(0, n);
  const shortest = [...completed]
    .sort((a, b) => (a.durationSec ?? 0) - (b.durationSec ?? 0))
    .slice(0, n);
  const viewed = streams.filter((s) => (s.viewCount ?? 0) > 0);
  const mostViewed = [...viewed]
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, n);
  return { longest, shortest, mostViewed };
}
