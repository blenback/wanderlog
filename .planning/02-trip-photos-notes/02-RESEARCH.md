# Phase 2: Trip Photos & Notes — Research

**Researched:** 2026-05-09
**Domain:** React 18 UMD (CDN) + browser fetch API + static file serving
**Confidence:** HIGH — all findings based on direct codebase inspection

---

## Summary

Phase 2 is a focused codebase-only change: replace generated fake photo data in `PhotoCarousel` with real images fetched from `meta.json` per trip, and wire up the stats panel blurb to use `meta.notes` when available. No new libraries, no new CSS, no new HTML files.

The app already has every CSS class, every component, and every layout position needed. The change is entirely in `app.jsx` — adding a `useEffect` fetch in `App`, threading the fetched data down to `StatsPanel` and `PhotoCarousel`, and modifying how those two components render based on whether real photo data exists.

One structural issue not addressed in the UI-SPEC: the `data/` folder uses geographic folder names (`brittany`, `corsica`, `lombardy`, `ruegen`, `sardinia`, `slovenia`, `switzerland`) while the trip IDs in `data.js` are short codes (`bia`, `rab`, `oro`, `sar`, `slo`, `swi`, `rue`). The plan must resolve this mismatch before meta.json fetch paths will work.

No real photos or meta.json files exist yet. These must be created as part of this phase — they are required for the implementation to be testable at all.

**Primary recommendation:** Implement the fetch in `App`, use a `metaCache` ref to avoid redundant fetches, and create `data/<trip-id>/` folders (ID-named) alongside one sample meta.json and at least one sample photo to enable end-to-end testing.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| meta.json fetch | Browser / Client | — | Static file served by GitHub Pages; fetched client-side at trip selection time |
| Race-condition guard | Browser / Client | — | Compare activeTripId at fetch resolution; discard stale response |
| Photo rendering | Browser / Client | — | `<img>` element with relative src path; no server involvement |
| Placeholder fallback | Browser / Client | — | Render `PhotoPlaceholder` SVG when photos array absent/empty |
| Stats blurb override | Browser / Client | — | Replace trip.blurb binding with meta.notes when present |
| File structure (data/) | Static / Storage | — | Folder and JSON file creation; no build step needed |

---

## Standard Stack

No new libraries. All existing CDN dependencies are already loaded in index.html.

| Dependency | Version | Purpose | Status |
|------------|---------|---------|--------|
| React 18 UMD | 18.3.1 | Component rendering, useState/useEffect/useRef | Already loaded via unpkg CDN |
| Babel Standalone | 7.29.0 | In-browser JSX transpilation | Already loaded via unpkg CDN |
| Leaflet | 1.9.4 | Map (not touched this phase) | Already loaded |

Browser built-ins used in this phase:
- `fetch()` — standard browser API, no polyfill needed for GitHub Pages target audience
- `AbortController` — standard browser API, used for fetch cancellation on trip change

**Installation:** None required. No npm, no bundler.

---

## Architecture Patterns

### System Architecture Diagram

```
User clicks trip marker
        |
        v
App: setActiveTripId(trip.id)
        |
        +---> Immediate render: StatsPanel(trip.blurb), PhotoCarousel(placeholder mode)
        |
        v
App useEffect: fetch('data/{trip.id}/meta.json')
        |
     [404]-----> swallow silently, keep data.js values
        |
     [200 + parse ok]
        |
        +--- check: activeTripId still matches?
                |
             [stale]---> discard response
                |
             [current]
                |
                v
        setMeta({ notes, photos, title })
                |
                +---> StatsPanel re-renders with meta.notes (or trip.blurb fallback)
                +---> PhotoCarousel re-renders with real <img> elements
                +---> Header subtitle re-renders with meta.title override (if present)
```

### Recommended Data File Structure

The `data/` folder currently uses geographic names. The plan must create ID-named subfolders for meta.json to be fetchable via `data/{trip.id}/meta.json`:

```
data/
  bia/           # matches trip.id 'bia' — new folder for meta.json
    meta.json
  rab/
    meta.json    # (optional — only if photos/notes are ready)
  ...
  brittany/      # existing GPX folders — untouched
  corsica/
  ...
media/
  bia/           # photos for trip 'bia' — new folder
    photo1.jpg
  ...
```

The GPX data folders do not need to move or be renamed. They serve a different consumer (data.js already has the coordinate arrays inlined — it never fetches GPX files at runtime).

### Pattern 1: Fetch with Race-Condition Guard (App component)

**What:** Fetch meta.json when activeTripId changes; discard stale responses if user switches trip before fetch resolves.

**When to use:** Any async data load keyed to a selected item.

```javascript
// In App() — verified against current app.jsx structure
const [meta, setMeta] = useState(null);

useEffect(() => {
  if (!activeTripId) {
    setMeta(null);
    return;
  }
  let cancelled = false;
  fetch(`data/${activeTripId}/meta.json`)
    .then(r => {
      if (!r.ok) return null;          // 404 -> treat as no meta
      return r.json();
    })
    .then(data => {
      if (!cancelled) setMeta(data);   // discard if trip changed
    })
    .catch(() => {
      if (!cancelled) setMeta(null);   // parse error -> treat as no meta
    });
  return () => { cancelled = true; };
}, [activeTripId]);
```

Note: `AbortController` is an alternative to the `cancelled` flag but adds complexity without meaningful benefit for this use case (JSON fetches are fast; the main goal is ignoring stale state, not cancelling network requests). The flag approach is simpler and equally correct.

**Source:** [VERIFIED: direct codebase inspection of app.jsx lines 384-389 (existing useEffect pattern)]

### Pattern 2: PhotoCarousel with Conditional Image Rendering

**What:** Render real `<img>` elements when meta photos exist; render `PhotoPlaceholder` otherwise.

**Current placeholder structure (app.jsx lines 172-222):**
- `photos` is computed by `useMemo` — 10 generated fake photo objects with fake captions
- Each renders `<PhotoPlaceholder>` with a `.ta-photo-tag` filename watermark
- Caption shows `stage {p.stage}` label + fake caption text

**Target structure:**

```javascript
function PhotoCarousel({ trip, meta }) {
  const [idx, setIdx] = useState(0);

  // Reset to first photo when trip changes
  useEffect(() => { setIdx(0); }, [trip.id]);

  const hasRealPhotos = meta && meta.photos && meta.photos.length > 0;
  const photos = hasRealPhotos
    ? meta.photos                             // [{ filename, caption }, ...]
    : Array.from({ length: 10 }, (_, i) => ({ // existing fake placeholder data
        id: `${trip.id}-p${i}`,
        stage: Math.min(trip.stages.length, Math.floor(i / 10 * trip.stages.length) + 1),
        caption: PLACEHOLDER_CAPTIONS[i],
        hue: (i * 47 + trip.year) % 60 + 20
      }));
  // ...render loop branches on hasRealPhotos
}
```

For real photos, each photo slot renders:
```jsx
<div className="ta-photo-img">
  <img
    src={`media/${trip.id}/${photo.filename}`}
    alt={photo.caption}
    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    onError={(e) => { /* replace with PhotoPlaceholder equivalent */ }}
  />
</div>
<div className="ta-photo-caption">
  <span className="ta-photo-cap">{photo.caption}</span>
</div>
```

No `.ta-photo-stage` label for real photos (per UI-SPEC section 2.1). No `.ta-photo-tag` watermark overlay.

**Source:** [VERIFIED: direct codebase inspection of app.jsx lines 169-248]

### Pattern 3: StatsPanel Notes Override

**Current binding (app.jsx line 105):**
```jsx
<p className="ta-stats-blurb">{trip.blurb}</p>
```

**Target binding:**
```jsx
<p className="ta-stats-blurb">{(meta && meta.notes) || trip.blurb}</p>
```

`meta` is passed as a prop to `StatsPanel`. This is a one-line change. The `trip.blurb` field exists in every trip object in `window.TRIPS` — confirmed in data.js lines 11, 28, 43, etc.

**Source:** [VERIFIED: direct codebase inspection of app.jsx line 105 and data.js trip objects]

### Pattern 4: Title Override in Header

**Current binding (app.jsx lines 60-61):**
```jsx
<span className="ta-brand-sub-em">{activeTrip.name}</span>
```
and in StatsPanel (line 101):
```jsx
<div className="ta-stats-title">{trip.name}</div>
```

**Target:** Use `(meta && meta.title) || trip.name` in both locations.

**Source:** [VERIFIED: direct codebase inspection of app.jsx lines 60-61, 101]

### Pattern 5: meta.json File Format

```json
{
  "title": "Optional display title override",
  "notes": "Trip notes text shown in stats panel",
  "photos": [
    { "filename": "photo.jpg", "caption": "Caption text" }
  ]
}
```

All fields optional. A valid meta.json with an empty `photos` array triggers placeholder mode (per MEDIA-03).

**Source:** [VERIFIED: CLAUDE.md project instructions and UI-SPEC section 2.5]

### Anti-Patterns to Avoid

- **Do not use `useState` for the cancelled flag** — use a closure variable (`let cancelled = false`) set in the effect cleanup. Using state for it would trigger additional renders.
- **Do not recompute placeholder photos on every render** — keep them in `useMemo` keyed to `trip.id` (existing pattern is correct).
- **Do not store meta.json data as a field on the trip object from data.js** — keep them separate; meta is async, trip is synchronous. Merging them would complicate the fallback logic.
- **Do not parse notes for markdown/HTML** — plain text only, per UI-SPEC section 2.3.
- **Do not add a loading spinner for the meta.json fetch** — per UI-SPEC section 2.3, the stats panel renders immediately with data.js values; meta data replaces it quietly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image lazy loading | Custom intersection observer | None needed | Photos are in a visible carousel; lazy loading adds complexity with no benefit at this scale |
| Image format optimization | WebP conversion pipeline | None — serve JPGs directly | No build toolchain; static site; personal use scale |
| Fetch caching layer | Custom cache object | None (or simple ref cache if needed) | Browser HTTP cache handles repeated fetches to same URL automatically |

**Key insight:** This is a personal site with 7 trips. Over-engineering the data-loading pattern would violate the project's explicit "no toolchain" constraint and add no user value.

---

## Critical Path Issue: Folder Name Mismatch

**What it is:** The `data/` folder uses geographic names (`brittany`, `corsica`, `lombardy`, `ruegen`, `sardinia`, `slovenia`, `switzerland`) but the trip IDs in `data.js` are short codes (`bia`, `rab`, `oro`, `sar`, `slo`, `swi`, `rue`).

**Mapping:**

| Trip ID | data.js name | Existing data/ folder |
|---------|-------------|----------------------|
| bia | Belle-Ile & Brittany | `brittany` |
| rab | Rab Island | (none — rab has no data/ subfolder visible) |
| oro | Alpe Orobie | `lombardy` |
| sar | Via Ogliastra | `sardinia` |
| slo | Julian Alps | `slovenia` |
| swi | Bernese Oberland | `switzerland` |
| rue | Ruegen Coastal Walk | `ruegen` |

**Resolution:** Create new `data/<trip-id>/` folders (e.g., `data/bia/`, `data/oro/`, etc.) specifically for meta.json. The existing geographic folders contain GPX files and are not touched — data.js has the coordinates inlined and never fetches from those folders at runtime. The geographic folders are build-time artifacts only.

**Source:** [VERIFIED: direct codebase inspection of data/ directory structure and data.js trip ID fields]

---

## Common Pitfalls

### Pitfall 1: Stale Meta Shown for Wrong Trip

**What goes wrong:** User clicks trip A, clicks trip B before A's fetch resolves. Trip A's meta.json arrives and overwrites the correct empty state for trip B.

**Why it happens:** `setMeta` called asynchronously after the component has moved to a different trip.

**How to avoid:** The `cancelled` flag pattern (Pattern 1 above). Check `!cancelled` before calling `setMeta`.

**Warning signs:** Caption text or notes text from a previous trip appearing momentarily on a new trip selection.

---

### Pitfall 2: Carousel Photo Index Out of Range After Trip Change

**What goes wrong:** User is on photo 8 of 10 for trip A. Selects trip B which has only 3 real photos. Carousel tries to show photo at index 8 — undefined.

**Why it happens:** `idx` state in `PhotoCarousel` is not reset when `trip` prop changes.

**How to avoid:** Add `useEffect(() => { setIdx(0); }, [trip.id])` inside `PhotoCarousel`.

**Warning signs:** Blank photo slot, "undefined / 3" counter display, or navigation controls showing inconsistent state.

---

### Pitfall 3: Broken Image with No Fallback

**What goes wrong:** meta.json lists a filename that doesn't exist in `media/<trip-id>/`. Browser shows broken image icon inside the `ta-photo-img` container.

**Why it happens:** The `<img>` src path resolves to a 404 but the error isn't caught.

**How to avoid:** Add `onError` handler to each `<img>` that hides the image and shows `PhotoPlaceholder` SVG inline (or sets a flag to render the placeholder for that slot). Per UI-SPEC section 2.1: "Fall back to the PhotoPlaceholder SVG art for that individual photo slot. Do not break adjacent photos."

**Warning signs:** Grey boxes with broken-image icons in the carousel.

---

### Pitfall 4: fetch() Relative Path Works Locally But Breaks on GitHub Pages

**What goes wrong:** `fetch('data/bia/meta.json')` works fine when opened as `file://` or served from root, but fails under the `/wanderlog` sub-path on GitHub Pages.

**Why it happens:** Relative paths resolve relative to the current document URL. When the page is at `https://blenback.github.io/wanderlog/`, the relative path `data/bia/meta.json` correctly resolves to `https://blenback.github.io/wanderlog/data/bia/meta.json`. This is correct behavior.

**How to avoid:** Keep the relative path as-is — it will work correctly on GitHub Pages because it's relative to the document, not the origin root. Do NOT use absolute paths like `/data/bia/meta.json` — that would resolve to `blenback.github.io/data/...` and break under the sub-path. [ASSUMED — GitHub Pages sub-path behavior deduction from standard URL resolution spec; mark for verification in Phase 4]

**Warning signs:** 404 on meta.json fetches after deployment but working locally.

---

### Pitfall 5: meta.json Fetch Triggered on Every Render

**What goes wrong:** `useEffect` for fetch has an incomplete dependency array, causing the fetch to re-fire on every render.

**Why it happens:** Including objects or non-primitive values in the dependency array when only `activeTripId` (a string) should trigger the fetch.

**How to avoid:** Dependency array should be exactly `[activeTripId]` — a string. The effect fires only when the selected trip ID changes.

---

## Code Examples

### Complete fetch pattern for App component

```javascript
// Source: [VERIFIED: adapted from existing useEffect pattern in app.jsx lines 384-389]
const [meta, setMeta] = useState(null);

useEffect(() => {
  if (!activeTripId) {
    setMeta(null);
    return;
  }
  let cancelled = false;
  fetch(`data/${activeTripId}/meta.json`)
    .then(r => {
      if (!r.ok) return null;
      return r.json();
    })
    .then(data => {
      if (!cancelled) setMeta(data || null);
    })
    .catch(() => {
      if (!cancelled) setMeta(null);
    });
  return () => { cancelled = true; };
}, [activeTripId]);
```

### Passing meta to child components (App render)

```jsx
// Source: [VERIFIED: adapted from app.jsx lines 406-410]
{activeTrip &&
  <>
    <StatsPanel trip={activeTrip} showElevation={tweaks.showElevation} meta={meta} />
    <PhotoCarousel trip={activeTrip} meta={meta} />
  </>
}
```

### StatsPanel blurb (one-line change)

```jsx
// Source: [VERIFIED: app.jsx line 105]
// Before:
<p className="ta-stats-blurb">{trip.blurb}</p>

// After:
<p className="ta-stats-blurb">{(meta && meta.notes) || trip.blurb}</p>
```

### Real photo item render

```jsx
// Source: [VERIFIED: constructed from UI-SPEC section 2.1 + existing ta-photo-img CSS in index.html]
<div key={photo.filename} className={`ta-photo ${i === idx ? 'is-active' : ''}`} onClick={() => setIdx(i)}>
  <div className="ta-photo-img">
    <img
      src={`media/${trip.id}/${photo.filename}`}
      alt={photo.caption}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        // PhotoPlaceholder can't be rendered here inline;
        // simplest approach: hide img, show background color (--tan is already set on .ta-photo-img)
      }}
    />
  </div>
  <div className="ta-photo-caption">
    <span className="ta-photo-cap">{photo.caption}</span>
  </div>
</div>
```

Note: The onError fallback that "shows PhotoPlaceholder SVG" is complex to implement purely in an onError handler since `PhotoPlaceholder` is a React component, not a DOM element. Two clean options: (1) use an `errored` flag per photo via a small wrapper component, or (2) accept that broken images show the tan background only (the `.ta-photo-img` background color covers it gracefully). Option 2 is simpler and defensible for a personal site.

### Sample meta.json for one trip

```json
{
  "title": "Belle-Ile & Brittany",
  "notes": "A week on the wild Atlantic coast. Clifftop walking on the GR34 around the Crozon peninsula, then five days circling Belle-Ile-en-Mer on the GR 340.",
  "photos": [
    { "filename": "001-morning-trail.jpg", "caption": "first morning on the trail" },
    { "filename": "002-clifftop.jpg", "caption": "clifftop above the Atlantic" }
  ]
}
```

---

## Runtime State Inventory

Step 2.5: SKIPPED — this is a greenfield feature addition, not a rename/refactor/migration phase. No runtime state contains old strings that need updating.

---

## Environment Availability

Step 2.6: No external CLI tools required. The implementation is pure file editing (app.jsx) plus creating new static files (meta.json, image files). No build step, no server, no database, no CLI utilities.

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| A web browser | Viewing result | Yes | Any modern browser |
| A local HTTP server (optional) | Testing fetch() | n/a | fetch() from file:// may be blocked by CORS depending on browser. Use `python -m http.server` or VS Code Live Server for local testing. |
| Photos (JPEG files) | MEDIA-01 | None exist yet | Must be added to media/<trip-id>/ as part of this phase |

**Note on local testing:** `fetch()` is blocked in some browsers when the page is opened as a `file://` URL due to CORS. Testing requires either a local HTTP server or the live GitHub Pages deployment. This is not a code issue — it's an environment constraint.

---

## Validation Architecture

`nyquist_validation: false` in config.json — section skipped.

---

## Security Domain

This is a static personal site with no authentication, no user input, and no server. ASVS categories are not applicable. The only security-relevant consideration is:

- **HTML injection:** `meta.notes` and `meta.json` captions are rendered as text children, not `dangerouslySetInnerHTML`. React's default rendering escapes all string values. No injection risk. [VERIFIED: React 18 text node rendering behavior]

---

## Open Questions

1. **onError fallback for broken images**
   - What we know: UI-SPEC says "fall back to PhotoPlaceholder SVG art for that individual photo slot"
   - What's unclear: `PhotoPlaceholder` is a React component — rendering it in an `onError` DOM event handler requires a React portal or wrapper component. The simpler alternative (tan background color via CSS) may satisfy the spirit of the spec.
   - Recommendation: Implement a small `PhotoItem` wrapper component that tracks `errored` state per photo; renders `<PhotoPlaceholder>` when errored. This is the clean React way. Adds ~15 lines of code.

2. **Which trip gets a sample meta.json?**
   - What we know: No real photos exist yet. The phase cannot be end-to-end tested without at least one meta.json and at least one real photo.
   - What's unclear: Whether Ben will add photos during this phase or if placeholder-mode is the only testable state.
   - Recommendation: Create `data/bia/meta.json` with a minimal valid structure (notes text only, empty photos array) to exercise the DATA-02/03 path without needing real photos. Create `media/bia/` folder with one real photo to exercise MEDIA-01/02 end-to-end. Document both as tasks in the plan.

3. **Carousel subtitle text when meta is loading**
   - What we know: UI-SPEC says subtitle shows `{N} photos` for real photos and the placeholder copy for placeholder mode.
   - What's unclear: During the async fetch (before meta arrives), the carousel is in placeholder mode. This is correct per UI-SPEC section 2.3 ("renders immediately with data.js content").
   - Recommendation: No special loading state needed. Placeholder mode is the correct pre-fetch state.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Relative `fetch('data/{trip-id}/meta.json')` paths resolve correctly under the `/wanderlog` GitHub Pages sub-path | Common Pitfalls #4 | Meta.json fetches would 404 on production; would need absolute path prefix or base-href strategy |

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `app.jsx` — PhotoCarousel, StatsPanel, App components (lines 1-453)
- Direct inspection of `data.js` — window.TRIPS structure, trip.blurb field
- Direct inspection of `index.html` — CSS class names, CDN script loading order
- Direct inspection of `02-UI-SPEC.md` — interaction contracts, copy rules, component inventory
- Direct inspection of `data/` directory structure — folder naming vs trip IDs

### Secondary (MEDIUM confidence)
- Standard browser `fetch()` API behavior — [ASSUMED: training knowledge; well-established web standard]
- React 18 UMD pattern for useEffect + useState — [ASSUMED: consistent with existing app.jsx patterns]

---

## Metadata

**Confidence breakdown:**
- Existing component structure: HIGH — directly read from app.jsx
- fetch pattern: HIGH — adapted from existing useEffect in App, standard API
- Path mismatch finding: HIGH — directly observed data/ folder vs data.js trip IDs
- GitHub Pages sub-path behavior: LOW — deduced from URL spec; needs verification in Phase 4

**Research date:** 2026-05-09
**Valid until:** Indefinite — codebase is stable; findings are based on static file inspection
