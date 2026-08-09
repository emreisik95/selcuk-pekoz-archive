import assert from "node:assert/strict";
import test from "node:test";
import { buildChannelSnapshot } from "../lib/channel-snapshot";
import type { Short, Stream, StreamKind } from "../lib/types";

const NOW = new Date("2026-08-09T12:00:00.000Z");

function stream(
  id: string,
  kind: StreamKind,
  scheduledAt: string,
  options: Partial<Stream> = {},
): Stream {
  return {
    id,
    kind,
    scheduledAt,
    title: `Yayın ${id}`,
    durationSec: 0,
    viewCount: 0,
    palette: ["#090A0C", "#FF3B30", "#3E7BFA"],
    episodeNo: 1,
    ...options,
  };
}

function short(id: string, publishedAt: string): Short {
  return {
    id,
    title: `Short ${id}`,
    publishedAt,
    durationSec: 20,
    viewCount: 100,
    thumbnailUrl: `https://example.com/${id}.jpg`,
  };
}

test("live wins over upcoming and completed content", () => {
  const completed = stream("completed", "completed", "2026-08-08T18:00:00.000Z");
  const upcoming = stream("upcoming", "upcoming", "2026-08-10T18:00:00.000Z");
  const live = stream("live", "live", "2026-08-09T11:00:00.000Z");

  const snapshot = buildChannelSnapshot([completed, upcoming, live], [], NOW);

  assert.equal(snapshot.mode, "live");
  assert.equal(snapshot.active?.id, live.id);
});

test("the nearest upcoming stream wins when nothing is live", () => {
  const later = stream("later", "upcoming", "2026-08-12T18:00:00.000Z");
  const nearer = stream("nearer", "upcoming", "2026-08-10T18:00:00.000Z");

  const snapshot = buildChannelSnapshot([later, nearer], [], NOW);

  assert.equal(snapshot.mode, "upcoming");
  assert.equal(snapshot.active?.id, nearer.id);
});

test("the latest completed stream becomes the signal when the schedule is empty", () => {
  const older = stream("older", "completed", "2026-08-01T18:00:00.000Z");
  const latest = stream("latest", "completed", "2026-08-08T18:00:00.000Z");

  const snapshot = buildChannelSnapshot([older, latest], [], NOW);

  assert.equal(snapshot.mode, "latest");
  assert.equal(snapshot.active?.id, latest.id);
  assert.deepEqual(snapshot.recent.map((item) => item.id), [older.id]);
});

test("an empty channel exposes an explicit empty mode", () => {
  const snapshot = buildChannelSnapshot([], [], NOW);

  assert.equal(snapshot.mode, "empty");
  assert.equal(snapshot.active, null);
});

test("snapshot totals and discovery groups are sorted from real metadata", () => {
  const quiet = stream("quiet", "completed", "2026-08-01T18:00:00.000Z", {
    durationSec: 3600,
    viewCount: 200,
  });
  const popular = stream("popular", "completed", "2026-08-08T18:00:00.000Z", {
    durationSec: 7200,
    viewCount: 1000,
  });
  const newestShort = short("new", "2026-08-09T10:00:00.000Z");
  const olderShort = short("old", "2026-08-02T10:00:00.000Z");

  const snapshot = buildChannelSnapshot(
    [quiet, popular],
    [olderShort, newestShort],
    NOW,
  );

  assert.deepEqual(snapshot.totals, {
    broadcasts: 2,
    shorts: 2,
    hours: 3,
    views: 1200,
  });
  assert.deepEqual(snapshot.popular.map((item) => item.id), [popular.id, quiet.id]);
  assert.deepEqual(snapshot.latestShorts.map((item) => item.id), [
    newestShort.id,
    olderShort.id,
  ]);
});
