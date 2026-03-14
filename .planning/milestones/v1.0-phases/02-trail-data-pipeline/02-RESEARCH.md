# Phase 2: Trail Data Pipeline - Research

**Researched:** 2026-03-13
**Domain:** Overpass API, Supabase Edge Functions (Deno), Mapbox GL JS GeoJSON layers
**Confidence:** HIGH (core patterns), MEDIUM (Overpass query geometry handling)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Trail pin appearance**
- Minimal colored dots (not icon pins) — Strava-minimal aesthetic
- Non-PTTK trails use accent gold (#C9A84C) dots
- PTTK trails use their `trail_color` for the dot
- Clustering: numbered cluster circles showing count (e.g. "12"), expand on zoom (standard Mapbox GL clustering)
- Tapping a pin shows a small popup/tooltip with the trail name (Phase 3 adds full TrailDetail navigation)

**PTTK polyline rendering**
- Medium line weight (4-5px) — visible without dominating the map
- Dark outline (casing) around the colored fill line — standard hiking map depth effect, stands out on varied terrain
- Tapping a polyline shows the same name popup as pins — consistent interaction
- When a PTTK trail has both geometry (polyline) and center point: show BOTH pin and polyline — pin marks center for discoverability at low zoom, polyline shows route at higher zoom

**Loading & error states**
- Subtle thin progress bar at the very top of the map during trail fetch (like YouTube/GitHub loading bar) — doesn't block map interaction
- On fetch failure: Polish toast "Nie udało się pobrać tras" with "Spróbuj ponownie" retry button in toast — matches Phase 1 GPS denial toast pattern
- Existing trail pins stay visible while new area loads — pins accumulate as user explores, map feels alive
- When panning to an area with zero trails: nothing happens, just no pins appear — absence is the message

**Cache & freshness**
- 7-day TTL auto-expiry from requirements — no user action needed
- Small muted timestamp text at bottom-left of map: "Zaktualizowano: X dni temu"
- Small refresh icon next to the timestamp — tapping forces re-fetch of current viewport (bypasses cache)

### Claude's Discretion
- Exact dot size and cluster circle styling
- Progress bar color and animation
- Popup/tooltip styling and positioning
- Polyline casing width ratio
- Timestamp text size and exact formatting
- Refresh icon design

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PIPE-01 | Edge Function `/search-trails` accepts POST with bbox, checks `search_areas` by `bbox_hash`, returns cached routes on hit | Supabase Edge Function Deno.serve pattern; service role client for DB access; `search_areas` table already has `bbox_hash unique` index |
| PIPE-02 | On cache miss, Edge Function queries Overpass API for hiking routes, footpaths, nature reserves, and PTTK relations within bbox | Overpass QL `[out:json][timeout:25]` pattern; `relation["route"="hiking"](bbox); out geom;` returns geometry inline |
| PIPE-03 | Overpass query excludes primary/secondary/tertiary roads, residential/commercial areas, `dogs=no` trails | Overpass QL `["highway"!~"primary|secondary|tertiary"]` and `["dogs"!="no"]` tag filter syntax |
| PIPE-04 | Edge Function normalizes results per schema: `surface_type`, `difficulty`, `water_access` (via Overpass `around:200`), `trail_color`, `source`, `water_type` | Overpass `around:200` subquery for water features; `osmc:symbol` / `colour` tags contain trail color; `operator` tag identifies PTTK |
| PIPE-05 | Edge Function upserts to `routes` (dedupe on `source_id`), inserts to `search_areas` with 7-day TTL | Supabase service role client `upsert` with `onConflict: 'source_id'`; `search_areas` default TTL already defined in schema |
| PIPE-06 | Overpass queries include `[timeout:25]`; Edge Function uses AbortController with 20s per attempt, max 2 retries with exponential backoff | Native `fetch` in Deno; AbortController; retry loop with `await new Promise(r => setTimeout(r, delay))` |
| PIPE-07 | Frontend calls Edge Function on `moveend` with 400ms debounce via `useTrails` hook | `useViewportStore` bounds already populated by `moveend` handler in MapView; `useEffect` + `setTimeout` debounce pattern |
| PIPE-08 | Trail markers render as clustered pins on map; clusters expand on zoom | Mapbox GL JS `cluster: true` on GeoJSON source; `addLayer` with `circle` type and `['has', 'point_count']` filter; `getClusterExpansionZoom` on click |
| PIPE-09 | PTTK trails render as colored polylines matching `trail_color` | Two `line` layers per PTTK source: casing layer (dark, wider) + fill layer (trail_color, 4-5px); `match` expression for colors |
| PIPE-10 | Loading state shown during trail fetch; error state with retry button on failure | CSS-only progress bar div with animation; existing Toast component from Phase 1; retry via re-invocation of fetch function |
</phase_requirements>

---

## Summary

Phase 2 builds the full data pipeline from OpenStreetMap → Supabase → Mapbox GL JS layers. The work splits cleanly into two plans: (1) the server-side Supabase Edge Function that fetches from Overpass, normalizes, and caches; (2) the client-side `useTrails` hook plus Mapbox GL JS layer setup.

The Overpass API returns relation data with inline geometry when using `out geom` — no separate way/node resolution is needed for most hiking routes. The critical complexity is in the Overpass query itself: separating PTTK route relations from bare footway ways, extracting color from `osmc:symbol` or `colour` tags, and handling the water proximity sub-query via `around:200`. The Supabase Edge Function runs on Deno with native `fetch` — no heavy dependencies needed.

On the client side, Mapbox GL JS's built-in clustering handles PIPE-08 natively via `cluster: true` on the GeoJSON source. PTTK polylines use the standard two-layer casing pattern (dark wide layer underneath, colored fill layer on top). The `useTrails` hook subscribes to `useViewportStore` bounds, debounces by 400ms, calls the Edge Function via `supabase.functions.invoke`, and stores results in a local Zustand slice.

**Primary recommendation:** Keep the Overpass query simple — one pass for route relations, one pass for footway ways, union them in Overpass QL. Do not attempt complex proximity joins server-side. Normalize in the Edge Function TypeScript, not in Overpass.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `jsr:@supabase/supabase-js@2` | 2.x | Supabase client inside Edge Function (service role) | JSR import is preferred over esm.sh in Deno per official docs |
| Overpass API | Public endpoint | OSM data source | Single authoritative source for hiking data in Poland |
| Mapbox GL JS | 3.19.1 (already installed) | GeoJSON source + layer rendering | Already in use; cluster + line + circle layer support |
| Zustand | 5.x (already installed) | Trail client state store | Consistent with viewport/filters/ui stores |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `fetch` + `AbortController` | Deno built-in | Overpass HTTP call with timeout | Always — no axios needed in Edge Functions |
| `@types/geojson` | 7946.x (already installed) | Type-safe GeoJSON geometry in normalization | Already a dev dep; use for geometry typing in Edge Function shared types |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Deno native fetch | `npm:node-fetch` | Native fetch is faster cold-start, fewer bytes — use native |
| Two Mapbox line layers for casing | Single layer + `line-gap-width` | `line-gap-width` creates inner gap for road-style, not a dark border — use two layers |
| Zustand trail store | React useState in hook | Zustand keeps trail data accessible to sibling components (e.g., future TrailList) without prop drilling |
| CSS-only progress bar | NProgress/BProgress library | CSS-only is simpler, no new dependency, sufficient for this use case |

**Installation:** No new packages needed. All dependencies already present.

---

## Architecture Patterns

### Recommended Project Structure

```
supabase/functions/
  _shared/
    cors.ts          # CORS headers helper (reused across functions)
  search-trails/
    index.ts         # Edge Function entry point

src/
  features/map/
    MapView.tsx      # Add trail layer init (useEffect on map load)
    TrailLayers.tsx  # (optional) extracted layer setup component
    CacheTimestamp.tsx  # Bottom-left "Zaktualizowano" + refresh icon
  hooks/
    useTrails.ts     # Debounce, invoke Edge Function, manage loading/error
  stores/
    trails.ts        # Zustand store: routes[], loading, error, lastFetched
```

### Pattern 1: Supabase Edge Function Structure

**What:** Deno server function using native `Deno.serve`, service role Supabase client for DB, native `fetch` for Overpass
**When to use:** Any Supabase Edge Function that reads/writes to the database

```typescript
// Source: https://supabase.com/docs/guides/getting-started/ai-prompts/edge-functions
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { north, south, east, west } = await req.json()

  // 1. Check cache
  // 2. Fetch Overpass on miss
  // 3. Normalize + upsert
  // 4. Return routes

  return new Response(JSON.stringify({ routes }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
```

### Pattern 2: Overpass QL Query for Polish Hiking Routes

**What:** Single QL query that retrieves hiking route relations with inline geometry
**When to use:** Cache miss in Edge Function

```
[out:json][timeout:25][bbox:${south},${west},${north},${east}];
(
  relation["route"="hiking"]["dogs"!="no"];
  relation["route"="foot"]["dogs"!="no"];
  way["highway"="footway"]["dogs"!="no"]["highway"!~"primary|secondary|tertiary"];
  way["highway"="path"]["dogs"!="no"];
);
out geom;
```

**Notes on this query:**
- `[bbox:...]` in the settings block applies globally — all statements use it
- `out geom` returns inline coordinates for ways; for relations, `members` array contains way geometries
- The `bbox` in settings is format `south,west,north,east` (lat/lon order, not Mapbox's lng/lat)
- `["dogs"!="no"]` excludes explicitly dog-prohibited paths; absence of tag = dogs allowed (conservative assumption is fine)

### Pattern 3: PTTK Color Extraction from OSM Tags

**What:** Normalize `osmc:symbol` or `colour` tag to project's `TrailColor` enum
**When to use:** During normalization of every Overpass element in Edge Function

```typescript
// Source: OSM Wiki https://wiki.openstreetmap.org/wiki/Key:osmc:symbol
// PTTK uses osmc:symbol=blue:white:blue_bar OR colour=blue
function extractTrailColor(tags: Record<string, string>): TrailColor | null {
  // Check osmc:symbol first (e.g. "blue:white:blue_bar")
  const osmc = tags['osmc:symbol']
  if (osmc) {
    const waycolor = osmc.split(':')[0]?.toLowerCase()
    if (['red', 'blue', 'yellow', 'green', 'black'].includes(waycolor)) {
      return waycolor as TrailColor
    }
  }
  // Fallback to colour tag
  const colour = tags['colour']?.toLowerCase()
  if (colour && ['red', 'blue', 'yellow', 'green', 'black'].includes(colour)) {
    return colour as TrailColor
  }
  return null
}
```

### Pattern 4: PTTK Source Detection

```typescript
function isPTTK(tags: Record<string, string>): boolean {
  const operator = (tags['operator'] || '').toLowerCase()
  const network = tags['network'] || ''
  // PTTK trails tagged with operator="PTTK ..." or network=rwn/lwn/nwn with Polish context
  return operator.includes('pttk') || ['rwn', 'lwn', 'nwn'].includes(network)
}
```

### Pattern 5: Mapbox GL JS Cluster Setup

**What:** GeoJSON source with clustering + three layers (clusters, counts, unclustered)
**When to use:** After map `load` event in MapView / TrailLayers

```typescript
// Source: https://docs.mapbox.com/mapbox-gl-js/example/cluster/
map.addSource('trails', {
  type: 'geojson',
  data: { type: 'FeatureCollection', features: [] },
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50,
})

// Cluster circles
map.addLayer({
  id: 'trail-clusters',
  type: 'circle',
  source: 'trails',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': '#C9A84C', // accent gold
    'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 50, 28],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#111318',
  }
})

// Cluster count label
map.addLayer({
  id: 'trail-cluster-count',
  type: 'symbol',
  source: 'trails',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-size': 12,
  },
  paint: { 'text-color': '#111318' }
})

// Unclustered pins — color driven by trail_color or accent gold
map.addLayer({
  id: 'trail-unclustered',
  type: 'circle',
  source: 'trails',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'match', ['get', 'trail_color'],
      'red',    '#C0392B',
      'blue',   '#2980B9',
      'yellow', '#F1C40F',
      'green',  '#27AE60',
      'black',  '#2C3E50',
      '#C9A84C' // default: accent gold
    ],
    'circle-radius': 6,
    'circle-stroke-width': 1.5,
    'circle-stroke-color': '#111318',
  }
})
```

### Pattern 6: PTTK Polyline Casing (Two-Layer)

**What:** Two line layers sharing one GeoJSON source — casing (dark, wide) + fill (colored)
**When to use:** After map loads; separate source `trails-lines` for LineString features

```typescript
// Source: https://docs.mapbox.com/mapbox-gl-js/example/geojson-line/ + casing pattern
map.addSource('trails-lines', {
  type: 'geojson',
  data: { type: 'FeatureCollection', features: [] },
})

// Casing layer — rendered first (below fill)
map.addLayer({
  id: 'trail-line-casing',
  type: 'line',
  source: 'trails-lines',
  layout: { 'line-join': 'round', 'line-cap': 'round' },
  paint: {
    'line-color': '#1a1a1a',
    'line-width': 7, // wider than fill to create casing effect
  }
})

// Fill layer — rendered on top
map.addLayer({
  id: 'trail-line-fill',
  type: 'line',
  source: 'trails-lines',
  layout: { 'line-join': 'round', 'line-cap': 'round' },
  paint: {
    'line-color': [
      'match', ['get', 'trail_color'],
      'red',    '#C0392B',
      'blue',   '#2980B9',
      'yellow', '#F1C40F',
      'green',  '#27AE60',
      'black',  '#2C3E50',
      '#C9A84C'
    ],
    'line-width': 4,
  }
})
```

### Pattern 7: useTrails Hook with Debounce

**What:** Subscribe to viewport bounds, debounce 400ms, call Edge Function, populate Zustand trail store
**When to use:** Mounted once in MapView or App-level

```typescript
// Subscribes to viewport bounds (already synced by MapView moveend handler)
export function useTrails() {
  const bounds = useViewportStore((s) => s.bounds)
  const { setRoutes, setLoading, setError } = useTrailsStore()

  useEffect(() => {
    if (!bounds) return

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase.functions.invoke('search-trails', {
          body: bounds,
        })
        if (error) throw error
        setRoutes(data.routes)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [bounds, setRoutes, setLoading, setError])
}
```

### Pattern 8: Bbox Hash for Cache Key

**What:** Stable string key for `search_areas.bbox_hash` — round bbox to 2 decimal places for reasonable cache area size (~1km²)
**When to use:** Both in Edge Function (cache check/insert) and never on frontend

```typescript
function bboxHash(n: number, s: number, e: number, w: number): string {
  const r = (v: number) => Math.round(v * 100) / 100
  return `${r(s)},${r(w)},${r(n)},${r(e)}`
}
```

**Note:** 2 decimal places ≈ 1.1km precision — large enough for reasonable cache hits during normal pan, small enough not to overfetch.

### Pattern 9: AbortController with Retry

```typescript
async function fetchOverpass(query: string, attempt = 0): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return res
  } catch (err) {
    clearTimeout(timeout)
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
      return fetchOverpass(query, attempt + 1)
    }
    throw err
  }
}
```

### Anti-Patterns to Avoid

- **Do NOT use `map.on('load', ...)` for layer setup if the map may already be loaded:** After the initial load, calling `addSource`/`addLayer` is safe any time. Check `map.isStyleLoaded()` if called after initial setup. Use `map.once('load', ...)` during initialization.
- **Do NOT pass raw Mapbox bounds object to Edge Function:** Destructure `{ north, south, east, west }` explicitly — bounds object has methods that don't serialize to JSON.
- **Do NOT call `addSource` if it already exists:** Check `map.getSource('trails')` before adding — React StrictMode double-invocation will throw otherwise.
- **Do NOT import supabase-js via esm.sh in Edge Functions:** Use `jsr:@supabase/supabase-js@2` — official recommendation as of 2025.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Point clustering | Custom grid aggregation | Mapbox GL JS `cluster: true` on GeoJSON source | Handles zoom-based expansion, count aggregation, click-to-expand natively |
| Polyline rendering | SVG overlay | Mapbox GL JS `line` layer | Hardware-accelerated, respects map tilt/rotation, correct z-ordering |
| Bbox cache lookup | PostgreSQL spatial extension | Exact `bbox_hash` string match on `search_areas` | Requirements explicitly confirm spatial containment is out of scope; simple unique index sufficient |
| Overpass result → GeoJSON | Third-party OSM converter library | Inline normalization in Edge Function | The conversion is ~50 lines; no library needed, avoids cold start weight |
| Progress bar | NProgress or BProgress library | CSS animation on a `<div>` | No new dependency; matches the "thin bar at top of map" constraint |

**Key insight:** OSM data is deceptively complex (relation members, recursive geometry) but Overpass `out geom` resolves most of it server-side. The normalization is the hard part — budget more time for edge cases in PIPE-04 than for the fetch mechanics.

---

## Common Pitfalls

### Pitfall 1: Overpass Relation Geometry — `out geom` vs recursive descent

**What goes wrong:** Querying `relation["route"="hiking"]; out geom;` returns the relation with member geometries inline. But `out body;` without `geom` returns only member IDs — the geometry is absent. Developer writes normalization code assuming coordinates are present, gets `undefined`.

**Why it happens:** OSM relations are topological references, not geometric objects. `geom` flag tells Overpass to materialize coordinates.

**How to avoid:** Always use `out geom;` (not `out body;` or `out skel;`) in the final output statement.

**Warning signs:** `element.geometry` is `undefined` in the normalized result; `members[i].geometry` is missing.

### Pitfall 2: Bbox Coordinate Order Mismatch

**What goes wrong:** Mapbox bounds are `[lng, lat]` (west, south, east, north). Overpass bbox setting is `[south,west,north,east]` (lat,lon). Mixing these silently produces queries for the wrong area or malformed queries.

**Why it happens:** Two different standards — GeoJSON/Mapbox uses longitude-first; Overpass uses ISO 6709 latitude-first.

**How to avoid:** Define a helper in the Edge Function that explicitly names parameters and maps them:
```typescript
const overpassBbox = `${south},${west},${north},${east}`
```

**Warning signs:** Overpass returns 0 results in areas with known trails; query returns elements from wrong country.

### Pitfall 3: React StrictMode Double-Init of Map Layers

**What goes wrong:** `useEffect` runs twice in development with StrictMode. `map.addSource('trails', ...)` throws `Error: Source with ID "trails" already exists` on the second call.

**Why it happens:** StrictMode mounts → unmounts → remounts. The map `ref` persists but the layer setup effect runs again.

**How to avoid:** Guard with `if (!map.getSource('trails'))` before `addSource`. Same for `addLayer` — `if (!map.getLayer('trail-clusters'))`.

**Warning signs:** Console error about duplicate source/layer IDs; map works in production but crashes in development.

### Pitfall 4: Stale Bounds from Zustand During Debounce

**What goes wrong:** `useTrails` reads bounds at effect time, but the bounds selector triggers re-render on every `moveend`. If the debounce timer fires with stale closure bounds, the Edge Function is called with old data.

**Why it happens:** `useEffect` captures the bounds value from render-time. If bounds updates multiple times during debounce, the timer scheduled for the last bounds fires correctly — but if bounds changes after the timer fires and before the response arrives, `setRoutes` overwrites with stale data.

**How to avoid:** Use `rerender-use-ref-transient-values` pattern — store bounds in a `useRef` updated on every render, read the ref inside the `setTimeout` callback.

**Warning signs:** Map shows trails for a previous viewport after fast panning.

### Pitfall 5: Overpass dogs=no Filter — Tag Absence vs Explicit Deny

**What goes wrong:** `["dogs"!="no"]` in Overpass returns elements where `dogs` tag is `no` filtered out, BUT also returns elements where `dogs=yes` is absent entirely. This is desired behavior — trails without explicit `dogs=no` are considered allowed. Do not confuse with filtering for explicitly `dogs=yes`.

**Why it happens:** Overpass `!=` operator matches elements where the tag value differs OR the tag is absent. This is the correct behavior for this use case.

**How to avoid:** Use `["dogs"!="no"]` intentionally. Never use `["dogs"="yes"]` — almost no trails have this tag, which would return near-zero results.

### Pitfall 6: Supabase Service Role Key in Frontend Code

**What goes wrong:** Developer puts `SUPABASE_SERVICE_ROLE_KEY` in `.env` as `VITE_*` variable, which gets bundled into the client. Service role bypasses all RLS — full database access exposed publicly.

**Why it happens:** Confusion about which keys are safe to expose.

**How to avoid:** Service role key is used only inside Edge Functions via `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`. Frontend uses only `VITE_SUPABASE_ANON_KEY`. The `search_areas` policy is `for select using (true)` (public read). Routes use `for select to authenticated` — the anon key is fine for calling the Edge Function which writes via service role.

**Warning signs:** `VITE_SUPABASE_SERVICE_ROLE_KEY` in any `.env` file.

### Pitfall 7: GeoJSON Source Update — setData vs Re-adding

**What goes wrong:** Calling `map.addSource()` again when trails update throws. Developer removes and re-adds source on every fetch — this causes a layer flash/flicker.

**Why it happens:** Sources are permanent map objects; their data is mutable via `setData`.

**How to avoid:** Initialize source with empty FeatureCollection on map load. On each trails update, call `(map.getSource('trails') as mapboxgl.GeoJSONSource).setData(featureCollection)`.

---

## Code Examples

### Overpass Query (complete, production-ready)

```
// Source: OSM Wiki + project requirements PIPE-02, PIPE-03
[out:json][timeout:25][bbox:${south},${west},${north},${east}];
(
  relation["route"="hiking"]["dogs"!="no"];
  relation["route"="foot"]["dogs"!="no"];
  way["highway"="footway"]["dogs"!="no"]
    ["highway"!~"primary|secondary|tertiary|residential|service"];
  way["highway"="path"]["dogs"!="no"]
    ["highway"!~"primary|secondary|tertiary|residential|service"];
  way["leisure"="nature_reserve"]["dogs"!="no"];
);
out geom;
```

### Edge Function Cache Check

```typescript
// Check search_areas for unexpired bbox_hash
const hash = bboxHash(north, south, east, west)
const { data: cached } = await supabase
  .from('search_areas')
  .select('id, expires_at')
  .eq('bbox_hash', hash)
  .gt('expires_at', new Date().toISOString())
  .maybeSingle()

if (cached) {
  // Fetch routes within this bbox from routes table
  const { data: routes } = await supabase
    .from('routes')
    .select('*')
    .gte('center_lat', south)
    .lte('center_lat', north)
    .gte('center_lon', west)
    .lte('center_lon', east)
  return new Response(JSON.stringify({ routes, cached: true }), { headers: corsHeaders })
}
```

### Route Normalization Skeleton

```typescript
interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  tags?: Record<string, string>
  geometry?: Array<{ lat: number; lon: number }>
  members?: Array<{ type: string; ref: number; role: string; geometry?: Array<{ lat: number; lon: number }> }>
}

function normalizeElement(el: OverpassElement): Partial<Route> | null {
  const tags = el.tags || {}

  // Build GeoJSON geometry
  let geometry: Route['geometry'] | null = null
  if (el.type === 'way' && el.geometry) {
    geometry = {
      type: 'LineString',
      coordinates: el.geometry.map(p => [p.lon, p.lat]),
    }
  } else if (el.type === 'relation') {
    const lines = (el.members || [])
      .filter(m => m.type === 'way' && m.geometry)
      .map(m => m.geometry!.map(p => [p.lon, p.lat]))
    if (lines.length === 0) return null
    geometry = lines.length === 1
      ? { type: 'LineString', coordinates: lines[0] }
      : { type: 'MultiLineString', coordinates: lines }
  }

  // Center point
  const coords = geometry?.type === 'LineString'
    ? geometry.coordinates
    : geometry?.type === 'MultiLineString'
    ? geometry.coordinates.flat()
    : []
  if (coords.length === 0) return null
  const center_lon = coords.reduce((s, c) => s + c[0], 0) / coords.length
  const center_lat = coords.reduce((s, c) => s + c[1], 0) / coords.length

  return {
    source_id: `osm:${el.type}:${el.id}`,
    name: tags['name'] || tags['ref'] || null,
    geometry,
    center_lat,
    center_lon,
    source: isPTTK(tags) ? 'pttk' : 'osm',
    trail_color: extractTrailColor(tags),
    is_marked: Boolean(tags['osmc:symbol'] || tags['colour'] || tags['marked']),
    dogs_allowed: tags['dogs'] === 'yes' ? true : tags['dogs'] === 'no' ? false : null,
    surface_type: normalizeSurface(tags['surface']),
    difficulty: normalizeDifficulty(tags['sac_scale']),
    water_access: 'none', // POST-QUERY: update via separate Overpass around:200 or default
  }
}
```

### Frontend: GeoJSON Feature Shape for Cluster Source

```typescript
// Routes → GeoJSON FeatureCollection for cluster source
function routesToFeatures(routes: Route[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: routes.map(r => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.center_lon, r.center_lat] },
      properties: {
        id: r.id,
        name: r.name,
        trail_color: r.trail_color,
        source: r.source,
      }
    }))
  }
}

// PTTK routes → separate LineString features for polyline source
function pttkToLineFeatures(routes: Route[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: routes
      .filter(r => r.source === 'pttk' && r.geometry)
      .map(r => ({
        type: 'Feature',
        geometry: r.geometry,
        properties: { id: r.id, name: r.name, trail_color: r.trail_color }
      }))
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import { serve } from "https://deno.land/std/http/server.ts"` | `Deno.serve(handler)` built-in | Deno 1.35+ / Supabase 2024 | Simpler, no import, fewer cold start bytes |
| `https://esm.sh/@supabase/supabase-js` import | `jsr:@supabase/supabase-js@2` import | Supabase 2024-2025 | Official, versioned, faster resolution |
| Overpass `out body; >; out skel qt;` recursive descent | `out geom;` inline | Overpass 0.7.54+ | Single request, less complexity |
| Custom CORS middleware import | Inline CORS headers object | Supabase recommendation 2024 | Fewer imports, no cold start overhead |

**Deprecated/outdated:**
- `deno.land/std` imports: Replaced by JSR or Deno built-ins. Use sparingly.
- `out skel; (._;>;); out body;` pattern: Still works but `out geom;` is simpler for route geometry.

---

## Open Questions

1. **Water access detection via Overpass `around:200`**
   - What we know: The requirement says water_access should be set via `around:200` proximity check for rivers/lakes/streams
   - What's unclear: Running a nested `around:200` subquery inside the main query doubles Overpass complexity and may approach the 25s timeout for large bboxes in mountain areas
   - Recommendation: Default `water_access` to `'none'` in initial normalization. Run a separate lightweight Overpass query for water nodes/ways only if the primary route upsert count exceeds 0. Alternative: skip the around query entirely and use `'none'` default — this is acceptable for v1 (the filter UI will have "water access" as a filter but most data will be `none`).

2. **PTTK relation vs way geometry in Overpass response**
   - What we know: PTTK trails are OSM relations (`type=route`, `route=hiking`). Their geometry is in `members[].geometry` when using `out geom`
   - What's unclear: Some PTTK entries may have partial geometry (only some member ways within bbox). Need to validate on live Tatry/Bieszczady Overpass queries
   - Recommendation: Accept partial geometry — store what arrives. `MultiLineString` supports disconnected segments. The STATE.md notes this as a pre-existing research flag.

3. **Edge Function cold start on first pan**
   - What we know: Supabase Edge Functions can have cold starts. First pan after app load may take 1-3s.
   - What's unclear: Whether the progress bar + accumulating pins UX adequately covers perceived latency
   - Recommendation: The loading bar plus "existing pins stay visible" decision covers this well. No special handling needed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` (jsdom environment, `src/**/*.test.ts`) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIPE-01 | Cache hit returns routes without Overpass call | unit | `npx vitest run src/hooks/useTrails.test.ts` | ❌ Wave 0 |
| PIPE-02 | Cache miss triggers Overpass fetch | unit | `npx vitest run src/hooks/useTrails.test.ts` | ❌ Wave 0 |
| PIPE-03 | Dogs=no paths excluded from normalization | unit | `npx vitest run src/features/map/normalizeTrail.test.ts` | ❌ Wave 0 |
| PIPE-04 | PTTK color extracted from osmc:symbol | unit | `npx vitest run src/features/map/normalizeTrail.test.ts` | ❌ Wave 0 |
| PIPE-05 | Routes upserted dedupe on source_id | manual-only | N/A — requires live Supabase; test via local Supabase CLI | ❌ — |
| PIPE-06 | AbortController fires after 20s; retry twice | unit | `npx vitest run src/lib/fetchOverpass.test.ts` | ❌ Wave 0 |
| PIPE-07 | useTrails debounces 400ms | unit | `npx vitest run src/hooks/useTrails.test.ts` | ❌ Wave 0 |
| PIPE-08 | Cluster layer added to map after routes load | unit | `npx vitest run src/features/map/TrailLayers.test.ts` | ❌ Wave 0 |
| PIPE-09 | PTTK polylines use correct trail_color | unit | `npx vitest run src/features/map/TrailLayers.test.ts` | ❌ Wave 0 |
| PIPE-10 | Loading state true during fetch; error state on failure | unit | `npx vitest run src/hooks/useTrails.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/hooks/useTrails.test.ts` — covers PIPE-01, PIPE-02, PIPE-07, PIPE-10
- [ ] `src/features/map/normalizeTrail.test.ts` — covers PIPE-03, PIPE-04
- [ ] `src/lib/fetchOverpass.test.ts` — covers PIPE-06
- [ ] `src/features/map/TrailLayers.test.ts` — covers PIPE-08, PIPE-09 (mock mapboxgl)
- [ ] Extract normalization logic to `src/features/map/normalizeTrail.ts` to make it unit-testable outside Edge Function

---

## Sources

### Primary (HIGH confidence)

- OSM Wiki: https://wiki.openstreetmap.org/wiki/Pl:Mapowanie_szlak%C3%B3w_turystycznych — PTTK trail conventions, osmc:symbol format
- OSM Wiki: https://wiki.openstreetmap.org/wiki/Key:osmc:symbol — Color extraction pattern
- Mapbox Docs: https://docs.mapbox.com/mapbox-gl-js/example/cluster/ — Cluster source/layer setup
- Mapbox Docs: https://docs.mapbox.com/mapbox-gl-js/example/geojson-line/ — Line layer setup
- Supabase Docs: https://supabase.com/docs/guides/getting-started/ai-prompts/edge-functions — Edge Function template pattern
- Supabase Docs: https://supabase.com/docs/guides/functions — Edge Functions architecture
- Project schema: `supabase/migrations/` — confirmed `routes`, `search_areas` table structure
- Project code: `src/stores/viewport.ts` — confirmed bounds structure
- Project code: `src/lib/types.ts` — confirmed `Route`, `SearchArea` interfaces

### Secondary (MEDIUM confidence)

- Overpass API docs: https://dev.overpass-api.de/overpass-doc/en/full_data/osm_types.html — `out geom` behavior for relations (retrieved, format confirmed)
- Overpass API docs: https://dev.overpass-api.de/overpass-doc/en/targets/formats.html — bbox output restriction
- GitHub discussions: https://github.com/orgs/supabase/discussions/9790 — confirmed `jsr:@supabase/supabase-js@2` import pattern

### Tertiary (LOW confidence — flag for validation)

- OSM Overpass behavior for incomplete PTTK relation members at bbox edges: unverified against live Tatry data (STATE.md notes this as known research gap)
- `around:200` water proximity: feasibility within 25s timeout for large mountain bboxes — unverified

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; Supabase/Deno pattern confirmed via official docs
- Architecture: HIGH — Mapbox cluster and line layer patterns from official examples; Overpass QL confirmed via OSM Wiki
- Overpass query: MEDIUM — core pattern confirmed; PTTK completeness on live data unverified (known gap from STATE.md)
- Pitfalls: HIGH — all from direct code inspection of project and official API behavior docs

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable ecosystem; Overpass API and Mapbox GL JS APIs are stable)
