import type { Short, Stream } from "./types";

export type ChannelMode = "live" | "upcoming" | "latest" | "empty";

export type ChannelSnapshot = {
  mode: ChannelMode;
  active: Stream | null;
  recent: Stream[];
  upcoming: Stream[];
  popular: Stream[];
  latestShorts: Short[];
  totals: {
    broadcasts: number;
    shorts: number;
    hours: number;
    views: number;
  };
  generatedAt: string;
};

const time = (value: string) => new Date(value).getTime();

export function buildChannelSnapshot(
  streams: Stream[],
  shorts: Short[],
  now: Date,
): ChannelSnapshot {
  const live = streams.find((item) => item.kind === "live") ?? null;
  const upcoming = streams
    .filter((item) => item.kind === "upcoming")
    .sort((a, b) => time(a.scheduledAt) - time(b.scheduledAt));
  const completed = streams
    .filter((item) => item.kind === "completed")
    .sort((a, b) => time(b.actualStartAt ?? b.scheduledAt) - time(a.actualStartAt ?? a.scheduledAt));

  const active = live ?? upcoming[0] ?? completed[0] ?? null;
  const mode: ChannelMode = live
    ? "live"
    : upcoming.length > 0
      ? "upcoming"
      : completed.length > 0
        ? "latest"
        : "empty";

  return {
    mode,
    active,
    recent: completed.filter((item) => item.id !== active?.id).slice(0, 6),
    upcoming: upcoming.slice(0, 3),
    popular: [...completed]
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 4),
    latestShorts: [...shorts]
      .sort((a, b) => time(b.publishedAt) - time(a.publishedAt))
      .slice(0, 6),
    totals: {
      broadcasts: completed.length,
      shorts: shorts.length,
      hours: Math.round(
        completed.reduce((sum, item) => sum + (item.durationSec ?? 0), 0) /
          3600,
      ),
      views: completed.reduce((sum, item) => sum + (item.viewCount ?? 0), 0),
    },
    generatedAt: now.toISOString(),
  };
}
