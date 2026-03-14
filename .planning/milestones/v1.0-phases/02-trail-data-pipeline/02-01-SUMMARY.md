---
phase: 02-trail-data-pipeline
plan: "01"
subsystem: api
tags: [supabase, edge-function, overpass, osm, pttk, geojson, vitest, deno]

# Dependency graph
requires:
  - phase: 00-scaffolding-fixes
    provides: Supabase schema with routes and search_areas tables, water_access text enum
  - phase: 01-map-core
    provides: Mapbox viewport bounds for bbox input to Edge Function

provides:
  - Supabase Edge Function search-trails with CORS, cache, Overpass fetch, normalization, upsert
  - normalizeTrail.ts with 7 pure functions (extractTrailColor, isPTTK, normalizeSurface, normalizeDifficulty, normalizeElement, bboxHash, buildOverpassQuery)
  - fetchOverpass.ts with AbortController 20s timeout and exponential backoff retry
  - 29 unit tests covering normalization, PTTK detection, geometry conversion, and retry/abort behavior

affects:
  - 02-trail-data-pipeline (subsequent plans consuming routes from DB)
  - 03-browsing-filter (trail list reads from routes table populated by this Edge Function)
  - hooks/useTrails (will call search-trails Edge Function)

# Tech tracking
tech-stack:
  added: [Deno Edge Function (jsr:@supabase/supabase-js@2), Overpass API]
  patterns:
    - Inline normalization functions in Deno Edge Function (cannot import from src/)
    - vi.stubGlobal('fetch') for mocking global fetch in vitest (avoids TypeScript global.fetch errors)
    - AbortController + setTimeout pattern for fetch timeout with recursive retry

key-files:
  created:
    - supabase/functions/_shared/cors.ts
    - supabase/functions/search-trails/index.ts
    - src/features/map/normalizeTrail.ts
    - src/features/map/normalizeTrail.test.ts
    - src/lib/fetchOverpass.ts
    - src/lib/fetchOverpass.test.ts
  modified: []

key-decisions:
  - "Overpass QL uses unquoted filter syntax [dogs!=no] not [\"dogs\"!=\"no\"] — test expects the unquoted form"
  - "vi.stubGlobal('fetch') used instead of global.fetch assignment — avoids TypeScript Cannot find name 'global' error in browser lib"
  - "Normalization functions inlined in Edge Function — Deno cannot resolve Vite aliases or src/ paths"
  - "water_access defaults to 'none' for v1 — around:200 water source subquery deferred"
  - "jsr:@supabase/supabase-js@2 import (not esm.sh) — required by current Supabase Deno runtime"

patterns-established:
  - "Inline pattern for Deno: pure helper functions extracted to src/ for testing, duplicated/inlined in Edge Function"
  - "Overpass bbox order: south,west,north,east (lat/lon) — opposite of Mapbox lng/lat order"
  - "TDD cycle for pure utility modules: write test file first, confirm RED, then implement GREEN"

requirements-completed: [PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06]

# Metrics
duration: 7min
completed: 2026-03-13
---

# Phase 2 Plan 1: Trail Data Pipeline Summary

**Overpass-to-Supabase pipeline via Deno Edge Function with 7-day bbox cache, PTTK detection, and GeoJSON normalization — 29 unit tests all green**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-13T18:42:32Z
- **Completed:** 2026-03-13T18:47:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Normalization module with 7 exported pure functions covering OSM surface, difficulty, trail color, PTTK detection, GeoJSON geometry construction
- Fetch-with-retry module: POST to Overpass with AbortController 20s abort and up to 2 retries with 1s/2s exponential backoff
- Edge Function handling CORS, bbox validation, search_areas cache check with 7-day TTL, Overpass fetch on miss, route upsert using `onConflict: 'source_id'`
- 29 tests: 25 normalization (extractTrailColor, isPTTK, surface/difficulty mapping, LineString/MultiLineString geometry, bboxHash, Overpass QL) + 4 fetch (success, retry, exhaustion, abort)

## Task Commits

1. **Task 1: Normalization module and fetch-with-retry module (with tests)** — `01cca2d` (feat)
2. **Task 2: Supabase Edge Function search-trails** — `8f2bd21` (feat)

## Files Created/Modified

- `/Users/kacpermajerowicz/pointer-adventure/src/features/map/normalizeTrail.ts` — 7 pure functions: extractTrailColor, isPTTK, normalizeSurface, normalizeDifficulty, normalizeElement, bboxHash, buildOverpassQuery + OverpassElement interface
- `/Users/kacpermajerowicz/pointer-adventure/src/features/map/normalizeTrail.test.ts` — 25 unit tests
- `/Users/kacpermajerowicz/pointer-adventure/src/lib/fetchOverpass.ts` — Overpass fetch with AbortController + exponential backoff retry
- `/Users/kacpermajerowicz/pointer-adventure/src/lib/fetchOverpass.test.ts` — 4 unit tests (success, retry, exhaustion, abort)
- `/Users/kacpermajerowicz/pointer-adventure/supabase/functions/_shared/cors.ts` — reusable CORS headers
- `/Users/kacpermajerowicz/pointer-adventure/supabase/functions/search-trails/index.ts` — complete Deno Edge Function

## Decisions Made

- Overpass QL unquoted filter `[dogs!=no]` instead of `["dogs"!="no"]` — the test spec expected the unquoted form, and both are valid Overpass QL
- `vi.stubGlobal('fetch')` instead of `global.fetch =` — avoids TypeScript error "Cannot find name 'global'" in browser environment lib
- `water_access: 'none'` hardcoded as default for v1 — the around:200 water-source subquery was deferred as noted in research open questions
- All normalization functions duplicated/inlined in the Edge Function — Deno cannot resolve Vite path aliases or `src/` imports; extractable module exists for testability

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Overpass QL dogs filter used wrong quoting**
- **Found during:** Task 1 (buildOverpassQuery test)
- **Issue:** Initial implementation used `["dogs"!="no"]` but test expected `dogs!=no` (unquoted Overpass syntax)
- **Fix:** Changed to unquoted filter syntax `[dogs!=no]` which is valid Overpass QL and matches the plan's truth statement
- **Files modified:** src/features/map/normalizeTrail.ts
- **Verification:** buildOverpassQuery test passes
- **Committed in:** 01cca2d (Task 1 commit)

**2. [Rule 1 - Bug] global.fetch not available in TypeScript browser lib**
- **Found during:** Task 2 (npm run build)
- **Issue:** `global.fetch = vi.fn()` in test file caused `Cannot find name 'global'` TypeScript error
- **Fix:** Replaced all instances with `vi.stubGlobal('fetch', vi.fn())` which is the correct vitest API
- **Files modified:** src/lib/fetchOverpass.test.ts
- **Verification:** Build passes without TypeScript errors
- **Committed in:** 8f2bd21 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (Rule 1 bugs)
**Impact on plan:** Both fixes necessary for correctness and build success. No scope creep.

## Issues Encountered

The timeout test was initially complex to implement cleanly with fake timers because Vitest's timer simulation triggers AbortController callbacks synchronously, causing unhandled rejection warnings. Resolved by using `vi.stubGlobal` and preemptively catching the promise with `.catch(() => undefined)`.

## User Setup Required

None - no external service configuration required for the modules themselves. The Edge Function requires Supabase deployment when used in production (`supabase functions deploy search-trails`).

## Next Phase Readiness

- Edge Function ready for deployment — requires Supabase project with `routes` and `search_areas` tables (already migrated in Phase 0)
- `normalizeTrail.ts` and `fetchOverpass.ts` available for import in `useTrails` hook (Phase 2 Plan 2)
- All 6 PIPE requirements fulfilled

---
*Phase: 02-trail-data-pipeline*
*Completed: 2026-03-13*

## Self-Check: PASSED
