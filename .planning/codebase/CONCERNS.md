# Codebase Concerns

**Analysis Date:** 2026-05-09

## Tech Debt

**CDN-only dependency loading:**
- Issue: React 18.3.1, ReactDOM, Leaflet 1.9.4, and `@babel/standalone` 7.29.0 are all fetched from `unpkg.com` at runtime. SRI integrity hashes are present for all four JS scripts and the Leaflet CSS, but there is no offline fallback and no local copy of any library.
- Files: `index.html` (lines 442–447)
- Impact: A CDN outage or `unpkg.com` rate limit renders the app completely non-functional. No graceful degradation is possible with the current architecture.
- Fix approach: Run `npm install` with locked versions and serve libraries locally, or at minimum add a `<noscript>` / CDN-failure fallback message.

**Babel in-browser transpilation:**
- Issue: `@babel/standalone` (7.29.0, ~1 MB gzipped) is loaded and transforms `app.jsx` and `tweaks-panel.jsx` at runtime on every page load via `<script type="text/babel">`.
- Files: `index.html` (lines 444, 450–451)
- Impact: Cold-load parse and transform time is significant, especially on low-powered devices. This pattern is explicitly unsupported by the Babel project for production use.
- Fix approach: Add a build step (Vite or esbuild) to pre-transpile JSX to plain JS. The HTML would then load a single bundled `.js` file instead of `babel.min.js` + raw JSX files.

**`window.TRIPS` global state:**
- Issue: `data.js` assigns trip data to `window.TRIPS`, `window.totalDistance`, and `window.totalElevation`. These are read directly from `window.*` in `app.jsx` (lines 61, 382, 393, 294, 382).
- Files: `data.js` (lines 1–end), `app.jsx` (lines 61, 294, 382, 393, 396)
- Impact: Load order is critical and fragile — if `data.js` fails to load, the React app crashes with no error boundary. Any future second JS file that overwrites `window.TRIPS` silently breaks all trip rendering. Not suitable for module-based tooling.
- Fix approach: Export data as an ES module (`export const TRIPS = [...]`) and import it explicitly in `app.jsx`.

**Inline coordinate array size:**
- Issue: `data.js` is 59 KB of hand-extracted GPS coordinate arrays embedded as JS literals. Every user loads the entire dataset regardless of which trips they view.
- Files: `data.js`
- Impact: Size will grow linearly with each new trip. At current density (~8 KB per trip), the file will exceed 100 KB with 4–5 more trips added.
- Fix approach: Split into per-trip JSON files (e.g., `data/brittany/track.json`) and fetch only the active trip's data on demand. This also enables lazy loading.

**No GPX parser — manual re-extraction required:**
- Issue: GPX source files exist under `data/` subdirectories (brittany, corsica, lombardy, ruegen, sardinia, slovenia, switzerland) but are not loaded at runtime. Coordinate data was pre-extracted by hand into `data.js`. There is no automated pipeline from GPX → JS.
- Files: `data.js`, `data/` directory
- Impact: Adding or correcting a trip requires manually re-extracting coordinates. Any GPS corrections to the GPX files are silently ignored unless `data.js` is also manually updated.
- Fix approach: Write a build-time script (Node.js with `togeojson` or `gpx-parser`) that reads the GPX files and regenerates `data.js` (or per-trip JSON files) as a build step.

## Missing Data

**Four trips listed in TRIPS.md have no data folder:**
- Issue: `TRIPS.md` lists 11 trips: Austria 2024, Brittany 2023, Corsica 2022, Sardinia 2025, Ruegen 2026, Alpe Orobie 2024, Switzerland 2025, Croatia 2024, Sachsische Schweiz 2020, Bornholme 2020, Slovenia 2022. The `data/` directory contains only 7 subdirectories (brittany, corsica, lombardy, ruegen, sardinia, slovenia, switzerland).
- Missing: Austria 2024, Croatia 2024, Sachsische Schweiz 2020, Bornholme 2020 — no GPX data folder exists for any of these four trips.
- Files: `TRIPS.md`, `data/` directory
- Impact: These trips cannot be added to the map without first obtaining and processing GPX files. The trip list in `TRIPS.md` overstates coverage.
- Fix approach: Either collect GPX files for the missing trips and add them to `data/`, or mark these as planned/pending in `TRIPS.md`.

## Known Bugs / Missing Features

**No routing — browser back button broken:**
- Issue: There is no URL-based navigation. Clicking a trip marker updates React state only (`setActiveTripId`). The browser back button navigates away from the page entirely rather than returning to the overview.
- Files: `app.jsx` (lines 379–453)
- Impact: Users who drill into a trip and press back lose their context and must reload the page.
- Fix approach: Use `history.pushState` / `popstate` to reflect the active trip in the URL hash (e.g., `#trip=sar`), or adopt React Router with hash-based routing.

**Photo carousel shows only placeholder art — no real images:**
- Issue: `PhotoCarousel` generates 10 synthetic placeholder entries per trip using `Array.from({ length: 10 }, ...)`. `PhotoPlaceholder` renders SVG geometric art. There is no mechanism to load real image files. The carousel title text says "drop real images into `media/{trip.id}/` to replace" but no such loading code exists.
- Files: `app.jsx` (lines 171–249)
- Impact: The carousel is entirely non-functional as a photo gallery. All trips show identical procedurally generated art.
- Fix approach: Implement an `<img>` element with `src={media/{trip.id}/{photo.id}.jpg}` and fall back to the SVG placeholder on `onError`. Add a manifest file or naming convention so the carousel knows which images exist.

**No error handling for tile CDN failures:**
- Issue: `MapView` calls `L.tileLayer(cfg.url, ...)` with no error handler. If the CARTO tile CDN is unavailable, the map renders as a blank background with no user feedback.
- Files: `app.jsx` (lines 279–285)
- Impact: A tile CDN outage produces a silent failure — users see a blank map with no explanation.
- Fix approach: Add a `tileRef.current.on('tileerror', ...)` handler that displays a visible error banner or fallback message.

**No error handling for GPS bounds calculation:**
- Issue: `L.latLngBounds(all).pad(0.08)` in `MapView` (line 365) will throw if `all` is empty (i.e., a trip has zero stages or all stages are empty arrays). No try/catch or guard exists.
- Files: `app.jsx` (lines 319–371)
- Impact: Selecting a trip with malformed or empty stage data crashes the Leaflet map instance silently, requiring a page reload.
- Fix approach: Guard with `if (all.length === 0) return;` before calling `flyToBounds`.

## Security Considerations

**SRI hashes use development builds of React:**
- Issue: `index.html` loads `react.development.js` and `react-dom.development.js` (line 442–443) — the unminified development builds. SRI hashes lock these specific files.
- Files: `index.html` (lines 442–443)
- Impact: Development builds include extra runtime warnings, are ~3× larger than production builds, and have slightly different internal behaviour. This is not a security risk per se, but it is inappropriate for any audience beyond local development.
- Fix approach: Switch to `react.production.min.js` and `react-dom.production.min.js` with updated SRI hashes.

## Accessibility Gaps

**Map markers are non-interactive div elements:**
- Issue: `markerHtml()` returns a `<div class="trip-marker">` tree injected via `L.divIcon`. These elements have no `role`, `tabindex`, `aria-label`, or keyboard event handlers. Leaflet marker click is attached via `marker.on('click', ...)` (line 302), not on the div itself.
- Files: `app.jsx` (lines 40–48, 294–305)
- Impact: The map is entirely unusable with a keyboard. Screen readers receive no meaningful information about trip markers.
- Fix approach: Add `tabindex="0"`, `role="button"`, and `aria-label={trip.name}` to the marker div HTML, and add a `keydown` handler for Enter/Space.

## Performance Bottlenecks

**Elevation profile computation on every render:**
- Issue: `StatsPanel` computes the full elevation SVG path in a `useMemo` keyed on `[trip, showElevation]`. For trips with dense GPS tracks (hundreds of points per stage, multiple stages), `trip.allPoints` can be thousands of entries that are all mapped and math-operated in a single synchronous pass on the main thread.
- Files: `app.jsx` (lines 81–95)
- Impact: Noticeable jank when switching between trips on lower-powered devices. The SVG path string is also regenerated when `showElevation` changes, even for the same trip.
- Fix approach: Downsample `allPoints` to at most 200–300 points before computing the SVG path, or move the computation to a web worker.

**Stage distance computed inline during render:**
- Issue: `StatsPanel` recalculates the Haversine distance for every stage point on every render inside the `trip.stages.map(...)` callback (lines 148–160). This is not memoized — it runs every time the stats panel re-renders.
- Files: `app.jsx` (lines 147–164)
- Impact: For trips with many stages and dense point arrays, this is CPU-expensive work done synchronously during React's render phase.
- Fix approach: Pre-compute per-stage distances in `data.js` and store them as `stage.distance`, or wrap in `useMemo` keyed on `trip.id`.

---

*Concerns audit: 2026-05-09*
