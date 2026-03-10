# Architecture Patterns

**Domain:** Map-centric PWA — dog-friendly trail discovery
**Project:** Psi Szlak
**Researched:** 2026-03-11
**Overall confidence:** HIGH (codebase validated, patterns verified with official docs)

---

## Recommended Architecture

```
Browser
  └── React SPA (Vite + PWA shell)
        ├── Service Worker (Workbox)
        │     ├── Precache: static assets (JS/CSS/HTML/icons)
        │     ├── CacheFirst: Mapbox tiles (api.mapbox.com) — status [0, 200]
        │     └── NetworkFirst: trail JSON from Supabase (last 10 trails)
        │
        ├── Router (React Router v7)
        │     ├── AppLayout (BottomTabBar + Outlet)
        │     │     ├── /        → MapView (map feature)
        │     │     ├── /trails  → TrailList (trails feature)
        │     │     ├── /favorites → FavoritesList (favorites feature)
        │     │     └── /profile → ProfileView (profile feature)
        │     ├── /invite  → InviteGate (auth feature)
        │     └── /auth    → MagicLinkHandler (auth feature)
        │
        ├── Zustand Stores (ephemeral client state)
        │     ├── useViewportStore  [center, zoom, bounds]
        │     ├── useFiltersStore   [length, surface, water, difficulty, distance, marked]
        │     └── useUIStore        [viewMode, isFilterOpen]
        │
        ├── Custom Hooks (data + side-effect logic)
        │     ├── useMapInstance    [mapRef management, lifecycle]
        │     ├── useGeolocation    [navigator.geolocation]
        │     ├── useTrails         [bounds → Edge Function → Route[]]
        │     ├── useMapBounds      [map moveend → setBounds]
        │     ├── useAuth           [session, onAuthStateChange]
        │     ├── useFavorites      [CRUD via supabase client]
        │     └── useActivityLog    [insert walked entry]
        │
        └── Supabase JS Client (src/lib/supabase.ts)
              ├── Auth: magic link, session management
              ├── DB: direct table access (favorites, activity_log, users, invitations)
              └── Edge Functions: search-trails (POST)

Supabase Backend
  ├── PostgreSQL (6 tables, RLS on all)
  └── Edge Function: search-trails (Deno)
        ├── Validate JWT (Authorization header)
        ├── Parse bbox from request body
        ├── Check search_areas (exact bbox_hash match, TTL 7 days)
        ├── Cache hit → SELECT from routes WHERE bbox overlap
        ├── Cache miss → fetch Overpass API (with retry/backoff)
        │     ├── Retry: exponential backoff (1s, 2s, 4s), max 3 attempts
        │     ├── Timeout: 25s (Edge Function limit is 30s)
        │     └── Normalize OSM/PTTK response to Route shape
        ├── UPSERT routes, INSERT search_areas
        └── Return Route[] as JSON

External APIs
  ├── Mapbox (tiles, geocoding) — browser direct
  └── Overpass API — server-side via Edge Function only
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `MapView` (features/map) | Renders Mapbox map container div; owns map lifecycle via `useMapInstance` hook | `useViewportStore`, `useMapBounds`, `useTrails`, `MapControls` |
| `MapControls` (features/map) | Geolocate button, zoom controls, compass overlay | `useGeolocation`, `useViewportStore` |
| `LocationSearch` (features/map) | Mapbox Geocoding search bar overlay | Mapbox Geocoding API (direct fetch), `useViewportStore` |
| `TrailList` (features/trails) | Scrollable list of `TrailCard`s | `useTrails`, `useFiltersStore`, `useViewportStore` |
| `TrailCard` (features/trails) | Single trail summary row | `useFavorites`, router navigate |
| `TrailDetail` (features/trails) | Full trail view — map preview, stats, notes | `useTrails` (by id), `useFavorites`, `useActivityLog` |
| `FilterPanel` (features/trails) | 6-filter bottom sheet | `useFiltersStore`, `useUIStore` |
| `InviteGate` (features/auth) | Validates invite token; blocks unauthenticated access | Supabase Edge Function (validate-invite), `useAuth` |
| `MagicLinkHandler` (features/auth) | Handles magic link callback; exchanges token for session | `useAuth` |
| `OnboardingFlow` (features/onboarding) | 3-step wizard post-first-login | `useAuth`, Supabase (users table UPSERT), `useGeolocation` |
| `ProfileView` (features/profile) | User stats, invite generator, dog info | `useAuth`, Supabase (users, invitations, activity_log) |
| `useMapInstance` (hooks) | Encapsulates raw mapbox-gl map ref, init, cleanup | Returns `mapRef` — map instance for consumers |
| `useMapBounds` (hooks) | Subscribes to map `moveend`; writes bounds to viewport store | `useViewportStore`, `useMapInstance` |
| `useTrails` (hooks) | Debounced watcher on viewport bounds; calls Edge Function; returns `Route[]` + loading/error | `useViewportStore`, `useFiltersStore`, Supabase Edge Function |
| Service Worker | Intercepts network; serves cache-first tiles; network-first trail data | Workbox runtime routes |

---

## Mapbox GL JS Lifecycle in React

### The Core Problem

Raw `mapbox-gl` (v3.x — confirmed in package.json) is not React-aware. The `Map` constructor is imperative and mutates a DOM node. React's reconciler and the map's internal WebGL context must be carefully isolated.

### Recommendation: ref for map instance, ref for container

**Store the `Map` instance in a `useRef`, not `useState`.**

Rationale: Storing the instance in state causes a re-render on every `setMap()` call. A `Map` object changing reference does not mean the DOM has changed — React would tear down and rebuild the component tree unnecessarily. The map instance is a stable imperative handle, not declarative data.

```typescript
// src/hooks/useMapInstance.ts
export function useMapInstance(options: UseMapInstanceOptions) {
  const containerRef = useRef<HTMLDivElement>(null)  // DOM node ref
  const mapRef = useRef<mapboxgl.Map | null>(null)   // imperative instance ref

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: options.initialCenter,
      zoom: options.initialZoom,
      attributionControl: { compact: true }, // ToS compliance
    })

    mapRef.current = map
    options.onLoad?.(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // Empty dep array — map initializes once

  return { containerRef, mapRef }
}
```

### StrictMode Double-Mount Protection

React 18 StrictMode double-invokes effects in development. The guard `if (!containerRef.current || mapRef.current) return` prevents double initialization. The cleanup `map.remove(); mapRef.current = null` ensures the ref is cleared before the second mount attempt runs.

**Do not use `map._removed` internals** — use the `mapRef.current` null check instead.

### Event Listener Cleanup

Attach all map event listeners inside the same `useEffect` that creates the map, or in a separate `useEffect` that depends on `mapRef`. Always remove them in the cleanup:

```typescript
useEffect(() => {
  const map = mapRef.current
  if (!map) return

  const onMoveEnd = () => {
    const bounds = map.getBounds()
    setBounds({ north: bounds.getNorth(), south: bounds.getSouth(),
                 east: bounds.getEast(), west: bounds.getWest() })
    setCenter([map.getCenter().lng, map.getCenter().lat])
    setZoom(map.getZoom())
  }

  map.on('moveend', onMoveEnd)
  return () => { map.off('moveend', onMoveEnd) }
}, [mapRef.current]) // Re-run if map instance changes (rare)
```

### Source and Layer Management

Add GeoJSON sources and layers **inside `map.on('load', ...)`**, not immediately after construction. The map style must finish loading before sources can be added:

```typescript
map.on('load', () => {
  map.addSource('trails', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer({ id: 'trails-line', type: 'line', source: 'trails', ... })
})
```

To update trail data, use `getSource('trails').setData(geojson)` — do not remove/re-add the source.

---

## Zustand Store Design

### Existing Store Inventory (confirmed from codebase)

Three stores are scaffolded and well-structured. The main design concern is the interaction between the viewport store and the map instance.

**`useViewportStore`** — `center`, `zoom`, `bounds | null`
**`useFiltersStore`** — 6 filter fields, `resetAll()`
**`useUIStore`** — `viewMode`, `isFilterOpen`

### The Viewport Sync Problem

The viewport store holds `center`, `zoom`, and `bounds`. The map instance (in a ref) has its own internal camera state. These must stay in sync without creating feedback loops.

**Recommended pattern: map is source of truth for camera, store is observer.**

- User pans/zooms → map emits `moveend` → `useMapBounds` hook reads map state → writes to `useViewportStore`
- Do NOT write back from the store to the map on `moveend` — this creates an infinite loop
- Only write from store to map for programmatic navigation (e.g., geolocation, search result jump):

```typescript
// In LocationSearch or geolocation handler — EXPLICIT navigation only
const map = mapRef.current
if (map) {
  map.flyTo({ center: [lng, lat], zoom: 14 })
  // Map will emit moveend, which updates the store
}
```

### Derived Trail Query

`useTrails` must watch BOTH `bounds` and filters to trigger re-fetches. Subscribe to both stores:

```typescript
// In useTrails hook
const bounds = useViewportStore((s) => s.bounds)
const filters = useFiltersStore()

useEffect(() => {
  if (!bounds) return
  // debounce 400ms then call Edge Function
}, [bounds, filters.length, filters.surface, filters.water,
    filters.difficulty, filters.distance, filters.marked])
```

Use granular selector subscriptions on `useFiltersStore` to avoid re-renders on unrelated store writes. Alternatively, extract a stable `filtersHash` value via `JSON.stringify(filters)` and use that as the dependency.

### Missing Field: `water_access` in `Route` type

The `Route` interface in `src/lib/types.ts` declares `water_access: boolean | null` but per `PROJECT.md` this must be `'none' | 'nearby' | 'on_route'`. This is a known pending migration. The `useFiltersStore.water` filter (`'required' | 'preferred' | 'any'`) also needs mapping logic to convert to the `water_access` enum for DB queries. This must be resolved before the trail pipeline phase.

---

## Supabase Edge Function Patterns

### `search-trails` Architecture

The Edge Function is the only piece of server-side logic in the project. It acts as a caching proxy between the frontend and Overpass API.

```typescript
// supabase/functions/search-trails/index.ts — pattern skeleton

Deno.serve(async (req) => {
  // 1. CORS preflight — MUST be first
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 2. Auth: verify JWT from Authorization header
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  // use jose to verify against Supabase JWT secret, or use
  // createClient with the user's JWT to let RLS handle authorization

  // 3. Parse request
  const { north, south, east, west } = await req.json()
  const bboxHash = computeBboxHash(north, south, east, west)

  // 4. Cache check
  const { data: cached } = await supabaseAdmin
    .from('search_areas')
    .select('id')
    .eq('bbox_hash', bboxHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (cached) {
    // 5a. Cache hit — return routes from DB
    const { data: routes } = await supabaseAdmin
      .from('routes')
      .select('*')
      .filter('...bbox overlap...')
    return new Response(JSON.stringify(routes), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 5b. Cache miss — fetch Overpass with retry
  const osm = await fetchOverpassWithBackoff({ north, south, east, west })

  // 6. Normalize + upsert
  const normalized = normalizeOsmRoutes(osm)
  await supabaseAdmin.from('routes').upsert(normalized, { onConflict: 'source_id' })
  await supabaseAdmin.from('search_areas').insert({ bbox_hash: bboxHash, north, south, east, west,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })

  return new Response(JSON.stringify(normalized), { ... })
})
```

### Overpass Rate Limiting (Backoff Pattern)

Overpass API is community infrastructure. The project notes state debounce on the frontend + exponential backoff + max 1 concurrent in the Edge Function.

```typescript
async function fetchOverpassWithBackoff(bbox, maxRetries = 3): Promise<OsmResult> {
  const query = buildOverpassQuery(bbox)

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await delay(Math.pow(2, attempt - 1) * 1000) // 0ms, 1000ms, 2000ms
    }

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(20_000), // 20s timeout, leave 10s for DB ops
    })

    if (res.status === 429 || res.status === 503) continue // retry on rate limit
    if (!res.ok) throw new Error(`Overpass error: ${res.status}`)
    return await res.json()
  }
  throw new Error('Overpass API unavailable after retries')
}
```

Edge Function execution limit is 150s (Supabase free tier). Budget: 20s Overpass timeout, 3 retries with backoff = max ~65s worst case. Well within limits.

### CORS Headers

Every Edge Function response must include CORS headers manually. Supabase does NOT inject them automatically:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // or restrict to your Vercel domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
```

CORS preflight (`OPTIONS`) check must be the first handler in the function — before any auth, before any logic. A thrown exception before the OPTIONS return will prevent the CORS headers from being sent, breaking the browser request.

### JWT Validation

Per Supabase's current documentation (2026), the old `verify_jwt` flag is being deprecated in favor of explicit JWT verification. Recommended approach for this project: pass the user's Supabase anon-key JWT in the `Authorization` header, and create a `supabaseClient` from it to leverage RLS, rather than manually verifying the JWT:

```typescript
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
)
// Now all queries via supabaseClient respect RLS policies
```

Use `supabaseAdmin` (service role key) only for operations that need to bypass RLS (e.g., upserting routes, inserting search_areas).

---

## Service Worker Caching Strategy

### Current Configuration (from vite.config.ts)

The existing config is mostly correct but needs two fixes:

```typescript
// vite.config.ts — current (partial)
runtimeCaching: [
  {
    urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'mapbox-tiles',
      expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
      // MISSING: cacheableResponse plugin — needed for opaque responses
    },
  },
],
```

### Fix 1: Opaque Response Handling for Mapbox Tiles

Mapbox tile requests are cross-origin. The browser issues them without CORS headers, so responses are "opaque" — status code 0, body unreadable by the service worker. By default, Workbox's `CacheFirst` strategy does NOT cache status-0 responses.

Add `CacheableResponsePlugin` with status `[0, 200]`:

```typescript
{
  urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'mapbox-tiles',
    expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
    cacheableResponse: { statuses: [0, 200] }, // required for opaque responses
  },
}
```

**Risk:** Opaque responses use ~7MB of cache quota per entry (Chrome security padding). With 500 entries this could be ~3.5GB — reduce `maxEntries` to 200 for safety (~1.4GB realistic worst case, but tiles are shared/deduplicated by URL). In practice Mapbox tiles are small and the padding is per-unique-response not per byte, so 200 entries is the safe ceiling.

### Fix 2: Trail Data Caching (missing entirely)

The current config has no runtime cache for Supabase Edge Function responses. Add `NetworkFirst` with a 10-entry limit to match the "last 10 trails cached" requirement:

```typescript
{
  urlPattern: ({ url }) => url.hostname.includes('supabase.co') && url.pathname.includes('search-trails'),
  handler: 'NetworkFirst',
  options: {
    cacheName: 'trail-data',
    networkTimeoutSeconds: 5,
    expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }, // 24h
    cacheableResponse: { statuses: [200] },
  },
}
```

`NetworkFirst` is correct here: trail data should be fresh when online, but stale is acceptable when offline. The 5s timeout ensures that slow networks fall through to cache quickly rather than making the user wait.

### Complete Recommended Cache Strategy

| Resource | Strategy | TTL | Max Entries | Rationale |
|----------|----------|-----|-------------|-----------|
| Static assets (JS/CSS/HTML) | Precache (Workbox) | version-locked | all | App shell must work offline |
| Mapbox tiles (api.mapbox.com) | CacheFirst | 7 days | 200 | Tiles don't change; offline map use |
| Trail data (supabase Edge Fn) | NetworkFirst, 5s timeout | 24h | 10 | Fresh when online, stale acceptable offline |
| Geocoding (api.mapbox.com/geocoding) | NetworkFirst | — | — | Search results must be fresh; no offline need |
| Supabase Auth/DB reads | Not cached | — | — | RLS-sensitive, cannot safely cache |

---

## Data Flow

### Primary Flow: Trail Discovery

```
User pans map
  → map emits 'moveend'
  → useMapBounds: reads getBounds() + getCenter() + getZoom()
  → useViewportStore.setBounds(newBounds) [Zustand write]
  → useTrails: useEffect fires (deps: bounds, filters)
  → debounce 400ms (prevents rapid pan triggers)
  → POST supabase.functions.invoke('search-trails', { body: bbox })
  → Edge Function: cache check → Overpass fetch if needed → return Route[]
  → useTrails: setState(routes) [local React state in hook]
  → MapView: getSource('trails').setData(routesToGeoJSON(routes))
  → TrailList: re-renders with filtered + sorted routes
```

### Filter Change Flow

```
User taps filter chip
  → useFiltersStore.setX(value) [Zustand write]
  → useTrails useEffect fires (bounds unchanged, filters changed)
  → debounce 400ms
  → Re-calls Edge Function with same bbox, different filter params
  (Note: filters applied server-side OR client-side from cached route data)
```

**Filter application decision:** Apply filters client-side when the current `routes` array is already loaded (same bounds, only filter changed). Apply server-side (re-fetch) only when bounds change or the filter requires a fresh Overpass query. This prevents unnecessary Edge Function calls.

### Auth State Flow

```
App mount
  → useAuth: supabase.auth.onAuthStateChange()
  → session present → render main app
  → session absent → navigate('/auth')
  → '/auth' renders InviteGate if no token, or MagicLinkHandler if token present
```

### Favorites Flow

```
User taps heart on TrailCard
  → useFavorites.toggle(routeId)
  → optimistic update (add to local favorites set)
  → supabase.from('favorites').insert/delete
  → on error: rollback optimistic update + toast
```

---

## Suggested Build Order

Dependencies drive order. Each phase builds on the contracts established by previous phases.

### Phase 1: Map Core (prerequisite for everything)

**What:** `useMapInstance`, `MapView` container, `useMapBounds` writing to viewport store.
**Why first:** Every other feature either renders on the map or depends on viewport bounds. The map must be stable before layers, sources, or data queries are added.
**Contract established:** `useViewportStore.bounds` is reliably populated after map mount.

### Phase 2: Trail Data Pipeline (prerequisite for display)

**What:** `search-trails` Edge Function (Overpass fetch, normalization, cache), `useTrails` hook with debounce.
**Why second:** No trail UI is possible without data. Building the Edge Function and hook before UI enables testing the data shape independently.
**Contract established:** `useTrails` returns `Route[]` given bounds. GeoJSON layer added to map.
**Blocker:** `water_access` type migration must be done before this phase (bool → text enum).

### Phase 3: Trail Display + Browsing

**What:** Trail polylines on map (PTTK colors), `TrailCard`, `TrailList`, `TrailDetail`, map/list toggle.
**Why third:** Depends on Phase 1 (map canvas) and Phase 2 (data).
**Contract established:** Users can see and tap trails.

### Phase 4: Filters

**What:** `FilterPanel`, filter-to-query mapping, active filter count badge.
**Why fourth:** Filters require a working trail list to be meaningful. The `useFiltersStore` is already scaffolded.
**Decision required:** Client-side filter application for same-bounds changes (avoid extra Edge Function calls).

### Phase 5: Auth + Onboarding

**What:** `InviteGate`, `MagicLinkHandler`, `OnboardingFlow`, auth guard on all routes.
**Why fifth:** Can be developed independently of map/trail phases. Placed here because a working app is needed to test the full onboarding-to-map flow.
**Note:** Auth must gate the entire app — all previous phases assume an authenticated user.

### Phase 6: Favorites + Activity Log

**What:** `FavoritesList`, favorite toggle on TrailCard, notes on TrailDetail, `useActivityLog`, "Przeszlem!" button.
**Why sixth:** Depends on auth (Phase 5) and trail detail view (Phase 3). Pure Supabase CRUD — no new architectural complexity.

### Phase 7: PWA Hardening + Offline

**What:** Fix `cacheableResponse` for Mapbox tiles, add trail data `NetworkFirst` cache, offline banner, GPS fallback.
**Why last:** Offline scenarios require a working app to test. The service worker config exists but is incomplete (see fixes above).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Map Instance in useState

**What goes wrong:** `useState(null)` for the Map instance triggers a React re-render when `setMap(instance)` is called, which can cause the containing component to unmount/remount — destroying the map canvas.
**Instead:** `useRef(null)` — the ref is stable across renders, map canvas persists.

### Anti-Pattern 2: Writing Viewport Store on Every Map Event

**What goes wrong:** Subscribing to `map.on('move', ...)` (fires continuously during pan/zoom) and writing to Zustand on every frame causes hundreds of store updates per second, triggering re-renders in every component subscribed to the store.
**Instead:** Use `map.on('moveend', ...)` — fires once after the camera settles. For the trail fetch, add a 400ms debounce on top.

### Anti-Pattern 3: Filtering in the Edge Function for Every Keypress

**What goes wrong:** Calling the Edge Function for every filter chip toggle (even when bounds haven't changed) exhausts Supabase free tier invocation quotas (500,000/month) and adds 300-500ms latency per filter interaction.
**Instead:** Cache the `Route[]` for current bounds in hook state. Apply filters client-side (Array.filter) for same-bounds interactions. Only re-invoke Edge Function when bounds change.

### Anti-Pattern 4: Adding Map Sources/Layers Before Style Load

**What goes wrong:** Calling `map.addSource()` before the style has loaded throws `Error: Style is not done loading`. This is especially common when navigating away and back to the map tab.
**Instead:** All `addSource`/`addLayer` calls go inside `map.on('load', callback)`. Check `map.isStyleLoaded()` before programmatic source updates.

### Anti-Pattern 5: Caching Supabase Auth Responses in Service Worker

**What goes wrong:** Caching auth token refresh responses or RLS-protected queries means users could see stale or wrong-user data when offline, and token expiry is invisible.
**Instead:** Exclude all `supabase.co/auth` and direct table reads (`/rest/v1/`) from runtime caching. Only cache the Edge Function response for trail data.

### Anti-Pattern 6: CORS Check After Logic in Edge Function

**What goes wrong:** If any code runs before the OPTIONS preflight handler (auth verification, JSON parsing), exceptions there prevent CORS headers from being sent, breaking all browser requests with an opaque network error.
**Instead:** OPTIONS check is always the first branch in the Deno handler, before any other logic.

---

## Cross-Cutting Concerns

### Type Drift: `water_access`

The `Route` interface in `src/lib/types.ts` has `water_access: boolean | null`. The schema and PRD require `'none' | 'nearby' | 'on_route'`. The filter store's `WaterFilter` type (`'required' | 'preferred' | 'any'`) must map to this enum. This type discrepancy will cause TypeScript errors as soon as the trail pipeline is built — fix the type and migration before Phase 2.

### Missing Schema Fields

Per `PROJECT.md`, these columns need migrations before their features are built:
- `routes.source` (`'osm' | 'pttk'`) — needed for Phase 2 normalization
- `routes.water_type` (`'river' | 'lake' | 'stream'`) — needed for Phase 2
- `invitations.used_at` — needed for Phase 5 auth

### Map Tab Re-Mount Behavior

When the user navigates between tabs and returns to the map (`/`), React Router unmounts and remounts `MapView`. The cleanup in `useMapInstance` will call `map.remove()`, and the next mount will reinitialize the map. This is correct behavior but means the map position resets to the store's last `center`/`zoom` — which is populated from the store, so position is preserved if `useMapInstance` reads initial values from `useViewportStore`.

---

## Sources

- [Mapbox GL JS with React — Official Tutorial](https://docs.mapbox.com/help/tutorials/use-mapbox-gl-js-with-react/) — MEDIUM confidence (official Mapbox, patterns consistent with mapbox-gl v3)
- [react-map-gl State Management](https://visgl.github.io/react-map-gl/docs/get-started/state-management) — MEDIUM confidence (not used in this project but patterns apply to controlled map sync)
- [Supabase Edge Functions — Official Docs](https://supabase.com/docs/guides/functions) — HIGH confidence
- [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth) — HIGH confidence
- [Workbox Caching Strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview) — HIGH confidence (official Chrome Developers)
- [workbox-cacheable-response module](https://developer.chrome.com/docs/workbox/modules/workbox-cacheable-response) — HIGH confidence (resolves opaque response issue)
- [vite-plugin-pwa generateSW](https://vite-pwa-org.netlify.app/workbox/generate-sw) — HIGH confidence (official vite-plugin-pwa docs)
- [Opaque responses in Service Worker](https://whatwebcando.today/articles/opaque-responses-service-worker/) — MEDIUM confidence
- [Zustand Architecture Patterns at Scale](https://brainhub.eu/library/zustand-architecture-patterns-at-scale) — MEDIUM confidence
- [React StrictMode + useRef cleanup issue](https://github.com/facebook/react/issues/26315) — HIGH confidence (official React repo issue)
- [Supabase Rate Limiting Edge Functions](https://supabase.com/docs/guides/functions/examples/rate-limiting) — HIGH confidence

---

*Architecture research: 2026-03-11*
