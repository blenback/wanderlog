# Technology Stack

**Analysis Date:** 2026-05-09

## Languages

**Primary:**
- JavaScript (ES2020+) — all application logic in `app.jsx`, `tweaks-panel.jsx`, `data.js`
- JSX — component markup syntax in `app.jsx` and `tweaks-panel.jsx`

**Markup / Style:**
- HTML5 — single entry point `index.html`
- CSS — embedded in `index.html` `<style>` block (no external stylesheet files)

## Runtime

**Environment:**
- Browser only — no Node.js, no server, no build step
- Files are served statically and opened directly in a browser

**Package Manager:**
- None — all dependencies loaded via CDN `<script>` tags
- No `package.json`, no lockfile, no `node_modules`

## JSX Transpilation

Babel Standalone transpiles JSX in the browser at page-load time. There is no
compile step. The mechanism is:

1. `<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js">` is
   loaded from CDN (integrity-checked, see INTEGRATIONS.md).
2. Application scripts declare `type="text/babel"`:
   ```html
   <script type="text/babel" src="tweaks-panel.jsx"></script>
   <script type="text/babel" src="app.jsx"></script>
   ```
3. Babel Standalone intercepts those script tags and transpiles JSX → plain JS
   in the browser before execution. No build artifacts are produced.

## CDN-Loaded Libraries

All libraries arrive via `https://unpkg.com` with SRI integrity hashes.

| Library | Version | CDN URL | Purpose |
|---|---|---|---|
| React | 18.3.1 | `https://unpkg.com/react@18.3.1/umd/react.development.js` | UI component runtime |
| ReactDOM | 18.3.1 | `https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js` | DOM rendering |
| Babel Standalone | 7.29.0 | `https://unpkg.com/@babel/standalone@7.29.0/babel.min.js` | In-browser JSX transpilation |
| Leaflet | 1.9.4 | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` | Interactive map |
| Leaflet CSS | 1.9.4 | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` | Leaflet default styles |

All `<script>` tags carry `crossorigin="anonymous"` and `integrity="sha384-..."` /
`integrity="sha256-..."` attributes for subresource integrity.

React and ReactDOM use the **development** (non-minified) UMD builds. They are
available as the globals `React` and `ReactDOM`. Leaflet is available as the
global `L`. Babel Standalone is available as `Babel`.

## Font Stack

Loaded from Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`) with
`<link rel="preconnect">` pre-warming:

```html
https://fonts.googleapis.com/css2?
  family=Syne:wght@600;700;800
  &family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600
  &family=JetBrains+Mono:wght@400;500
  &display=swap
```

Three CSS custom properties map logical roles to font families (defined in
`:root` in `index.html`):

| Variable | Value | Role |
|---|---|---|
| `--display` | `'Syne', 'Helvetica Neue', sans-serif` | Headings, brand title, stat numbers |
| `--serif` | `'Nunito', 'Helvetica Neue', sans-serif` | Body text, UI labels (misnamed: Nunito is sans-serif) |
| `--mono` | `'JetBrains Mono', ui-monospace, monospace` | Overlines, data tags, attribution |

## CSS Approach

**Methodology:** Flat BEM-like class names with a `ta-` prefix for app
components (e.g., `.ta-header`, `.ta-stats`, `.ta-carousel`). Tweaks-panel
uses a `twk-` prefix, defined as an injected `<style>` string inside
`tweaks-panel.jsx`.

**Custom Properties (design tokens)** — all defined on `:root` in `index.html`:

```css
:root {
  --green: #586048;
  --green-deep: #3f4634;
  --tan: #d1af82;
  --tan-deep: #b88a4a;
  --offwhite: #F7F7EF;
  --offwhite-2: #efece1;
  --yellow: #FFC806;
  --blue: #ddeaf1;
  --ink: #222222;
  --rule: rgba(88, 96, 72, 0.18);
  --rule-strong: rgba(88, 96, 72, 0.4);
  --shadow-soft: 0 6px 22px rgba(58, 50, 30, 0.10);
  --shadow-card: 0 18px 48px rgba(58, 50, 30, 0.18);
  --serif: 'Nunito', 'Helvetica Neue', sans-serif;
  --display: 'Syne', 'Helvetica Neue', sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

**No CSS framework** (no Tailwind, Bootstrap, etc.). All styles are hand-authored.

**Map theme CSS filters** — three named tile themes apply CSS `filter` to
`.leaflet-tile-pane` via `[data-theme]` attribute selectors on `.ta-map`:

```css
.ta-map[data-theme="voyager"]   .leaflet-tile-pane { filter: sepia(0.18) saturate(0.85) ... }
.ta-map[data-theme="positron"]  .leaflet-tile-pane { filter: sepia(0.25) saturate(0.6)  ... }
.ta-map[data-theme="watercolor"] .leaflet-tile-pane { filter: sepia(0.32) saturate(1.05) ... }
```

## No Build Toolchain

There is no Vite, webpack, Rollup, esbuild, TypeScript compiler, or similar.
The project has:
- No `package.json`
- No `tsconfig.json`
- No `*.config.*` files
- No `node_modules/`
- No `.nvmrc` / `.node-version`

The app runs by opening `index.html` in a browser or serving the directory
with any static file server.

---

*Stack analysis: 2026-05-09*
