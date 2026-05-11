# Requirements: Wanderlog

**Defined:** 2026-05-09
**Core Value:** The map and snack gallery feel like a living travel scrapbook — easy to add a new trip or snack, looks great, works without a server.

## v1 Requirements

### Trip Media

- [x] **MEDIA-01**: Carousel loads real `<img>` elements from `media/<trip-id>/` folder using filenames listed in meta.json
- [x] **MEDIA-02**: Each carousel photo displays its per-photo caption from meta.json
- [x] **MEDIA-03**: When no meta.json or photos exist for a trip, placeholder SVG art is shown (backward compatible)

### Trip Data

- [x] **DATA-01**: Each trip can have a `data/<trip-id>/meta.json` file containing: notes text, photo list (filename + caption), and an optional display title override
- [x] **DATA-02**: Trip notes from meta.json appear in the stats panel (replacing the hardcoded blurb in data.js)
- [x] **DATA-03**: Stats panel falls back to the data.js blurb when no meta.json exists

### GPX Data Pipeline

- [x] **GPX-01**: Each trip's `data/<trip-id>/meta.json` declares the GPX stage files for that trip (e.g., `"gpx_stages": ["stage1.gpx", "stage2.gpx"]`)
- [ ] **GPX-02**: A build script (e.g., `scripts/build_data.py`) reads all `data/<trip-id>/meta.json` files, parses the referenced GPX files, and writes a new `data.js`
- [ ] **GPX-03**: The map renders all 7 trips correctly after regenerating `data.js` from GPX sources (tracks, stats, elevation profiles unchanged)
- [x] **GPX-04**: Adding a new trip requires only creating `data/<trip-id>/meta.json` with GPX paths and running the build script — no manual `data.js` editing

### Snack Gallery

- [ ] **SNCK-01**: A `snacks.html` page exists with the same visual design as the map page (fonts, colors, CSS variables)
- [ ] **SNCK-02**: Snack gallery renders entries in a responsive grid — photo, snack name, country/origin
- [ ] **SNCK-03**: Each snack entry shows Ben's score (1–10) and one-sentence tasting note
- [ ] **SNCK-04**: Each snack entry shows Janna's score (1–10) and one-sentence tasting note
- [ ] **SNCK-05**: Each snack entry displays the average of Ben and Janna's scores
- [ ] **SNCK-06**: All snack data lives in `snacks.json` at repo root — adding a new snack means editing one file
- [ ] **SNCK-07**: Snack photos are stored in `media/snacks/` and referenced by filename in snacks.json

### Navigation

- [ ] **NAV-01**: Map page (index.html) has a visible link to the Snacks page (snacks.html)
- [ ] **NAV-02**: Snacks page has a visible link back to the Map page

### Deployment

- [ ] **DEPL-01**: GitHub Pages is enabled on `blenback/wanderlog`, serving from the main branch root
- [ ] **DEPL-02**: Site is publicly accessible at `https://blenback.github.io/wanderlog`
- [ ] **DEPL-03**: All asset paths work correctly under the `/wanderlog` sub-path (no broken links)

## v2 Requirements

### Trip Coverage

- **TRIPS-01**: Add the 4 trips currently in TRIPS.md but missing GPX data (Austria 2024, Croatia 2024, Sachsische Schweiz 2020, Bornholme 2020)

### Snack Gallery — Enhanced

- **SNCK-08**: Filter snacks by country or average rating
- **SNCK-09**: Sort snacks by Ben's score, Janna's score, or average

## Out of Scope

| Feature | Reason |
|---------|--------|
| Admin / edit UI | Editing JSON files directly is sufficient for a personal site |
| User authentication | Personal site — no logins needed |
| Server-side rendering | Static site constraint |
| Build toolchain / bundler | Keep CDN-only approach — no npm |
| Custom domain | github.io subdomain is sufficient |
| Comments or social features | Not a public-facing app |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| *(Phase 1 baseline — interactive map, GPX tracks, stats, carousel, tweaks)* | Phase 1 | Complete |
| MEDIA-01 | Phase 2 | Complete (02-01) |
| MEDIA-02 | Phase 2 | Complete (02-01) |
| MEDIA-03 | Phase 2 | Complete (02-01) |
| DATA-01 | Phase 2 | Complete (02-01) |
| DATA-02 | Phase 2 | Complete (02-01) |
| DATA-03 | Phase 2 | Complete (02-01) |
| GPX-01 | Phase 2.1 | Complete (02.1-01) |
| GPX-02 | Phase 2.1 | Pending |
| GPX-03 | Phase 2.1 | Pending |
| GPX-04 | Phase 2.1 | Complete (02.1-01) |
| SNCK-01 | Phase 3 | Pending |
| SNCK-02 | Phase 3 | Pending |
| SNCK-03 | Phase 3 | Pending |
| SNCK-04 | Phase 3 | Pending |
| SNCK-05 | Phase 3 | Pending |
| SNCK-06 | Phase 3 | Pending |
| SNCK-07 | Phase 3 | Pending |
| NAV-01 | Phase 3 | Pending |
| NAV-02 | Phase 3 | Pending |
| DEPL-01 | Phase 4 | Pending |
| DEPL-02 | Phase 4 | Pending |
| DEPL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 22 total (18 original + 4 GPX pipeline added 2026-05-09)
- Mapped to phases: 22
- Unmapped: 0 ✓
- Phase 1 baseline: Complete (validated 2026-05-09)

---
*Requirements defined: 2026-05-09*
*Last updated: 2026-05-09 — GPX-01/02/03/04 added for Phase 2.1 (GPX Data Pipeline insertion)*
