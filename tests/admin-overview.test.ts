import assert from "node:assert/strict";
import test from "node:test";
import { buildAdminOverview } from "../lib/admin-overview";
import type { AdminConfig } from "../lib/admin-config";
import type { SyncLogEntry } from "../lib/sync-log";
import type { Short, Stream } from "../lib/types";

const NOW = new Date("2026-08-09T12:00:00.000Z");

const streams: Stream[] = [
  {
    id: "live",
    kind: "live",
    title: "Canlı yayın",
    scheduledAt: "2026-08-09T11:00:00.000Z",
    durationSec: null,
    viewCount: null,
    palette: ["#090A0C", "#FF3B30", "#3E7BFA"],
    episodeNo: 3,
  },
  {
    id: "past",
    kind: "completed",
    title: "Dünkü yayın",
    scheduledAt: "2026-08-08T18:00:00.000Z",
    durationSec: 7200,
    viewCount: 1200,
    palette: ["#090A0C", "#FF3B30", "#3E7BFA"],
    episodeNo: 2,
  },
];

const shorts: Short[] = [
  {
    id: "short",
    title: "Kısa video",
    publishedAt: "2026-08-09T08:00:00.000Z",
    durationSec: 25,
    viewCount: 400,
    thumbnailUrl: "https://example.com/short.jpg",
  },
];

const config: AdminConfig = {
  banner: {
    message: "Bu akşam canlı",
    tone: "info",
    updatedAt: "2026-08-09T08:00:00.000Z",
  },
  pinnedVideoId: "past",
  hiddenVideoIds: ["hidden-a", "hidden-b"],
  overrides: { past: { title: "Düzenlenmiş başlık" } },
  webhookToken: "must-not-leak",
  socialLinks: [],
  about: null,
  twitterTimeline: null,
  pubsub: {
    channelId: "channel",
    active: true,
    leaseExpiresAt: null,
    lastNotifiedAt: null,
    secret: "must-not-leak-either",
  },
};

function log(
  finishedAt: string,
  ok: boolean,
  message = ok ? "Senkron tamamlandı" : "API hatası",
): SyncLogEntry {
  return {
    startedAt: finishedAt,
    finishedAt,
    kind: "full",
    ok,
    durationMs: 1000,
    message,
    error: ok ? undefined : message,
  };
}

test("overview reports public state, content coverage and publishing controls", () => {
  const overview = buildAdminOverview({
    streams,
    shorts,
    log: [log("2026-08-09T11:30:00.000Z", true)],
    config,
    now: NOW,
  });

  assert.equal(overview.publicMode, "live");
  assert.equal(overview.active?.id, "live");
  assert.deepEqual(overview.counts, {
    live: 1,
    upcoming: 0,
    completed: 1,
    shorts: 1,
  });
  assert.deepEqual(overview.publishing, {
    banner: true,
    pinned: true,
    hidden: 2,
    overrides: 1,
  });
  assert.equal(JSON.stringify(overview).includes("must-not-leak"), false);
});

test("data older than six hours is flagged for review", () => {
  const overview = buildAdminOverview({
    streams,
    shorts,
    log: [log("2026-08-09T05:00:00.000Z", true)],
    config,
    now: NOW,
  });

  assert.equal(overview.health, "review");
  assert.equal(overview.dataAgeMinutes, 420);
});

test("a failure newer than the last success becomes an active error", () => {
  const overview = buildAdminOverview({
    streams,
    shorts,
    log: [
      log("2026-08-09T11:45:00.000Z", false),
      log("2026-08-09T11:30:00.000Z", true),
    ],
    config,
    now: NOW,
  });

  assert.equal(overview.health, "error");
  assert.equal(overview.latestFailure?.message, "API hatası");
});

test("a newer successful sync clears an older failure", () => {
  const overview = buildAdminOverview({
    streams,
    shorts,
    log: [
      log("2026-08-09T11:45:00.000Z", true),
      log("2026-08-09T11:30:00.000Z", false),
    ],
    config,
    now: NOW,
  });

  assert.equal(overview.health, "healthy");
  assert.equal(overview.latestFailure, null);
});
