# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-09)

**Core value:** The map and snack gallery feel like a living travel scrapbook — easy to add a new trip or snack, looks great, works without a server.
**Current focus:** Phase 2.1 — GPX Data Pipeline (INSERTED)

## Current Position

Phase: 2.1 of 5 (GPX Data Pipeline)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-05-09 — Plan 02.1-01 complete — 7 meta.json files created with 33 gpx_stages references

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: ~4m
- Total execution time: ~7m

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 2 | 2 | ~7m | ~4m |
| Phase 2.1 | 1 | ~8m | ~8m |

**Recent Trend:**
- Last 5 plans: 02-01 (~2m), 02-02 (~5m incl. human checkpoint)
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 2: meta.json per trip (not extending data.js) — easier to edit one trip without touching the large GPX coordinate file
- Phase 2.1 (INSERTED): GPX paths in meta.json + build script to regenerate data.js — user wants to remove hardcoded coordinate arrays and derive them from source GPX files
- 02.1-01: gpx_stages paths use ../geographic-folder/ relative convention; rue unicode filenames required Python json.dump to preserve U+201E/U+201C characters
- Phase 3: Single snacks.json at repo root — flat list, no per-folder complexity needed
- Phase 4: Deploy from main branch root — zero-config GitHub Pages, no gh-pages branch gymnastics
- 02-01: closure cancelled flag (not AbortController) for race-condition guard — simpler, equally correct
- 02-01: PhotoItem wrapper component for per-slot errored state — clean React pattern
- 02-01: tan SVG rect fallback on image load error — simpler than re-rendering PhotoPlaceholder SVG

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 4: Asset paths under /urlaub sub-path must be verified before deployment (CDN links are absolute, local file refs may need attention)

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v2 | TRIPS-01: Add 4 missing trips (Austria 2024, Croatia 2024, etc.) | Deferred | Init |
| v2 | SNCK-08: Filter snacks by country or rating | Deferred | Init |
| v2 | SNCK-09: Sort snacks by score | Deferred | Init |

## Session Continuity

Last session: 2026-05-09
Stopped at: Plan 02.1-01 complete — ready for 02.1-02 (build script)
Resume file: None
