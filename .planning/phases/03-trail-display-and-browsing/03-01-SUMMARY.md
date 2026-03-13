---
phase: 03-trail-display-and-browsing
plan: 01
subsystem: ui
tags: [react, tailwind, zustand, haversine, lucide, react-router]

# Dependency graph
requires:
  - phase: 02-trail-data-pipeline
    provides: Route type, useTrailsStore with routes array, center_lat/center_lon fields
  - phase: 01-map-core
    provides: useViewportStore center/bounds, MapView map instance for flyTo
provides:
  - haversineKm great-circle distance utility
  - TrailCard compact horizontal card component with PTTK border, water icon, badges
  - TrailList sorted trail list with nearest-first ordering and empty state
  - EmptyTrailState with zoom-out CTA linked to viewport store
  - Trasy tab (/trails) wired to TrailList instead of stub
  - requestedZoom/requestZoomOut/clearRequestedZoom actions in viewport store
  - MapView zoom-out observer that calls flyTo when requestedZoom is set
affects:
  - 03-trail-display-and-browsing (filter panel will sit above TrailList)
  - 05-favorites (FavoritesList will reuse TrailCard layout patterns)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PTTK trail color borders via explicit class map (no dynamic string interpolation — Tailwind v4 purges it)"
    - "Zoom-out CTA dispatches to Zustand store → MapView useEffect watches + calls flyTo"
    - "Nearest-first sort with useMemo and primitive deps (originLat, originLon) not array refs"
    - "GPS-then-viewport fallback for sort origin"

key-files:
  created:
    - src/lib/haversine.ts
    - src/lib/haversine.test.ts
    - src/features/trails/TrailCard.tsx
    - src/features/trails/TrailList.tsx
    - src/features/trails/EmptyTrailState.tsx
  modified:
    - src/stores/viewport.ts
    - src/router.tsx
    - src/features/map/MapView.tsx

key-decisions:
  - "Explicit class map for PTTK border colors: border-l-trail-red etc — dynamic string interpolation purged by Tailwind v4"
  - "trail_color: black uses border-l-[#808080] (visible gray) instead of #1A1A1A which is invisible on dark bg-bg-surface"
  - "Warsaw-Wroclaw haversine result is ~301km straight-line, not ~292km — test range corrected to 295-310"
  - "viewport store extended with requestedZoom/requestZoomOut/clearRequestedZoom in Task 1 to unblock EmptyTrailState"

patterns-established:
  - "TrailCard: button element, min-h-[72px] for touch target, border-l-4 for PTTK color, two-line layout"
  - "EmptyTrailState: calls useViewportStore.getState().requestZoomOut(9) — zoom 9 covers ~50km radius at Poland latitude"
  - "TrailList: GPS status checked first, viewport center as fallback; coords must be swapped (center is [lng,lat], haversine wants [lat,lon])"

requirements-completed: [BROW-01, BROW-02, BROW-04, BROW-05]

# Metrics
duration: 4min
completed: 2026-03-13
---

# Phase 03 Plan 01: Trail Browsing List Summary

**Nearest-first TrailCard list on Trasy tab with PTTK color borders, water/difficulty badges, and zoom-out empty state CTA wired through Zustand viewport store**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-13T19:11:36Z
- **Completed:** 2026-03-13T19:15:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- haversineKm utility with 3 tests (identity, known distance, symmetry) — all passing
- TrailCard renders name, length_km, surface/difficulty badges, water access icon (Droplet filled/stroke/hidden), PTTK left border, 72px min touch target
- TrailList sorted nearest-first using GPS > viewport center as origin, renders EmptyTrailState when routes empty
- EmptyTrailState "Brak tras w okolicy" + zoom-out CTA dispatches requestZoomOut(9) to viewport store
- MapView watches requestedZoom via useEffect, calls flyTo then clearRequestedZoom
- Trasy tab (/trails route) now renders TrailList instead of placeholder stub

## Task Commits

1. **TDD RED: failing haversine test** - `30ed3df` (test)
2. **Task 1: haversine + TrailCard + TrailList + EmptyTrailState** - `8f98862` (feat)
3. **Task 2: router wiring + MapView zoom observer** - `b7be069` (feat)

## Files Created/Modified
- `src/lib/haversine.ts` - Great-circle distance formula, Earth radius 6371km
- `src/lib/haversine.test.ts` - 3 assertions: identity, Warsaw-Wroclaw ~301km, symmetry
- `src/features/trails/TrailCard.tsx` - Compact horizontal trail card component
- `src/features/trails/TrailList.tsx` - Sorted list using haversineKm, shows EmptyTrailState
- `src/features/trails/EmptyTrailState.tsx` - Empty state with zoom-out CTA
- `src/stores/viewport.ts` - Added requestedZoom, requestZoomOut, clearRequestedZoom
- `src/router.tsx` - /trails route wired to TrailList (was stub)
- `src/features/map/MapView.tsx` - useEffect watches requestedZoom, calls map.flyTo

## Decisions Made
- Used explicit class map for PTTK trail colors (`border-l-trail-red`, `border-l-trail-blue`, etc.) — dynamic string interpolation is purged by Tailwind v4 at build time
- `trail_color: 'black'` uses `border-l-[#808080]` (medium gray) instead of `#1A1A1A` which is visually invisible against dark `bg-bg-surface` background
- Warsaw-Wroclaw haversine distance is ~301km straight-line (not ~292km as plan stated) — test range adjusted to 295-310

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] viewport store requestedZoom actions added in Task 1**
- **Found during:** Task 1 (EmptyTrailState implementation)
- **Issue:** EmptyTrailState references `useViewportStore.getState().requestZoomOut(9)` but the action didn't exist in the store yet — Task 2 was supposed to add it
- **Fix:** Added `requestedZoom`, `requestZoomOut`, and `clearRequestedZoom` to viewport store during Task 1 so EmptyTrailState would compile and build could be verified
- **Files modified:** src/stores/viewport.ts
- **Verification:** Build passed after Task 1
- **Committed in:** 8f98862 (Task 1 commit)

**2. [Rule 1 - Bug] Haversine test distance range corrected**
- **Found during:** Task 1 TDD GREEN phase
- **Issue:** Plan specified Warsaw-Wroclaw as ~292km, actual haversine calculation yields ~301km
- **Fix:** Widened test range to 295-310 to match the correct great-circle distance
- **Files modified:** src/lib/haversine.test.ts
- **Verification:** Test passes with corrected range
- **Committed in:** 8f98862 (part of Task 1 feat commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the two auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Trasy tab shows sorted trail cards from viewport or empty state
- Filter panel (Plan 03-02) can be added above TrailList
- TrailDetail page (/trails/:id) not yet implemented — tapping a card navigates to a route that has no handler yet
- haversineKm available for reuse in distance calculations across the app

---
*Phase: 03-trail-display-and-browsing*
*Completed: 2026-03-13*
