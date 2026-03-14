# Phase 1: Map Core - Research

**Researched:** 2026-03-13
**Domain:** Mapbox GL JS 3.x + React 19 + Vite 7 — map lifecycle, geocoding, geolocation
**Confidence:** HIGH (core APIs verified against official Mapbox docs; Vite/mapbox-gl bundling caveat is MEDIUM)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Button placement: bottom-right floating circular button, above the tab bar (Strava/Google Maps pattern)
- App opens on Poland overview (center `[19.145, 51.919]`, zoom 6) every time — no auto-centering on GPS
- Auto-center for returning users deferred to Phase 5 onboarding (ONBR-03)
- Pulsing animation on button while GPS is being acquired
- After GPS acquired: map flies to user location at zoom 12
- Standard accuracy GPS (`enableHighAccuracy: false`)
- GPS timeout: 10 seconds, then show failure toast and stop pulsing
- Always-visible floating search bar at top of map screen
- Custom dark-themed input using app design tokens (bg-bg-surface, text-text-primary, accent border on focus) — NOT the Mapbox Geocoder plugin
- Autocomplete: dropdown list below search bar showing up to 5 Mapbox Geocoding suggestions
- Search scoped to Poland only (`country=pl` parameter)
- On result selection: map flies to location + temporary pin marker (pin disappears when user pans away or taps elsewhere)
- On GPS denied: Polish toast "Brak dostępu do lokalizacji" + briefly pulse/highlight the search bar
- Geolocation button stays active after denial — user can tap to retry
- On GPS timeout (10s): toast "Nie udało się znaleźć lokalizacji" and stop pulsing
- No zoom +/- buttons — pinch-to-zoom only
- Compass appears only when map is rotated (Mapbox default); tapping resets north
- Only two floating overlays: search bar (top) and geolocation button (bottom-right)
- No filter button or other placeholders in Phase 1
- Map instance via `useRef` (NOT useState) to prevent WebGL context leaks
- `map.remove()` called exactly once in cleanup

### Claude's Discretion
- Exact search bar dimensions and padding
- Temporary pin marker design/icon
- Dropdown autocomplete styling details
- Fly-to animation duration and easing
- Error boundary recovery UI design

### Deferred Ideas (OUT OF SCOPE)
- Auto-center on GPS for returning users — Phase 5
- Filter button on map overlay — Phase 4
- Trail pins and polylines on map — Phase 2
- Map/list toggle — Phase 3
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MAP-01 | User sees interactive Mapbox Outdoors map centered on Poland (`[19.145, 51.919]`, zoom 6) on app load | Map constructor options, CSS import, vite config verified |
| MAP-02 | User can tap "Gdzie jestem" to center map on current GPS position with fly-to animation | Geolocation API pattern, `map.flyTo()` documented |
| MAP-03 | User can search Polish locations via Mapbox Geocoding and map flies to result | Geocoding v6 API endpoint, `country=pl` param, response structure verified |
| MAP-04 | Map viewport (center, zoom, bounds) syncs to Zustand store on `moveend` (not every frame) | `map.on('moveend')` event documented; Zustand store already exists |
| MAP-05 | When GPS is denied, user sees fallback message and search bar per PRD section 7 | `navigator.geolocation` error codes, PermissionDenied = code 1 |
| MAP-06 | Map uses single-instance `useRef` pattern to prevent WebGL context leaks on tab navigation | Pattern documented; React Strict Mode double-invoke pitfall identified |
| MAP-07 | Error boundary wraps map component — invalid token or WebGL failure shows recovery UI | `mapboxgl.supported()` pre-check + React error boundary pattern documented |
</phase_requirements>

---

## Summary

Phase 1 builds the interactive Mapbox Outdoors map for "Psi Szlak," requiring three interconnected systems: map lifecycle management (WebGL context via `useRef`), GPS geolocation with the Geolocation API, and custom search autocomplete via Mapbox Geocoding API v6. All three systems must integrate with the existing Zustand `useViewportStore` and fit within the `AppLayout` flex column.

The highest-risk technical item is the map lifecycle on tab navigation. React Router v6's Outlet pattern unmounts the MapPage component when switching tabs, which will call the cleanup function and destroy the WebGL context. The solution is the `useRef` + `useEffect` pattern with `map.remove()` called exactly once in cleanup — this is well-established and verified. React 18/19 Strict Mode in development causes a double mount/unmount cycle that will exercise the cleanup path, so cleanup code must be defensive.

Mapbox GL JS v3.x is installed (v3.19.1). It requires WebGL2 (dropped WebGL1 support). The `mapboxgl.supported()` pre-check is the correct guard before initialization. Vite 7 bundling with mapbox-gl v3 has a known history of worker transpilation issues (now fixed since v2.14.0+), but the installed v3.19.1 should work without special `optimizeDeps` config — this needs to be validated empirically when the first working map instance is built (flagged in STATE.md).

**Primary recommendation:** Build in this order: (1) working map with lifecycle, (2) viewport sync to Zustand, (3) geolocation hook, (4) geocoding search. Each step is independently verifiable.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mapbox-gl | 3.19.1 (installed) | WebGL map rendering | Project decision; already installed |
| react | 19.2.0 (installed) | Component framework | Project stack |
| zustand | 5.0.11 (installed) | Client state (viewport, UI) | Project pattern; stores already exist |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.577.0 (installed) | Icon for geolocation button (MapPin, Navigation, LocateFixed) | Geolocation button UI |
| Mapbox Geocoding API v6 | REST API | Location search | Custom search bar — NOT the geocoder plugin widget |
| Browser Geolocation API | Native | GPS position | `navigator.geolocation.getCurrentPosition()` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw mapbox-gl | react-map-gl wrapper | react-map-gl adds abstraction and billing `reuseMaps` trick, but project decided raw mapbox-gl to keep bundle lean and control map ref directly |
| Mapbox Geocoder plugin | Custom fetch to Geocoding v6 | Plugin brings its own DOM + CSS that clashes with dark design tokens; custom approach is locked decision |
| Mapbox Search JS React SDK | Manual fetch | Search JS SDK is heavier; custom fetch to `/v6/forward` is sufficient for 5-result autocomplete |

**No additional installation needed.** All required packages are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/map/
│   ├── MapView.tsx          # Root component: map container + overlays
│   ├── MapControls.tsx      # Geolocation button (floating, bottom-right)
│   ├── LocationSearch.tsx   # Search bar + autocomplete dropdown
│   └── index.ts             # Re-exports
├── hooks/
│   └── useGeolocation.ts    # Geolocation hook (first custom hook)
└── router.tsx               # Replace MapPage stub with <MapView />
```

### Pattern 1: Map Lifecycle with useRef

**What:** Map instance lives in a `useRef`, initialized in `useEffect`, removed in cleanup.

**When to use:** Always — this is the only safe pattern for Mapbox GL + React Router tab navigation.

**Example:**
```typescript
// Source: https://docs.mapbox.com/mapbox-gl-js/api/map/
// + https://docs.mapbox.com/help/tutorials/use-mapbox-gl-js-with-react/
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (mapRef.current) return          // already initialized (Strict Mode guard)
    if (!containerRef.current) return
    if (!mapboxgl.supported()) return   // WebGL2 not available — let error boundary show

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [19.145, 51.919],
      zoom: 6,
      attributionControl: false,       // Phase 0 decision: use compact control instead
    })

    mapRef.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    )

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
```

**Critical detail:** The `if (mapRef.current) return` guard at the top prevents double initialization in React 19 Strict Mode (development), which runs useEffect twice.

### Pattern 2: Viewport Sync on moveend (MAP-04)

**What:** On `moveend`, read map state and push to Zustand store.

**When to use:** Inside the map `load` callback, or after map is initialized.

```typescript
// Source: https://docs.mapbox.com/mapbox-gl-js/api/map/ (map.on events)
mapRef.current.on('moveend', () => {
  const map = mapRef.current
  if (!map) return
  const center = map.getCenter()
  const bounds = map.getBounds()
  setCenter([center.lng, center.lat])
  setZoom(map.getZoom())
  setBounds({
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  })
})
```

**Why `moveend` not `move`:** `move` fires every animation frame — hundreds of events per second. `moveend` fires once when camera settles. Zustand updates on every frame would cause excessive re-renders.

### Pattern 3: useGeolocation Hook

**What:** Encapsulates `navigator.geolocation.getCurrentPosition()` with loading/error/position state.

**When to use:** Called from `MapControls` geolocation button handler.

```typescript
// Source: MDN Geolocation API
// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
type GeolocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; position: GeolocationPosition }
  | { status: 'error'; code: number; message: string }

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' })

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'error', code: 0, message: 'Brak obsługi geolokalizacji' })
      return
    }
    setState({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (position) => setState({ status: 'success', position }),
      (error) => setState({ status: 'error', code: error.code, message: error.message }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  return { state, locate }
}
```

**Error codes (PositionError):**
- `1` — PERMISSION_DENIED → toast "Brak dostępu do lokalizacji"
- `2` — POSITION_UNAVAILABLE → toast "Nie udało się znaleźć lokalizacji"
- `3` — TIMEOUT (matches 10s setting) → toast "Nie udało się znaleźć lokalizacji"

### Pattern 4: Geocoding v6 Search with Debounce

**What:** Fetch Mapbox Geocoding API v6 `/forward` endpoint on each input change, debounced to reduce API costs.

**When to use:** Inside `LocationSearch` component onChange handler.

```typescript
// Source: https://docs.mapbox.com/api/search/geocoding/ (Geocoding API v6)
const GEOCODING_URL = 'https://api.mapbox.com/search/geocode/v6/forward'

async function searchLocations(query: string): Promise<GeocodingFeature[]> {
  const params = new URLSearchParams({
    q: query,
    country: 'pl',
    limit: '5',
    language: 'pl',
    access_token: import.meta.env.VITE_MAPBOX_TOKEN,
  })
  const res = await fetch(`${GEOCODING_URL}?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.features ?? []
}

// Response shape (v6):
// feature.geometry.coordinates = [lng, lat]
// feature.properties.place_formatted = "Kraków, Małopolska, Polska"
// feature.properties.name = "Kraków"
```

**Billing note:** With autocomplete enabled (default), each keystroke = 1 API request. Minimum 3 characters before firing + 300ms debounce reduces calls by ~60–70%.

### Pattern 5: flyTo for Navigation

**What:** Smooth camera animation to a coordinate.

```typescript
// Source: https://docs.mapbox.com/mapbox-gl-js/api/map/
mapRef.current?.flyTo({
  center: [lng, lat],
  zoom: 12,
  duration: 1500,   // ms
  essential: true,  // not skipped by prefers-reduced-motion
})
```

### Pattern 6: Temporary Pin Marker

**What:** Add a `mapboxgl.Marker` on geocoding result selection; remove it when user pans.

```typescript
// Source: https://docs.mapbox.com/mapbox-gl-js/api/markers/
const markerRef = useRef<mapboxgl.Marker | null>(null)

function placeMarker(lng: number, lat: number) {
  markerRef.current?.remove()
  markerRef.current = new mapboxgl.Marker({ color: '#C9A84C' })
    .setLngLat([lng, lat])
    .addTo(mapRef.current!)
}

// Remove marker on dragstart (user pans away)
mapRef.current.on('dragstart', () => {
  markerRef.current?.remove()
  markerRef.current = null
})
```

### Pattern 7: React Error Boundary for Map

**What:** Class component wrapping `<MapView>` that catches render errors and WebGL initialization failures.

**When to use:** Wrap `MapView` in router so invalid token or missing WebGL shows recovery UI instead of crash.

```typescript
// React error boundaries must be class components (as of React 19)
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error) { console.error('[MapErrorBoundary]', error) }
  render() {
    if (this.state.hasError) {
      return <MapFallbackUI />  // Recovery UI — design at discretion
    }
    return this.props.children
  }
}
```

**Note:** The `mapboxgl.supported()` check inside `useEffect` does NOT throw, so it alone won't trigger the error boundary. It must be paired with either (a) throwing in `useEffect` when unsupported, or (b) rendering a fallback div when `!mapboxgl.supported()`. Option (b) is simpler and avoids async error boundary timing issues.

### Anti-Patterns to Avoid

- **Map in useState:** `const [map, setMap] = useState(null)` — setting map triggers re-render which re-initializes WebGL context. Use `useRef` only.
- **Multiple `map.remove()` calls:** Guard with `mapRef.current = null` after removal to prevent double-remove crashes.
- **Event listeners not removed on cleanup:** Mapbox's `map.remove()` removes all listeners automatically — no manual `map.off()` needed if cleanup calls `map.remove()`.
- **Flying before map load:** Call `flyTo` only after `map.on('load')` fires, or check `map.loaded()`.
- **Autocomplete on every keystroke:** Always debounce (300ms) and require minimum characters (3) before fetching.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Map WebGL rendering | Custom canvas + WebGL | `mapboxgl.Map` | Vector tile decoding, projection math, WebGL shader management are thousands of lines |
| Map tile caching | Custom SW cache | Mapbox GL built-in + Workbox CacheFirst (already configured) | Mapbox manages tile LRU internally; Workbox layer already set up in Phase 0 |
| Geocoding | Custom Polish place search | Mapbox Geocoding v6 REST API | Address normalization, fuzzy matching, ranking across POIs/streets/cities |
| Location permission UI | Custom permission flow | Browser Geolocation API standard flow | OS-level permission dialogs cannot be customized; browser handles re-prompt |
| Compass control | Custom bearing indicator | Mapbox NavigationControl (compass only) or default behavior | Mapbox's compass control integrates correctly with map rotation state |
| Marker management | Custom canvas overlays | `mapboxgl.Marker` | Handles projection, viewport culling, drag events |

**Key insight:** Mapbox GL JS is a complete rendering engine. Everything except the React component shell, the Zustand sync, and the geocoding fetch call should delegate to Mapbox's own API.

---

## Common Pitfalls

### Pitfall 1: Black Screen After Tab Navigation

**What goes wrong:** User navigates to Trasy tab and back to Mapa — map canvas renders black or blank.

**Why it happens:** React Router unmounts MapPage, triggering cleanup. If `map.remove()` is NOT called, the WebGL context is orphaned. If the map container div is re-mounted into a new DOM node, Mapbox can't reattach to the previous canvas.

**How to avoid:** Always call `map.remove()` in the useEffect cleanup. Set `mapRef.current = null` after removal. Guard against re-initialization with `if (mapRef.current) return` at the top of useEffect.

**Warning signs:** Black canvas on revisit; browser console shows "GL ERROR :GL_INVALID_OPERATION" or "Too many active WebGL contexts."

### Pitfall 2: Mapbox CSS Not Imported

**What goes wrong:** Map renders but popups, markers, and attribution are unstyled or broken.

**Why it happens:** Mapbox GL JS requires its own CSS file to be imported separately.

**How to avoid:** Import `'mapbox-gl/dist/mapbox-gl.css'` in `MapView.tsx` (or in `src/index.css` via `@import`).

**Warning signs:** Markers appear without styling; attribution missing; popup arrows missing.

### Pitfall 3: React Strict Mode Double-Init

**What goes wrong:** In development, useEffect runs twice (mount → cleanup → mount). Second mount finds `mapRef.current` is null (cleaned up by first cycle) but container div may still be in DOM. Two map instances may briefly coexist, or the second init fails because the container was already used.

**Why it happens:** React 19 Strict Mode intentionally double-invokes effects to expose cleanup bugs.

**How to avoid:** The `if (mapRef.current) return` guard prevents double initialization. The cleanup sets `mapRef.current = null`, so the second init creates a fresh instance correctly.

**Warning signs:** Console error "Map already exists on element" in development only.

### Pitfall 4: Geocoding Billing from Autocomplete

**What goes wrong:** Each keystroke fires a geocoding request — 10-character search = 10 API calls.

**Why it happens:** Mapbox Geocoding v6 counts each request individually for billing.

**How to avoid:** Debounce input handler by 300ms; only start fetching after minimum 3 characters; cancel in-flight requests with `AbortController` when new input arrives.

**Warning signs:** Geocoding API usage spikes in Mapbox dashboard.

### Pitfall 5: flyTo Before Map Loaded

**What goes wrong:** Calling `map.flyTo()` immediately after map construction throws "Map is not yet loaded" error.

**Why it happens:** Map tiles and style are loaded asynchronously after the constructor returns.

**How to avoid:** Either wait for `map.on('load', ...)` before calling any camera methods, or use `map.once('load', () => ...)` for one-shot setup.

### Pitfall 6: map.getBounds() Before moveend

**What goes wrong:** `map.getBounds()` returns null or incorrect bounds if called before the map's first render completes.

**Why it happens:** Bounds are only meaningful after the map has rendered at least once.

**How to avoid:** Initialize Zustand bounds inside the `moveend` handler, not in the constructor. Initial bounds will be set after the first user interaction or `flyTo` completion.

### Pitfall 7: Vite 7 Worker Bundling (Flag from STATE.md)

**What goes wrong:** In development, "An error occurred while parsing the WebWorker bundle" appears in console.

**Why it happens:** Mapbox GL JS uses internal Web Workers for tile parsing. Historically (v2.14.0 era), class fields caused transpilation issues. Fixed in v3.x, but Vite 7's behavior is extrapolated — not yet empirically confirmed with this exact stack.

**How to avoid:** Run `npm run dev` and verify a working map before building on top of it. If worker errors appear, try adding `optimizeDeps: { exclude: ['mapbox-gl'] }` to `vite.config.ts`. This is the known mitigation from community reports.

**Warning signs:** Console worker error in dev; map never renders in dev but works in `npm run preview`.

---

## Code Examples

### Full MapView Shell

```typescript
// src/features/map/MapView.tsx
// Sources:
//   https://docs.mapbox.com/mapbox-gl-js/api/map/
//   https://docs.mapbox.com/help/tutorials/use-mapbox-gl-js-with-react/

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useViewportStore } from '../../stores/viewport'
import { MapControls } from './MapControls'
import { LocationSearch } from './LocationSearch'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const { setCenter, setZoom, setBounds } = useViewportStore()

  useEffect(() => {
    if (mapRef.current) return
    if (!containerRef.current) return

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [19.145, 51.919],
      zoom: 6,
      attributionControl: false,
    })

    mapRef.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    )

    mapRef.current.on('moveend', () => {
      const map = mapRef.current
      if (!map) return
      const c = map.getCenter()
      const b = map.getBounds()
      setCenter([c.lng, c.lat])
      setZoom(map.getZoom())
      setBounds({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [setCenter, setZoom, setBounds])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />
      <LocationSearch mapRef={mapRef} />
      <MapControls mapRef={mapRef} />
    </div>
  )
}
```

### Geocoding Feature Type

```typescript
// Mapbox Geocoding v6 response shape
// Source: https://docs.mapbox.com/api/search/geocoding/
interface GeocodingFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]  // [lng, lat]
  }
  properties: {
    name: string
    place_formatted: string        // "Kraków, Małopolska, Polska"
    mapbox_id: string
    feature_type: string
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mapbox Geocoding v5 (`/geocoding/v5/`) | Geocoding v6 (`/search/geocode/v6/`) | 2023–2024 | v5 deprecated; v6 has better response shape (`place_formatted` instead of `place_name`) |
| WebGL1 in Mapbox GL JS | WebGL2 mandatory (GL JS v3) | v3.0 (2023) | `mapboxgl.supported()` now checks for WebGL2 |
| `map.accessToken` on instance | Global `mapboxgl.accessToken` before construction | v2+ | Set globally once, not per-map |
| `forwardRef` in React | Ref as regular prop (React 19) | React 19 (2024) | No `forwardRef` wrapper needed |

**Deprecated/outdated:**
- Geocoding v5 endpoint `/geocoding/v5/{dataset}/{query}.json`: Use v6 `/search/geocode/v6/forward` instead
- `@mapbox/mapbox-gl-geocoder` plugin: Heavy, DOM-managed, clashes with design tokens — locked decision to not use it
- `new mapboxgl.NavigationControl()` with zoom buttons: Project decided pinch-to-zoom only; compass only is achieved by not adding NavigationControl (or by using a compass-only custom button)

---

## Open Questions

1. **Vite 7 + mapbox-gl v3 worker bundling in dev**
   - What we know: v3.19.1 is installed; the v2.14.0 class-field bug is fixed upstream
   - What's unclear: Whether Vite 7's new module resolution introduces any new transpilation friction with mapbox-gl's web workers
   - Recommendation: First task of Phase 1 should be a "smoke test" — get a working map rendering in dev before building hooks and UI on top. If worker errors appear, add `optimizeDeps: { exclude: ['mapbox-gl'] }` to `vite.config.ts`.

2. **React 19 Strict Mode with mapbox-gl**
   - What we know: The `if (mapRef.current) return` guard prevents double-init; `mapRef.current = null` in cleanup prevents stale ref issues
   - What's unclear: Whether any mapbox-gl v3 internal state (worker threads, tile cache) has issues with the dev-mode mount/unmount/remount cycle
   - Recommendation: Test tab navigation in dev mode early. The guard pattern is well-established.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `/Users/kacpermajerowicz/pointer-adventure/vitest.config.ts` |
| Quick run command | `npx vitest run src/hooks/useGeolocation.test.ts` |
| Full suite command | `npx vitest run` |

**Note:** `vitest.config.ts` has `include: ['src/**/*.test.ts']` — test files must be `.test.ts` (not `.tsx`). Hook tests (pure logic, no DOM) fit this pattern. Component tests would need `.test.tsx` and a DOM environment — the config does not yet specify `environment: 'jsdom'`. Mapbox GL JS cannot be tested in jsdom (requires WebGL). UI components for overlays are better covered by smoke tests / manual verification.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAP-01 | Map renders at Poland coords on load | manual/smoke | `npm run dev` → visual check | N/A |
| MAP-02 | flyTo fires after GPS success | unit (hook) | `npx vitest run src/hooks/useGeolocation.test.ts` | ❌ Wave 0 |
| MAP-03 | Geocoding fetch returns features for Polish query | unit | `npx vitest run src/features/map/geocoding.test.ts` | ❌ Wave 0 |
| MAP-04 | moveend handler calls Zustand setters | manual/smoke | Tab-switch visual check; no DOM env for Mapbox | N/A |
| MAP-05 | Error code 1 → 'denied' state in useGeolocation | unit (hook) | `npx vitest run src/hooks/useGeolocation.test.ts` | ❌ Wave 0 |
| MAP-06 | map.remove() called in cleanup | manual/smoke | Chrome DevTools → WebGL contexts | N/A |
| MAP-07 | MapErrorBoundary renders fallback on throw | manual/smoke | Dev tools error simulation | N/A |

**Why Mapbox map itself is manual-only:** `mapboxgl.Map` requires a real WebGL2 canvas. jsdom does not support WebGL. Vitest's node environment has no DOM. The testable units are the hooks and utility functions that live outside the map instance.

### Sampling Rate
- **Per task commit:** `npx vitest run src/hooks/useGeolocation.test.ts` (if exists)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useGeolocation.test.ts` — covers MAP-02, MAP-05 (mock `navigator.geolocation`, assert state transitions)
- [ ] `src/features/map/geocoding.test.ts` — covers MAP-03 (mock `fetch`, assert feature array parsing)
- [ ] Update `vitest.config.ts`: add `environment: 'happy-dom'` under `test` if component smoke tests are added (not required for hooks)

---

## Sources

### Primary (HIGH confidence)
- Mapbox GL JS API Docs — `Map` constructor, events, flyTo, AttributionControl — https://docs.mapbox.com/mapbox-gl-js/api/map/
- Mapbox GL JS — `mapboxgl.supported()` — https://docs.mapbox.com/mapbox-gl-js/example/check-for-support/
- Mapbox Geocoding API v6 — endpoint, country filter, response shape — https://docs.mapbox.com/api/search/geocoding/
- Mapbox GL JS Install Guide — CSS import, worker notes, accessToken — https://docs.mapbox.com/mapbox-gl-js/guides/install/
- MDN Geolocation API — error codes, getCurrentPosition options — https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- Project source files — viewport.ts, ui.ts, AppLayout.tsx, router.tsx, index.css, vitest.config.ts

### Secondary (MEDIUM confidence)
- react-map-gl Tips & Tricks — `reuseMaps` billing note, WebGL performance — https://visgl.github.io/react-map-gl/docs/get-started/tips-and-tricks
- Mapbox React tutorial (official) — useEffect + useRef pattern — https://docs.mapbox.com/help/tutorials/use-mapbox-gl-js-with-react/

### Tertiary (LOW confidence)
- Community reports on Vite 7 + mapbox-gl worker bundling — multiple GitHub issues; v3.x should be fixed but needs empirical validation
- `optimizeDeps: { exclude: ['mapbox-gl'] }` as Vite mitigation — community-reported, not in official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — mapbox-gl v3.19.1 already installed; Zustand stores already exist
- Architecture: HIGH — useRef/useEffect lifecycle pattern is documented by Mapbox and widely verified
- Pitfalls: HIGH for WebGL lifecycle; MEDIUM for Vite 7 worker behavior (needs empirical validation)
- Geocoding API: HIGH — v6 endpoint and params verified against official docs

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (Mapbox GL JS v3.x is stable; Geocoding v6 is current; 30-day window)
