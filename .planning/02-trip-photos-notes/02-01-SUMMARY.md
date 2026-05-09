---
phase: 02-trip-photos-notes
plan: 01
subsystem: app.jsx
tags: [react, fetch, carousel, photos, meta-json]
dependency_graph:
  requires: []
  provides: [meta-fetch-pipeline, photo-carousel-real-images, stats-notes-override, title-override]
  affects: [app.jsx]
tech_stack:
  added: []
  patterns: [fetch-with-race-condition-guard, per-slot-errored-state, prop-threading]
key_files:
  created: []
  modified:
    - app.jsx
decisions:
  - "Use closure cancelled flag (not AbortController) for race-condition guard — simpler, equally correct for this use case"
  - "PhotoItem wrapper component for per-slot errored state — clean React pattern over onError DOM hack"
  - "Tan SVG rect fallback on image load error — simpler than re-rendering PhotoPlaceholder SVG, visually consistent"
  - "placeholderPhotos kept in useMemo keyed to trip — no regression to placeholder behaviour"
metrics:
  duration: "~2m"
  completed: "2026-05-09"
  tasks_completed: 2
  files_modified: 1
---

# Phase 2 Plan 01: Meta.json Fetch Pipeline & Photo Carousel Summary

Implemented async meta.json fetch in App with race-condition guard, threaded meta prop to Header/StatsPanel/PhotoCarousel, and rewrote PhotoCarousel to render real `<img>` elements (with per-slot error fallback) when meta.photos is present, falling back to original placeholder SVG art when absent.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add meta fetch in App and thread meta prop to children | 9e7dcc4 | app.jsx |
| 2 | Rewrite PhotoCarousel to render real images or placeholder | bfae0ca | app.jsx |

## What Was Built

### Task 1: Meta fetch pipeline

- Added `const [meta, setMeta] = useState(null)` state in `App()`
- Added `useEffect` with `[activeTripId]` dependency array that:
  - Clears meta immediately when no trip selected
  - Fetches `data/${activeTripId}/meta.json` (relative path — correct for GitHub Pages sub-path)
  - Guards against stale responses with `let cancelled = false` closure flag
  - Silently swallows 404s (no meta.json) and parse errors — falls back to data.js values
- Threaded `meta` prop to `Header`, `StatsPanel`, and `PhotoCarousel`
- `Header`: subtitle uses `(meta && meta.title) || activeTrip.name`
- `StatsPanel`: title uses `(meta && meta.title) || trip.name`; blurb uses `(meta && meta.notes) || trip.blurb`

### Task 2: PhotoCarousel real-image rendering

- Added `PhotoItem` component with per-slot `errored` state:
  - Renders `<img src="media/{trip.id}/{photo.filename}">` with `objectFit: cover`
  - On load error: replaces img with a simple tan SVG rect (clean, no broken image icon)
  - No `.ta-photo-tag` overlay, no stage label — captions from meta.json only
- Rewrote `PhotoCarousel` to accept `meta` prop:
  - `hasRealPhotos = meta && meta.photos && meta.photos.length > 0` gate
  - Real-photo branch: renders `PhotoItem` per entry, subtitle shows `"{N} photos"`
  - Placeholder branch: identical to original render — no regression
  - Added `useEffect(() => { setIdx(0); }, [trip.id])` to reset index on trip change (prevents out-of-range on trips with fewer photos)
  - `placeholderPhotos` kept in `useMemo` keyed to `trip` — no behaviour change

## Requirements Satisfied

| Requirement | Description | Implementation |
|-------------|-------------|----------------|
| MEDIA-01 | Load real photos from media/<trip-id>/ | PhotoItem renders `<img src="media/{id}/{filename}">` |
| MEDIA-02 | Per-photo captions from meta.json | `photo.caption` in `.ta-photo-cap` span |
| MEDIA-03 | Fallback to placeholder when no meta photos | `hasRealPhotos` gate — placeholder branch unchanged |
| DATA-01 | meta.json title override | `(meta && meta.title) || name` in Header + StatsPanel |
| DATA-02 | Trip notes from meta.json | `(meta && meta.notes) || trip.blurb` in StatsPanel |
| DATA-03 | Fetch meta.json per trip selection | useEffect with [activeTripId] dependency |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Placeholder mode is the intentional designed fallback for trips without meta.json files — not a stub. It renders the existing PhotoPlaceholder SVG art and works correctly today. Real photos and meta.json files are created in Plan 02 (data file creation task).

## Threat Flags

None. All security surface in this plan was pre-modelled in the plan's threat register (T-02-01 through T-02-03). The fetch call uses a relative path to same-origin static assets. No dangerouslySetInnerHTML used — all meta.json values render as React text nodes.

## Self-Check: PASSED

- [x] app.jsx modified and committed (9e7dcc4, bfae0ca)
- [x] `grep -c "const \[meta, setMeta\]" app.jsx` = 1
- [x] `grep -c "let cancelled = false" app.jsx` = 1
- [x] `grep -c "hasRealPhotos" app.jsx` = 4 (>= 3 required)
- [x] `grep -c "function PhotoItem" app.jsx` = 1
- [x] No import/export statements in app.jsx
- [x] No new CSS, no changes to index.html, no changes to data.js
