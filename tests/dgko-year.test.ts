import test from "node:test";
import assert from "node:assert/strict";

import { getBirthdayYearStats } from "../lib/dgko-year";

test("birthday recap includes only completed records inside the birthday year", () => {
  const streams = [
    { id: "old", title: "Eski", kind: "completed", scheduledAt: "2025-07-22T20:00:00Z", durationSec: 3600, viewCount: 90 },
    { id: "winner", title: "En çok izlenen yayın", thumbnailUrl: "https://example.com/winner.jpg", kind: "completed", scheduledAt: "2025-07-23T20:00:00Z", durationSec: 7200, viewCount: 800 },
    { kind: "upcoming", scheduledAt: "2026-01-01T20:00:00Z", durationSec: 7200, viewCount: 900 },
    { id: "last", title: "Son yayın", kind: "completed", scheduledAt: "2026-07-23T18:00:00Z", durationSec: 3600, viewCount: 400 },
  ];
  const shorts = [
    { id: "a", title: "A", thumbnailUrl: "https://example.com/a.jpg", publishedAt: "2025-08-01T10:00:00Z", viewCount: 200 },
    { id: "b", title: "B", thumbnailUrl: "https://example.com/b.jpg", publishedAt: "2026-03-01T10:00:00Z", viewCount: 600 },
    { title: "C", publishedAt: "2026-07-24T10:00:00Z", viewCount: 5000 },
  ];

  const recap = getBirthdayYearStats(
    streams,
    shorts,
    new Date("2025-07-23T00:00:00Z"),
    new Date("2026-07-24T00:00:00Z"),
  );

  assert.deepEqual(recap, {
    streamCount: 2,
    streamHours: 3,
    streamViews: 1200,
    shortCount: 2,
    shortViews: 800,
    totalViews: 2000,
    totalRecords: 4,
    activeDays: 2,
    longestStreakDays: 1,
    mostViewed: {
      id: "winner",
      kind: "stream",
      title: "En çok izlenen yayın",
      views: 800,
      thumbnailUrl: "https://example.com/winner.jpg",
    },
    longestStream: {
      title: "En çok izlenen yayın",
      durationSec: 7200,
    },
  });
});
