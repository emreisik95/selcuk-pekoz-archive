# DGKO — Selçuk Peköz Birthday Film Design

## Creative direction

`/dgko` is a self-running 75-second birthday film, not a page the visitor scrolls or operates. It combines the deep-space continuity of a one-camera WebGL journey with the toy-like physical warmth of Nintendo hardware. The opening is dark, spare, and cinematic; the tunnel gradually fills with Selçuk's Shorts; the middle shifts into an olive Game Boy chapter; the last third compresses one year into a luminous event horizon; and the finale opens into a purple-and-peach birthday room inspired by the supplied concept image.

The route is isolated from the archive so every current page and API continues to work unchanged. It uses Selçuk's existing local Shorts catalogue and YouTube's privacy-enhanced embeds. Videos request muted autoplay because browsers block unprompted sound. No gesture is required to experience the film. A small replay control appears only after the ending.

## Narrative timeline

- 00–07s — “Sinyal bulundu”: darkness, a distant portal, sparse telemetry.
- 07–27s — “Bir yılın içinden”: the camera accelerates through neon rails while Shorts pass on alternating walls.
- 27–45s — “Nintendo zamanı”: a hand-built 3D Game Boy altar appears; D-pad, screen, buttons, pixels, and green phosphor typography echo the birthday reference.
- 45–60s — “365 gün”: the tunnel bends into an event horizon; dates, hours, videos, and memories collapse into one orbit.
- 60–75s — “Yeni tur”: warm colors bloom, confetti erupts, and “İyi ki doğdun Selçuk Peköz” resolves in the center.

## Visual and technical system

The WebGL layer uses raw Three.js: instanced tunnel architecture, a custom shader star field, fog, physically lit geometry, an animated Game Boy assembled from primitives, ACES color mapping, bloom, and afterimage trails. DOM typography remains crisp above WebGL. YouTube iframes are treated like emissive media panels and synchronized to the same deterministic film clock.

The film exposes pure timeline helpers for clamp, phase selection, easing, and media-panel visibility. Those helpers are written test-first. Runtime quality adapts pixel ratio and particle count to the device. `prefers-reduced-motion` shortens the travel and removes high-velocity trails while preserving the complete story and finale.

## Completion criteria

- `https://sp.emre.zip/dgko` starts by itself and reaches the finale without input.
- At least six real Selçuk Peköz Shorts appear, with active muted playback during the tunnel.
- A clearly readable Game Boy/Nintendo chapter occupies the middle of the film.
- The ending remains on-screen with the exact text “İyi ki doğdun Selçuk Peköz”.
- Desktop and mobile layouts remain legible; the rest of the archive is unchanged.
- Timeline tests and the production build pass before deployment.

