<!-- refreshed: 2026-05-09 -->
# Architecture

**Analysis Date:** 2026-05-09

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                     index.html                              │
│   Loads CDN scripts, inlines all CSS, mounts React root     │
└───────────────────┬─────────────────────────────────────────┘
                    │  script load order (synchronous)
         ┌──────────┼──────────────────┐
         ▼          ▼                  ▼
    data.js   tweaks-panel.jsx      app.jsx
   (plain JS) (type="text/babel")  (type="text/babel")
         │          │                  │
         ▼          │                  ▼
  window.TRIPS      │         ReactDOM.createRoot
  window.total*     │              → <App />
                    ▼
         window.{useTweaks, TweaksPanel,
                 TweakSection, TweakRadio,
                 TweakColor, TweakToggle,
                 TweakText, TweakSlider, ...}

┌─────────────────────────────────────────────────────────────┐
│                        <App />                              │
│  State: activeTripId (string|null), tweaks (object)        │
├──────────────┬───────────────┬──────────────────────────────┤
│  <Header />  │  <MapView />  │  <TweaksPanel /> (always)   │
│              │  (always)     ├──────────────────────────────┤
│              │               │  when activeTripId set:      │
│              │               │  <StatsPanel />              │
│              │               │  <PhotoCarousel />           │
└──────────────┴───────────────┴──────────────────────────────┘
                    │
                    ▼  (imperative Leaflet API via useEffect + refs)
             L.map / L.tileLayer / L.polyline / L.marker
             (Leaflet 1.9.4 — global `L` from CDN)
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` | Root state owner — `activeTripId`, `tweaks`; Escape key listener | `app.jsx:379` |
| `Header` | Brand title/subtitle bar; shows trip name when active; "All trips" back button | `app.jsx:52` |
| `MapView` | Leaflet map lifecycle; tile layer swap; markers (overview) and track polylines (detail) | `app.jsx:253` |
| `StatsPanel` | Trip stats grid, inline elevation SVG profile, per-stage distance list | `app.jsx:80` |
| `PhotoCarousel` | Horizontal strip of 10 placeholder photo cards per trip; prev/next navigation | `app.jsx:171` |
| `PhotoPlaceholder` | SVG-generated landscape placeholder until real images are dropped in | `app.jsx:225` |
| `TweaksPanel` | Floating draggable settings panel; host postMessage protocol; visibility toggled by host | `tweaks-panel.jsx:186` |
| `useTweaks` | Hook — merges tweak edits into React state and forwards them to host via postMessage | `tweaks-panel.jsx:162` |

## Pattern Overview

**Overall:** No-build React UMD + Babel in-browser transpilation; data as a plain IIFE; Leaflet imperative map managed via React refs.

**Key Characteristics:**
- Zero build step — all files served directly from disk; Babel standalone transpiles JSX in the browser at load time
- Global namespace used intentionally: `window.TRIPS`, `window.totalDistance`, `window.totalElevation`, `window.useTweaks`, `window.TweaksPanel`, etc.
- Leaflet is purely imperative; React components hold Leaflet objects in `useRef` and synchronise through `useEffect`, never through React state
- Two-mode UI: overview (all trip markers on map) vs. detail (single trip — tracks + StatsPanel + PhotoCarousel)

## Layers

**Data Layer:**
- Purpose: Produce GPS track data and derived statistics; expose on `window`
- Location: `data.js`
- Contains: Inline coordinate arrays `[lat, lng, elev]` per stage, IIFE-computed stats (`distance`, `elevationGain`, `highest`, `lowest`, `stages`), `allPoints` flat array
- Depends on: Nothing (vanilla ES5 IIFE)
- Used by: `app.jsx` reads `window.TRIPS`, `window.totalDistance`, `window.totalElevation`

**Tweaks Utility Layer:**
- Purpose: Reusable edit-mode shell and form controls; host postMessage protocol
- Location: `tweaks-panel.jsx`
- Contains: `useTweaks` hook, `TweaksPanel` component, all `TweakXxx` control components; injects own CSS as a `<style>` element
- Depends on: React (global `React`)
- Used by: `app.jsx` via globals; panel instances in other prototypes (generic library)
- Exports via: `Object.assign(window, { useTweaks, TweaksPanel, ... })` at bottom of file (`tweaks-panel.jsx:564`)

**UI/Application Layer:**
- Purpose: Full interactive trip viewer
- Location: `app.jsx`
- Contains: All React components (`App`, `Header`, `MapView`, `StatsPanel`, `PhotoCarousel`, `PhotoPlaceholder`), tile URL config, tweak defaults
- Depends on: `window.TRIPS` (data layer), `window.useTweaks`/`window.TweaksPanel` (tweaks layer), global `L` (Leaflet), global `React`/`ReactDOM`

## Data Flow

### Application Startup

1. Browser parses `index.html` — loads CDN scripts (React 18.3.1, ReactDOM 18.3.1, Babel 7.29.0, Leaflet 1.9.4) (`index.html:442-447`)
2. `data.js` executes as plain `<script>` — IIFE runs, populates `window.TRIPS`, `window.totalDistance`, `window.totalElevation` (`data.js:157-160`)
3. `tweaks-panel.jsx` transpiled by Babel — registers all tweak globals on `window` (`tweaks-panel.jsx:564`)
4. `app.jsx` transpiled by Babel — calls `ReactDOM.createRoot(...).render(<App />)` (`app.jsx:453`)

### Overview → Detail Flow

1. `App` initialises: `activeTripId = null`, `tweaks = TWEAK_DEFAULTS`
2. `MapView` mounts — creates Leaflet map instance stored in `mapRef.current` (`app.jsx:259`)
3. `MapView` useEffect (deps: `[activeTrip]`) renders one `L.marker` per trip from `window.TRIPS`; click handler calls `onSelectTrip(trip)` → `App.setActiveTripId(trip.id)` (`app.jsx:294-305`)
4. `activeTripId` update triggers re-render:
   - `MapView` clears markers, draws polyline halo+track per stage, flies to bounds (`app.jsx:307-373`)
   - `StatsPanel` and `PhotoCarousel` mount with `activeTrip` prop
5. Back navigation: header "All trips" button or Escape key → `setActiveTripId(null)` → map flies back to overview, panels unmount

### Tweaks Flow

1. `useTweaks(TWEAK_DEFAULTS)` returns `[tweaks, setTweak]` (`app.jsx:380`)
2. User changes control in `TweaksPanel` → `setTweak('key', value)` called
3. `useTweaks.setTweak` updates local React state AND posts `__edit_mode_set_keys` to `window.parent` (host rewrites the `/*EDITMODE-BEGIN*/…/*EDITMODE-END*/` block in `app.jsx`) (`tweaks-panel.jsx:171`)
4. React re-renders propagate new `tweaks` object to `MapView` (tile theme, track colour), `Header` (title, subtitle), `StatsPanel` (showElevation)

**State Management:**
- `activeTripId` (`string | null`): owned by `App`, passed down as derived `activeTrip` object
- `tweaks` (`object`): owned by `App` via `useTweaks`; keys match `TWEAK_DEFAULTS` (`app.jsx:7-13`)
- `PhotoCarousel.idx` (`number`): local to carousel component
- Leaflet map objects: held in `useRef`, never in React state

## Key Abstractions

**TRIPS Array:**
- Purpose: Single source of truth for all trip data
- Structure: Each entry has `id`, `name`, `year`, `country`, `hub`, `blurb`, `months`, `color`, `stages` (array of arrays of `[lat, lng, elev]` tuples), and computed `stats`/`allPoints`
- Location: `data.js:2` (defined), `data.js:131-155` (stats computed)

**Tweak Defaults / EDITMODE block:**
- Purpose: Persisted configuration that a host tool can rewrite on disk
- Location: `app.jsx:7-13` — delimited by `/*EDITMODE-BEGIN*/` and `/*EDITMODE-END*/` comments so the host can surgically overwrite just the JSON object

**TILE_URLS map:**
- Purpose: Maps `mapTheme` tweak values to Leaflet tile provider config
- Location: `app.jsx:20-36`
- Values: `voyager`, `positron`, `watercolor` (all CartoCDN)

## Entry Points

**`index.html`:**
- Location: `index.html`
- Triggers: Browser opens file / dev server serves it
- Responsibilities: Loads all CDN dependencies, inlines full CSS, defines `<div id="root">`, loads `data.js` then `tweaks-panel.jsx` then `app.jsx` in dependency order

## Architectural Constraints

- **Threading:** Single-threaded browser JS; no workers
- **Global state:** `window.TRIPS`, `window.totalDistance`, `window.totalElevation` written once at load time by `data.js`; tweak globals written once by `tweaks-panel.jsx`
- **Script load order is critical:** `data.js` must execute before `app.jsx`; `tweaks-panel.jsx` must execute before `app.jsx`. Order is enforced by DOM order in `index.html:449-451`
- **No module system:** `import`/`export` are not used anywhere. All inter-file communication is via `window`
- **Leaflet version pin:** `1.9.4` with SRI hash (`index.html:445-447`); Leaflet tiles all use CartoCDN

## Anti-Patterns

### Global window pollution for inter-file API
**What happens:** `tweaks-panel.jsx` assigns a dozen symbols onto `window` so `app.jsx` can use them without `import` (`tweaks-panel.jsx:564-568`)
**Why it's wrong:** No static analysis, no tree-shaking, name-collision risk, load-order dependency implicit
**Do this instead:** If a build step is ever added, convert to ES module exports and import in `app.jsx`

### In-browser Babel transpilation
**What happens:** `<script type="text/babel">` causes Babel Standalone to parse and compile JSX in the user's browser on every page load (`index.html:444,450-451`)
**Why it's wrong:** Slow first paint, ships the full Babel runtime to every client (~1 MB)
**Do this instead:** Add a one-command build step (e.g. `esbuild`) that pre-compiles JSX to plain JS

### Photo placeholders with hardcoded captions
**What happens:** `PhotoCarousel` generates 10 synthetic photos with hardcoded captions and SVG art, ignoring any real image files (`app.jsx:174-187`)
**Why it's wrong:** Placeholder UI ships in production; adding real images requires code changes (or the `media/{trip.id}/` convention documented in the caption text is never enforced)
**Do this instead:** Scan `media/{trip.id}/` at build time or serve a manifest, then fall back to placeholder when no images exist

## Error Handling

**Strategy:** None — no try/catch, no error boundaries.

**Patterns:**
- Missing trips: `activeTrip` will be `null` if `activeTripId` is set to an ID not found in `window.TRIPS`; the conditional render in `App` handles `null` gracefully (`app.jsx:406`)
- Bad GPS data: Leaflet will throw if a stage array is empty; no guard exists in `MapView`

## Cross-Cutting Concerns

**Logging:** None — no `console.log` calls in production paths
**Validation:** None — GPS data is trusted as correct inline literals
**Authentication:** Not applicable — static file with no server

---

*Architecture analysis: 2026-05-09*
