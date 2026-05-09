# Testing Patterns

**Analysis Date:** 2026-05-09

## Test Framework

**Runner:** None

No test framework is present. There is no `package.json`, no `node_modules`, no `jest.config.*`, no `vitest.config.*`, and no test runner of any kind. The project is a single-page HTML prototype with no build pipeline.

**Assertion Library:** None

**Run Commands:** Not applicable — there are no test scripts.

## Test File Organization

**Location:** No test files exist in the repository.

**Naming:** Not applicable.

## Manual Testing

All testing is performed manually in a web browser.

### How to Open the App

The app **cannot be opened via `file://` protocol** directly because Leaflet map tile requests are blocked by browser CORS policy when loaded from the filesystem. A local HTTP server is required:

```bash
# Python (any directory containing index.html)
python -m http.server 8080

# Node.js (if npx is available)
npx serve .

# VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then open `http://localhost:8080` in a browser.

### Manual Test Checklist

The following behaviors must be verified manually after any change:

**Map initialisation**
- [ ] Map loads and renders tile layer (Voyager theme by default)
- [ ] All trip markers appear as circular discs at their `hub` coordinates
- [ ] Marker discs show the trip name and year
- [ ] Map starts centered at `[48.5, 10]` at zoom 5

**Marker interaction**
- [ ] Clicking a trip marker selects that trip (triggers `onSelectTrip`)
- [ ] Selected trip causes the header subtitle to switch to trip name / country / months
- [ ] Markers are removed from the map when a trip is active
- [ ] Map flies (`flyToBounds`) to the trip's stage bounding box with correct padding

**Track rendering**
- [ ] Stage polylines render with halo (white, weight 7) and colour line (weight 3.5)
- [ ] Alternate stages render as dashed lines (`dashArray: '1 6'`)
- [ ] Stage start pins (numbered circles) appear at the first point of each stage
- [ ] Final stage end pin renders as a star (`★`) in yellow

**Stats panel**
- [ ] Stats panel appears on the right side when a trip is active
- [ ] Distance, elevation gain, highest point, and stage count are displayed
- [ ] Elevation profile SVG renders when `showElevation` tweak is `true`
- [ ] Elevation profile is hidden when `showElevation` tweak is `false`
- [ ] Stage list shows per-stage distance calculated via Haversine formula

**Photo carousel**
- [ ] Carousel appears at the bottom when a trip is active
- [ ] 10 placeholder photos render with SVG pattern art
- [ ] Previous / Next buttons advance and retreat the carousel index
- [ ] Active photo is highlighted with a green border ring
- [ ] Previous button is disabled at index 0; Next button is disabled at last index

**Navigation**
- [ ] Pressing `Escape` deselects the active trip and returns to the overview
- [ ] Clicking "← All trips" button in the header returns to the overview
- [ ] Clicking the brand title when a trip is active returns to the overview
- [ ] Overview flyTo (`[48.5, 10]`, zoom 5) animates on return

**Tweaks panel**
- [ ] Tweaks panel is hidden by default (only shown when activated by host `__activate_edit_mode` message)
- [ ] Title radio changes the header title between `WANDERLOG`, `TRAIL ATLAS`, `BOOTPRINTS`, `TWO BOOTS`
- [ ] Subtitle text input updates the header subtitle text
- [ ] Map tile theme radio switches tiles between `voyager`, `positron`, `watercolor`
- [ ] Track colour chips update the polyline colour on the active trip
- [ ] Show elevation toggle shows/hides the SVG elevation profile
- [ ] Tweaks panel can be dragged to different positions within the viewport
- [ ] Close button (`✕`) hides the panel

**Theme switching**
- [ ] `data-theme` attribute on `.ta-map` is updated on tile theme change
- [ ] CSS filter on `.leaflet-tile-pane` matches the selected theme (sepia / saturate / hue-rotate values differ per theme)

## What Does Not Exist

| Concern | Status |
|---------|--------|
| Unit tests | Not present |
| Integration tests | Not present |
| End-to-end tests (Playwright, Cypress, etc.) | Not present |
| Visual regression tests | Not present |
| Accessibility automated checks | Not present |
| CI pipeline | Not present |
| `package.json` / npm scripts | Not present |
| Linting checks | Not present |

## Adding a Test Layer (Future)

If automated tests are introduced, the following areas carry the highest regression risk and should be covered first:

1. **`markerHtml(trip)`** in `app.jsx` — pure function, easy to unit-test; drives Leaflet divIcon HTML
2. **Haversine distance calculation** in `StatsPanel` — inline loop at `app.jsx` lines 149–155; no dedicated function, would need extraction first
3. **`useTweaks` hook** in `tweaks-panel.jsx` — state merging logic and `postMessage` dispatch
4. **`TweakRadio` segment/select fallback logic** in `tweaks-panel.jsx` — `fitsAsSegments` calculation and `resolve()` type preservation
5. **`__twkIsLight(hex)`** in `tweaks-panel.jsx` — pure luminance function, trivial to unit-test

No test framework is prescribed; the project has no existing dependency on any runtime, so Vitest (zero-config, browser-compatible) or plain browser-based assertion scripts would be the lowest-friction addition.

---

*Testing analysis: 2026-05-09*
