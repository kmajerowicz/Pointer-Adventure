---
phase: 07-pwa-hardening
plan: 02
subsystem: ui
tags: [react, hooks, pwa, offline, navigator-online]

# Dependency graph
requires:
  - phase: 05-auth-and-onboarding
    provides: AuthLayout component that wraps all routes
  - phase: 01-map-core
    provides: LocationSearch component used in MapView
provides:
  - useOnlineStatus hook (navigator.onLine with event listeners)
  - OfflineBanner component (fixed amber top banner for offline state)
  - LocationSearch disabled prop (grayed out input with offline placeholder)
  - AuthLayout mounts OfflineBanner for all routes
  - AppLayout adds top padding when offline to avoid banner overlap
affects: [08-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: [navigator.onLine wrapper hook, fixed top status banner, disabled prop pattern for offline-aware inputs]

key-files:
  created:
    - src/hooks/useOnlineStatus.ts
    - src/components/ui/OfflineBanner.tsx
  modified:
    - src/components/layout/AuthLayout.tsx
    - src/components/layout/AppLayout.tsx
    - src/features/map/LocationSearch.tsx
    - src/features/map/MapView.tsx

key-decisions:
  - "OfflineBanner mounted in AuthLayout (wraps all routes) not AppLayout — ensures TrailDetail and other standalone routes also show the banner"
  - "AppLayout adds pt-9 top padding when offline — prevents content overlap with fixed banner without re-mounting banner in AppLayout"
  - "LocationSearch outer div uses opacity-50 pointer-events-none for disabled state — clean visual gray-out without input-level CSS gymnastics"

patterns-established:
  - "useOnlineStatus pattern: useState(navigator.onLine) + window online/offline event listeners — reusable for any offline-aware component"
  - "Offline banner in root layout pattern: mount at AuthLayout level so all child routes inherit it without each route needing to render it"

requirements-completed:
  - PWA-04
  - PWA-05

# Metrics
duration: 2min
completed: 2026-03-14
---

# Phase 7 Plan 02: PWA Hardening — Offline Detection Summary

**navigator.onLine hook with fixed amber banner on all routes and disabled geocoding search when offline**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T10:28:05Z
- **Completed:** 2026-03-14T10:30:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `useOnlineStatus` hook wrapping `navigator.onLine` with online/offline event listeners for reactive status
- Created `OfflineBanner` component — fixed top amber banner with Polish text, auto-dismisses when online event fires
- Mounted OfflineBanner in `AuthLayout` so all routes (including standalone TrailDetail) show the banner
- Added `disabled` prop to `LocationSearch` with full visual graying and offline placeholder text
- `MapView` passes `disabled={!isOnline}` to `LocationSearch` via `useOnlineStatus()`

## Task Commits

1. **Task 1: Create useOnlineStatus hook and OfflineBanner component** - `2ba74bb` (feat)
2. **Task 2: Wire OfflineBanner into layouts and disable LocationSearch when offline** - `35b12f7` (feat)

## Files Created/Modified

- `src/hooks/useOnlineStatus.ts` — Boolean hook wrapping navigator.onLine with event listeners
- `src/components/ui/OfflineBanner.tsx` — Fixed top amber banner shown when offline
- `src/components/layout/AuthLayout.tsx` — Mounts OfflineBanner before Outlet for all routes
- `src/components/layout/AppLayout.tsx` — Adds pt-9 top padding when offline to avoid banner overlap
- `src/features/map/LocationSearch.tsx` — Added disabled prop with opacity/pointer-events-none visual + disabled input
- `src/features/map/MapView.tsx` — Imports useOnlineStatus, passes disabled={!isOnline} to LocationSearch

## Decisions Made

- OfflineBanner is mounted in AuthLayout (the root wrapper for all routes) rather than AppLayout — this ensures standalone routes like TrailDetail also show the banner
- AppLayout uses conditional `pt-9` class for top padding when offline — keeps layout push-down without re-rendering the banner twice
- Disabled state on LocationSearch uses `opacity-50 pointer-events-none` on the outer wrapper div — cleaner than applying styles to individual child elements

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Offline detection infrastructure complete — all routes display amber banner when offline
- LocationSearch gracefully degraded in offline mode
- Ready for Phase 8 testing if applicable

---
*Phase: 07-pwa-hardening*
*Completed: 2026-03-14*
