import assert from "node:assert/strict";
import test from "node:test";
import {
  getBundledShortsFile,
  getBundledStreamsFile,
  getBundledSyncLogFile,
} from "../lib/bundled-channel-data";

test("the Worker bundle carries the current YouTube archive instead of mock data", () => {
  const streams = getBundledStreamsFile();
  const shorts = getBundledShortsFile();

  assert.equal(streams.streams.length, 215);
  assert.equal(streams.streams[0]?.id, "Qbg6SSG2ulc");
  assert.equal(shorts.shorts.length, 80);
  assert.equal(shorts.shorts[0]?.id, "2DaNd25p9Ao");
});

test("the Worker bundle carries the latest successful sync health record", () => {
  const log = getBundledSyncLogFile();

  assert.equal(log.entries[0]?.ok, true);
  assert.equal(log.entries[0]?.startedAt, "2026-08-09T11:22:03.479Z");
});

test("callers receive isolated copies of bundled channel data", () => {
  const first = getBundledStreamsFile();
  first.streams[0]!.title = "mutated";

  assert.notEqual(getBundledStreamsFile().streams[0]?.title, "mutated");
});
