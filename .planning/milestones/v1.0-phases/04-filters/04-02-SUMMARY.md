---
phase: 04-filters
plan: 02
subsystem: ui
tags: [react, zustand, tailwind, mapbox, filter-ui, bottom-sheet, chips]

# Dependency graph
requires:
  - phase: 04-filters/04-01
    provides: useFilteredRoutes, useActiveFilterCount, filterLabels, filters Zustand store

provides:
  - FilterPanel bottom sheet with 6 filter categories (Polish labels, draft state, sticky Zastosuj button)
  - FilterButton floating trigger with active count badge
  - ActiveFilterChips horizontal scrollable chip bar with dismiss and tap-to-scroll
  - Filters wired into both MapView (map pins) and TrailList — end-to-end client-side filtering

affects: [05-auth, 06-favorites, 07-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Draft state pattern — FilterPanel copies store state into local useState on open; committed only on Zastosuj tap; discarded on backdrop close
    - Pill toggle group — horizontal flex-wrap pill buttons with tap-to-toggle (same value deselects to null)
    - Scroll-to-category — useRef Record keyed by category name; onChipTap sets scrollToCategory, reopens panel
    - Exit animation — isClosing state flag triggers sheet-down CSS animation 200ms before unmount

key-files:
  created:
    - src/features/map/FilterPanel.tsx
    - src/features/map/FilterButton.tsx
    - src/features/map/ActiveFilterChips.tsx
  modified:
    - src/features/map/MapView.tsx
    - src/features/trails/TrailList.tsx
    - src/index.css

key-decisions:
  - "Draft state kept in FilterPanel local useState — not Zustand; committed only on Zastosuj, discarded on backdrop close"
  - "ActiveFilterChips positioned absolute inside map container (top-[4.25rem]) not fixed — avoids z-index conflicts with tab bar"
  - "Sheet exit animation uses isClosing flag + 200ms delay before DOM removal — smooth UX without CSS Animations API"

patterns-established:
  - "Draft state pattern: local useState copy from store on isOpen=true, commit all fields on Zastosuj"
  - "Pill toggle group: px-4 py-2 rounded-full, selected = bg-accent text-bg-base border-accent, deselect by tapping same"
  - "ToggleSwitch: w-11 h-6 rounded-full with w-5 h-5 sliding circle, role=switch + aria-checked"

requirements-completed: [FILT-01, FILT-08, FILT-10]

# Metrics
duration: ~15min
completed: 2026-03-14
---

# Phase 4 Plan 02: Filter UI Summary

**FilterPanel bottom sheet with 6 Polish-language filter categories (draft state + Zastosuj), floating FilterButton with badge, dismissible chip bar, and client-side filtering wired into both MapView pins and TrailList**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-14
- **Completed:** 2026-03-14
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 6

## Accomplishments

- Built FilterPanel bottom sheet with 6 filter sections (Dlugosci, Nawierzchnia, Dostep do wody, Trudnosc, Odleglosc, Szlak oznaczony) using internal PillGroup and ToggleSwitch components with full Polish labels
- FilterButton (bottom-left, mirrors geolocation at bottom-right) with active count badge from useActiveFilterCount; ActiveFilterChips horizontal scrollable bar with X dismiss and label-tap-to-scroll
- Wired useFilteredRoutes into both MapView (updateTrailData) and TrailList — filters affect map pins and list simultaneously with no extra API calls

## Task Commits

1. **Task 1: FilterPanel, FilterButton, ActiveFilterChips, CSS keyframes** - `35789e1` (feat)
2. **Task 2: Wire useFilteredRoutes into MapView and TrailList** - `d0b511f` (feat)
3. **Task 3: Visual verification checkpoint** - approved by user (no commit)

## Files Created/Modified

- `src/features/map/FilterPanel.tsx` — Bottom sheet: 6 filter sections, draft state (useState), PillGroup + ToggleSwitch, sticky Zastosuj footer, Wyczysc wszystko reset link, scroll-to-category support, sheet-up/down animations
- `src/features/map/FilterButton.tsx` — Floating circular trigger (bottom-left), SlidersHorizontal icon, active count badge
- `src/features/map/ActiveFilterChips.tsx` — Horizontal scrollable chip bar, reads useFiltersStore, dismiss X per chip, tap label opens panel at that category
- `src/features/map/MapView.tsx` — Imports FilterPanel, FilterButton, ActiveFilterChips; uses useFilteredRoutes instead of raw routes for updateTrailData
- `src/features/trails/TrailList.tsx` — Uses useFilteredRoutes instead of useTrailsStore routes; empty state now means "no trails match filters"
- `src/index.css` — Added sheet-up and sheet-down keyframe animations

## Decisions Made

- Draft state kept in FilterPanel local useState (not Zustand) — copied from store when isOpen becomes true; committed on Zastosuj; discarded on backdrop close. Prevents partial filter states leaking into map/list before user confirms.
- ActiveFilterChips positioned absolute at `top-[4.25rem]` inside MapView container (not fixed) — keeps it scoped to map viewport, avoids z-index fights with tab bar.
- Sheet exit animation uses isClosing boolean flag + 200ms setTimeout before unmount — no external animation library needed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both tasks built and verified cleanly. All 14 checkpoint verification steps passed per user confirmation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Complete filter system (FILT-01, FILT-08, FILT-10) is live and verified end-to-end
- Both map and list views consume useFilteredRoutes — any new filter dimensions only require updating the hook and store
- Ready for Phase 5 (Auth/Onboarding) or Phase 6 (Favorites)

---
*Phase: 04-filters*
*Completed: 2026-03-14*
