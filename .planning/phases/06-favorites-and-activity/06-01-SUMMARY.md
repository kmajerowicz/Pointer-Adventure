---
phase: 06-favorites-and-activity
plan: 01
subsystem: ui
tags: [zustand, react, supabase, vitest, optimistic-ui, typescript]

requires:
  - phase: 05-auth-and-onboarding
    provides: useAuthStore with profile, session

provides:
  - useFavoritesStore (favoriteIds Set, favorites array, O(1) lookup)
  - useActivityStore (walkedIds Set, entries array, appendEntry newest-first)
  - useInvitesStore (invitations array, loading flag)
  - useFavorites hook (optimistic toggle with rollback, updateNote, loadFavorites)
  - useActivity hook (logWalk with toast, loadActivity, loadActivityHistory with route join)
  - useInvites hook (createInvite returns URL, loadInvites)
  - ActivityHistoryEntry type in src/lib/types.ts
  - useFilteredRoutes accepts optional sourceRoutes param
  - heart-pop keyframe in src/index.css
  - showToast/clearToast on useUIStore

affects:
  - 06-02 (FavoritesList, HeartButton — consume useFavorites + useFavoritesStore)
  - 06-03 (ProfileView — consumes useActivity, useInvites, ActivityHistoryEntry)

tech-stack:
  added: []
  patterns:
    - "Optimistic UI: mutate store immediately, rollback on server error (useFavorites.toggleFavorite)"
    - "useEffect on user.id dep for auto-loading user data when session changes"
    - "Supabase chain mock with makeFullChain factory + mockReturnValueOnce for useEffect separation"
    - "Global toast via useUIStore.showToast — hooks call store, App renders toast UI"

key-files:
  created:
    - src/stores/favorites.ts
    - src/stores/favorites.test.ts
    - src/stores/activity.ts
    - src/stores/activity.test.ts
    - src/stores/invites.ts
    - src/stores/invites.test.ts
    - src/hooks/useFavorites.ts
    - src/hooks/useFavorites.test.ts
    - src/hooks/useActivity.ts
    - src/hooks/useActivity.test.ts
    - src/hooks/useInvites.ts
    - src/hooks/useInvites.test.ts
  modified:
    - src/lib/types.ts
    - src/hooks/useFilteredRoutes.ts
    - src/stores/ui.ts
    - src/index.css

key-decisions:
  - "showToast added to useUIStore (not a separate toast store) — hooks can call store action directly without React rendering; App renders toast widget from store"
  - "useEffect loadXxx uses user?.id as dep — fires once per login session, avoids stale closure issues"
  - "makeFullChain mock factory with mockReturnValueOnce for useEffect call separation — clean per-test control without global beforeEach override"
  - "ActivityHistoryEntry = ActivityLogEntry & route join — typed extension avoids separate interface; ActivityLogEntry stays clean for basic writes"

patterns-established:
  - "Store actions use new Set([...s.setName, id]) pattern — never mutate Set in place for Zustand shallow compare"
  - "appendEntry prepends (newest first) — consistent with invitations array prepend"
  - "Hooks guard mutations with if (!user) return — null user = no-op throughout data layer"
  - "TDD: store tests (pure Zustand, no React) separated from hook tests (renderHook + vi.mock)"

requirements-completed: [FAV-01, FAV-02, ACT-02, ACT-03]

duration: 7min
completed: 2026-03-14
---

# Phase 06 Plan 01: Favorites and Activity Data Layer Summary

**Zustand stores with O(1) Set lookups for favorites/activity, optimistic-UI toggle hook with server rollback, walk logging with toast feedback, and invite URL generation — 21 tests green**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-13T23:58:10Z
- **Completed:** 2026-03-14T00:05:20Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Three Zustand stores (favorites, activity, invites) with immutable Set operations and 10 store tests passing
- useFavorites with optimistic toggle: `addFavoriteId` fires before server call, rolls back if error
- useActivity.logWalk inserts to DB and shows "Zapisano spacer!" toast via useUIStore
- useInvites.createInvite returns `${origin}/invite?token=...` URL string
- useFilteredRoutes extended with optional sourceRoutes param (FavoritesList can now pass filtered subset)
- ActivityHistoryEntry type exported from types.ts for ProfileView route join data
- Heart-pop keyframe added to CSS for future HeartButton animation

## Task Commits

Each task was committed atomically:

1. **Task 1: Zustand stores and CSS keyframe** - `c18977e` (feat)
2. **Task 2: Data-fetching hooks, types, useFilteredRoutes extension** - `df99d6f` (feat)

## Files Created/Modified
- `src/stores/favorites.ts` - favoriteIds Set, favorites array, optimistic helpers
- `src/stores/favorites.test.ts` - 4 store unit tests
- `src/stores/activity.ts` - walkedIds Set, entries array, appendEntry (newest-first)
- `src/stores/activity.test.ts` - 3 store unit tests
- `src/stores/invites.ts` - invitations array, loading flag, prepend on create
- `src/stores/invites.test.ts` - 3 store unit tests
- `src/hooks/useFavorites.ts` - optimistic toggle + rollback, updateNote, loadFavorites
- `src/hooks/useFavorites.test.ts` - 5 hook tests (optimistic, rollback, no-op, updateNote)
- `src/hooks/useActivity.ts` - logWalk, loadActivity, loadActivityHistory with route join
- `src/hooks/useActivity.test.ts` - 3 hook tests (logWalk, no-op, history join)
- `src/hooks/useInvites.ts` - createInvite returns URL, loadInvites
- `src/hooks/useInvites.test.ts` - 3 hook tests (URL, null user, loadInvites)
- `src/lib/types.ts` - added ActivityHistoryEntry type
- `src/hooks/useFilteredRoutes.ts` - added optional sourceRoutes param
- `src/stores/ui.ts` - added showToast/clearToast + toast: ToastMessage | null
- `src/index.css` - added heart-pop keyframe + --animate-heart-pop token

## Decisions Made
- `showToast` added to `useUIStore` rather than creating a separate toast store — keeps surface area small; hooks call the action directly; App renders the toast widget from store state
- `useEffect` uses `user?.id` as dependency — loads data once per login session without stale closure
- `makeFullChain` mock factory with `mockReturnValueOnce` for useEffect call separation — each test controls exactly which supabase response goes to the auto-load vs the explicit mutation
- `ActivityHistoryEntry` as an intersection type (`ActivityLogEntry & { route? }`) — avoids duplication while keeping ActivityLogEntry clean for write operations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added showToast/clearToast to useUIStore**
- **Found during:** Task 2 (useActivity hook implementation)
- **Issue:** useActivity.logWalk needs to show "Zapisano spacer!" toast from hook context; no global toast mechanism existed (MapControls used local useState)
- **Fix:** Added `toast: ToastMessage | null`, `showToast(message)`, and `clearToast()` to useUIStore — enables any hook to trigger a toast that the App renders
- **Files modified:** src/stores/ui.ts
- **Verification:** Build passes, hook tests mock showToast successfully
- **Committed in:** df99d6f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing critical functionality)
**Impact on plan:** Required for correct toast functionality from hooks. No scope creep — useUIStore was already the correct place for global UI state.

## Issues Encountered
- TypeScript strict errors on custom `.then`/`.catch` implementations in test chain mocks — resolved by using `any` type annotations and proper parameter signatures with optional second argument

## Next Phase Readiness
- All stores and hooks ready for UI consumption
- Plan 06-02 (FavoritesList, HeartButton) can import useFavorites and useFavoritesStore directly
- Plan 06-03 (ProfileView, ActivityHistory) can import useActivity and useInvites with ActivityHistoryEntry type
- App.tsx needs to render toast widget from useUIStore.toast state (deferred to 06-03 or polish phase)

## Self-Check: PASSED
- All 16 files verified present on disk
- Task commits c18977e and df99d6f confirmed in git log
- Build passes cleanly (no TypeScript errors)
- 21 tests (10 store + 11 hook) all green

---
*Phase: 06-favorites-and-activity*
*Completed: 2026-03-14*
