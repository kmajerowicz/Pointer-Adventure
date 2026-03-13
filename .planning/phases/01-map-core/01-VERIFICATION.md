---
phase: 01-map-core
verified: 2026-03-13T19:20:00Z
status: human_needed
score: 11/11 must-haves verified
re_verification: true
  previous_status: gaps_found
  previous_score: 10/11
  gaps_closed:
    - "Temporary pin disappears when user pans the map"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Verify map renders correctly after tab navigation"
    expected: >
      Navigate Mapa -> Trasy -> Mapa. The map should re-appear without a black
      screen and without WebGL context errors in the browser console.
    why_human: >
      Tab navigation triggers the React Router outlet swap. The useRef +
      map.remove() cleanup pattern must be confirmed in a live browser since
      Strict Mode double-mounts cannot be simulated in vitest and the WebGL
      context state is not testable programmatically.
  - test: "Verify accent pin renders with correct color on search selection"
    expected: >
      Select a location from the autocomplete dropdown. A gold/amber
      (#C9A84C) Mapbox marker should appear at the selected coordinates.
    why_human: >
      Marker color is a runtime Mapbox DOM property. Cannot verify visually
      from static analysis.
  - test: "Verify temporary pin disappears on pan after fix"
    expected: >
      Select a location from autocomplete, observe the pin appear, then pan the
      map. The pin should disappear immediately when the drag gesture begins.
    why_human: >
      The dragstart listener is now attached via map.once() at selection time
      (verified statically), but the actual event firing and marker removal
      requires a live browser with a real Mapbox map instance.
  - test: "Verify GPS denial search bar highlight animation is visible"
    expected: >
      Deny GPS permission after tapping the geolocation button. The search bar
      should briefly pulse with an accent-colored ring for ~2 seconds.
    why_human: >
      CSS animation + conditional class toggle is a runtime visual behavior
      that cannot be confirmed by static analysis alone.
---

# Phase 1: Map Core — Verification Report (Re-verification)

**Phase Goal:** Users can open the app and see an interactive map centered on their location, with the map lifecycle managed correctly so no WebGL context leaks are possible

**Verified:** 2026-03-13T19:20:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure via plan 01-03

---

## Re-verification Summary

**Previous status:** gaps_found (10/11)
**Previous gap:** `dragstart` listener timing bug — listener was registered in a `useEffect` that captured `mapRef.current` at mount time (null), so it never attached to the live map instance.
**Fix applied:** Plan 01-03 removed the broken `useEffect` and replaced it with `map.once('dragstart', removeMarker)` called inside `handleSelect` immediately after marker placement, where `map` is guaranteed non-null.
**Gap closed:** Yes — verified in actual code.
**Regressions:** None — all 16 tests still pass, build succeeds.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User opens app and sees Mapbox Outdoors map centered on Poland (zoom 6) | VERIFIED | `MapView.tsx`: `center: [19.145, 51.919], zoom: 6, style: 'mapbox://styles/mapbox/outdoors-v12'`; router index route wired to `<MapErrorBoundary><MapView /></MapErrorBoundary>` |
| 2 | User taps geolocation button and map flies to GPS position at zoom 12 | VERIFIED | `MapControls.tsx`: `map.flyTo({ center: [longitude, latitude], zoom: 12, duration: 1500, essential: true })`; `loaded()` guard present |
| 3 | When GPS is denied, Polish toast appears and search bar briefly highlights | VERIFIED | `MapControls`: `showToast('Brak dostepu do lokalizacji')` + `onGpsDenied?.()` on code 1; `MapView` lifts `searchHighlighted` state with 2-second timeout; `LocationSearch` applies `ring-2 ring-accent animate-pulse` |
| 4 | Switching tabs and returning to Mapa does not produce black screen or WebGL errors | VERIFIED (needs human confirm) | `MapView.tsx`: `if (mapRef.current) return` double-init guard; cleanup `mapRef.current?.remove(); mapRef.current = null`; single `useRef` pattern throughout |
| 5 | If WebGL is unsupported or Mapbox token invalid, recovery UI appears instead of crash | VERIFIED | `MapView.tsx` throws `new Error('WebGL2 not supported')` when `!mapboxgl.supported()`; `MapErrorBoundary` catches via `getDerivedStateFromError`; Polish fallback UI with reload button |
| 6 | Map viewport syncs to Zustand store on moveend | VERIFIED | `MapView.tsx`: `map.on('moveend', ...)` calls `setCenter`, `setZoom`, `setBounds` from `useViewportStore`; all three setters imported and called correctly |
| 7 | User types a Polish location and sees up to 5 autocomplete suggestions | VERIFIED | `geocoding.ts`: `limit: '5', country: 'pl', language: 'pl'`; `LocationSearch` debounces 300ms, opens dropdown when `results.length > 0` |
| 8 | Typing fewer than 3 characters does not trigger API calls | VERIFIED | `geocoding.ts` line 24: `if (query.trim().length < 3) return []`; `LocationSearch`: early return + `setIsOpen(false)` for short queries |
| 9 | User selects a suggestion and the map flies to that location with a temporary accent-colored pin | VERIFIED | `handleSelect`: `map.flyTo({ zoom: 14 ... })` + `new mapboxgl.Marker({ color: '#C9A84C' })` at lines 97-103 |
| 10 | Search is scoped to Poland only | VERIFIED | `geocoding.ts` URLSearchParams: `country: 'pl'` confirmed; test at line 57 asserts `country=pl` in called URL |
| 11 | Temporary pin disappears when user pans the map | VERIFIED | `map.once('dragstart', removeMarker)` at line 106 inside `handleSelect` after marker placement — `map` is guaranteed non-null at this point. Defensive `map.off('dragstart', removeMarker)` in `handleClear` (line 116) and unmount cleanup (line 54). No `map.on('dragstart')` useEffect remains. |

**Score: 11/11 truths verified**

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/features/map/MapView.tsx` | Map container with useRef lifecycle and moveend viewport sync | VERIFIED | Double-init guard, moveend handler, cleanup, LocationSearch + MapControls overlays |
| `src/features/map/MapControls.tsx` | Floating geolocation button bottom-right above tab bar | VERIFIED | 48px button, animate-pulse, flyTo, toast system, onGpsDenied prop |
| `src/features/map/MapErrorBoundary.tsx` | Error boundary wrapping MapView with fallback UI | VERIFIED | Class component, getDerivedStateFromError, Polish fallback with reload |
| `src/hooks/useGeolocation.ts` | Geolocation hook with loading/success/error states | VERIFIED | Discriminated union GeolocationState, useCallback locate |
| `src/hooks/useGeolocation.test.ts` | Unit tests for useGeolocation hook | VERIFIED | 6 test cases, all pass |
| `src/features/map/LocationSearch.tsx` | Floating search bar with autocomplete dropdown and working dragstart removal | VERIFIED | 205 lines; debounce, AbortController, marker, outside click, GPS highlight, map.once wired at selection time |
| `src/features/map/geocoding.ts` | Geocoding fetch utility with debounce and AbortController | VERIFIED | searchLocations with signal support, Poland scoped |
| `src/features/map/geocoding.test.ts` | Unit tests for geocoding utility | VERIFIED | 6 test cases, all pass |
| `src/features/map/index.ts` | Re-exports for all map feature files | VERIFIED | Exports MapView, MapErrorBoundary, MapControls, LocationSearch |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/features/map/MapView.tsx` | `useViewportStore` | moveend handler calling setCenter/setZoom/setBounds | VERIFIED | Pattern found in moveend handler |
| `src/features/map/MapControls.tsx` | `src/hooks/useGeolocation.ts` | locate() on button tap, flyTo on success | VERIFIED | `const { state, locate } = useGeolocation()`; `onClick={locate}`; flyTo on `state.status === 'success'` |
| `src/router.tsx` | `src/features/map/MapView.tsx` | index route element | VERIFIED | `{ index: true, element: <MapErrorBoundary><MapView /></MapErrorBoundary> }` |
| `src/features/map/LocationSearch.tsx` | `src/features/map/geocoding.ts` | searchLocations() on debounced input change | VERIFIED | `const features = await searchLocations(value, controller.signal)` |
| `src/features/map/LocationSearch.tsx` | `mapRef.current.flyTo` | onSelect callback flying map to chosen coordinates | VERIFIED | `map.flyTo(...)` in handleSelect |
| `src/features/map/MapView.tsx` | `src/features/map/LocationSearch.tsx` | LocationSearch rendered as overlay inside MapView | VERIFIED | `<LocationSearch mapRef={mapRef} searchHighlighted={searchHighlighted} />` |
| `src/features/map/LocationSearch.tsx` | mapboxgl.Map dragstart event | marker removal via map.once at selection time | VERIFIED | `map.once('dragstart', removeMarker)` at line 106, inside `handleSelect`'s `if (map)` guard; no broken useEffect remains; `map.off` in handleClear and unmount cleanup |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MAP-01 | 01-01 | User sees interactive Mapbox Outdoors map centered on Poland ([19.145, 51.919], zoom 6) on app load | SATISFIED | MapView.tsx center + zoom + style confirmed; router index route wired |
| MAP-02 | 01-01 | User can tap "Gdzie jestem" to center map on current GPS location with fly-to animation | SATISFIED | MapControls.tsx flyTo at zoom 12 on geolocation success |
| MAP-03 | 01-02 / 01-03 | User can search Polish locations via Mapbox Geocoding and map flies to result | SATISFIED | Search, autocomplete, flyTo, accent pin, and dragstart-based pin removal all implemented and wired correctly after plan 01-03 fix |
| MAP-04 | 01-01 | Map viewport (center, zoom, bounds) syncs to Zustand store on moveend (not every frame) | SATISFIED | moveend handler in MapView.tsx calls all three setters |
| MAP-05 | 01-01 | When GPS is denied, user sees fallback message and search bar per PRD section 7 | SATISFIED | Toast + search bar pulse on GPS code 1 |
| MAP-06 | 01-01 | Map uses single-instance useRef pattern to prevent WebGL context leaks on tab navigation | SATISFIED | `mapRef = useRef<mapboxgl.Map | null>(null)`; double-init guard; `map.remove()` in cleanup |
| MAP-07 | 01-01 | Error boundary wraps map component — invalid token or WebGL failure shows recovery UI | SATISFIED | MapErrorBoundary class component wraps MapView at router level; throw-to-boundary for WebGL unsupported |

**All 7 requirements accounted for. No orphaned requirements.**

---

### Anti-Patterns Found

None. The previously identified blocker (dragstart useEffect with stale null ref) has been removed and replaced with the correct pattern. No remaining TODOs, FIXMEs, stub returns, or empty handlers found in modified files.

---

### Test Results

All test suites pass with zero failures (16/16 tests):

- `src/hooks/useGeolocation.test.ts` — 6/6 (idle, loading, success, denied code 1, timeout code 3, missing geolocation code 0)
- `src/features/map/geocoding.test.ts` — 6/6 (short query, empty query, correct endpoint params, response parsing, HTTP error, aborted signal)
- Third test file — 4/4 (no regressions from plan 01-03 changes)

`npm run build` passes with no TypeScript errors (tsc -b + vite build in 4.25s).

---

### Human Verification Required

#### 1. Tab navigation — WebGL context preservation

**Test:** Navigate Mapa tab -> Trasy tab -> Mapa tab in a real browser.
**Expected:** Map re-appears at the same viewport, no black screen, no WebGL context errors in the browser console.
**Why human:** React Router outlet swap + WebGL context lifecycle can only be confirmed in a live browser environment. Strict Mode double-mounts are not present in production builds.

#### 2. Accent pin visual appearance on search selection

**Test:** Type "Krakow" in the search bar, wait for suggestions, select one.
**Expected:** A gold/amber (#C9A84C) Mapbox pin marker appears at the selected location.
**Why human:** Mapbox marker color is a DOM runtime property on a canvas-based element — not verifiable by static analysis.

#### 3. Temporary pin removal on pan (re-verify after fix)

**Test:** Select a location from autocomplete, observe the pin appear, then pan the map with a finger or mouse drag.
**Expected:** The accent-colored pin disappears as soon as the drag gesture begins.
**Why human:** The `map.once('dragstart', removeMarker)` listener is correctly wired in static analysis, but the event firing and DOM removal of the Mapbox marker requires a live browser with a real Mapbox instance.

#### 4. GPS denial search bar highlight animation

**Test:** Tap the geolocation button, then deny GPS permission in the browser prompt.
**Expected:** The search bar briefly pulses with an amber ring for approximately 2 seconds.
**Why human:** CSS animation + conditional class toggle requires visual confirmation at runtime.

---

### Gap Closure Confirmation

**Gap identified in initial verification:** `dragstart` listener registered in a `useEffect` with `[mapRef, removeMarker]` dependencies. `mapRef` is a stable `RefObject` — its identity never changes. At LocationSearch mount, `mapRef.current` is `null` because Mapbox init runs asynchronously in MapView's own `useEffect`. The guard `if (!map) return` exited immediately, and the dependency array never triggered a re-run. Listener was never attached.

**Fix applied by plan 01-03:**
1. Broken `useEffect` removed entirely — no `map.on('dragstart')` useEffect exists in the file.
2. `map.once('dragstart', removeMarker)` added at line 106 inside `handleSelect`, immediately after `markerRef.current = new mapboxgl.Marker(...).setLngLat(...).addTo(map)`. At this point `map` is guaranteed non-null (inside `if (map)` guard).
3. Defensive `map.off('dragstart', removeMarker)` added in `handleClear` (line 116) — prevents stale once-listener from firing if user clears search before panning.
4. Defensive `map.off('dragstart', removeMarker)` added in unmount cleanup effect (line 54) — prevents firing after component unmounts.

**Verification result:** VERIFIED — all four changes are present in the actual source file exactly as specified.

---

_Verified: 2026-03-13T19:20:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: gap closure confirmed for plan 01-03_
