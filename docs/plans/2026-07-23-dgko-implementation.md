# DGKO Birthday Film Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a self-running, cinematic Three.js birthday journey at `/dgko` and publish it through the existing Coolify application.

**Architecture:** A server route selects real Shorts from the local data catalogue and passes a compact serializable list to one client experience. The client owns a deterministic film clock, a WebGL scene, DOM narrative overlays, and muted privacy-enhanced YouTube panels. Pure timeline behavior is kept outside React and covered by tests.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Three.js, CSS, Node test runner via tsx, YouTube embeds, Coolify API.

### Task 1: Timeline contract

**Files:**
- Create: `tests/dgko-timeline.test.ts`
- Create: `lib/dgko-timeline.ts`
- Modify: `package.json`

**Steps:**
1. Add failing tests for clamped progress, phase boundaries, panel activation, and the persistent finale.
2. Run the focused test and verify that it fails because the module is missing.
3. Implement only the pure timeline helpers required by the test.
4. Run the focused test and verify all assertions pass.

### Task 2: Route and data selection

**Files:**
- Create: `app/dgko/page.tsx`
- Create: `app/dgko/BirthdayExperience.tsx`

**Steps:**
1. Select a curated year-spanning set from `data/shorts.json`, falling back to recent items when a preferred id is absent.
2. Add route metadata and pass only id, title, date, and thumbnail fields to the client.
3. Render the client experience as the complete route surface, with no archive navigation or banner.

### Task 3: WebGL film

**Files:**
- Create: `app/dgko/BirthdayExperience.tsx`
- Create: `app/dgko/dgko.css`

**Steps:**
1. Build the renderer, perspective camera, fog, lights, instanced tunnel, shader stars, Game Boy model, event horizon, and finale confetti.
2. Add bloom, output color correction, and afterimage post-processing with mobile-aware quality limits.
3. Drive every scene element from the deterministic timeline and cleanly dispose all GPU resources on unmount.
4. Respect reduced motion and preserve a complete accelerated narrative.

### Task 4: Media panels and titles

**Files:**
- Modify: `app/dgko/BirthdayExperience.tsx`
- Modify: `app/dgko/dgko.css`

**Steps:**
1. Place alternating video cards along the tunnel and activate only the nearest two YouTube embeds.
2. Request muted autoplay, looping, inline playback, and privacy-enhanced embeds.
3. Add cinematic chapter typography, a progress rail, loading state, finale, and post-finale replay control.
4. Make the route usable from 360px mobile screens through large desktops.

### Task 5: Validate and publish

**Files:**
- Modify: `package-lock.json`
- Modify: `package.json`

**Steps:**
1. Run `npm test` and expect all DGKO timeline tests to pass.
2. Run `npm run build` and expect `/dgko` in the successful route table.
3. Start the site locally and inspect the route at desktop and mobile sizes.
4. Commit the validated source, push `main`, trigger the existing Coolify application, wait for success, and verify `https://sp.emre.zip/dgko` returns the finished route.

