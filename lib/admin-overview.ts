import type { AdminConfig } from "./admin-config";
import { buildChannelSnapshot, type ChannelMode } from "./channel-snapshot";
import type { SyncLogEntry } from "./sync-log";
import type { Short, Stream } from "./types";

export type AdminHealth = "healthy" | "review" | "error";

export type AdminOverview = {
  publicMode: ChannelMode;
  active: {
    id: string;
    title: string;
    kind: Stream["kind"];
    scheduledAt: string;
    thumbnailUrl: string;
  } | null;
  counts: {
    live: number;
    upcoming: number;
    completed: number;
    shorts: number;
  };
  publishing: {
    banner: boolean;
    pinned: boolean;
    hidden: number;
    overrides: number;
  };
  health: AdminHealth;
  dataAgeMinutes: number | null;
  lastSuccess: SyncLogEntry | null;
  latestFailure: SyncLogEntry | null;
};

type Input = {
  streams: Stream[];
  shorts: Short[];
  log: SyncLogEntry[];
  config: AdminConfig;
  now: Date;
};

const at = (value: string) => new Date(value).getTime();

export function buildAdminOverview({
  streams,
  shorts,
  log,
  config,
  now,
}: Input): AdminOverview {
  const snapshot = buildChannelSnapshot(streams, shorts, now);
  const orderedLog = [...log].sort(
    (a, b) => at(b.finishedAt) - at(a.finishedAt),
  );
  const lastSuccess = orderedLog.find((entry) => entry.ok) ?? null;
  const newestFailure = orderedLog.find((entry) => !entry.ok) ?? null;
  const latestFailure =
    newestFailure &&
    (!lastSuccess || at(newestFailure.finishedAt) > at(lastSuccess.finishedAt))
      ? newestFailure
      : null;
  const dataAgeMinutes = lastSuccess
    ? Math.max(
        0,
        Math.floor((now.getTime() - at(lastSuccess.finishedAt)) / 60_000),
      )
    : null;
  const health: AdminHealth = latestFailure
    ? "error"
    : dataAgeMinutes === null || dataAgeMinutes > 360 || streams.length === 0
      ? "review"
      : "healthy";

  return {
    publicMode: snapshot.mode,
    active: snapshot.active
      ? {
          id: snapshot.active.id,
          title: snapshot.active.title,
          kind: snapshot.active.kind,
          scheduledAt: snapshot.active.scheduledAt,
          thumbnailUrl: snapshot.active.thumbnailUrl ?? "",
        }
      : null,
    counts: {
      live: streams.filter((stream) => stream.kind === "live").length,
      upcoming: streams.filter((stream) => stream.kind === "upcoming").length,
      completed: streams.filter((stream) => stream.kind === "completed").length,
      shorts: shorts.length,
    },
    publishing: {
      banner: Boolean(config.banner?.message.trim()),
      pinned: Boolean(config.pinnedVideoId),
      hidden: config.hiddenVideoIds.length,
      overrides: Object.keys(config.overrides).length,
    },
    health,
    dataAgeMinutes,
    lastSuccess,
    latestFailure,
  };
}
