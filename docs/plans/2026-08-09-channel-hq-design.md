# Selçuk Peköz Channel HQ — experience design

Date: 2026-08-09

## Product thesis

This is a fan-built command center for Selçuk Peköz’s Turkish Nintendo community. Its audience is made up of returning viewers who first want to know whether Selçuk is live, what happened most recently, and what is coming next; after that, they want to browse the channel’s long history without fighting YouTube’s interface. The homepage has one job: reveal the channel’s current state in seconds, then turn the full catalog into an inviting place to explore.

The redesign must not behave like a portfolio splash page. The “wow” moment is a functional broadcast boot sequence: the current live/upcoming/latest thumbnail arrives as a signal, the status resolves, and the rest of the channel becomes visible without waiting for a long animation. Motion stops immediately for people who prefer reduced motion. The experience remains fast and legible even when no live stream or upcoming event exists.

The public product covers live, upcoming and completed streams, Shorts, calendar, archive, statistics, favorites, random discovery, social channels and editorial announcements. The authenticated admin product exposes the same system from the operator’s side: current status, content totals, freshness, sync health, schedule controls, pinned/hidden content and site-wide messaging.

## Reference teardown

The references are complementary rather than direct competitors.

| Reference | What works | What we will improve |
| --- | --- | --- |
| [NTS](https://www.nts.live/schedule) | “Live now” remains a durable product state while schedule and archive stay close. NTS describes itself as two 24/7 live channels plus a very large human-curated archive. | Preserve that immediacy with one channel, then make the latest replay meaningful when nothing is live. |
| [A24](https://a24films.com/) | Large imagery gives every piece of content its own mood; restrained labels keep the catalog understandable. | Use real thumbnails as the visual identity, but add stronger time, format and status information. |
| [A24 Films](https://a24films.com/films) | Upcoming items are separated from the full catalog, and the archive offers predictable sorting. | Merge upcoming, live and latest into one state-aware hero, then expose filters and random discovery lower on the page. |
| [Boiler Room](https://boilerroom.tv/upcoming/) | Upcoming broadcasts are a first-class destination rather than a secondary metadata field. | Keep “what’s next” above the fold without forcing a separate page visit. |
| [Footage Farm redesign](https://bokaap.design/case-study/case-study-footage-farm-digital-archive-design/) | Categories are used as the archive’s structure; SMPTE details connect the visual system to broadcast history. | Use status and format as true structure, with a subtle signal language instead of decorative nostalgia. |
| [Generous Interfaces research](https://arxiv.org/abs/2009.02242) | Large collections become approachable when multiple visual and metadata dimensions are visible together. | Offer recent, popular, Shorts, years and random entry points instead of making search the only door into the archive. |

Key opportunity: award-gallery sites often trade utility for motion, while archive products often trade emotion for density. This project can occupy the open quadrant—high atmosphere and high daily usefulness.

## Directions considered

### 1. Broadcast desk — recommended

A full-width, state-aware “channel signal” leads into a dense but calm channel dashboard. The hero’s composition changes between LIVE, NEXT and LATEST modes. This direction is strongest for repeat visits and turns data freshness into part of the product identity.

### 2. Creator cinema

Every visit begins with a nearly full-screen thumbnail or video poster and sparse cinematic typography. It creates the strongest still image, but it makes routine tasks—finding the latest replay, Shorts or schedule—take longer and becomes weak when the source image is mediocre.

### 3. Playable Nintendo museum

The archive becomes a spatial or console-like world with eras and games as rooms. It is highly memorable, but expensive to keep accessible, fragile on low-power phones, and too slow for the primary “is he live?” question. Its playfulness is better spent on one signature interaction.

## Design system

### Color tokens

- Broadcast black — `#090A0C`: main canvas and the dark neutral behind thumbnails.
- Paper signal — `#F4F1E8`: primary type and warm light-mode canvas.
- On-air red — `#FF3B30`: live state and the one persistent action color.
- Switch blue — `#3E7BFA`: upcoming state, links and calendar actions.
- Phosphor lime — `#C7F36B`: freshness and healthy-system indicators.
- Console grey — `#9A9A93`: metadata and inactive controls.

This avoids the generic black-plus-acid-green template: lime is restricted to data health, while the channel’s actual thumbnails provide the changing accent field.

### Typography

- Display: **Bricolage Grotesque**, variable 600–800. Its slightly improvised forms match Selçuk’s conversational, playful delivery without becoming a game-logo pastiche.
- Body: **Inter**, 400–600, retained for Turkish character coverage and compact interface clarity.
- Utility/data: **JetBrains Mono**, 400–600, retained for times, durations, counts and system states.

### Layout

Desktop:

```text
┌────────────────────────────────────────────────────────────────────┐
│ MARK          LIVE/NEXT/LATEST                    NAV + SEARCH      │
├──────────────────────────────────────────────┬─────────────────────┤
│                                              │ CHANNEL STATE       │
│         ACTIVE THUMBNAIL / SIGNAL            │ title + time        │
│                                              │ primary actions     │
├──────────────────────────────────────────────┴─────────────────────┤
│ archive total     watched hours     Shorts     last data refresh   │
├────────────────────────────────────────────────────────────────────┤
│ LATEST BROADCASTS     one large story + four compact stories       │
├────────────────────────────────────────────────────────────────────┤
│ SHORT SIGNALS         horizontally scrollable portrait rail        │
├────────────────────────────────────────────────────────────────────┤
│ TIME MACHINE          random pick + year / popular entry points     │
└────────────────────────────────────────────────────────────────────┘
```

Mobile stacks the active image and state panel, keeps one primary action visible, turns metrics into a horizontal rail, and uses two-column cards only where thumbnails remain readable.

### Signature: the channel signal

On first paint, a thin scan line crosses the hero while the active thumbnail moves from low-contrast monochrome to full color. The state label appears exactly when the image “locks.” LIVE uses red; NEXT uses blue; LATEST uses paper white. This is the one orchestrated animation. Hover effects elsewhere are limited to image scale, underline and a directional nudge. No custom cursor, scroll hijacking, looping 3D scene or mandatory intro screen.

## Public architecture

The server page derives a `ChannelSnapshot` from existing stream, Shorts, admin configuration and statistics data. It chooses one hero mode in strict order: live, nearest upcoming, latest completed. That same snapshot supplies totals and freshness labels so status cannot disagree between sections.

New presentation components are deliberately small: `ChannelHero`, `ChannelMetrics`, `BroadcastGrid`, `ShortsRail` and `ArchivePortal`. Existing `Thumb`, favorite state, countdown and formatting helpers remain sources of truth. Links keep their current destinations; the homepage becomes a better hub rather than duplicating archive filtering logic.

Remote YouTube imagery remains optional. Missing thumbnails render the existing palette treatment and a useful title. Empty upcoming data becomes “Son sinyal” rather than an apologetic blank state. Empty Shorts or history sections are omitted. Data errors remain server-safe because the current JSON loaders already fall back without making the homepage depend on a live API call.

## Admin architecture

The admin panel gains an Overview tab and opens there by default. The overview shows:

- Current public mode (LIVE / NEXT / LATEST) and its featured item.
- Counts for completed, upcoming, live and Shorts content.
- Last successful sync, most recent failure and data age.
- Publishing state: banner, pinned item, hidden items and overridden items.
- Direct actions for syncing, adding an event and editing featured content.

Existing Events, Content and System tools remain intact and become secondary tabs. Overview data is computed server-side and passed as a serializable `AdminOverview`; it does not expose tokens, secrets or passwords. Health language is explicit: “Güncel,” “Kontrol edilmeli” and “Senkron hatası,” each with the timestamp and a suggested action.

## Testing and acceptance

Pure snapshot selection and admin-summary computations receive unit tests before UI code. Existing tests must stay green. Production build is required because the page is server-rendered and font/static behavior differs from development.

Visual checks cover desktop and 390px mobile widths, dark and light themes, and LIVE/NEXT/LATEST states where fixtures make them practical. Keyboard checks cover navigation, hero actions, cards and admin tabs. Reduced-motion mode must remove the scan animation. The final browser pass verifies homepage hierarchy, archive/Shorts/calendar routes, admin login routing, console errors and layout overflow.

Acceptance means a first-time visitor can identify the current channel state and latest content above the fold; a returning visitor can reach archive, Shorts, calendar and statistics from the homepage; and an authenticated operator can understand content and sync health without visiting multiple tabs.
