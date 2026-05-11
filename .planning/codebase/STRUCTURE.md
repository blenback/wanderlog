# Codebase Structure

**Analysis Date:** 2026-05-09

## Directory Layout

```
wanderlog/                         # Project root — also the web root
├── index.html                  # Single HTML entry point; all CSS inlined; script load order
├── app.jsx                     # React application (Babel-transpiled in browser)
├── tweaks-panel.jsx            # Generic tweaks shell + controls (Babel-transpiled in browser)
├── data.js                     # Trip GPS data + derived stats IIFE; populates window.TRIPS
├── TRIPS.md                    # Human-readable trip reference / planning notes
├── data/                       # Raw GPX files organised by trip id
│   ├── brittany/               # id: bia — Belle-Île & Brittany (France, 2023)
│   ├── corsica/                # id: rab — Rab Island (Croatia, 2023) [folder named corsica]
│   ├── lombardy/               # id: oro — Alpe Orobie (Lombardy, 2024)
│   ├── ruegen/                 # id: rue — Rügen (Germany, 2026)
│   ├── sardinia/               # id: sar — Via Ogliastra (Sardinia, 2025)
│   ├── slovenia/               # id: slo — Slovenia (2022)
│   └── switzerland/            # id: swi — Switzerland (2025)
├── .planning/                  # GSD planning workspace (not served)
│   └── codebase/               # Codebase map documents
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md
├── .claude/                    # Claude Code project settings
│   └── settings.json
└── .git/                       # Git repository
```

## Directory Purposes

**Project Root (`/`):**
- Purpose: Web root — every file here is directly browser-accessible; no dist or build directory
- Contains: The three source files that constitute the entire application
- Key files: `index.html`, `app.jsx`, `tweaks-panel.jsx`, `data.js`

**`data/`:**
- Purpose: Source GPX files from Komoot/similar apps; one subdirectory per trip
- Contains: `.gpx` files only; not loaded by the app at runtime (data has already been extracted and inlined into `data.js` as coordinate arrays)
- Naming convention: `YYYY-MM-DD_<numeric-id>_<human-readable-title>.gpx`
- Note: The folder names (`brittany`, `corsica`, etc.) do not all match the trip `id` fields used in `data.js` (`bia`, `rab`, etc.)

**`.planning/codebase/`:**
- Purpose: GSD codebase map — consumed by `/gsd-plan-phase` and `/gsd-execute-phase`
- Generated: Yes (by GSD mapper)
- Committed: Yes (planning artifacts are tracked)

**`.claude/`:**
- Purpose: Claude Code project configuration
- Contains: `settings.json` with project-level Claude settings
- Committed: Yes

## Key File Locations

**Entry Point:**
- `index.html`: Browser entry point; loads CDN dependencies; mounts `<div id="root">`; inline CSS (~420 lines); load order: `data.js` → `tweaks-panel.jsx` → `app.jsx`

**Data:**
- `data.js`: IIFE that defines `TRIPS` array with inline GPS coordinates and computes derived stats; exposes `window.TRIPS`, `window.totalDistance`, `window.totalElevation`

**Core Application Logic:**
- `app.jsx`: All React components — `App`, `Header`, `MapView`, `StatsPanel`, `PhotoCarousel`, `PhotoPlaceholder`; tile URL map; `TWEAK_DEFAULTS` constant

**Reusable Utility:**
- `tweaks-panel.jsx`: `useTweaks` hook; `TweaksPanel` shell; all `TweakXxx` controls (`TweakSection`, `TweakRow`, `TweakSlider`, `TweakToggle`, `TweakRadio`, `TweakSelect`, `TweakText`, `TweakNumber`, `TweakColor`, `TweakButton`); self-contained CSS string; host postMessage protocol

**Trip Reference:**
- `TRIPS.md`: Human-readable trip list (not used by the application)

**Raw GPS Source:**
- `data/*/`: GPX files per trip — used for manual extraction into `data.js`, not loaded at runtime

## Naming Conventions

**Files:**
- Source files: lowercase with hyphens (`tweaks-panel.jsx`, `data.js`, `index.html`)
- Planning docs: UPPERCASE (`ARCHITECTURE.md`, `STRUCTURE.md`)
- GPX files: `YYYY-MM-DD_<numeric-id>_<descriptive title>.gpx`

**Directories:**
- Data folders: lowercase geographic names (`brittany`, `sardinia`, etc.)
- Planning folders: lowercase (`codebase/`)

**React Components:**
- PascalCase function names: `App`, `Header`, `MapView`, `StatsPanel`, `PhotoCarousel`
- Tweak controls prefixed: `TweakSection`, `TweakRadio`, `TweakColor`, etc.

**CSS Classes:**
- Scoped with `ta-` prefix for application styles: `ta-app`, `ta-header`, `ta-map`, `ta-stats`, `ta-carousel`
- Scoped with `twk-` prefix for tweaks panel styles: `twk-panel`, `twk-hd`, `twk-body`, `twk-seg`
- Scoped with `trip-marker-` prefix for Leaflet marker HTML

**Trip IDs (in `data.js`):**
- Short three-letter slugs: `bia`, `rab`, `oro`, `sar`, `slo`, `swi`, `rue`

## Where to Add New Code

**New Trip:**
1. Add GPX files to `data/<tripname>/`
2. Add a new trip object to the `TRIPS` array in `data.js` — include `id`, `name`, `year`, `country`, `hub` (lat/lng), `blurb`, `months`, `color`, and `stages` (array of coordinate arrays `[lat, lng, elev]`)
3. The IIFE at the end of `data.js` automatically computes `stats` and `allPoints`

**New UI Component:**
- Add to `app.jsx` as a named function before `App`
- Follow the `ta-` CSS class prefix; add styles in the `<style>` block in `index.html`
- If the component needs tweaks integration, use `tweaks` prop passed down from `App`

**New Tweak Control:**
- Add to `tweaks-panel.jsx` following the `TweakXxx` pattern
- Export via the `Object.assign(window, {...})` block at `tweaks-panel.jsx:564`
- Add the new key to `TWEAK_DEFAULTS` in `app.jsx:7-13`
- Wire into the `<TweaksPanel>` JSX in `App` at `app.jsx:413-448`

**New Map Tile Theme:**
- Add an entry to `TILE_URLS` in `app.jsx:20-36`
- Add the theme name string to `THEME_OPTIONS` in `app.jsx:17`
- The `TweakRadio` for tile theme at `app.jsx:428-432` will pick it up automatically if it fits the segmented control width limit

**Shared CSS Variables:**
- Defined in `:root` inside `index.html:17-34`
- Variables: `--green`, `--green-deep`, `--tan`, `--tan-deep`, `--offwhite`, `--offwhite-2`, `--yellow`, `--blue`, `--ink`, `--rule`, `--rule-strong`, `--shadow-soft`, `--shadow-card`, `--serif`, `--display`, `--mono`

## Special Directories

**`data/`:**
- Purpose: Source GPX archives, one folder per trip
- Generated: No (manually collected from Komoot)
- Committed: Yes
- Runtime use: None — coordinates are pre-extracted into `data.js`

**`.planning/`:**
- Purpose: GSD planning workspace
- Generated: Partially (codebase docs generated by GSD mapper)
- Committed: Yes

**No `dist/`, `build/`, or `node_modules/`:**
- There is no build step. All files are served exactly as written. Babel transpilation happens in the browser via `<script type="text/babel">`.

---

*Structure analysis: 2026-05-09*
