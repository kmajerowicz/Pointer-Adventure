# Phase 3: Trail Display and Browsing - Research

**Researched:** 2026-03-13
**Domain:** React list/detail UI, Mapbox GL JS second instance, mobile card layout, empty states
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**TrailCard layout & density**
- Compact horizontal row layout (Strava activity list style) — dense, scannable
- Line 1: trail name + length in km (right-aligned)
- Line 2: surface badge · water icon · difficulty badge + distance from user (right-aligned) + chevron
- PTTK trail color shown as 4px colored left border (red/blue/yellow/green/black); non-PTTK trails have no colored border
- Water access: solid blue droplet icon for `on_route`, outline/faded droplet for `nearby`, no icon for `none`
- Distance from user (or map center if no GPS) shown as muted secondary text on the card — uses existing `haversine.ts` utility
- 2-3 cards visible without scrolling on 375px screen (BROW-05)
- Tapping a TrailCard navigates to `/trails/:id` TrailDetail page (full-screen transition with back button)

**Map/list toggle behavior**
- Mapa tab = map with pins (Phase 1+2). Trasy tab = scrollable trail list. No separate toggle button needed — bottom tab bar provides the switch
- Both views show the same trails from the current map viewport — Trasy list reflects whatever area the map is showing
- Sorted by nearest first: distance from user GPS location (if available) or map center (fallback)

**TrailDetail page**
- Map hero layout: top ~40% is an interactive Mapbox map showing the trail polyline fitted to bounds
- Map inset is interactive (pannable/zoomable) — a second Mapbox instance (WebGL context management must be careful)
- Below map: trail name, all attributes (length, surface, difficulty, water access, PTTK color, distance), description if available
- Back button overlays the map hero (top-left)
- No action buttons in Phase 3 — display only. Heart and "Przeszedlem!" arrive in Phase 6 with auth
- Route: `/trails/:id` as a standalone route (not inside AppLayout tabs, or with modified layout)

**Empty state**
- Appears only in Trasy list view (map view shows no pins — absence is the message, per Phase 2)
- Custom SVG illustration (user will provide externally via GPT) — code renders a placeholder `<img>` or inline SVG slot
- Text: "Brak tras w okolicy" + secondary line
- CTA button: "Szukaj w promieniu 50 km" — tapping zooms the map out to ~50km radius around current center and triggers a new trail fetch

### Claude's Discretion
- Exact card padding, font sizes, badge pill styling
- TrailDetail scroll behavior and section spacing
- Map inset height ratio (approximately 40% but flexible)
- Polyline styling in detail map inset (color, weight)
- Loading skeleton for TrailDetail page
- Placeholder SVG design until user provides custom one
- How to handle trails with no name (fallback display text)

### Deferred Ideas (OUT OF SCOPE)
- Filter button and filter panel — Phase 4
- Heart/favorite toggle on TrailCard — Phase 6
- "Przeszedlem!" activity button on TrailDetail — Phase 6
- "Walked" indicator badge on TrailCard — Phase 6
- Share/copy-link button — future phase
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BROW-01 | User can toggle between map view and list view | Tab bar already wired (BottomTabBar, AppLayout, router.tsx stub at /trails) — replace stub with TrailList |
| BROW-02 | TrailCard displays: name, length (km), surface badge, water access icon, difficulty badge, trail color indicator (if PTTK) | Route interface has all fields; trail-color tokens in index.css; Lucide Droplet for water; badge pills via Tailwind |
| BROW-03 | TrailDetail page shows full trail info, map with route polyline, and action buttons | Second Mapbox instance via useRef; fitBounds to geometry; /trails/:id standalone route; PTTK polyline reuses TrailLayers pattern |
| BROW-04 | Empty state shows illustration + "Brak tras" message + "Szukaj w promieniu 50 km" CTA | CTA calls useViewportStore.setZoom + setCenter to zoom out; triggers useTrails via bounds change |
| BROW-05 | 2-3 TrailCards visible without scrolling on 375px screen width | Card height ~72-80px max; list minus tab bar ~740px available; 3 cards fit easily |
</phase_requirements>

---

## Summary

Phase 3 is a pure frontend UI phase — no new backend, no new stores, no new hooks beyond `haversine.ts`. All data already flows from the existing `useTrailsStore` (routes array) populated by `useTrails` hook from Phase 2. The primary work is:

1. Building `TrailCard` and `TrailList` components in `src/features/trails/`
2. Building `TrailDetail` page with a second Mapbox instance
3. Wiring the `/trails` tab stub to `TrailList` and adding `/trails/:id` route
4. Creating `haversine.ts` utility (listed in CLAUDE.md but not yet implemented)
5. Modifying map pin interactions to navigate to TrailDetail on tap

The hardest technical problem is the second Mapbox instance in `TrailDetail` — WebGL contexts are limited per browser tab (typically 8-16). The established pattern from Phase 1 (single `useRef`, `map.remove()` on cleanup) must be applied identically to the detail map.

TrailDetail is a **standalone route** (outside `AppLayout`), which means it gets its own full-screen layout without the bottom tab bar. This is explicitly decided in CONTEXT.md and is the right call for a detail-page experience.

**Primary recommendation:** Build in task order: (1) haversine.ts utility, (2) TrailCard + TrailList, (3) TrailDetail, (4) router updates + map pin navigation. Each task is independently testable.

---

## Standard Stack

### Core (already in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React + TypeScript | 18/19 + strict | Component tree | Project foundation |
| Tailwind CSS 4 | 4.x | Styling via `@theme` tokens | Project foundation |
| React Router v6 | 6.x | `/trails` + `/trails/:id` routes | Project foundation |
| Mapbox GL JS | latest | Second instance in TrailDetail | Already used for main map |
| Lucide React | latest | Droplet (water), ChevronRight, ArrowLeft icons | Already used in BottomTabBar |
| Zustand | 4.x | useTrailsStore (routes), useViewportStore (center), useUIStore | Already used |

### No New Dependencies Required

This phase requires zero new npm packages. All necessary libraries are already installed. The haversine calculation is a pure math function (~15 lines) — no library needed.

**Installation:**
```bash
# No new packages needed
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── features/trails/           # All trail UI lives here
│   ├── TrailCard.tsx          # Single card component
│   ├── TrailList.tsx          # Scrollable list + empty state
│   ├── TrailDetail.tsx        # Full-screen detail page
│   ├── TrailDetailMap.tsx     # Second Mapbox instance (isolated)
│   └── index.ts               # Public exports
├── lib/
│   └── haversine.ts           # NEW: distance calculation utility
└── router.tsx                 # Updated: add /trails/:id, replace stub
```

### Pattern 1: TrailCard — Compact Horizontal Row

**What:** Two-line row with left PTTK color border, inline badges, right-aligned metadata.

**When to use:** Every trail in the TrailList.

**Height constraint for BROW-05:** On a 375px screen, AppLayout gives `flex-1 overflow-hidden` to the content area, and the tab bar is `h-[var(--spacing-tab-bar)]` (4.5rem = 72px). Typical mobile viewport height ~667px (iPhone SE) → content area ~595px. To show 2-3 cards without scrolling, each card must be under ~198px. A compact two-line card is comfortably ~72-80px with 12px vertical padding.

```tsx
// Source: Project design tokens + established patterns
interface TrailCardProps {
  route: Route
  distanceKm: number | null  // pre-computed by parent via haversine
  onClick: () => void
}

export function TrailCard({ route, distanceKm, onClick }: TrailCardProps) {
  const borderColor = route.trail_color
    ? `border-l-trail-${route.trail_color}`
    : 'border-l-transparent'

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 bg-bg-surface
        border-l-4 ${borderColor}
        active:bg-bg-elevated transition-colors text-left`}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Line 1: name + length */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {route.name ?? 'Trasa bez nazwy'}
          </span>
          {route.length_km != null && (
            <span className="text-xs text-text-secondary shrink-0">
              {route.length_km.toFixed(1)} km
            </span>
          )}
        </div>
        {/* Line 2: badges + distance */}
        <div className="flex items-center gap-1.5 mt-1">
          <SurfaceBadge surface={route.surface_type} />
          <WaterIcon water={route.water_access} />
          <DifficultyBadge difficulty={route.difficulty} />
          <span className="ml-auto text-xs text-text-muted shrink-0">
            {distanceKm != null ? `${distanceKm.toFixed(1)} km` : ''}
          </span>
        </div>
      </div>
      <ChevronRight size={16} className="text-text-muted shrink-0" />
    </button>
  )
}
```

### Pattern 2: haversine.ts — Distance Utility

**What:** Pure function computing great-circle distance between two lat/lon pairs.

**Why needed:** TrailList sorts by nearest-first using `route.center_lat` / `route.center_lon` against user GPS or map center. Referenced in CLAUDE.md project structure as `src/lib/haversine.ts` but the file does not yet exist in the codebase (confirmed by filesystem scan).

```typescript
// src/lib/haversine.ts
// Source: standard haversine formula, no external library needed

const R = 6371 // Earth radius in km

export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}
```

### Pattern 3: TrailList — Sorted, Empty-State-Aware List

**What:** Reads from `useTrailsStore`, computes distances, sorts, and renders TrailCard list or empty state.

**Sort origin:** Use `useGeolocation` state if `status === 'success'`, otherwise fall back to `useViewportStore` center. Both are already available in the project.

```tsx
// Source: project Zustand patterns
export function TrailList() {
  const routes = useTrailsStore((s) => s.routes)
  const center = useViewportStore((s) => s.center)
  const { state: geoState } = useGeolocation()
  const navigate = useNavigate()

  const origin: [number, number] =
    geoState.status === 'success'
      ? [geoState.position.coords.latitude, geoState.position.coords.longitude]
      : [center[1], center[0]] // viewport center is [lng, lat], haversine wants [lat, lon]

  const sorted = useMemo(() =>
    [...routes]
      .map((r) => ({
        route: r,
        distanceKm: haversineKm(origin[0], origin[1], r.center_lat, r.center_lon),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm),
    [routes, origin[0], origin[1]]
  )

  if (routes.length === 0) {
    return <EmptyTrailState />
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-bg-elevated">
      {sorted.map(({ route, distanceKm }) => (
        <TrailCard
          key={route.id}
          route={route}
          distanceKm={distanceKm}
          onClick={() => navigate(`/trails/${route.id}`)}
        />
      ))}
    </div>
  )
}
```

**Re-render note (rerender-dependencies rule):** Pass `origin[0]` and `origin[1]` as primitive useMemo deps rather than the origin array object to avoid unnecessary recomputes.

### Pattern 4: TrailDetail — Second Mapbox Instance

**What:** Full-screen standalone page with a map hero (top ~40%) and scrollable info below.

**Critical concern — WebGL context limit:** Browsers limit WebGL contexts per page (Chrome: ~16, iOS Safari: 8). With the main MapView potentially mounted (depending on React Router's keep-alive behavior), the detail map must be careful.

**Investigation finding:** React Router v6 does NOT keep-alive routes by default. When navigating to `/trails/:id` (standalone route outside `AppLayout`), the `AppLayout` and its `MapView` child unmount. `MapView` calls `mapRef.current?.remove()` in cleanup. This means the main map's WebGL context is released before the detail map initializes. Context collision is not a risk in this navigation pattern.

**Pattern (same useRef lifecycle as Phase 1 MapView):**

```tsx
// Source: MapView.tsx Phase 1 established pattern
export function TrailDetailMap({ route }: { route: Route }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (mapRef.current) return   // Strict Mode guard
    if (!containerRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [route.center_lon, route.center_lat],
      zoom: 12,
      attributionControl: false,
      interactive: true,  // pannable/zoomable per locked decision
    })

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('style.load', () => {
      // Add route polyline if PTTK (has geometry)
      if (route.source === 'pttk' && route.geometry) {
        map.addSource('route', { type: 'geojson', data: route.geometry as GeoJSON.Geometry })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': TRAIL_COLOR_MAP[route.trail_color ?? 'default'] ?? ACCENT_GOLD,
            'line-width': 4,
          },
          layout: { 'line-join': 'round', 'line-cap': 'round' },
        })
        // Fit bounds to geometry
        const bounds = computeBoundsFromGeometry(route.geometry)
        if (bounds) map.fitBounds(bounds, { padding: 40, duration: 0 })
      }
    })

    mapRef.current = map
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])  // run once — route data won't change while detail is mounted

  return <div ref={containerRef} className="w-full h-full" />
}
```

### Pattern 5: Empty State with Zoom-Out CTA

**What:** Renders when `routes.length === 0` in TrailList. CTA programmatically updates the viewport store and triggers a trail fetch.

**How the "50km radius" zoom works:** 50km radius at Poland's latitude (~51°N) corresponds approximately to zoom level 9 on a 375px-wide map. Call `useViewportStore.setZoom(9)` and `setCenter(currentCenter)` — this will trigger the `bounds` change in viewport store which `useTrails` debounces and re-fetches.

**Important:** `useTrails` only fetches when `bounds` changes. The zoom-out CTA needs to also update bounds, not just center/zoom. Since `bounds` is set by the map's `moveend` event (not programmatically), we need a different approach: the CTA should use `useTrails`'s `forceRefresh` function after updating the viewport store, or expose a `fetchForRadius` function. The simplest approach: the CTA updates a "requested zoom" in `useViewportStore` and the `MapView` observes this to call `map.flyTo()`, which then fires `moveend` and updates bounds naturally.

**Simpler alternative:** Export a `useRequestZoomOut` action from viewport store that `MapView` watches and executes a `map.flyTo`. TrailList's CTA dispatches this action. This keeps the map as the single source of bounds truth.

```tsx
// Pattern: viewport store action + MapView observer
// useViewportStore adds:
//   requestedZoom: number | null
//   requestZoomOut: (zoom: number) => void
//   clearRequestedZoom: () => void

// TrailList empty state CTA:
const requestZoomOut = useViewportStore((s) => s.requestZoomOut)
<button onClick={() => requestZoomOut(9)}>
  Szukaj w promieniu 50 km
</button>

// MapView adds useEffect watching requestedZoom:
useEffect(() => {
  const zoom = requestedZoom
  if (!zoom || !mapRef.current) return
  mapRef.current.flyTo({ zoom, center: currentCenter })
  clearRequestedZoom()
}, [requestedZoom])
```

### Pattern 6: Map Pin → TrailDetail Navigation

**What:** Phase 2 popup shows trail name on pin tap. Phase 3 adds navigation to `/trails/:id` from the popup.

**How:** The `setupTrailInteractions` function in `TrailLayers.ts` creates popups with `.setHTML()`. This approach doesn't support React events. Replace the unclustered pin and line click handlers with a callback pattern that navigates imperatively.

```typescript
// TrailLayers.ts updated signature:
export function setupTrailInteractions(
  map: MapboxMap,
  onTrailClick: (routeId: string) => void
): void

// MapView passes:
setupTrailInteractions(map, (id) => navigate(`/trails/${id}`))
```

`useNavigate()` cannot be called inside `TrailLayers.ts` (not a component). Pass the callback from `MapView` which has access to `useNavigate`.

### Anti-Patterns to Avoid

- **Putting `haversine` computation inside the render function without `useMemo`:** Sorting + computing distance for hundreds of trails on every render is expensive. Always memoize with `useMemo`.
- **Using `useState` for the map instance in TrailDetailMap:** Same lesson as Phase 1. Map ref must be `useRef`. State triggers re-renders; a re-render during map initialization creates a second instance.
- **Fetching the single route from Supabase in TrailDetail:** Routes are already in `useTrailsStore`. Read from store by ID: `useTrailsStore((s) => s.routes.find((r) => r.id === id))`. No extra network call needed.
- **Adding `/trails/:id` inside `AppLayout` children:** TrailDetail is a standalone full-screen route — confirmed locked decision. Place it at the top-level router array, not nested under `/`.
- **`map.flyTo` inside the zoom-out CTA directly:** TrailList has no access to the Mapbox instance. Keep the map ref in `MapView` and communicate via viewport store.
- **Dynamic `useEffect` deps array for the detail map init:** The map init runs once. Use `[]` (no deps) with the Strict Mode double-init guard, same as `MapView`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Distance calculation | Custom formula | `haversine.ts` (15 lines, pure math) | No library needed; already planned in CLAUDE.md |
| Icon components | Custom SVG droplet, chevron | Lucide React (`Droplet`, `ChevronRight`, `ArrowLeft`) | Already used in BottomTabBar |
| Route navigation | Custom history management | `useNavigate` from react-router-dom | Already installed |
| Map instance | Direct DOM canvas | Mapbox GL JS via `useRef` pattern | Established in Phase 1 |
| GeoJSON bounds computation | Custom bbox | `mapboxgl.LngLatBounds` extend loop | Built into Mapbox |

**Key insight:** This phase is entirely UI composition. Every piece of infrastructure (stores, hooks, map, Tailwind, router) is already in place. The work is wiring existing pieces into new visual components.

---

## Common Pitfalls

### Pitfall 1: `useGeolocation` Called Twice (TrailList + MapControls)

**What goes wrong:** `useGeolocation` is a local `useState` hook — not global state. If both `TrailList` and `MapControls` call `useGeolocation()`, they get separate instances. Calling `locate()` in one does not update the other.

**Why it happens:** The hook uses local `useState`, not a Zustand store or context.

**How to avoid:** In `TrailList`, read GPS position from the existing `useGeolocation` call at the appropriate level, or accept `userPosition` as a prop. Alternatively, lift the geolocation state up to `AppLayout` or a store. For Phase 3, the simplest fix: check if `useGeolocation` state is `idle` and call `locate()` once in TrailList's `useEffect`, or fall back to map center if position is unavailable without forcing a new permission prompt.

**Warning signs:** Two permission dialogs; TrailList showing wrong distances while MapControls shows correct position.

### Pitfall 2: `routes.find(r => r.id === id)` Returns Undefined

**What goes wrong:** User navigates directly to `/trails/abc` via a bookmark or share URL. `useTrailsStore.routes` is empty (not yet fetched for the current viewport). The `find` returns `undefined` and the detail page crashes or shows nothing.

**Why it happens:** Routes are fetched lazily on `moveend`. A cold navigation to a detail URL skips this flow.

**How to avoid:** Handle `route === undefined` with a fallback: show a loading skeleton, or show a "Trasa niedostępna — wróć do mapy" message with a back button. Don't fetch from Supabase in this phase (Phase 3 is display-only). The null case is expected and must be a graceful UI state, not a crash.

**Warning signs:** `Cannot read properties of undefined` errors in TrailDetail.

### Pitfall 3: Second Mapbox Instance Memory Leak

**What goes wrong:** `TrailDetailMap` component remounts (e.g., React Strict Mode double-invoke), creating two Mapbox instances. Only one is tracked in `mapRef`. The other leaks, consuming WebGL context budget.

**Why it happens:** Same root cause as Phase 1 MapView without the Strict Mode guard.

**How to avoid:** Use the identical double-init guard: `if (mapRef.current) return` as the first line of the `useEffect`. The cleanup function must call `mapRef.current?.remove(); mapRef.current = null`.

**Warning signs:** "Too many active WebGL contexts" console warning; map flickering on iOS.

### Pitfall 4: fitBounds on Non-LineString Geometry

**What goes wrong:** `route.geometry` may be a `Point`, `MultiLineString`, or `GeometryCollection`, not just `LineString`. Naively iterating `geometry.coordinates` fails.

**Why it happens:** OSM data produces varied geometry types. The Edge Function normalizes geometry but may produce any valid GeoJSON Geometry type.

**How to avoid:** Write a `computeBoundsFromGeometry(geometry)` helper that handles `Point`, `LineString`, `MultiLineString` via recursive coordinate flattening. Only `fitBounds` when a valid multi-coordinate geometry is found; otherwise just `flyTo` the `center_lat`/`center_lon` at a reasonable zoom.

### Pitfall 5: PTTK Trail Black Color on Dark Background

**What goes wrong:** `trail_color: 'black'` renders as `border-l-trail-black` where `--color-trail-black: #1A1A1A`. On `bg-bg-surface: #1C1F26`, the black border is invisible — same luminance.

**Why it happens:** Design token for trail-black was defined for map layers (where it contrasts against the Outdoors basemap), not for dark-mode card borders.

**How to avoid:** For the left border on dark cards, use a lighter variant for black trails — e.g., `#808080` (medium gray) or display with a subtle stroke/outline. The PTTK convention expects black to be visible — gray is a reasonable substitute in dark UI context. This is Claude's discretion per CONTEXT.md.

### Pitfall 6: `useMemo` Origin Array Causing Infinite Recompute

**What goes wrong:** `const origin = geoState.status === 'success' ? [...] : [...]` creates a new array reference every render. Passing `origin` as a `useMemo` dependency triggers the memo on every render, defeating the purpose.

**Why it happens:** Arrays are reference-compared in React.

**How to avoid:** Extract `originLat` and `originLon` as primitive numbers and use them as deps:
```typescript
const originLat = geoState.status === 'success' ? geoState.position.coords.latitude : center[1]
const originLon = geoState.status === 'success' ? geoState.position.coords.longitude : center[0]
const sorted = useMemo(() => ..., [routes, originLat, originLon])
```

---

## Code Examples

### Verified: Mapbox fitBounds Pattern

```typescript
// Source: Mapbox GL JS docs — LngLatBounds
function computeBoundsFromGeometry(geometry: GeoJSON.Geometry): mapboxgl.LngLatBounds | null {
  const coords = flattenCoords(geometry)
  if (coords.length < 2) return null
  const bounds = new mapboxgl.LngLatBounds(coords[0], coords[0])
  for (const c of coords) bounds.extend(c)
  return bounds
}

function flattenCoords(geom: GeoJSON.Geometry): [number, number][] {
  if (geom.type === 'Point') return [geom.coordinates as [number, number]]
  if (geom.type === 'LineString') return geom.coordinates as [number, number][]
  if (geom.type === 'MultiLineString')
    return geom.coordinates.flat() as [number, number][]
  if (geom.type === 'Polygon')
    return geom.coordinates.flat() as [number, number][]
  return []
}
```

### Verified: React Router v6 useParams

```typescript
// Source: React Router v6 docs
import { useParams, useNavigate } from 'react-router-dom'

export function TrailDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const route = useTrailsStore((s) => s.routes.find((r) => r.id === id))

  if (!route) {
    return <TrailDetailNotFound onBack={() => navigate(-1)} />
  }
  // ...
}
```

### Verified: Tailwind v4 Dynamic Color Classes

Tailwind v4 purges classes not found in source at build time. Dynamic class assembly like `` `border-l-trail-${route.trail_color}` `` WILL be purged unless the full class names appear somewhere in source.

**Solution — safelist via data attribute or explicit map:**

```typescript
// Use an explicit map — never dynamic string interpolation for purged utilities
const TRAIL_BORDER: Record<string, string> = {
  red: 'border-l-trail-red',
  blue: 'border-l-trail-blue',
  yellow: 'border-l-trail-yellow',
  green: 'border-l-trail-green',
  black: 'border-l-trail-black',
}

const borderClass = route.trail_color ? TRAIL_BORDER[route.trail_color] : undefined
```

This pattern ensures the full class strings appear in source and are not purged.

### Verified: useNavigate in Event Handler

```typescript
// Source: React Router v6 docs — imperative navigation
// TrailLayers.ts receives callback, does not import useNavigate
export function setupTrailInteractions(
  map: MapboxMap,
  onTrailClick: (id: string) => void
): void {
  map.on('click', 'trail-unclustered', (e) => {
    const id = e.features?.[0]?.properties?.id as string | undefined
    if (id) onTrailClick(id)
  })
}

// MapView.tsx — useNavigate available here
const navigate = useNavigate()
map.on('style.load', () => {
  initTrailLayers(map)
  setupTrailInteractions(map, (id) => navigate(`/trails/${id}`))
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `forwardRef` for ref passing | Ref as regular prop (React 19) | React 19 | Simpler component signatures |
| `tailwind.config.ts` colors | `@theme { --color-*: value }` in CSS | Tailwind v4 | Already established in this project |
| Dynamic Tailwind class strings | Explicit object maps for dynamic classes | Tailwind v2+ | Required for build-time purging |
| `useState` for map instance | `useRef` (established Phase 1) | Phase 1 of this project | Prevents WebGL leaks |

**Deprecated/outdated:**
- `mapboxgl.Popup().setHTML()` for interactive content: HTML strings cannot contain React event handlers. For Phase 3, replace with imperative navigation callback (shown above). The popup itself can be removed — just navigate directly on pin click.

---

## Open Questions

1. **Should TrailDetail fetch from Supabase when route is not in store?**
   - What we know: Phase 3 is display-only; routes are in `useTrailsStore` when navigating from TrailList or map pin. Cold URL navigation is possible.
   - What's unclear: Should Phase 3 handle cold URL navigation with a Supabase fetch, or is graceful "not found" sufficient?
   - Recommendation: Graceful "not found" for Phase 3. Adding a Supabase fetch in Phase 3 is premature — it adds scope and the feature is fully functional for normal navigation flows. Document the limitation.

2. **How to handle `useGeolocation` coordination between TrailList and MapControls?**
   - What we know: Both components need GPS position; the hook is local state.
   - What's unclear: Should we lift geolocation state to a Zustand store now or handle in Phase 3 with a fallback pattern?
   - Recommendation: In Phase 3, have TrailList use viewport store center as the sort origin (no GPS dependency). This avoids a store refactor and satisfies the requirement — "distance from user GPS location (if available) or map center (fallback)." GPS-accurate sort is a quality-of-life enhancement, not a hard requirement. If GPS state is already available from a prior `locate()` call, read it; otherwise use center.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run src/features/trails` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BROW-01 | Tab bar Trasy link navigates to /trails and TrailList renders | unit | `npx vitest run src/features/trails/TrailList.test.tsx` | ❌ Wave 0 |
| BROW-02 | TrailCard renders name, length, surface badge, water icon, difficulty badge, PTTK border | unit | `npx vitest run src/features/trails/TrailCard.test.tsx` | ❌ Wave 0 |
| BROW-03 | TrailDetail renders with route data; handles missing route gracefully | unit | `npx vitest run src/features/trails/TrailDetail.test.tsx` | ❌ Wave 0 |
| BROW-04 | Empty state renders when routes=[]; CTA dispatches zoom-out action | unit | `npx vitest run src/features/trails/TrailList.test.tsx` | ❌ Wave 0 |
| BROW-05 | TrailCard height ≤ 80px CSS structure (style snapshot or DOM check) | unit | `npx vitest run src/features/trails/TrailCard.test.tsx` | ❌ Wave 0 |
| haversine | haversineKm returns correct distance for known coordinate pairs | unit | `npx vitest run src/lib/haversine.test.ts` | ❌ Wave 0 |

Note: BROW-03 map inset (second Mapbox instance) is **manual-only** for testing — Mapbox GL JS requires a real WebGL context not available in jsdom. Test the data layer (route lookup, not-found handling) without rendering the map.

### Sampling Rate

- **Per task commit:** `npx vitest run src/features/trails`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/haversine.ts` — implementation (covers haversine sort logic)
- [ ] `src/lib/haversine.test.ts` — unit tests for haversine distance
- [ ] `src/features/trails/TrailCard.test.tsx` — covers BROW-02, BROW-05
- [ ] `src/features/trails/TrailList.test.tsx` — covers BROW-01, BROW-04
- [ ] `src/features/trails/TrailDetail.test.tsx` — covers BROW-03 (data layer, not map)

---

## Sources

### Primary (HIGH confidence)

- Project source code (`src/`) — direct inspection of all relevant files
- `src/index.css` — verified `trail-*` color tokens exist
- `src/stores/` — verified store interfaces (no haversine.ts found)
- `src/features/map/TrailLayers.ts` — verified `setupTrailInteractions` signature to update
- `src/router.tsx` — verified stub for `/trails` route that needs replacing
- `vitest.config.ts` — verified test infrastructure (jsdom, no tsx include yet)

### Secondary (MEDIUM confidence)

- Mapbox GL JS documentation (from Phase 1/2 established patterns) — WebGL context lifecycle, `fitBounds`, `LngLatBounds`
- React Router v6 `useParams`, `useNavigate` — standard hooks, well-established
- Tailwind CSS v4 purging behavior — class strings must appear verbatim in source

### Tertiary (LOW confidence)

- Browser WebGL context limit (16 Chrome, 8 iOS Safari) — commonly cited but varies by device/driver; the architectural mitigation (separate routes → unmount on navigation) is sound regardless of exact limit

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; no new deps
- Architecture: HIGH — patterns directly derived from existing code in the project
- Pitfalls: HIGH — 4 of 6 pitfalls are direct consequences of inspected code structure
- Test gaps: HIGH — confirmed by filesystem scan that no `src/features/trails/` files exist

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable libraries, 30-day horizon)
