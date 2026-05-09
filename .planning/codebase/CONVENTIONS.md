# Coding Conventions

**Analysis Date:** 2026-05-09

## Naming Patterns

**Files:**
- `.jsx` extension for React component files even though they are transpiled by Babel at runtime (not a build step): `app.jsx`, `tweaks-panel.jsx`
- `kebab-case` for filenames: `tweaks-panel.jsx`, `data.js`, `index.html`

**Functions / Components:**
- Named function declarations for all React components — never arrow function components:
  ```js
  function Header({ tweaks, totalKm, totalElev, activeTrip, onHome }) { ... }
  function StatsPanel({ trip, showElevation }) { ... }
  function MapView({ tweaks, activeTrip, onSelectTrip }) { ... }
  function App() { ... }
  ```
- camelCase for all JavaScript identifiers: `markerHtml`, `useTweaks`, `setTweak`, `elevationProfile`, `layerRefs`
- `__` double-underscore prefix for private/internal helpers in `tweaks-panel.jsx`: `__TWEAKS_STYLE`, `__twkIsLight`, `__TwkCheck`
- `SCREAMING_SNAKE_CASE` for module-level constants: `TWEAK_DEFAULTS`, `TILE_URLS`, `TITLE_OPTIONS`, `THEME_OPTIONS`

**CSS Classes:**
- `.ta-*` prefix for all app UI classes defined in `index.html`: `.ta-app`, `.ta-header`, `.ta-brand`, `.ta-stats`, `.ta-carousel`, `.ta-map`, `.ta-photo`, `.ta-stat`, `.ta-elev`, `.ta-stages`, `.ta-stage-pin`
- `.twk-*` prefix for all tweaks-panel component classes defined inline in `tweaks-panel.jsx`: `.twk-panel`, `.twk-hd`, `.twk-body`, `.twk-row`, `.twk-seg`, `.twk-toggle`, `.twk-chip`, `.twk-slider`
- `.trip-marker*` classes for Leaflet divIcon HTML injected via template literals (not React-rendered): `.trip-marker-wrap`, `.trip-marker-disc`, `.trip-marker-name`, `.trip-marker-year`
- BEM-like compound naming with `-` separator for sub-elements: `.ta-stats-head`, `.ta-stats-grid`, `.ta-stat-num`, `.ta-stat-label`, `.ta-carousel-head`, `.ta-carousel-controls`
- State modifier classes use `is-` prefix: `.is-active` on `.ta-photo`

## Code Style

**Formatting:**
- No linter or formatter config files present (no `.eslintrc*`, `.prettierrc*`, `biome.json`, or similar)
- Indentation: 2 spaces throughout
- Trailing semicolons omitted inside JSX attribute callbacks; present in regular JS statements

**Linting:**
- No tooling enforced; style is maintained manually

## CSS Architecture

**Custom Properties (design tokens):**
All colors, fonts, and shadows are defined as CSS custom properties on `:root` in `index.html`. Never use raw hex/font values directly in selectors — reference a variable:
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
  --shadow-soft: ...;
  --shadow-card: ...;
  --serif: 'Nunito', ...;
  --display: 'Syne', ...;
  --mono: 'JetBrains Mono', ...;
}
```

**Inline dynamic CSS variables:**
Per-element dynamic values are passed via inline `style` with a CSS custom property, which the selector then reads via `var()`:
```js
// in markerHtml():
`<div class="trip-marker" style="--c:${trip.color}">`
// in CSS:
.trip-marker-disc { background: var(--c); }
```

**Tweaks panel styles:**
All `.twk-*` styles are injected as a single minified string constant `__TWEAKS_STYLE` at the top of `tweaks-panel.jsx` and rendered via `<style>{__TWEAKS_STYLE}</style>` inside `TweaksPanel`. This keeps the component self-contained with zero external CSS dependencies.

## Import Organization

**No module imports.** The project has no build step. All dependencies are loaded via `<script>` tags in `index.html` in this order:
1. Google Fonts (CSS `<link>`)
2. Leaflet CSS (`<link>`)
3. React UMD (`react.development.js`)
4. ReactDOM UMD (`react-dom.development.js`)
5. Babel Standalone (in-browser JSX transpilation)
6. Leaflet JS
7. `data.js` (app data — plain script, not JSX)
8. `tweaks-panel.jsx` (`type="text/babel"`)
9. `app.jsx` (`type="text/babel"`)

**Global access pattern:**
React hooks and globals are destructured from the `React` UMD global at the top of `app.jsx`:
```js
const { useState, useEffect, useMemo, useRef, useCallback } = React;
```
`tweaks-panel.jsx` uses `React.useState`, `React.useCallback`, etc. directly (no destructuring).

All exports from `tweaks-panel.jsx` are assigned to `window` at the bottom of the file:
```js
Object.assign(window, {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
});
```

Data from `data.js` is accessed via `window.TRIPS`, `window.totalDistance`, `window.totalElevation`.

## Comment Style

**Section dividers** separate logical blocks within a file using this exact format:
```js
// ─── SECTION NAME ────────────────────────────────────────────────────────────
```
Used consistently in both `app.jsx` and `tweaks-panel.jsx`. Examples: `// ─── MARKER HTML ─────`, `// ─── LEAFLET TILE SOURCES ───`, `// ─── PHOTO CAROUSEL ──────`.

**CSS section dividers** use the same pattern inside `<style>` in `index.html`:
```css
/* ───────────────────────── HEADER ───────────────────────── */
```

**Block comments** at the top of `tweaks-panel.jsx` document the component API and usage with a multi-line `//` comment block (not JSDoc).

**Inline comments** mark editable regions for the host edit-mode protocol:
```js
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{ ... }/*EDITMODE-END*/;
```

## Template Literals for DOM/HTML

Marker HTML and stage-pin HTML injected into Leaflet `divIcon` are built with template literals, not JSX, because Leaflet consumes raw HTML strings:
```js
function markerHtml(trip) {
  return `
    <div class="trip-marker" style="--c:${trip.color}">
      <div class="trip-marker-disc">
        <div class="trip-marker-name">${trip.name}</div>
        <div class="trip-marker-year">${trip.year}</div>
      </div>
    </div>`;
}
```
```js
html: `<div class="ta-stage-pin">${i + 1}</div>`
html: `<div class="ta-stage-pin end">★</div>`
```

## JSX Patterns

- `className` (not `class`) for all CSS class attributes
- `data-*` attributes used for CSS state hooks: `data-active`, `data-theme`, `data-on`
- Conditional rendering with `&&` short-circuit: `{activeTrip && <StatsPanel ... />}`
- Fragment `<>...</>` for grouping sibling elements without a wrapper
- `aria-hidden`, `aria-label`, `role`, `aria-checked` attributes included on interactive elements in `tweaks-panel.jsx`

## Function Design

**Hook pattern:**
Custom hooks (`useTweaks`) follow the React hooks naming convention and are declared as named functions:
```js
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  const setTweak = React.useCallback((keyOrEdits, val) => { ... }, []);
  return [values, setTweak];
}
```

**`useEffect` dependency arrays** are always explicit — no omitted deps.

**`useMemo`** used for expensive derived values: elevation profile SVG path in `StatsPanel`, photo array in `PhotoCarousel`.

---

*Convention analysis: 2026-05-09*
