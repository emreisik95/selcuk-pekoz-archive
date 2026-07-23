import test from "node:test";
import assert from "node:assert/strict";

import {
  FILM_DURATION,
  clamp01,
  getChapter,
  getFilmFrame,
  getPanelActivity,
  getPanelProjection,
  getRenderProfile,
  getTunnelPanelDepth,
} from "../lib/dgko-timeline";

test("clamp01 keeps progress inside the film", () => {
  assert.equal(clamp01(-0.2), 0);
  assert.equal(clamp01(0.48), 0.48);
  assert.equal(clamp01(1.2), 1);
});

test("chapter boundaries cover the complete 75 second film", () => {
  assert.equal(getChapter(0).id, "signal");
  assert.equal(getChapter(7).id, "year");
  assert.equal(getChapter(27).id, "nintendo");
  assert.equal(getChapter(45).id, "orbit");
  assert.equal(getChapter(60).id, "finale");
  assert.equal(getChapter(FILM_DURATION + 10).id, "finale");
});

test("only nearby tunnel panels are active", () => {
  assert.deepEqual(getPanelActivity(0, 0), { visible: true, active: true });
  assert.deepEqual(getPanelActivity(0, 2), { visible: true, active: false });
  assert.deepEqual(getPanelActivity(0, 4), { visible: false, active: false });
});

test("media panels travel from the vanishing point past the camera", () => {
  const far = getPanelProjection(2, 0);
  const near = getPanelProjection(2, 2);
  const passed = getPanelProjection(2, 3.2);
  const offscreen = getPanelProjection(2, 3.8);

  assert.ok(far.depth < near.depth);
  assert.ok(far.scale < near.scale);
  assert.ok(Math.abs(far.leftPercent - 50) < Math.abs(near.leftPercent - 50));
  assert.ok(Math.abs(passed.leftPercent - 50) > Math.abs(near.leftPercent - 50));
  assert.equal(passed.opacity, near.opacity);
  assert.equal(offscreen.opacity, 0);
});

test("wall media depth loops on the same 24-unit rail as the Three.js niches", () => {
  const initial = getTunnelPanelDepth(0, 0, 8);
  const advanced = getTunnelPanelDepth(0, 20, 8);
  const wrapped = getTunnelPanelDepth(0, 210, 8);

  assert.equal(initial, -30);
  assert.ok(advanced > initial);
  assert.ok(wrapped < initial);
});

test("the final frame persists after the film completes", () => {
  const frame = getFilmFrame(FILM_DURATION + 30, false);

  assert.equal(frame.progress, 1);
  assert.equal(frame.chapter.id, "finale");
  assert.equal(frame.finished, true);
  assert.equal(frame.travel, 520);
});

test("reduced motion preserves all chapters in a shorter film", () => {
  const frame = getFilmFrame(24, true);

  assert.equal(frame.progress, 1);
  assert.equal(frame.chapter.id, "finale");
  assert.equal(frame.finished, true);
});

test("recap chapters use real-content labels instead of hardware trivia", () => {
  const copy = [getChapter(10), getChapter(30), getChapter(50)]
    .map((chapter) => `${chapter.title} ${chapter.note}`)
    .join(" ");

  assert.doesNotMatch(copy, /DMG-01|1989|GAME BOY ZAMANI/);
});

test("mobile render profile stays crisp on high-density phone screens", () => {
  const mobile = getRenderProfile(390, 3);
  const desktop = getRenderProfile(1440, 2);

  assert.equal(mobile.compact, true);
  assert.ok(mobile.pixelRatio >= 2.25);
  assert.ok(mobile.pixelRatio <= 2.5);
  assert.ok(mobile.frameCount >= 24);
  assert.ok(mobile.frameCount <= 28);
  assert.equal(desktop.compact, false);
  assert.ok(desktop.frameCount > mobile.frameCount);
});
