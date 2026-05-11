# Wanderlog — Project Instructions

## What This Is

A personal hiking memories website for Ben and Janna. Interactive Leaflet map with real GPX tracks, trip notes, and photos. Separate Trail Snacks gallery page with rated snack entries. Deployed as a static site on GitHub Pages at `blenback.github.io/wanderlog`.

## Tech Stack

- **No build toolchain** — React 18 UMD + Babel standalone (in-browser JSX transpilation) + Leaflet 1.9.4, all via CDN
- **No npm, no bundler, no server** — all JS served as raw files
- New pages must follow the same CDN-only pattern

## File Layout

```
index.html          — main map page (HTML shell + all CSS)
app.jsx             — React components (Map, StatsPanel, PhotoCarousel, Header)
data.js             — IIFE: populates window.TRIPS, window.totalDistance, window.totalElevation
tweaks-panel.jsx    — useTweaks hook + TweaksPanel component
snacks.html         — Trail Snacks gallery page (Phase 3)
snacks.json         — flat list of snack entries (Phase 3)
data/<trip-id>/     — GPX files + meta.json per trip
media/<trip-id>/    — photos per trip
media/snacks/       — snack photos
```

## Per-Trip Data

Each trip can have `data/<trip-id>/meta.json`:
```json
{
  "title": "Optional display title override",
  "notes": "Trip notes text shown in stats panel",
  "photos": [
    { "filename": "photo.jpg", "caption": "Caption text" }
  ]
}
```

Photos go in `media/<trip-id>/` — referenced by filename in meta.json.

## Snack Data

`snacks.json` at repo root:
```json
[
  {
    "id": "snack-id",
    "name": "Snack Name",
    "country": "Country",
    "photo": "snack-id.jpg",
    "ben": { "score": 8, "note": "One sentence." },
    "janna": { "score": 7, "note": "One sentence." }
  }
]
```

Photos go in `media/snacks/`.

## Design System

CSS custom properties defined in index.html (reuse in snacks.html):
- `--green: #586048`, `--tan: #a18258`, `--offwhite: #f5f0e8`, `--yellow: #d4a832`
- Fonts: Syne 800 (display), Nunito (body), JetBrains Mono (labels)

## Trip IDs

`bia`, `rab`, `oro`, `sar`, `slo`, `swi`, `rue`

## Planning

- `.planning/ROADMAP.md` — 4 phases; Phase 2 is next
- `.planning/REQUIREMENTS.md` — requirement IDs (MEDIA-*, DATA-*, SNCK-*, NAV-*, DEPL-*)
- `.planning/STATE.md` — current position and blockers
- `.planning/codebase/` — 7 structured codebase documents

## GSD Config

YOLO mode, coarse granularity, research-only agents (no plan checker, no verifier).
