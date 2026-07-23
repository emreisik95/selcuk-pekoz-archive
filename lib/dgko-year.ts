type StreamLike = {
  id?: string;
  title?: string;
  kind: string;
  scheduledAt: string;
  durationSec?: number | null;
  viewCount?: number | null;
  thumbnailUrl?: string;
};

type ShortLike = {
  id?: string;
  title?: string;
  publishedAt: string;
  viewCount?: number | null;
  thumbnailUrl?: string;
};

export type BirthdayHighlight = {
  id: string;
  kind: "stream" | "short";
  title: string;
  views: number;
  thumbnailUrl?: string;
};

export type BirthdayYearStats = {
  streamCount: number;
  streamHours: number;
  streamViews: number;
  shortCount: number;
  shortViews: number;
  totalViews: number;
  totalRecords: number;
  activeDays: number;
  longestStreakDays: number;
  mostViewed: BirthdayHighlight | null;
  longestStream: { title: string; durationSec: number } | null;
};

export function getBirthdayYearStats(
  streams: StreamLike[],
  shorts: ShortLike[],
  start: Date,
  endExclusive: Date,
): BirthdayYearStats {
  const inWindow = (iso: string) => {
    const time = new Date(iso).getTime();
    return time >= start.getTime() && time < endExclusive.getTime();
  };
  const yearStreams = streams.filter(
    (stream) => stream.kind === "completed" && inWindow(stream.scheduledAt),
  );
  const yearShorts = shorts.filter((short) => inWindow(short.publishedAt));
  const totalSeconds = yearStreams.reduce(
    (sum, stream) => sum + (stream.durationSec ?? 0),
    0,
  );
  const streamViews = yearStreams.reduce(
    (sum, stream) => sum + (stream.viewCount ?? 0),
    0,
  );
  const shortViews = yearShorts.reduce(
    (sum, short) => sum + (short.viewCount ?? 0),
    0,
  );
  const dayKeys = [...new Set(yearStreams.map((stream) => {
    const trtDate = new Date(new Date(stream.scheduledAt).getTime() + 3 * 3600 * 1000);
    return trtDate.toISOString().slice(0, 10);
  }))].sort();
  let longestStreakDays = dayKeys.length > 0 ? 1 : 0;
  let currentStreakDays = longestStreakDays;
  for (let index = 1; index < dayKeys.length; index += 1) {
    const previous = Date.parse(`${dayKeys[index - 1]}T00:00:00Z`);
    const current = Date.parse(`${dayKeys[index]}T00:00:00Z`);
    currentStreakDays = current - previous === 86_400_000 ? currentStreakDays + 1 : 1;
    longestStreakDays = Math.max(longestStreakDays, currentStreakDays);
  }
  const highlights: BirthdayHighlight[] = [
    ...yearStreams.map((stream) => ({
      id: stream.id ?? stream.scheduledAt,
      kind: "stream" as const,
      title: stream.title ?? "Canlı yayın",
      views: stream.viewCount ?? 0,
      thumbnailUrl: stream.thumbnailUrl,
    })),
    ...yearShorts.map((short) => ({
      id: short.id ?? short.publishedAt,
      kind: "short" as const,
      title: short.title ?? "Shorts",
      views: short.viewCount ?? 0,
      thumbnailUrl: short.thumbnailUrl,
    })),
  ];
  const mostViewed = highlights.sort((a, b) => b.views - a.views)[0] ?? null;
  const longest = [...yearStreams].sort(
    (a, b) => (b.durationSec ?? 0) - (a.durationSec ?? 0),
  )[0];

  return {
    streamCount: yearStreams.length,
    streamHours: Math.round(totalSeconds / 3600),
    streamViews,
    shortCount: yearShorts.length,
    shortViews,
    totalViews: streamViews + shortViews,
    totalRecords: yearStreams.length + yearShorts.length,
    activeDays: dayKeys.length,
    longestStreakDays,
    mostViewed,
    longestStream: longest
      ? {
          title: longest.title ?? "Canlı yayın",
          durationSec: longest.durationSec ?? 0,
        }
      : null,
  };
}
