import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("Channel HQ owns a display face and one reduced-motion-safe signal", () => {
  const layout = read("app/layout.tsx");
  const css = read("app/globals.css");

  assert.match(layout, /Bricolage_Grotesque/);
  assert.match(layout, /--font-bricolage/);
  assert.match(css, /\.channel-signal/);
  assert.match(css, /\.signal-grid/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("global navigation keeps the complete channel within one step", () => {
  const nav = read("components/Nav.tsx");

  assert.match(nav, /ChannelMark/);
  for (const href of ["/takvim", "/arsiv", "/shorts", "/istatistikler"]) {
    assert.match(nav, new RegExp(`href: \"${href}\"`));
  }
  assert.match(nav, /Favorilerim/);
  assert.match(nav, /ThemeToggle/);
});
