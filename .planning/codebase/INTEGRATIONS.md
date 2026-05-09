# External Integrations

**Analysis Date:** 2026-05-09

## Map Tile Provider — CartoCDN

Map tiles come from CARTO's public raster tile service. Three themes are
configured in `app.jsx` in the `TILE_URLS` object:

```javascript
const TILE_URLS = {
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    sub: 'abcd'
  },
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    sub: 'abcd'
  },
  watercolor: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    sub: 'abcd'
  }
};
```

| Theme key | CARTO style path | Labels |
|---|---|---|
| `voyager` | `rastertiles/voyager_nolabels` | No labels |
| `positron` | `light_nolabels` | No labels |
| `watercolor` | `rastertiles/voyager` | Labels included |

**Subdomains:** `a`, `b`, `c`, `d` — Leaflet rotates among them automatically
via `{s}` in the URL template.

**Retina tiles:** `{r}` resolves to `@2x` on high-DPI screens (handled by
Leaflet).

**Max zoom:** configured as `19` in the `L.tileLayer` call in `app.jsx` (line
~280), though the map UI caps user zoom at `14`.

**Authentication:** None. CARTO's public basemaps require no API key.

**Attribution:** `&copy; OpenStreetMap &copy; CARTO` — displayed by Leaflet's
attribution control (bottom-left, styled in `index.html`).

**Additional CSS filter processing:** Each theme's tiles are further tinted with
a CSS `filter` applied to `.leaflet-tile-pane` (sepia + saturation + hue-rotate
combinations) to match the warm off-white colour palette. See `STACK.md` for
the exact filter values.

## Google Fonts API

Font assets are loaded from Google's font delivery infrastructure.

**Preconnect hints** (in `index.html`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

**Font request URL:**
```
https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800
  &family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600
  &family=JetBrains+Mono:wght@400;500&display=swap
```

Fonts loaded: Syne (display), Nunito (body), JetBrains Mono (monospace).
No API key required for Google Fonts CSS API v2.

## CDN — unpkg.com

All JavaScript and CSS library assets are served from `https://unpkg.com` with
subresource integrity (SRI) verification:

| Asset | Integrity algorithm |
|---|---|
| `react@18.3.1` | SHA-384 |
| `react-dom@18.3.1` | SHA-384 |
| `@babel/standalone@7.29.0` | SHA-384 |
| `leaflet@1.9.4` JS | SHA-256 |
| `leaflet@1.9.4` CSS | SHA-256 |

All tags use `crossorigin="anonymous"`. The browser will block execution if
any asset hash mismatches.

## GPX Data — Format and Folder Structure

GPX files are the source of truth for route geometry. They are **not loaded at
runtime** by the application. Instead, coordinates were extracted from GPX files
and baked into `data.js` as a JavaScript object literal. At runtime the browser
loads `data.js` as a plain `<script>` tag, which sets `window.TRIPS`.

**GPX storage path:** `data/<region-folder>/<timestamp>_<title>.gpx`

**7 trip folders, 35 GPX files:**

| Folder | Files | Corresponding app trip |
|---|---|---|
| `data/brittany/` | 6 | `bia` — Belle-Ile & Brittany (France, May 2023) |
| `data/corsica/` | 3 | `rab` — Rab Island (Croatia, Oct 2023) *(folder name mismatch)* |
| `data/lombardy/` | 2 | `oro` — Alpe Orobie (Lombardy, June 2024) |
| `data/ruegen/` | 5 | not yet in `TRIPS` array — newest files (May 2026) |
| `data/sardinia/` | 9 | `sar` — Via Ogliastra (Sardinia, Sep 2025) |
| `data/slovenia/` | 5 | `slo` — Slovenia (Jun & Aug 2022) |
| `data/switzerland/` | 5 | `swi` (or similar) — Alps / Engadin (2025) |

**Coordinate format in `data.js`:** Each stage is an array of `[lat, lng, elevMetres]`
tuples. Elevation is an integer in metres above sea level. Example:

```javascript
stages: [
  [ [48.31527, -4.54874, 17], [48.3258, -4.55197, 65], ... ],
  [ [47.34694, -3.15401, 22], ... ],
  ...
]
```

The `allPoints` computed property (referenced in `app.jsx` `StatsPanel`) is a
flat array of all stage points for elevation profile generation.

**GPX files are committed to the repo** but are not parsed at runtime. They
serve as archival source data only.

## Leaflet — Map Library Protocol

Leaflet (`L`) is used directly (imperative API, no React-Leaflet wrapper). Key
integration points in `app.jsx`:

- **Map init:** `L.map(el, options)` inside a `useEffect` with empty deps —
  runs once on mount.
- **Tile layer:** `L.tileLayer(url, options).addTo(map)` — replaced on each
  `tweaks.mapTheme` change.
- **Track polylines:** `L.polyline(latlngs, style).addTo(map)` — a white halo
  polyline + a coloured track polyline per stage.
- **Markers:** `L.divIcon` with raw HTML strings for trip overview bubbles and
  stage-number pins.
- **Bounds fitting:** `map.flyToBounds(bounds, opts)` with `paddingBottomRight`
  accounting for the stats panel width (400 px) and carousel height (230 px).
- **Map reference:** stored in `mapRef` (React ref), never in React state.

## postMessage Protocol — Tweaks Panel / Host Integration

`tweaks-panel.jsx` implements a bidirectional `window.postMessage` protocol that
lets an external host (e.g., a prototype-viewer shell) control the tweaks panel
and persist edits to disk. The protocol is documented in comments at the top of
`tweaks-panel.jsx`.

### Messages the panel **sends** (to `window.parent`):

| Message type | When sent | Payload |
|---|---|---|
| `__edit_mode_available` | On panel mount | none |
| `__edit_mode_set_keys` | On any tweak change | `{ edits: { key: value, ... } }` |
| `__edit_mode_dismissed` | When user clicks ✕ close button | none |

### Messages the panel **receives** (from `window`):

| Message type | Effect |
|---|---|
| `__activate_edit_mode` | Shows the panel (`setOpen(true)`) |
| `__deactivate_edit_mode` | Hides the panel (`setOpen(false)`) |
| `__omelette_rail_enabled` | Enables the deck rail toggle UI element |

### Same-window custom event:

When a tweak changes, a `CustomEvent('tweakchange', { detail: edits })` is also
dispatched on `window`. This allows in-page listeners (e.g. deck-stage
thumbnail rails) to react without going through the parent frame.

### EDITMODE block convention:

The `TWEAK_DEFAULTS` object in `app.jsx` is bracketed by magic comments:

```javascript
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "title": "WANDERLOG",
  ...
}/*EDITMODE-END*/;
```

A host that receives `__edit_mode_set_keys` can rewrite the content between
these markers on disk to persist tweaks across page reloads.

### Deck rail messages (optional, auto-detected):

If a `<deck-stage>` custom element is present in the DOM, the tweaks panel
exposes a "Thumbnail rail" toggle. State is read from / written to
`localStorage` key `deck-stage.railVisible` and propagated via
`window.postMessage({ type: '__deck_rail_visible', on: boolean }, '*')`.

---

*Integration audit: 2026-05-09*
