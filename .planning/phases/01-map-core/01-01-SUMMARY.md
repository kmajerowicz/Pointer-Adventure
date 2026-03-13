---
phase: 01-map-core
plan: "01"
subsystem: map
tags: [mapbox, geolocation, zustand, webgl, error-boundary, tdd]
dependency_graph:
  requires: []
  provides: [MapView, MapControls, MapErrorBoundary, useGeolocation]
  affects: [router, viewport-store]
tech_stack:
  added:
    - "@testing-library/react (dev) — hook testing with renderHook"
    - "jsdom (dev) — browser-like test environment for vitest"
  patterns:
    - "useRef for map instance (never useState) — WebGL context leak prevention"
    - "Strict Mode double-init guard (if mapRef.current return)"
    - "mapboxgl.supported() throw-to-boundary pattern for WebGL detection"
    - "moveend → Zustand viewport store sync"
    - "Inline toast with useState + setTimeout auto-dismiss"
key_files:
  created:
    - src/features/map/MapView.tsx
    - src/features/map/MapControls.tsx
    - src/features/map/MapErrorBoundary.tsx
    - src/features/map/index.ts
    - src/hooks/useGeolocation.ts
    - src/hooks/useGeolocation.test.ts
  modified:
    - src/router.tsx
    - vitest.config.ts
    - package.json
    - package-lock.json
decisions:
  - "useRef lifecycle for Mapbox map instance — map.remove() called in cleanup, double-init guard in effect"
  - "mapboxgl.supported() checked at render time and thrown to MapErrorBoundary (not inline fallback)"
  - "MapControls imports Mapbox types as named import (not namespace) to avoid unused-import TS error"
  - "Toast implemented inline in MapControls with useState + auto-dismiss timer"
  - "vitest.config.ts updated to jsdom environment for @testing-library/react hook tests"
metrics:
  duration: "3m"
  completed_date: "2026-03-13"
  tasks_completed: 3
  files_created: 6
  files_modified: 4
---

# Phase 1 Plan 01: Map Core — Summary

**One-liner:** Mapbox Outdoors map with stable WebGL useRef lifecycle, geolocation flyTo, Zustand viewport sync, Polish error boundary, and 6-case hook test coverage.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | useGeolocation hook with TDD tests | 48345e5 | useGeolocation.ts, useGeolocation.test.ts, vitest.config.ts |
| 2 | MapView, MapErrorBoundary, index.ts, router wiring | dd0a311 | MapView.tsx, MapErrorBoundary.tsx, index.ts, router.tsx |
| 3 | MapControls geolocation button with flyTo and toast | f0646a0 | MapControls.tsx |

## What Was Built

**useGeolocation hook** (`src/hooks/useGeolocation.ts`): Discriminated union state machine covering idle/loading/success/error. Uses `useCallback` for stable `locate()` reference. Handles missing `navigator.geolocation` (code 0), permission denied (code 1), position unavailable (code 2), and timeout (code 3).

**MapView** (`src/features/map/MapView.tsx`): Mapbox GL map initialized in `useEffect` with double-init prevention (`if (mapRef.current) return`). WebGL support checked at render time via `mapboxgl.supported()` — throws to `MapErrorBoundary` so both runtime errors and WebGL-unsupported cases are caught by the same boundary. `moveend` event syncs center, zoom, and bounds to Zustand viewport store. Cleanup calls `map.remove()` exactly once.

**MapErrorBoundary** (`src/features/map/MapErrorBoundary.tsx`): React class component with `getDerivedStateFromError` and `componentDidCatch`. Fallback shows Polish error message, description, and "Sprobuj ponownie" reload button styled with design tokens.

**MapControls** (`src/features/map/MapControls.tsx`): Floating 48px circular button bottom-right. Pulsing animation (`animate-pulse`) while GPS is acquiring. On success: `flyTo` user position at zoom 12. On denial: Polish toast auto-dismissing after 3 seconds. Button stays active for retry. TODO comment for Plan 02 search bar highlight.

## Test Results

All 10 tests pass (6 for useGeolocation + 4 existing type tests):
- idle state, locate() → loading, success with position, code 1 denied, code 3 timeout, missing geolocation → code 0

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Dependency] Installed @testing-library/react and jsdom**
- Found during: Task 1 setup
- Issue: `renderHook` from `@testing-library/react` not installed; vitest needed jsdom environment for DOM APIs
- Fix: `npm install --save-dev @testing-library/react jsdom`; updated `vitest.config.ts` to `environment: 'jsdom'`
- Files modified: vitest.config.ts, package.json, package-lock.json
- Commit: 48345e5

**2. [Rule 1 - Bug] Fixed TypeScript unused import error in MapControls**
- Found during: Task 2/3 build
- Issue: `import mapboxgl from 'mapbox-gl'` flagged as unused because only types were needed
- Fix: Changed to `import { type Map as MapboxMap } from 'mapbox-gl'` and updated `RefObject` typing
- Files modified: src/features/map/MapControls.tsx
- Commit: f0646a0

## Self-Check: PASSED

Files verified:
- [x] src/features/map/MapView.tsx — FOUND
- [x] src/features/map/MapControls.tsx — FOUND
- [x] src/features/map/MapErrorBoundary.tsx — FOUND
- [x] src/features/map/index.ts — FOUND
- [x] src/hooks/useGeolocation.ts — FOUND
- [x] src/hooks/useGeolocation.test.ts — FOUND

Commits verified:
- [x] 48345e5 — feat(01-01): implement useGeolocation hook
- [x] dd0a311 — feat(01-01): add MapView with WebGL lifecycle
- [x] f0646a0 — feat(01-01): add MapControls with geolocation button

Build: PASSED (npm run build)
Tests: 10/10 PASSED (npx vitest run)
