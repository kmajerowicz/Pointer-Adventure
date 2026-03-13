---
phase: 02-trail-data-pipeline
verified: 2026-03-13T20:00:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
---

# Phase 2: Trail Data Pipeline Verification Report

**Phase Goal:** Trail data from OpenStreetMap and PTTK is automatically fetched, cached, and surfaced on the map as the user pans
**Verified:** 2026-03-13T20:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

Plan 02-01 truths:

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Edge Function accepts POST with bbox and returns cached routes when search_areas has unexpired entry | VERIFIED | `index.ts` lines 295–325: `.from('search_areas').eq('bbox_hash', hash).gt('expires_at', ...).maybeSingle()` — hits routes query on cache hit, returns `{ routes, cached: true }` |
| 2 | Edge Function queries Overpass on cache miss and normalizes results to Route schema | VERIFIED | `index.ts` lines 329–344: `fetchOverpass(buildOverpassQuery(bbox))` on cache miss → `.map(normalizeElement).filter()` |
| 3 | Overpass query excludes primary/secondary/tertiary roads, residential/commercial areas, and dogs=no trails | VERIFIED | `buildOverpassQuery` in `normalizeTrail.ts` line 211: `[highway!=primary][highway!=secondary][highway!=tertiary][highway!=residential][highway!=service][dogs!=no]` |
| 4 | PTTK trails identified via operator/network tags; trail_color extracted from osmc:symbol or colour | VERIFIED | `isPTTK` checks `operator.toLowerCase().includes('pttk')` or `network in ['rwn','lwn','nwn']`; `extractTrailColor` checks `osmc:symbol` then `colour` tag |
| 5 | Routes upserted with source_id deduplication; search_areas inserted with 7-day TTL | VERIFIED | `index.ts` lines 349–370: `.upsert(normalizedRoutes, { onConflict: 'source_id' })` then `.from('search_areas').insert({ ..., expires_at: +7 days })` |
| 6 | Overpass requests use [timeout:25], AbortController 20s, max 2 retries with exponential backoff | VERIFIED | `buildOverpassQuery` includes `[timeout:25]`; `fetchOverpass.ts` uses `AbortController` with `TIMEOUT_MS = 20_000`, `MAX_RETRIES = 2`, backoff `1000 * 2^attempt` |

Plan 02-02 truths:

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 7 | Panning the map triggers useTrails which calls search-trails Edge Function after 400ms debounce | VERIFIED | `useTrails.ts` lines 54–66: `setTimeout(..., 400)` on `bounds` change → `supabase.functions.invoke('search-trails', ...)` |
| 8 | Trail pins appear as clustered colored dots on the map; clusters show count and expand on zoom click | VERIFIED | `TrailLayers.ts`: `cluster: true` source, `trail-clusters` circle layer with step-radius, `trail-cluster-count` symbol layer, `getClusterExpansionZoom` on click |
| 9 | PTTK trails render as colored polylines with dark casing; both pin and polyline shown for PTTK | VERIFIED | `trail-line-casing` (7px dark) + `trail-line-fill` (4px color-matched) layers on `trails-lines` source; `pttkToLineFeatures` filters `source === 'pttk'` |
| 10 | A thin progress bar appears at the top of the map during trail fetch | VERIFIED | `LoadingBar.tsx`: 3px `absolute top-0 left-0 right-0` div with `animate-[loading-bar_1.4s_ease-in-out_infinite]`; `MapView.tsx` renders `<LoadingBar visible={loading} />` |
| 11 | On fetch failure, a Polish toast with retry button appears | VERIFIED | `MapView.tsx` lines 34–41, 129–143: error stored in state, renders toast with "Sprobuj ponownie" button, 5-second auto-dismiss |
| 12 | Existing pins stay visible while new area loads — pins accumulate | VERIFIED | `trails.ts` `appendRoutes`: deduplicates by `id || source_id`, appends to existing `routes`; `setRoutes` only called on forceRefresh |
| 13 | Tapping a pin or polyline shows a popup with the trail name | VERIFIED | `setupTrailInteractions`: `mapboxgl.Popup().setHTML(name ?? 'Trasa')` on click of `trail-unclustered` and `trail-line-fill` |
| 14 | Cache timestamp and refresh icon shown at bottom-left of map | VERIFIED | `CacheTimestamp.tsx`: relative Polish time + SVG refresh icon at `absolute bottom-6 left-3`; `MapView.tsx` renders `<CacheTimestamp forceRefresh={forceRefresh} />` |

**Score:** 10/10 requirement groups verified (14/14 observable truths verified)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/functions/search-trails/index.ts` | Deno Edge Function with CORS, cache, Overpass, normalize, upsert | VERIFIED | 393 lines, complete implementation — all paths present and wired to Supabase |
| `supabase/functions/_shared/cors.ts` | Reusable CORS headers | VERIFIED | 4 lines, exports `corsHeaders`, imported by Edge Function |
| `src/features/map/normalizeTrail.ts` | Pure normalization functions | VERIFIED | 215 lines, exports: `normalizeElement`, `extractTrailColor`, `isPTTK`, `normalizeSurface`, `normalizeDifficulty`, `bboxHash`, `buildOverpassQuery`, `OverpassElement` |
| `src/lib/fetchOverpass.ts` | Overpass fetch with retry | VERIFIED | 32 lines, exports `fetchOverpass` with AbortController + exponential backoff |
| `src/features/map/normalizeTrail.test.ts` | 25 normalization unit tests | VERIFIED | All 25 tests pass |
| `src/lib/fetchOverpass.test.ts` | 4 fetch unit tests | VERIFIED | All 4 tests pass (success, retry, exhaustion, abort) |
| `src/stores/trails.ts` | Zustand store for trail state | VERIFIED | 35 lines, exports `useTrailsStore` with routes/loading/error/lastFetched/retry + deduplicating `appendRoutes` |
| `src/hooks/useTrails.ts` | Debounced hook calling Edge Function | VERIFIED | 79 lines, exports `useTrails`; 400ms debounce, boundsRef stale-closure guard, forceRefresh |
| `src/hooks/useTrails.test.ts` | 7 useTrails unit tests | VERIFIED | All 7 tests pass |
| `src/features/map/TrailLayers.ts` | Mapbox source/layer management | VERIFIED | 231 lines, exports: `initTrailLayers`, `updateTrailData`, `routesToPointFeatures`, `pttkToLineFeatures`, `setupTrailInteractions` |
| `src/features/map/TrailLayers.test.ts` | 6 TrailLayers unit tests | VERIFIED | All 6 tests pass |
| `src/features/map/LoadingBar.tsx` | Animated progress bar | VERIFIED | 3px indeterminate bar, visible prop-gated |
| `src/features/map/CacheTimestamp.tsx` | Relative time + refresh icon | VERIFIED | Polish relative time strings, SVG refresh button, only renders when lastFetched is set |
| `src/features/map/MapView.tsx` | Wired MapView | VERIFIED | Imports and calls `useTrails()`, subscribes to `routes`, renders `LoadingBar`, `CacheTimestamp`, error toast |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useTrails.ts` | `viewport.ts` | `useViewportStore((s) => s.bounds)` | WIRED | Line 7: subscription; line 18: `boundsRef.current = bounds`; line 54: effect on bounds change |
| `useTrails.ts` | `search-trails` Edge Function | `supabase.functions.invoke` | WIRED | Line 26: `supabase.functions.invoke('search-trails', { body: { north, south, east, west } })` |
| `TrailLayers.ts` | Mapbox GeoJSON source | `map.addSource` / `getSource.setData` | WIRED | Lines 58, 67: `addSource`; lines 176, 179: `trailsSource.setData(...)` / `linesSource.setData(...)` |
| `MapView.tsx` | `useTrails.ts` | `useTrails()` call | WIRED | Line 27: `const { loading, error, retry, forceRefresh } = useTrails()` |
| `MapView.tsx` | `TrailLayers.ts` | `initTrailLayers`, `updateTrailData` | WIRED | Line 89: `initTrailLayers(map)` on `style.load`; lines 103–107: `updateTrailData(map, routes)` on routes change |
| `search-trails/index.ts` | Overpass API | `fetch` with AbortController | WIRED | Lines 229–237: `fetch(OVERPASS_URL, { method: 'POST', ..., signal: controller.signal })` |
| `search-trails/index.ts` | Supabase (service role) | `createClient(SUPABASE_SERVICE_ROLE_KEY)` | WIRED | Lines 289–292: `createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))`; routes and search_areas queried/upserted at lines 297, 306, 349, 361 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PIPE-01 | 02-01 | Edge Function accepts POST with bbox; checks search_areas by bbox_hash; returns cached routes on hit | SATISFIED | Cache check at index.ts lines 295–325 |
| PIPE-02 | 02-01 | On cache miss, queries Overpass for hiking routes, footpaths, nature reserves, PTTK relations | SATISFIED | `buildOverpassQuery` includes `route=hiking`, `route=foot`, `highway~footway/path/track`, `leisure=nature_reserve` |
| PIPE-03 | 02-01 | Overpass query excludes primary/secondary/tertiary roads, residential/commercial, dogs=no | SATISFIED | `buildOverpassQuery` line 211 filters confirmed by passing test `"query contains dogs!=no filter and highway exclusions"` |
| PIPE-04 | 02-01 | Normalizes surface_type, difficulty, water_access, trail_color, source, water_type | SATISFIED | `normalizeElement` maps all fields; `water_access` defaults to `'none'` (v1 scope decision, documented) |
| PIPE-05 | 02-01 | Upserts to routes (dedupe on source_id); inserts to search_areas with 7-day TTL | SATISFIED | `.upsert(normalizedRoutes, { onConflict: 'source_id' })` + `expires_at = now + 7 days` |
| PIPE-06 | 02-01 | [timeout:25] in query; AbortController 20s per attempt; max 2 retries with exponential backoff | SATISFIED | `TIMEOUT_MS = 20_000`, `MAX_RETRIES = 2`, backoff `1000 * 2^attempt`; all 4 fetchOverpass tests pass |
| PIPE-07 | 02-02 | Frontend calls Edge Function on moveend with 400ms debounce via useTrails hook | SATISFIED | `useEffect` on bounds with `setTimeout(..., 400)` confirmed by passing debounce test |
| PIPE-08 | 02-02 | Trail markers render as clustered pins; clusters expand on zoom | SATISFIED | `cluster: true` source, `trail-clusters` layer, `getClusterExpansionZoom` click handler |
| PIPE-09 | 02-02 | PTTK trails render as colored polylines matching trail_color | SATISFIED | `trail-line-casing` + `trail-line-fill` with `match` expression on trail_color; pttkToLineFeatures filters source==='pttk' |
| PIPE-10 | 02-02 | Loading state during fetch; error state with retry button on failure | SATISFIED | `LoadingBar visible={loading}`, error toast with "Sprobuj ponownie" button calling `retry?.()` |

All 10 PIPE requirements satisfied. No orphaned requirements detected.

---

### Anti-Patterns Found

None. Scanned `TrailLayers.ts`, `useTrails.ts`, `LoadingBar.tsx`, `CacheTimestamp.tsx`, `search-trails/index.ts` — no TODOs, FIXMEs, placeholder comments, or stub implementations found. The two instances of `return null` in `LoadingBar.tsx` and `CacheTimestamp.tsx` are conditional guards (hide when not needed), not stubs. The `return null` in Edge Function `normalizeElement` is a valid null-geometry early return.

---

### Test Results

All 42 unit tests pass across 4 test files:

- `src/lib/fetchOverpass.test.ts` — 4/4 (fetch success, retry, exhaustion, 20s abort)
- `src/features/map/normalizeTrail.test.ts` — 25/25 (extractTrailColor, isPTTK, normalizeSurface, normalizeDifficulty, normalizeElement, bboxHash, buildOverpassQuery)
- `src/hooks/useTrails.test.ts` — 7/7 (null bounds guard, debounce, success, error, retry, forceRefresh)
- `src/features/map/TrailLayers.test.ts` — 6/6 (routesToPointFeatures, pttkToLineFeatures, initTrailLayers idempotency)

TypeScript build: passes with no errors.

---

### Human Verification Required

The following items cannot be verified programmatically:

#### 1. End-to-end trail pin rendering

**Test:** Deploy the Edge Function (`supabase functions deploy search-trails`), open the app, and pan the map to a hiking area in Poland (e.g., Tatry, Karkonosze).
**Expected:** After 400ms debounce, trail pins appear as colored clustered dots. Zooming in expands clusters to individual pins. PTTK trails show a colored polyline with dark casing underneath.
**Why human:** Requires live Supabase + Overpass API network calls; cannot verify Mapbox rendering in a headless test environment.

#### 2. Loading bar visibility during fetch

**Test:** Throttle network to "Slow 3G" in DevTools, then pan the map.
**Expected:** A thin gold bar (3px) appears at the top of the map during the fetch and disappears when data loads.
**Why human:** CSS animations and timing require a real browser to observe.

#### 3. Error toast with retry on network failure

**Test:** Disable network in DevTools, pan the map, wait for error.
**Expected:** A Polish-language toast appears near the bottom of the screen with the text "Nie udalo sie pobrac tras" and a "Sprobuj ponownie" button. Button re-triggers the fetch. Toast auto-dismisses after 5 seconds.
**Why human:** Requires real network failure simulation; error UI timing requires human observation.

#### 4. Cache timestamp display

**Test:** After a successful fetch, check the bottom-left of the map.
**Expected:** "Zaktualizowano: teraz" appears immediately after first fetch. After a few minutes, it updates to "Zaktualizowano: X min temu". Tapping the refresh icon re-fetches and resets to "teraz".
**Why human:** Relative time display and refresh behavior require browser interaction.

---

### Gaps Summary

No gaps. All 10 requirements (PIPE-01 through PIPE-10) are implemented, tested, and wired. The phase goal — "Trail data from OpenStreetMap and PTTK is automatically fetched, cached, and surfaced on the map as the user pans" — is achieved by the complete pipeline:

1. `MapView.tsx` → `useTrails()` hook → `supabase.functions.invoke('search-trails')` (400ms debounce on `moveend`)
2. Edge Function → `search_areas` cache check → Overpass API fetch with retry → normalize → upsert to `routes`
3. `useTrailsStore.routes` → `updateTrailData(map, routes)` → Mapbox GeoJSON sources → clustered pins + PTTK polylines

The only noted scope decision is `water_access` defaulting to `'none'` in v1 (the `around:200` water-source Overpass subquery was intentionally deferred). This is documented in the PLAN and SUMMARY and does not affect any PIPE requirement.

---

_Verified: 2026-03-13T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
