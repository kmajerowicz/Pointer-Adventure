---
phase: 04-filters
plan: 01
subsystem: ui
tags: [react, zustand, vitest, hooks, filtering, tdd]

# Dependency graph
requires:
  - phase: 03-trail-display-and-browsing
    provides: Route type with all filter fields, useTrailsStore with routes array
  - phase: 00-scaffolding-fixes
    provides: useFiltersStore with all 6 filter types and resetAll
  - phase: 01-map-core
    provides: useGeolocation hook for GPS position in distance filter
provides:
  - useFilteredRoutes hook — client-side filter+sort derived state
  - useActiveFilterCount hook — non-default filter count for badge
  - filterLabels constants — Polish labels for all filter UI options
affects: [04-filters/04-02-PLAN, features/map/FilterPanel, features/map/FilterButton, features/map/ActiveFilterChips]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useMemo filter chain — sequential filter application (length→surface→difficulty→water→marked→distance)
    - Water preferred sort — [...result].sort() spread-before-sort, never mutates original array
    - GPS-guarded distance filter — skips filter entirely when userLat/userLon are null

key-files:
  created:
    - src/hooks/useFilteredRoutes.ts
    - src/hooks/useFilteredRoutes.test.ts
    - src/hooks/useActiveFilterCount.ts
    - src/features/map/filterLabels.ts
  modified: []

key-decisions:
  - "null length_km routes always pass the length filter — unknown lengths included in all buckets"
  - "Water 'required' excludes water_access==='none'; 'preferred' keeps all routes but sorts water to top via spread-before-sort"
  - "Distance filter silently skipped when GPS status is not 'success' — no error shown to user at hook level"
  - "useActiveFilterCount uses Zustand selector returning primitive (number) — no extra useMemo needed"

patterns-established:
  - "useFilteredRoutes: single derived hook consumed by both MapView and TrailList — filtered routes flow from one source of truth"
  - "filterLabels: Polish label maps and option arrays in filterLabels.ts — all filter UI constants in one file"

requirements-completed: [FILT-02, FILT-03, FILT-04, FILT-05, FILT-06, FILT-07, FILT-09, FILT-10]

# Metrics
duration: 1min
completed: 2026-03-13
---

# Phase 4 Plan 1: useFilteredRoutes — Client-Side Filter Logic Summary

**useMemo filter chain with 6 filter types (length/surface/difficulty/water/marked/distance), water preferred sort, GPS-guarded distance, 12 unit tests, Polish label constants**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-13T21:44:57Z
- **Completed:** 2026-03-13T21:46:37Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 4 created

## Accomplishments
- useFilteredRoutes hook with full useMemo filter chain — no Edge Function called on filter change
- Water 'preferred' sort boosts water-accessible routes to top without excluding any (spread-before-sort pattern)
- Distance filter gracefully skips when GPS is unavailable (null guard)
- 12 unit tests covering all filter types individually plus combined AND-logic test
- useActiveFilterCount Zustand selector returning badge count number
- filterLabels.ts with all Polish labels (SURFACE_LABELS, DIFFICULTY_LABELS, LENGTH_OPTIONS, DISTANCE_OPTIONS, WATER_OPTIONS)

## Task Commits

Each task was committed atomically:

1. **Task 1: useFilteredRoutes + useActiveFilterCount + filterLabels (TDD RED+GREEN)** - `64eb4ba` (feat)

_Note: RED (test) and GREEN (implementation) committed together as plan specified single task._

## Files Created/Modified
- `src/hooks/useFilteredRoutes.ts` — Client-side filter+sort hook using useMemo over routes+filters+geolocation
- `src/hooks/useFilteredRoutes.test.ts` — 12 unit tests via vi.mock for stores and geolocation
- `src/hooks/useActiveFilterCount.ts` — Zustand selector counting non-default filter values
- `src/features/map/filterLabels.ts` — Polish label maps and option arrays for all 5 filter categories

## Decisions Made
- `null length_km` routes pass all length filter buckets — unknown lengths never excluded
- Water 'preferred' sort uses `[...result].sort()` — spreading before sort prevents mutation of original store array
- Distance filter silently skipped when geolocation status is not 'success' — hook never shows error itself
- useActiveFilterCount returns primitive number from selector — no useMemo wrapper needed per rerender-simple-expression-in-memo rule

## Deviations from Plan

None — plan executed exactly as written. TDD RED confirmed (import error on missing file), GREEN achieved in one implementation pass.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- useFilteredRoutes, useActiveFilterCount, filterLabels all ready for Plan 02 FilterPanel UI consumption
- Hook exports typed Route[] compatible with existing MapView updateTrailData and TrailList
- All FILT-02 through FILT-10 requirements satisfied (FILT-01 and FILT-08 are UI-only, handled in Plan 02)

---
*Phase: 04-filters*
*Completed: 2026-03-13*
