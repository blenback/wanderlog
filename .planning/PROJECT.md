# Wanderlog

## What This Is

A personal hiking memories website for Ben and Janna — an interactive Leaflet map showing all their hiking trips with real GPX tracks, trip notes, and photos, plus a separate Trail Snacks gallery page where they rate and review trail snacks they've eaten. Deployed as a static site on GitHub Pages at `blenback.github.io/urlaub`.

## Core Value

**The map and the snack gallery feel like a living travel scrapbook** — easy to add a new trip or snack, looks great, and works without any server or build step.

## Requirements

### Validated

- ✓ Interactive Leaflet map with 7 real trips parsed from GPX files — existing
- ✓ Circular disc markers (trip name + year) on overview map — existing
- ✓ Click marker → zoom in, show GPX track polylines with stage pins — existing
- ✓ Per-trip stats panel: distance, elevation gain, highest point, stage count — existing
- ✓ Inline elevation profile SVG chart — existing
- ✓ Photo carousel with placeholder art — existing
- ✓ Header with total km/elevation summary across all trips — existing
- ✓ Tweaks panel for title/theme/track-color adjustments — existing
- ✓ Earth-tone design system (Syne + Nunito + JetBrains Mono fonts, CSS custom properties) — existing
- ✓ No build toolchain — CDN React + Babel in-browser transpilation — existing

### Active

- [ ] Load real photos from `media/<trip-id>/` folder in the carousel
- [ ] Per-trip `data/<trip-id>/meta.json` files: notes text, photo filenames + captions
- [ ] Show trip notes in the stats panel (replaces placeholder blurb in data.js)
- [ ] Carousel loads actual `<img>` tags from meta.json photo list with per-photo captions
- [ ] Trail Snacks gallery page (`snacks.html`) — same visual design as map page
- [ ] Snack entries: photo, snack name, country/origin, Ben's score (1–10) + one-sentence tasting note, Janna's score (1–10) + one-sentence tasting note, average score displayed
- [ ] Snack data stored in `snacks.json` at repo root — easy to add new entries by editing the file
- [ ] Snack photos stored in `media/snacks/<snack-id>.jpg`
- [ ] Navigation between map page and snacks page (link/button in header of each)
- [ ] GitHub Pages deployment from `main` branch root → `blenback.github.io/urlaub`

### Out of Scope

- Admin or edit UI for trip data/snacks — edit JSON files directly
- User accounts or authentication — personal site, no login needed
- Server-side rendering or backend — pure static files
- Comments or social features
- Build toolchain / npm / bundler — stay CDN-only
- Custom domain — using github.io subdomain

## Context

- **Existing codebase**: 4 source files (index.html, app.jsx, data.js, tweaks-panel.jsx) + 35 GPX files in `data/` across 7 trip folders
- **GitHub remote**: `https://github.com/blenback/urlaub.git` — GitHub Pages will serve from main branch root
- **Tech constraint**: No build step — all JS served as raw files via CDN React (UMD) + Babel standalone. New pages must follow the same pattern.
- **Photo storage**: `media/<trip-id>/` folders in repo (already referenced in placeholder code). Snack photos in `media/snacks/`
- **Data files**: `data/<trip-id>/meta.json` per trip (notes, photo list); `snacks.json` at root for snack gallery
- **Users**: Ben and Janna — personal use only. No onboarding needed.

## Constraints

- **Tech stack**: CDN-only (React UMD, Leaflet, Babel standalone) — no npm, no bundler, no server
- **Simplicity**: Keep it simple — prefer editing a JSON file over building a UI for it
- **Hosting**: GitHub Pages (static only) — no server-side logic

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Per-trip meta.json instead of extending data.js | Easier to edit one trip at a time without touching the big GPX coordinate file | — Pending |
| Snack data in a single snacks.json | Snacks are flat list, no per-folder complexity needed | — Pending |
| Separate snacks.html page | Cleaner separation; map and snacks are distinct experiences | — Pending |
| Deploy from main branch root | Zero config GitHub Pages — no gh-pages branch gymnastics | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-09 after initialization*
