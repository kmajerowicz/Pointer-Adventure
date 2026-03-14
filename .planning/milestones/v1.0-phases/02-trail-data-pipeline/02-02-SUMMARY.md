---
phase: 02-trail-data-pipeline
plan: "02"
subsystem: ui
tags: [react, mapbox, zustand, geojson, vitest, tdd, clustering, pttk]

# Dependency graph
requires:
  - phase: 02-trail-data-pipeline
    provides: search-trails Edge Function, normalizeTrail.ts, fetchOverpass.ts
  - phase: 01-map-core
    provides: MapView with moveend viewport sync, useViewportStore bounds

provides:
  - Zustand trail store (routes, loading, error, lastFetched, retry) with deduplicating appendRoutes
  - useTrails hook: 400ms debounced Edge Function calls, boundsRef stale-closure safety, retry, forceRefresh
  - TrailLayers.ts: cluster GeoJSON source+layers, PTTK line sources+layers, updateTrailData, setupTrailInteractions with Popup
  - LoadingBar: 3px accent indeterminate progress bar
  - CacheTimestamp: relative time display with SVG refresh icon
  - MapView: wired with trail layers init on style.load, updateTrailData on routes change, error toast with retry

affects:
  - 03-browsing-filter (trail list reads routes from useTrailsStore)
  - 05-favorites (favoriting routes from map pins)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - boundsRef pattern for debounced hooks — useRef updated synchronously, read inside setTimeout callback to avoid stale closures
    - style.load event for Mapbox layer initialization — ensures sources/layers added after style is ready
    - setRetry stores a plain function (not () => fn) — Zustand does not call functions stored in state

key-files:
  created:
    - src/stores/trails.ts
    - src/hooks/useTrails.ts
    - src/hooks/useTrails.test.ts
    - src/features/map/TrailLayers.ts
    - src/features/map/TrailLayers.test.ts
    - src/features/map/LoadingBar.tsx
    - src/features/map/CacheTimestamp.tsx
  modified:
    - src/features/map/MapView.tsx
    - src/index.css
    - vite.config.ts

key-decisions:
  - "setRetry stores a plain function reference, not a thunk — Zustand would invoke () => fn at set time and store the return value"
  - "Trail layer init uses map.on('style.load') — ensures sources/layers are added after style is fully loaded"
  - "Workbox maximumFileSizeToCacheInBytes raised to 4 MiB — Mapbox GL JS bundle exceeds 2 MiB default"
  - "Test for retry fn uses .find(typeof === function) — setRetry(null) is called first in fetchTrails before the actual retry fn"

patterns-established:
  - "boundsRef updated synchronously on every render, read inside setTimeout — prevents stale viewport data in debounced callbacks"
  - "TDD test mock for Zustand: vi.mock with selector support (selector ? selector(state) : state)"

requirements-completed: [PIPE-07, PIPE-08, PIPE-09, PIPE-10]

# Metrics
duration: 5min
completed: 2026-03-13
---

# Phase 2 Plan 2: Trail Data Pipeline Summary

**Zustand trail store + debounced useTrails hook + Mapbox cluster pins and PTTK polylines + LoadingBar and error toast — map now shows trails from the Edge Function as user pans**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-13T19:49:27Z
- **Completed:** 2026-03-13T19:54:40Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Trail store with accumulating `appendRoutes` (deduplicates by id) enabling "pins persist as user pans" UX
- 400ms debounced useTrails hook with boundsRef stale-closure guard, loading/error/retry/forceRefresh returned to UI
- TrailLayers module with 5 Mapbox layers: cluster circles (step-radius), cluster count labels, unclustered color-matched dots, PTTK line casing (7px dark), PTTK line fill (4px trail-color)
- MapView wired: trail layers init on `style.load`, updateTrailData on routes change, LoadingBar during fetch, error toast with Polish retry button, CacheTimestamp with SVG refresh icon
- 13 new tests (7 useTrails + 6 TrailLayers) + all 58 total tests pass

## Task Commits

1. **Task 1: Zustand trail store, useTrails hook, and TrailLayers module with tests** — `0fbbdc6` (feat)
2. **Task 2: Loading bar, cache timestamp, MapView wiring** — `3d9b953` (feat)

## Files Created/Modified

- `/Users/kacpermajerowicz/pointer-adventure/src/stores/trails.ts` — routes/loading/error/lastFetched/retry state, deduplicating appendRoutes
- `/Users/kacpermajerowicz/pointer-adventure/src/hooks/useTrails.ts` — 400ms debounce, boundsRef, supabase.functions.invoke, appendRoutes/setRoutes, retry, forceRefresh
- `/Users/kacpermajerowicz/pointer-adventure/src/hooks/useTrails.test.ts` — 7 tests: null bounds, debounce, success/error paths, retry, forceRefresh
- `/Users/kacpermajerowicz/pointer-adventure/src/features/map/TrailLayers.ts` — routesToPointFeatures, pttkToLineFeatures, initTrailLayers (2 sources + 5 layers), updateTrailData, setupTrailInteractions
- `/Users/kacpermajerowicz/pointer-adventure/src/features/map/TrailLayers.test.ts` — 6 tests: point features, line features, initTrailLayers call counts + idempotency
- `/Users/kacpermajerowicz/pointer-adventure/src/features/map/LoadingBar.tsx` — 3px indeterminate progress bar, CSS keyframe animation, accent gold
- `/Users/kacpermajerowicz/pointer-adventure/src/features/map/CacheTimestamp.tsx` — relative time ("teraz", "X min temu", "X godz. temu", "X dni temu"), SVG refresh icon, calls forceRefresh
- `/Users/kacpermajerowicz/pointer-adventure/src/features/map/MapView.tsx` — useTrails wired, style.load init, routes effect, LoadingBar/CacheTimestamp/error toast
- `/Users/kacpermajerowicz/pointer-adventure/src/index.css` — loading-bar @keyframes
- `/Users/kacpermajerowicz/pointer-adventure/vite.config.ts` — maximumFileSizeToCacheInBytes: 4 MiB

## Decisions Made

- `setRetry` stores plain function (not thunk): Zustand state setter invokes functions if passed as setter argument — storing `() => fn` would call it and store the result. Plain `retryFn` reference avoids this.
- Trail layer initialization in `map.on('style.load')` not a separate useEffect: ensures the map style is loaded before attempting to add sources/layers — avoids "style not loaded" errors on slow connections.
- Workbox `maximumFileSizeToCacheInBytes` raised to 4 MiB: Mapbox GL JS is ~2.18 MiB, exceeding the 2 MiB default. This was always going to be needed once Mapbox was added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] setRetry called with null first — test needed .find() to locate the retry fn**
- **Found during:** Task 1 (useTrails.test.ts)
- **Issue:** The test assumed `mockSetRetry.mock.calls[0][0]` was the retry function, but `fetchTrails` calls `setRetry(null)` at the start to clear previous retry, making the function appear at calls[1]
- **Fix:** Updated test to use `.find(v => typeof v === 'function')` to locate the retry fn regardless of call order
- **Files modified:** src/hooks/useTrails.test.ts
- **Verification:** Test passes
- **Committed in:** 0fbbdc6 (Task 1 commit)

**2. [Rule 3 - Blocking] Workbox precache size limit exceeded**
- **Found during:** Task 2 (npm run build)
- **Issue:** Mapbox GL JS bundle at 2.18 MiB exceeded Workbox default 2 MiB precache limit, causing build failure
- **Fix:** Added `maximumFileSizeToCacheInBytes: 4 * 1024 * 1024` to vite.config.ts workbox options
- **Files modified:** vite.config.ts
- **Verification:** Build passes, precache shows 8 entries including the JS bundle
- **Committed in:** 3d9b953 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 test bug, 1 Rule 3 blocking build)
**Impact on plan:** Both fixes necessary for correct test execution and build success. No scope creep.

## Issues Encountered

The Zustand retry storage pattern required careful handling: storing `() => () => fn` would have Zustand call the outer arrow function immediately during `set()`. The fix was to store a plain `const retryFn = () => {...}` reference. This is an established Zustand gotcha when storing callbacks in state.

## User Setup Required

None - no external service configuration required. Edge Function deployment requires Supabase CLI (`supabase functions deploy search-trails`) when ready to test end-to-end.

## Next Phase Readiness

- Map pipeline complete: panning triggers useTrails -> Edge Function -> trail pins appear on map
- Trail store available for Phase 3 browsing/filter (trail list reads `useTrailsStore.routes`)
- All 4 PIPE-07 through PIPE-10 requirements fulfilled

---
*Phase: 02-trail-data-pipeline*
*Completed: 2026-03-13*

## Self-Check: PASSED

- src/stores/trails.ts — FOUND
- src/hooks/useTrails.ts — FOUND
- src/features/map/TrailLayers.ts — FOUND
- src/features/map/LoadingBar.tsx — FOUND
- src/features/map/CacheTimestamp.tsx — FOUND
- Commit 0fbbdc6 — FOUND
- Commit 3d9b953 — FOUND
