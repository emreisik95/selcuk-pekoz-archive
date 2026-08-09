# Channel HQ Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a live-first, visually memorable Channel HQ homepage and an admin overview that makes the complete YouTube archive and its operational health immediately understandable.

**Architecture:** Add two pure server-safe view-model modules: one selects and summarizes the public channel state, and one summarizes admin health. Server pages load existing JSON-backed repositories and pass serializable models into small presentation components; existing routes, favorites, countdown and admin editing tools remain sources of truth.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Node test runner, `next/font`, existing JSON/YouTube sync data.

---

### Task 1: Public channel snapshot model

**Files:**
- Create: `lib/channel-snapshot.ts`
- Create: `tests/channel-snapshot.test.ts`

**Step 1: Write the failing tests**

Cover the strict hero priority and derived totals:

```ts
test("live wins over upcoming and completed", () => {
  const snapshot = buildChannelSnapshot([completed, upcoming, live], shorts, now);
  assert.equal(snapshot.mode, "live");
  assert.equal(snapshot.active.id, live.id);
});

test("the latest completed stream is used when the schedule is empty", () => {
  const snapshot = buildChannelSnapshot([older, latest], [], now);
  assert.equal(snapshot.mode, "latest");
  assert.equal(snapshot.active.id, latest.id);
});

test("snapshot exposes archive, hours, views and short totals", () => {
  assert.deepEqual(snapshot.totals, {
    broadcasts: 2,
    shorts: 1,
    hours: 3,
    views: 1200,
  });
});
```

**Step 2: Run the new test and verify failure**

Run: `node --import tsx --test tests/channel-snapshot.test.ts`

Expected: FAIL because `@/lib/channel-snapshot` does not exist.

**Step 3: Implement the pure model**

Create `buildChannelSnapshot(streams, shorts, now)` with:

- `mode: "live" | "upcoming" | "latest" | "empty"`.
- `active: Stream | null` chosen live → nearest upcoming → newest completed.
- `recent`: six newest completed streams excluding the active item.
- `upcoming`: three nearest upcoming streams.
- `popular`: four completed streams sorted by view count.
- `latestShorts`: six newest Shorts.
- `totals`: completed broadcast count, Shorts count, rounded duration hours and total views.

Do not read files or environment variables in this module.

**Step 4: Run focused and full tests**

Run: `node --import tsx --test tests/channel-snapshot.test.ts`

Expected: PASS.

Run: `npm test`

Expected: all existing and new tests pass.

**Step 5: Commit**

```bash
git add lib/channel-snapshot.ts tests/channel-snapshot.test.ts
git commit -m "feat: model the public channel snapshot"
```

---

### Task 2: Channel HQ typography, tokens and navigation

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `components/Nav.tsx`
- Create: `components/ChannelMark.tsx`
- Create: `tests/channel-hq-ui.test.ts`

**Step 1: Write a failing source-contract test**

Verify that the layout declares the display font variable, the stylesheet includes reduced-motion handling and the navigation exposes direct archive/Shorts/calendar access.

```ts
test("Channel HQ owns a display face and one reduced-motion-safe signal", () => {
  assert.match(layout, /--font-bricolage/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /channel-signal/);
});
```

**Step 2: Run the test and verify failure**

Run: `node --import tsx --test tests/channel-hq-ui.test.ts`

Expected: FAIL on missing display token and signal styles.

**Step 3: Implement the visual foundation**

- Load `Bricolage_Grotesque` with Turkish-compatible Latin subsets in `app/layout.tsx` and expose `--font-bricolage`.
- Replace generic warm tokens with the six named design tokens from the design document while retaining semantic `bg`, `text`, `muted`, `hair`, `ink` and `red` aliases for existing pages.
- Add `.font-display`, `.channel-signal`, `.signal-grid`, hover transitions and `@media (prefers-reduced-motion: reduce)` rules.
- Build a compact `ChannelMark` that reads as a broadcast identity, not a logo imitation.
- Reshape desktop/mobile navigation around Home, Live Calendar, Archive, Shorts and Statistics. Preserve favorites and theme switching.

**Step 4: Run focused and full tests**

Run: `node --import tsx --test tests/channel-hq-ui.test.ts`

Expected: PASS.

Run: `npm test`

Expected: PASS.

**Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css components/Nav.tsx components/ChannelMark.tsx tests/channel-hq-ui.test.ts
git commit -m "feat: establish the Channel HQ visual system"
```

---

### Task 3: State-aware hero and channel metrics

**Files:**
- Create: `components/channel/ChannelHero.tsx`
- Create: `components/channel/ChannelMetrics.tsx`
- Modify: `tests/channel-hq-ui.test.ts`

**Step 1: Extend the failing UI contract**

Assert that the hero has copy for all four states, links the active broadcast internally and to YouTube, and labels the channel metrics.

```ts
for (const label of ["ŞİMDİ CANLI", "SIRADAKİ YAYIN", "SON SİNYAL", "YAYIN BEKLENİYOR"]) {
  assert.match(hero, new RegExp(label));
}
assert.match(metrics, /Yayınlık arşiv/);
assert.match(metrics, /Saatlik kayıt/);
```

**Step 2: Verify the test fails**

Run: `node --import tsx --test tests/channel-hq-ui.test.ts`

Expected: FAIL because the components do not exist.

**Step 3: Implement the components**

- Render the active thumbnail as the hero’s visual field using `Thumb`.
- Keep status, title, schedule, duration/viewer metadata and one primary action visible above the fold.
- Use the existing `Countdown` and `CalendarButton` only for upcoming mode.
- Use the existing live pulse and direct YouTube action for live mode.
- Animate only the signal line and thumbnail lock-in; use semantic headings and links.
- Render four concise metrics: broadcasts, recorded hours, total views and Shorts.

**Step 4: Run tests and build type-check**

Run: `npm test`

Expected: PASS.

Run: `npx tsc --noEmit`

Expected: PASS.

**Step 5: Commit**

```bash
git add components/channel/ChannelHero.tsx components/channel/ChannelMetrics.tsx tests/channel-hq-ui.test.ts
git commit -m "feat: add the live-first channel hero"
```

---

### Task 4: Complete homepage content hub

**Files:**
- Create: `components/channel/BroadcastGrid.tsx`
- Create: `components/channel/ShortsRail.tsx`
- Create: `components/channel/ArchivePortal.tsx`
- Modify: `app/page.tsx`
- Modify: `tests/channel-hq-ui.test.ts`

**Step 1: Add failing homepage contracts**

Verify that the homepage uses the snapshot model and visibly exposes the archive, Shorts, calendar, statistics and random discovery routes.

```ts
assert.match(home, /buildChannelSnapshot/);
for (const href of ["\/arsiv", "\/shorts", "\/takvim", "\/istatistikler", "\/rastgele"]) {
  assert.match(homeAndChildren, new RegExp(`href=[{\"']${href}`));
}
```

**Step 2: Run and verify failure**

Run: `node --import tsx --test tests/channel-hq-ui.test.ts`

Expected: FAIL on missing components/routes.

**Step 3: Implement the homepage hub**

- Replace `app/page.tsx` with one server-rendered composition using `getAllStreams`, `getShorts`, `getNow`, `getAdminConfig` and `buildChannelSnapshot`.
- Show the pinned stream only when it differs from the active stream.
- Render recent broadcasts as one lead card plus supporting cards.
- Render the newest Shorts in a keyboard-scrollable portrait rail.
- Render an archive portal with Popular, Random, Calendar and Statistics entry points.
- Keep the admin banner, global navigation/footer and the optional community timeline behavior.
- Omit empty secondary sections rather than rendering vague placeholders.

**Step 4: Run tests and production build**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS with all routes generated or server-rendered successfully.

**Step 5: Commit**

```bash
git add app/page.tsx components/channel tests/channel-hq-ui.test.ts
git commit -m "feat: turn the homepage into a complete channel hub"
```

---

### Task 5: Admin overview model

**Files:**
- Create: `lib/admin-overview.ts`
- Create: `tests/admin-overview.test.ts`

**Step 1: Write failing model tests**

Cover counts, current public mode, last success, latest failure, configuration totals and stale sync detection.

```ts
test("flags data older than six hours for review", () => {
  const overview = buildAdminOverview({ streams, shorts, log, config, now });
  assert.equal(overview.health, "review");
});

test("a newer successful sync clears an older failure", () => {
  assert.equal(overview.health, "healthy");
  assert.equal(overview.latestFailure, null);
});
```

**Step 2: Run and verify failure**

Run: `node --import tsx --test tests/admin-overview.test.ts`

Expected: FAIL because the module does not exist.

**Step 3: Implement the server-safe summary**

Return a serializable object containing `publicMode`, active item, counts by stream kind, Shorts count, last success, unresolved latest failure, data age, health (`healthy | review | error`) and publishing totals (`banner`, `pinned`, hidden, overrides). Reuse `buildChannelSnapshot` rather than reimplementing hero priority.

**Step 4: Run focused and full tests**

Run: `node --import tsx --test tests/admin-overview.test.ts`

Expected: PASS.

Run: `npm test`

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/admin-overview.ts tests/admin-overview.test.ts
git commit -m "feat: summarize admin content health"
```

---

### Task 6: Admin command-center overview

**Files:**
- Modify: `app/admin/panel/page.tsx`
- Modify: `app/admin/panel/AdminPanel.tsx`
- Create: `components/admin/AdminOverview.tsx`
- Create: `tests/admin-hq-ui.test.ts`

**Step 1: Write the failing UI contract**

Verify that Overview is the default tab, the panel labels public state/content health/data freshness, and direct actions reach Events, Content and System.

```ts
assert.match(panel, /type Tab = "overview"/);
assert.match(panel, /Genel bakış/);
for (const label of ["Yayın durumu", "Veri sağlığı", "İçerik kapsamı", "Yayınlama durumu"]) {
  assert.match(overview, new RegExp(label));
}
```

**Step 2: Run and verify failure**

Run: `node --import tsx --test tests/admin-hq-ui.test.ts`

Expected: FAIL because Overview is absent.

**Step 3: Implement Overview without weakening existing tools**

- Load Shorts and build `AdminOverview` on the authenticated server page.
- Add `overview` to tab routing and make it the default.
- Render status cards, active broadcast, freshness timeline and publishing counts.
- Link direct actions to `?t=events`, `?t=content` and `?t=system`.
- Preserve the current Events, Content, preview, sync log and System behavior unchanged.
- Never serialize webhook tokens, PubSub secrets or environment variables into the overview.

**Step 4: Run tests and build**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add app/admin/panel/page.tsx app/admin/panel/AdminPanel.tsx components/admin/AdminOverview.tsx tests/admin-hq-ui.test.ts
git commit -m "feat: add the admin command center"
```

---

### Task 7: Visual, responsive and accessibility critique

**Files:**
- Modify as findings require: `app/globals.css`, `app/page.tsx`, `components/channel/*.tsx`, `components/Nav.tsx`, `components/admin/AdminOverview.tsx`

**Step 1: Start the worktree app on a non-conflicting port**

Run: `npm run dev -- --port 3001`

Expected: Next.js reports ready at `http://localhost:3001`.

**Step 2: Capture and critique desktop**

Inspect the homepage at the default desktop viewport. Check first-screen state recognition, text contrast, thumbnail crop, hero action prominence, section rhythm, hover/focus, console errors and horizontal overflow.

**Step 3: Capture and critique mobile**

Use a 390 × 844 viewport. Check navigation, first-screen action, metric rail, two-column card readability, Shorts rail, tap targets and overflow.

**Step 4: Verify reduced motion and themes**

Confirm the signal animation is disabled under `prefers-reduced-motion`, light/dark modes both meet contrast expectations and theme changes do not cause unreadable image overlays.

**Step 5: Fix findings and rerun checks**

Use small CSS/component patches for concrete issues, then reload and capture fresh evidence.

**Step 6: Commit**

```bash
git add app components tests
git commit -m "fix: polish Channel HQ across breakpoints"
```

---

### Task 8: Final verification and integration readiness

**Files:**
- Modify only if verification exposes issues.

**Step 1: Run the full automated gate**

Run: `npm test`

Expected: all tests pass.

Run: `npx tsc --noEmit`

Expected: no TypeScript errors.

Run: `npm run build`

Expected: production build succeeds.

**Step 2: Verify key routes in the browser**

Open `/`, `/arsiv`, `/shorts`, `/takvim`, `/istatistikler`, `/rastgele`, `/admin` and the authenticated `/admin/panel` when a local admin password is available. Confirm navigation, page load, no horizontal overflow and no error logs.

**Step 3: Audit explicit requirements**

- WOW landing moment: rendered channel-signal hero evidence.
- Latest/live/upcoming visibility: snapshot tests plus rendered hero.
- Complete channel visibility: homepage links/sections and route checks.
- Admin “check everything”: overview model/UI tests plus rendered panel where credentials permit.
- Usability: desktop/mobile/reduced-motion/focus evidence.

**Step 4: Request code review**

Use `superpowers:requesting-code-review`, address actionable findings, and rerun the full gate.

**Step 5: Finish the branch**

Use `superpowers:finishing-a-development-branch` only after every acceptance item is evidenced.
