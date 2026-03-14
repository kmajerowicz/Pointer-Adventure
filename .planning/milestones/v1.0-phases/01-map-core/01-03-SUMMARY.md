---
phase: 01-map-core
plan: "03"
subsystem: ui
tags: [mapbox, react, hooks, event-listener]

# Dependency graph
requires:
  - phase: 01-map-core/01-02
    provides: LocationSearch component with search + marker placement

provides:
  - Correctly timed dragstart listener — temporary search pin removed on first user pan

affects: [map, trails, browsing]

# Tech tracking
tech-stack:
  added: []
  patterns: [map.once for one-shot event listeners attached at action time]

key-files:
  created: []
  modified:
    - src/features/map/LocationSearch.tsx

key-decisions:
  - "map.once('dragstart', removeMarker) attached inside handleSelect after marker placement — listener always fires because map is guaranteed non-null at that point"
  - "Defensive map.off('dragstart', removeMarker) in handleClear and unmount cleanup — prevents stale listener firing after manual clear or component unmount"

patterns-established:
  - "One-shot event listeners: use map.once() at the time the action occurs, not map.on() in a useEffect at mount time"

requirements-completed: [MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06, MAP-07]

# Metrics
duration: 1min
completed: 2026-03-13
---

# Phase 1 Plan 03: Location Search Dragstart Fix Summary

**Replaced broken useEffect-based dragstart wiring with map.once() attached at selection time, ensuring temporary search pins are removed when the user pans the map**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-13T18:07:42Z
- **Completed:** 2026-03-13T18:08:51Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Removed broken `useEffect` that called `map.on('dragstart', removeMarker)` — `mapRef.current` is null at mount time and the stable ref identity never triggers a re-run, so the listener never fired
- Added `map.once('dragstart', removeMarker)` inside `handleSelect` immediately after marker placement — `map` is guaranteed non-null inside the `if (map)` guard at that point
- Added defensive `map.off('dragstart', removeMarker)` in `handleClear` — prevents stale listener from firing when user clears search before panning
- Added defensive cleanup in the unmount effect — prevents listener from firing after component unmounts

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace dragstart useEffect with map.once in handleSelect** - `cb137db` (fix)

**Plan metadata:** `460533f` (docs: complete plan)

## Files Created/Modified

- `src/features/map/LocationSearch.tsx` - Replaced broken useEffect dragstart wiring with map.once at selection time; added defensive off() in handleClear and unmount cleanup

## Decisions Made

- `map.once('dragstart', removeMarker)` at selection time instead of `map.on(...)` in useEffect — `mapRef.current` is null at mount so the useEffect approach never wires the listener. At selection time the map is guaranteed ready.
- Defensive `map.off()` in both handleClear and unmount cleanup — handles the edge cases where user clears or unmounts before ever panning, which would leave a stale once-listener registered.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- MAP-03 gap fully closed: search pins are now removed on user pan
- All MAP-01 through MAP-07 requirements satisfied by Phase 1 plans 01-03
- Ready to proceed to Phase 2 (Trail Pipeline)

---
*Phase: 01-map-core*
*Completed: 2026-03-13*
