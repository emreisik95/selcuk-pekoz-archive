// Verification dump: every computed stat as JSON. Use this to spot-check
// the numbers shown on /istatistikler against raw data.

import { NextResponse } from "next/server";
import { getAllStreams, getNow, getPastStreams } from "@/lib/streams";
import {
  totals,
  dayOfWeekDistribution,
  hourDistribution,
  monthlyTrend,
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
  firstByTitle,
  nthStream,
  flightEquivalents,
  awakeDays,
  lastWeek,
} from "@/lib/stats";
import { tagCounts, TAG_RULES } from "@/lib/tags";

export const revalidate = 60;

export async function GET() {
  const all = getAllStreams();
  const past = getPastStreams();
  const now = getNow();

  const t = totals(all);

  const tagFirsts: Record<string, { id: string; title: string; date: string } | null> =
    {};
  for (const r of TAG_RULES) {
    const first = firstByTitle(past, r.pattern);
    tagFirsts[r.tag] = first
      ? { id: first.id, title: first.title, date: first.scheduledAt }
      : null;
  }

  const data = {
    generatedAt: new Date().toISOString(),
    nowUsed: now.toISOString(),
    counts: {
      all: all.length,
      past: past.length,
    },
    totals: t,
    derived: {
      viewerHours: viewerHours(past),
      tenure: tenure(past, now),
      distinctActiveDays: distinctActiveDays(past),
      mostActiveDay: mostActiveDay(past),
      thisYear: thisYearTotals(past, now),
      hourRange: hourRange(past),
      avgViewers: avgViewers(past),
      weekdayWeekend: weekdayWeekendSplit(past),
      nightOwlPercent: nightOwlPercent(past),
      flightEquivalents: flightEquivalents(t.totalSec),
      awakeDays: awakeDays(t.totalSec),
      streakStats: streakStats(past),
      lastWeek: lastWeek(past, now),
      stream100: nthStream(past, 100),
    },
    distributions: {
      dayOfWeek: dayOfWeekDistribution(past),
      hour: hourDistribution(past),
      monthly: monthlyTrend(past, 12, now),
      yearTotals: yearTotals(past),
      tagCounts: tagCounts(past),
      tagFirsts,
    },
    topLists: topLists(past),
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
