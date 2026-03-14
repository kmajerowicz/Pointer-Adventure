---
phase: 06-favorites-and-activity
plan: 02
subsystem: ui
tags: [react, favorites, activity, tailwind, vitest, optimistic-ui, typescript]

requires:
  - phase: 06-favorites-and-activity
    plan: 01
    provides: useFavorites, useActivity, useFavoritesStore, useActivityStore, heart-pop keyframe

provides:
  - TrailCard with heart icon (replaces chevron when favorited) and walked indicator
  - TrailList passing isFavorited/isWalked/onFavoriteToggle props
  - TrailDetail with floating heart overlay, inline FavoriteNote, sticky Przeszedlem button
  - FavoriteNote component (auto-save on blur, Zapisywanie... feedback)
  - FavoritesList page (Ulubione tab — filter controls, empty state with dog name, note previews)
  - favorites/index.ts exporting FavoritesList and FavoriteNote
  - router.tsx wired to FavoritesList at /favorites

affects:
  - 06-03 (ProfileView — no direct dependency on these UI components)

tech-stack:
  added: []
  patterns:
    - "div+role=button pattern for TrailCard — avoids nested <button> HTML violation"
    - "FilterPanel local useState in FavoritesList — isOpen + scrollToCategory, same pattern as MapView"
    - "Note preview below TrailCard in FavoritesList — wrapper fragment, no TrailCard prop extension"
    - "FavoriteNote useEffect on initialNote dep — syncs draft when external Supabase data arrives"

key-files:
  created:
    - src/features/favorites/FavoriteNote.tsx
    - src/features/favorites/FavoriteNote.test.tsx
    - src/features/favorites/FavoritesList.tsx
    - src/features/favorites/FavoritesList.test.tsx
    - src/features/favorites/index.ts
  modified:
    - src/features/trails/TrailCard.tsx
    - src/features/trails/TrailDetail.tsx
    - src/features/trails/TrailList.tsx
    - src/router.tsx

key-decisions:
  - "TrailCard changed from <button> wrapper to div+role=button — HTML forbids button-inside-button; heart action is a proper <button> that stops propagation"
  - "FavoritesList manages its own FilterPanel state (local useState) — avoids coupling to global UIStore.isFilterOpen which is shared with MapView"
  - "Note preview renders below TrailCard via wrapper fragment — keeps TrailCard API unchanged, no notePreview prop added"
  - "Przeszedlem! button shows (ponownie) suffix when isWalked — simplest repeat-walk UX without walk count complexity"

requirements-completed: [FAV-03, FAV-04, FAV-05, ACT-01, ACT-03]

duration: 4min
completed: 2026-03-14
---

# Phase 06 Plan 02: Favorites and Activity UI Layer Summary

**Heart icon on TrailCard with stop-propagation, floating heart on TrailDetail, auto-save FavoriteNote, FavoritesList page with filter controls and personalized empty state — 9 tests green**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T00:08:06Z
- **Completed:** 2026-03-14T00:12:26Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- TrailCard: heart icon replaces chevron for favorited trails; empty heart when unfavorited but onFavoriteToggle present; backward-compatible chevron when no toggle prop
- TrailCard: walked checkmark (Check icon, text-success) after trail name for walked trails
- TrailList: now imports useFavorites and useActivityStore, passes isFavorited/isWalked/onFavoriteToggle to each card
- TrailDetail: floating heart button top-right (mirrors back button), animates with heart-pop on favorite; inline FavoriteNote shown when favorited+authenticated; sticky Przeszedlem! button at bottom for authenticated users (shows "(ponownie)" when already walked)
- FavoriteNote: controlled textarea, auto-saves on blur only when changed, shows "Zapisywanie..." during async save; syncs draft when initialNote changes externally
- FavoritesList: filters favorited routes through useFilteredRoutes (respecting user's active filters); sorts by distance; shows personalized empty state with dog name; shows filter-mismatch state; note preview below each card
- Router /favorites now renders FavoritesList (stub removed)
- 9 tests: 6 FavoriteNote + 3 FavoritesList, all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: TrailCard heart/walked, TrailDetail heart+note+Przeszedlem, FavoriteNote** - `aa0ac64` (feat)
2. **Task 2: FavoritesList page, index.ts, router wiring; fix nested button in TrailCard** - `409ba42` (feat)

## Files Created/Modified

- `src/features/trails/TrailCard.tsx` — heart/chevron conditional, walked indicator, div+role=button fix
- `src/features/trails/TrailDetail.tsx` — floating heart overlay, FavoriteNote section, Przeszedlem! button
- `src/features/trails/TrailList.tsx` — passes isFavorited/isWalked/onFavoriteToggle props
- `src/features/favorites/FavoriteNote.tsx` — controlled auto-save textarea component
- `src/features/favorites/FavoriteNote.test.tsx` — 6 tests (render, blur-save, no-save, clear, saving state)
- `src/features/favorites/FavoritesList.tsx` — Ulubione tab page with filters, empty states, note previews
- `src/features/favorites/FavoritesList.test.tsx` — 3 tests (empty state, renders cards, filter mismatch)
- `src/features/favorites/index.ts` — exports FavoritesList and FavoriteNote
- `src/router.tsx` — FavoritesPage stub removed, FavoritesList imported and wired

## Decisions Made

- `TrailCard` changed from `<button>` to `div+role=button` — HTML forbids button nesting; the heart action needs to be a proper focusable button with stopPropagation; keyboard nav preserved via onKeyDown
- `FavoritesList` manages its own FilterPanel state via local `useState` — global `useUIStore.isFilterOpen` belongs to the map view; creating independent panel state avoids cross-tab interference
- Note preview uses wrapper fragment pattern — no `notePreview` prop added to TrailCard, keeping TrailCard API minimal

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed nested button HTML violation in TrailCard**
- **Found during:** Task 2 (FavoritesList test run — jsdom console warning)
- **Issue:** TrailCard was a `<button>` containing a heart `<button>` — HTML forbids button-inside-button; screen readers and browsers handle it inconsistently
- **Fix:** Changed TrailCard outer container to `<div role="button" tabIndex={0}>` with `onKeyDown` for Enter/Space keyboard navigation; heart remains a proper `<button>` with stopPropagation
- **Files modified:** src/features/trails/TrailCard.tsx
- **Commit:** 409ba42 (included in Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Required for correct HTML semantics. The fix was applied during Task 2 before the final commit.

## Self-Check: PASSED
