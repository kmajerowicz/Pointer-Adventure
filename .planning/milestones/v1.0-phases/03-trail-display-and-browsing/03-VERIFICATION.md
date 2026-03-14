---
phase: 03-trail-display-and-browsing
verified: 2026-03-13T20:22:00Z
status: human_needed
score: 9/10 must-haves verified
re_verification: false
human_verification:
  - test: "Count visible TrailCards on 375px screen without scrolling"
    expected: "2-3 TrailCards visible in the Trasy tab list without any scrolling"
    why_human: "Card height is min-h-[72px] but actual rendered height depends on tab bar height, padding, and safe area insets — cannot confirm 2-3 visible cards purely from static analysis"
  - test: "Tap a map pin or PTTK polyline on the map"
    expected: "Navigates to /trails/:id detail page (no popup appears)"
    why_human: "Navigation via Mapbox event callback is runtime behavior — cannot verify event handler fires correctly from static analysis"
---

# Phase 03: Trail Display and Browsing Verification Report

**Phase Goal:** Users can browse trails in both map and list views, see full trail details, and understand each trail's key attributes at a glance
**Verified:** 2026-03-13T20:22:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tapping Trasy tab shows a scrollable list of trails from the current map viewport | VERIFIED | `router.tsx:17` — `{ path: 'trails', element: <TrailList /> }` wired. `TrailList.tsx:12` reads `useTrailsStore((s) => s.routes)` which is populated by viewport-bound `useTrails` hook |
| 2 | Each TrailCard shows name, length, surface badge, water icon, difficulty badge, and PTTK color border | VERIFIED | `TrailCard.tsx:11-118` — explicit class map for border (`TRAIL_COLOR_BORDER`), `SURFACE_LABEL` map, `DIFFICULTY_LABEL` map, `Droplet` icon with fill/stroke/hidden logic for water_access, fallback "Trasa bez nazwy" |
| 3 | 2-3 TrailCards are visible without scrolling on a 375px screen | NEEDS HUMAN | `TrailCard.tsx:52` sets `min-h-[72px]`. Math suggests 3-4 cards fit in viewport minus tab bar, but exact rendering depends on safe area insets and padding — needs visual confirmation |
| 4 | When no trails exist in the area, an empty state with 'Brak tras w okolicy' and a zoom-out CTA appears | VERIFIED | `EmptyTrailState.tsx:44` — "Brak tras w okolicy" text present. `EmptyTrailState.tsx:51-57` — "Szukaj w promieniu 50 km" CTA button. `TrailList.tsx:44-46` renders EmptyTrailState when `routes.length === 0` |
| 5 | Tapping the zoom-out CTA zooms the map to ~50km radius and triggers a new trail fetch | VERIFIED | `EmptyTrailState.tsx:5` — `handleZoomOut` calls `useViewportStore.getState().requestZoomOut(9)`. `viewport.ts:28` stores the value. `MapView.tsx:57-62` — `useEffect` watches `requestedZoom`, calls `map.flyTo({ zoom: requestedZoom })` then `clearRequestedZoom()` |
| 6 | Tapping a TrailCard navigates to /trails/:id and shows full trail info | VERIFIED | `TrailList.tsx:55` — `onClick={() => navigate('/trails/${route.id}')}`. `router.tsx:24` — `{ path: '/trails/:id', element: <TrailDetail /> }` as standalone route |
| 7 | TrailDetail shows an interactive map hero (~40vh) with the trail polyline fitted to bounds | VERIFIED | `TrailDetail.tsx:121` — `<div style={{ height: '40vh', minHeight: '200px' }}>` container. `TrailDetailMap.tsx:77-111` — adds GeoJSON source, polyline layer, calls `fitBoundsOrCenter()` on `style.load` |
| 8 | TrailDetail shows all trail attributes below the map: name, length, surface, difficulty, water access, PTTK color, distance | VERIFIED | `TrailDetail.tsx:139-217` — heading with name, AttributeRow for length_km, surface_type (Polish label), difficulty (Polish label), water_access (Droplet + label), trail_color indicator with PTTK badge, is_marked badge, distance from user |
| 9 | A back button overlays the map hero and returns to the previous page | VERIFIED | `TrailDetail.tsx:124-133` — `absolute top-4 left-4 z-10` ArrowLeft button, `onClick={() => navigate(-1)}` |
| 10 | When route is not found in store, a graceful 'Trasa niedostepna' message appears with a back button | VERIFIED | `TrailDetail.tsx:70-89` — `TrailNotFound` component renders "Trasa niedostepna" h1, description, back button with `navigate(-1)`. `TrailDetail.tsx:110-112` — renders `TrailNotFound` when route is undefined |

**Score:** 9/10 truths verified (1 needs human confirmation)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/haversine.ts` | Great-circle distance calculation, exports `haversineKm` | VERIFIED | 32 lines, correct Haversine formula, Earth radius 6371km, exports `haversineKm` |
| `src/features/trails/TrailCard.tsx` | Compact horizontal trail card, exports `TrailCard` | VERIFIED | 119 lines, full implementation — border class map, surface/difficulty/water labels, name fallback, chevron, 72px min-height |
| `src/features/trails/TrailList.tsx` | Sorted trail list with empty state, exports `TrailList` | VERIFIED | 60 lines, reads from `useTrailsStore`, GPS-then-viewport origin, `useMemo` sort, renders `EmptyTrailState` when empty |
| `src/features/trails/EmptyTrailState.tsx` | Empty state with zoom-out CTA, exports `EmptyTrailState` | VERIFIED (with info) | 60 lines, functional inline SVG illustration (intentional placeholder pending final art), correct text and CTA wired to viewport store |
| `src/features/trails/TrailDetail.tsx` | Full trail detail page, exports `TrailDetail` | VERIFIED | 222 lines, full implementation — map hero, attributes, back button, graceful fallback |
| `src/features/trails/TrailDetailMap.tsx` | Second Mapbox instance for detail map hero, exports `TrailDetailMap` | VERIFIED | 124 lines, same lifecycle guard as MapView, polyline with fitBounds, geometry type handling |
| `src/features/trails/index.ts` | Public barrel exports for trails feature | VERIFIED | Exports `TrailCard`, `TrailList`, `TrailDetail`, `EmptyTrailState` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `TrailList.tsx` | `src/stores/trails.ts` | `useTrailsStore((s) => s.routes)` | WIRED | `TrailList.tsx:12` — direct store subscription, sorted and rendered |
| `TrailList.tsx` | `src/lib/haversine.ts` | `haversineKm` for sort + distance display | WIRED | `TrailList.tsx:6,38` — imported and used in `useMemo` sort |
| `EmptyTrailState.tsx` | `src/stores/viewport.ts` | `requestZoomOut` action dispatches zoom to MapView | WIRED | `EmptyTrailState.tsx:1,5` — `useViewportStore.getState().requestZoomOut(9)` in click handler |
| `router.tsx` | `TrailList.tsx` | Trasy tab route renders TrailList | WIRED | `router.tsx:4,17` — imported and wired at `path: 'trails'` inside AppLayout |
| `TrailDetail.tsx` | `src/stores/trails.ts` | `routes.find(r => r.id === id)` | WIRED | `TrailDetail.tsx:97` — `useTrailsStore((s) => s.routes.find((r) => r.id === id))` |
| `TrailDetailMap.tsx` | `mapbox-gl` | `useRef` map instance with `style.load` polyline | WIRED | `TrailDetailMap.tsx:66-121` — `new mapboxgl.Map(...)`, style.load handler adds source and layers |
| `TrailLayers.ts` | navigation callback | `onTrailClick` callback navigates to `/trails/:id` | WIRED | `TrailLayers.ts:183-250` — optional `onTrailClick?(id: string): void` called for unclustered pin and line-fill clicks |
| `router.tsx` | `TrailDetail.tsx` | standalone `/trails/:id` route | WIRED | `router.tsx:5,24` — imported and wired as top-level route outside AppLayout |
| `MapView.tsx` | `TrailLayers.ts` | `setupTrailInteractions` with navigate callback | WIRED | `MapView.tsx:105` — `setupTrailInteractions(map, (id) => navigateRef.current('/trails/${id}'))` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BROW-01 | 03-01 | User can toggle between map view and list view | SATISFIED | `BottomTabBar.tsx` provides Mapa ("/") and Trasy ("/trails") tabs. Both routes are wired in `router.tsx`. TrailList is the list view; MapView is the map view. Tab navigation toggles between them. |
| BROW-02 | 03-01 | TrailCard displays: name, length, surface badge, water access icon, difficulty badge, trail color indicator (if PTTK) | SATISFIED | `TrailCard.tsx` renders all specified fields. Explicit class map avoids Tailwind v4 purge issue. |
| BROW-03 | 03-02 | TrailDetail page shows full trail info, map with route polyline, and action buttons | SATISFIED (partial per deferred spec) | Trail info and map polyline implemented. Action buttons (heart, "Przeszedlem!") intentionally deferred to Phase 5 per plan spec — PLAN documents this as acceptable for Phase 3. |
| BROW-04 | 03-01 | Empty state shows illustration + "Brak tras" message + "Szukaj w promieniu 50 km" CTA | SATISFIED | `EmptyTrailState.tsx` shows SVG illustration slot, correct message, and CTA wired to viewport store zoom-out |
| BROW-05 | 03-01 | 2-3 TrailCards visible without scrolling on 375px screen width | NEEDS HUMAN | `min-h-[72px]` per card. Static math supports 3-4 cards fitting but exact rendering needs visual check |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `EmptyTrailState.tsx` | 10 | Comment: "Placeholder SVG slot — user will supply final illustration" | Info | The component uses a functional inline SVG (circular path + trail icon shapes). The illustration works and is not missing — it is intentionally awaiting a final design asset. The CTA and text are fully functional. No goal impact. |

### Human Verification Required

#### 1. Card density on 375px screen (BROW-05)

**Test:** Open the app in a browser devtools mobile viewport set to 375x667px (iPhone SE). Navigate to the Trasy tab with at least 3 trails loaded.
**Expected:** 2-3 TrailCards should be visible without any scrolling gesture.
**Why human:** `min-h-[72px]` guarantees cards are at least 72px tall but actual height may be larger due to content. The tab bar is `4.5rem` (72px). Available height after tab bar on a 667px device: ~595px. At 72px per card: ~8 cards would fit, which exceeds the "2-3" target. Actual rendering on a real device or DevTools may show different results due to padding, OS bars, and font metrics.

#### 2. Map pin navigation (runtime behavior)

**Test:** Open the map view with trails loaded. Tap an unclustered trail pin or a PTTK polyline.
**Expected:** Navigates to `/trails/:id` detail page. No popup appears.
**Why human:** The Mapbox `click` event handler calls `onTrailClick` when `id` is truthy — this is runtime behavior that cannot be validated from static analysis. The wiring is correct but execution depends on the Mapbox event system.

### Gaps Summary

No blocking gaps found. All artifacts are substantive and wired. Build passes (`tsc -b && vite build`). Haversine tests pass (3/3). All 5 commits from the phase exist in git history (`30ed3df`, `8f98862`, `b7be069`, `1bf2654`, `9622c84`).

Two items require human confirmation:
1. BROW-05 card density — needs visual check at 375px
2. Map pin navigation — needs runtime verification

The BROW-03 action buttons note is intentional and documented in the plan: heart/favorite and "Przeszedlem!" buttons are deferred to Phase 5. This is not a gap for Phase 3.

---

_Verified: 2026-03-13T20:22:00Z_
_Verifier: Claude (gsd-verifier)_
