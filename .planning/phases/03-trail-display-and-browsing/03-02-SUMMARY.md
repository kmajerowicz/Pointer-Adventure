---
phase: 03-trail-display-and-browsing
plan: 02
subsystem: ui
tags: [react, mapbox, react-router, zustand, typescript, tailwind]

# Dependency graph
requires:
  - phase: 03-trail-display-and-browsing
    provides: TrailCard, TrailList, EmptyTrailState, haversineKm, useTrailsStore, TrailLayers

provides:
  - TrailDetail page at /trails/:id with 40vh interactive Mapbox map hero showing route polyline
  - TrailDetailMap component — isolated second Mapbox instance with fitBounds polyline rendering
  - Map pin/line click navigation to /trails/:id replacing popup behavior
  - Barrel exports for trails feature via src/features/trails/index.ts

affects:
  - Phase 4 auth/onboarding (standalone route pattern established)
  - Phase 5 favorites (TrailDetail page is where heart/favorite button will live)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Second Mapbox instance uses identical useRef lifecycle guard as MapView (Strict Mode double-init guard, map.remove() in cleanup)
    - onTrailClick optional callback pattern for backward-compatible setupTrailInteractions()
    - navigateRef pattern to avoid stale closure in Mapbox style.load event handler

key-files:
  created:
    - src/features/trails/TrailDetail.tsx
    - src/features/trails/TrailDetailMap.tsx
    - src/features/trails/index.ts
  modified:
    - src/features/map/TrailLayers.ts
    - src/features/map/MapView.tsx
    - src/router.tsx

key-decisions:
  - "navigateRef pattern used in MapView: navigate stored in a ref so style.load closure always accesses latest stable navigate function"
  - "setupTrailInteractions onTrailClick is optional and backward-compatible — no callback falls back to popup"
  - "TrailDetailMap duplicates TRAIL_COLOR_MAP locally with a comment — TrailLayers.ts does not export it"
  - "/trails/:id added as top-level standalone route (not inside AppLayout) per plan spec"

patterns-established:
  - "Multiple Mapbox instances: each uses useRef with identical Strict Mode guard and cleanup"
  - "Optional callback for map interaction handlers: onTrailClick?(id: string): void — caller passes navigate, no callback falls back to popup"

requirements-completed: [BROW-03]

# Metrics
duration: 3min
completed: 2026-03-13
---

# Phase 03 Plan 02: Trail Detail Page Summary

**TrailDetail page at /trails/:id with 40vh Mapbox map hero showing polyline + all trail attributes, and map pin navigation replacing popups**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-13T19:16:42Z
- **Completed:** 2026-03-13T19:19:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- TrailDetail page renders full trail info: name, length, surface, difficulty, water access, PTTK color, distance from user
- TrailDetailMap creates an isolated second Mapbox instance with polyline fitted to bounds, same lifecycle as MapView
- Map pin and PTTK line clicks now navigate to /trails/:id instead of showing a popup
- Graceful "Trasa niedostepna" fallback when route ID is not found in store
- Barrel exports created for the trails feature

## Task Commits

1. **Task 1: TrailDetail page + TrailDetailMap component** - `1bf2654` (feat)
2. **Task 2: Map pin navigation + router + barrel exports** - `9622c84` (feat)

## Files Created/Modified
- `src/features/trails/TrailDetail.tsx` - Full-screen detail page with 40vh map hero, attribute rows, back button
- `src/features/trails/TrailDetailMap.tsx` - Isolated Mapbox instance rendering route geometry with fitBounds
- `src/features/trails/index.ts` - Barrel exports: TrailCard, TrailList, TrailDetail, EmptyTrailState
- `src/features/map/TrailLayers.ts` - setupTrailInteractions() updated to accept optional onTrailClick callback
- `src/features/map/MapView.tsx` - Passes navigate callback to setupTrailInteractions via navigateRef
- `src/router.tsx` - Added /trails/:id as top-level standalone route

## Decisions Made
- `navigateRef` pattern: `useNavigate()` called at component top level, stored in a ref, then accessed inside the Mapbox `style.load` callback — avoids stale closure problem since map effect runs once.
- `onTrailClick` is optional with popup fallback — preserves backward compatibility if the map is used without routing context.
- `TRAIL_COLOR_MAP` is duplicated locally in `TrailDetailMap.tsx` with a comment referencing `TrailLayers.ts` — `TrailLayers.ts` does not export the constant and adding an export was not required by the plan.
- `/trails/:id` placed outside AppLayout (no tab bar) consistent with /invite and /auth pattern.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- TrailDetail page is wired and accessible from both TrailList and map pins
- Phase 5 (Favorites) can add heart/favorite button to TrailDetail without structural changes
- Phase 3 Plan 03 (filters/search) can build on the same TrailList infrastructure

## Self-Check: PASSED

- TrailDetail.tsx: FOUND
- TrailDetailMap.tsx: FOUND
- index.ts: FOUND
- commit 1bf2654: FOUND
- commit 9622c84: FOUND

---
*Phase: 03-trail-display-and-browsing*
*Completed: 2026-03-13*
