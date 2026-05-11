# Roadmap: Wanderlog

## Overview

The interactive map app is already live with 7 real trips. Three phases of active work complete the v1 vision: real photos and notes in the trip carousel (Phase 2), a Trail Snacks gallery page (Phase 3), and public deployment on GitHub Pages (Phase 4). All new pages follow the existing no-build CDN pattern — no toolchain changes.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Core Map App** - Interactive Leaflet map with 7 trips — already complete
- [x] **Phase 2: Trip Photos & Notes** - Load real images and meta.json trip notes into the map app
- [x] **Phase 2.1: GPX Data Pipeline** (INSERTED) - Replace hardcoded data.js coordinate arrays with a script that generates track data from GPX files referenced in meta.json
- [x] **Phase 3: Trail Snacks Gallery** - New snacks.html page with rated snack entries and cross-page navigation
- [x] **Phase 4: GitHub Pages Deployment** - Publish the site publicly at blenback.github.io/wanderlog

## Phase Details

### Phase 1: Core Map App
**Goal**: Ben and Janna can explore all their hiking trips on an interactive map with GPX tracks, stats, and elevation profiles
**Depends on**: Nothing (first phase)
**Requirements**: (pre-existing — no v1 requirement IDs assigned)
**Success Criteria** (what must be TRUE):
  1. Interactive Leaflet map shows all 7 trips as circular disc markers
  2. Clicking a marker zooms in and renders the GPX track with stage pins
  3. Stats panel displays distance, elevation gain, highest point, and stage count
  4. Inline elevation profile SVG is visible in the stats panel
  5. Photo carousel renders (with placeholder art) and is navigable
**Plans**: Complete (existing codebase validated 2026-05-09)

### Phase 2: Trip Photos & Notes
**Goal**: The trip carousel shows real photos with captions and the stats panel displays actual trip notes from per-trip JSON files
**Depends on**: Phase 1
**Requirements**: MEDIA-01, MEDIA-02, MEDIA-03, DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. Selecting a trip with a meta.json loads its real photos into the carousel as `<img>` elements
  2. Each carousel photo shows its caption from meta.json
  3. Selecting a trip with no meta.json still shows the SVG placeholder art (no broken UI)
  4. The stats panel shows trip notes text sourced from meta.json when available
  5. The stats panel falls back to the data.js blurb when no meta.json exists
**Plans**: 2 plans
Plans:
- [x] 02-01-PLAN.md — app.jsx meta fetch pipeline and PhotoCarousel real-image mode
- [x] 02-02-PLAN.md — sample data scaffolding (data/bia/meta.json + media/bia/)
**UI hint**: yes

### Phase 2.1: GPX Data Pipeline (INSERTED)
**Goal**: Trip tracks load from individual GPX files specified in meta.json instead of hardcoded coordinate arrays in data.js. Adding a new trip means adding a meta.json with GPX file paths — no manual data.js editing required.
**Depends on**: Phase 2
**Requirements**: GPX-01, GPX-02, GPX-03, GPX-04
**Success Criteria** (what must be TRUE):
  1. Each trip's meta.json can declare the GPX stage files for that trip (relative paths inside `data/<trip-id>/`)
  2. A build script reads all `data/<trip-id>/meta.json` files, parses the referenced GPX files, and regenerates `data.js`
  3. The map renders all 7 trips identically after regenerating `data.js` from GPX sources
  4. Adding a new trip requires only creating `data/<trip-id>/meta.json` (with GPX paths) and running the script — no manual data.js editing
**Plans**: 2 plans
Plans:
- [x] 02.1-01-PLAN.md — create/extend meta.json for all 7 trips with gpx_stages arrays
- [x] 02.1-02-PLAN.md — write scripts/build_data.py, run it, verify map renders correctly

### Phase 3: Trail Snacks Gallery
**Goal**: Ben and Janna can browse their rated trail snacks on a dedicated gallery page that shares the same design as the map page, with navigation between both pages
**Depends on**: Phase 2.1
**Requirements**: SNCK-01, SNCK-02, SNCK-03, SNCK-04, SNCK-05, SNCK-06, SNCK-07, NAV-01, NAV-02
**Success Criteria** (what must be TRUE):
  1. snacks.html loads and renders a responsive grid of snack cards matching the map page visual style
  2. Each snack card shows photo, name, country/origin, Ben's score + tasting note, Janna's score + tasting note, and average score
  3. Adding a new snack requires only editing snacks.json — no code changes
  4. Snack photos are served from media/snacks/ and render correctly
  5. A navigation link in each page header lets Ben and Janna switch between the map and snacks pages
**Plans**: 2 plans
Plans:
- [x] 03-01-PLAN.md — snacks.html + snacks.jsx gallery page (sorted by joint score)
- [x] 03-02-PLAN.md — snacks.json sample data + Trail Snacks nav link in map header
**UI hint**: yes

### Phase 4: GitHub Pages Deployment
**Goal**: The site is publicly accessible at blenback.github.io/wanderlog with all assets loading correctly under the /wanderlog sub-path
**Depends on**: Phase 3
**Requirements**: DEPL-01, DEPL-02, DEPL-03
**Success Criteria** (what must be TRUE):
  1. GitHub Pages is enabled on the blenback/wanderlog repo serving from the main branch root
  2. The site loads without errors at https://blenback.github.io/wanderlog
  3. All assets (GPX data, photos, fonts, CDN scripts) load without broken links under the /wanderlog sub-path
**Plans**: 1 plan
Plans:
- [x] 04-01-PLAN.md — push main to GitHub, enable Pages from repo settings, verify

## Progress

**Execution Order:**
Phases execute in numeric order: 2.1 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Map App | -/- | Complete | 2026-05-09 |
| 2. Trip Photos & Notes | 2/2 | Complete | 2026-05-09 |
| 2.1. GPX Data Pipeline | 2/2 | Complete | 2026-05-09 |
| 3. Trail Snacks Gallery | 2/2 | Complete | 2026-05-11 |
| 4. GitHub Pages Deployment | 1/1 | Complete | 2026-05-11 |
