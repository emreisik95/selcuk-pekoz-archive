import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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

test("the channel hero communicates every broadcast state and its actions", () => {
  const path = "components/channel/ChannelHero.tsx";
  assert.equal(existsSync(path), true, "ChannelHero should exist");
  const hero = read(path);

  for (const label of [
    "ŞİMDİ CANLI",
    "SIRADAKİ YAYIN",
    "SON SİNYAL",
    "YAYIN BEKLENİYOR",
  ]) {
    assert.match(hero, new RegExp(label));
  }
  assert.match(hero, /youtube\.com\/watch/);
  assert.match(hero, /Countdown/);
  assert.match(hero, /CalendarButton/);
  assert.match(hero, /\/y\/\$\{active\.id\}/);
});

test("channel metrics label the archive in human terms", () => {
  const path = "components/channel/ChannelMetrics.tsx";
  assert.equal(existsSync(path), true, "ChannelMetrics should exist");
  const metrics = read(path);

  for (const label of [
    "Yayınlık arşiv",
    "Saatlik kayıt",
    "Toplam izlenme",
    "Kısa video",
  ]) {
    assert.match(metrics, new RegExp(label));
  }
});

test("the homepage is a complete channel hub, not only a hero", () => {
  const componentPaths = [
    "components/channel/BroadcastGrid.tsx",
    "components/channel/ShortsRail.tsx",
    "components/channel/ArchivePortal.tsx",
  ];
  for (const path of componentPaths) {
    assert.equal(existsSync(path), true, `${path} should exist`);
  }

  const home = read("app/page.tsx");
  const surface = [home, ...componentPaths.map(read)].join("\n");

  assert.match(home, /buildChannelSnapshot/);
  assert.match(home, /getShorts/);
  assert.match(home, /ChannelHero/);
  assert.match(home, /ChannelMetrics/);
  for (const href of ["/arsiv", "/shorts", "/takvim", "/istatistikler", "/rastgele"]) {
    assert.match(surface, new RegExp(`href(?:=|:)\\s*[{]?\\"${href}\\"`));
  }
  for (const section of ["Son yayınlar", "Kısa sinyaller", "Arşive dal"]) {
    assert.match(surface, new RegExp(section));
  }
});
