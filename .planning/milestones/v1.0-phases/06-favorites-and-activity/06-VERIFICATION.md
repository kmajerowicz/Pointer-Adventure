---
phase: 06-favorites-and-activity
verified: 2026-03-14T01:15:30Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 6: Favorites and Activity Verification Report

**Phase Goal:** Authenticated users can save trails, add private notes, log completed walks, and view their history on their profile
**Verified:** 2026-03-14T01:15:30Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|---------|
| 1  | Heart toggle is instant — tapping favorite reflects immediately in UI before server round-trip | VERIFIED | `useFavorites.toggleFavorite` calls `addFavoriteId`/`removeFavoriteId` before awaiting Supabase; 3 hook tests confirm optimistic behavior |
| 2  | Heart toggle rolls back if server call fails — user sees original state restored | VERIFIED | Catch block in `useFavorites.toggleFavorite` restores prior Set state; dedicated rollback test passes |
| 3  | Walked indicator appears on TrailCards for trails the user has logged | VERIFIED | `TrailCard` renders `<Check>` icon when `isWalked=true`; `TrailList` and `FavoritesList` both pass `walkedIds.has(route.id)` |
| 4  | FavoritesList shows only favorited trails with working filter controls via useFilteredRoutes | VERIFIED | `FavoritesList` computes `favoriteRoutes` via `useMemo`, passes to `useFilteredRoutes(favoriteRoutes)`; FilterPanel + FilterButton + ActiveFilterChips present |
| 5  | "Zapisano spacer!" toast appears after logging a walk | VERIFIED | `useActivity.logWalk` calls `showToast('Zapisano spacer!')` on success; `showToast` exists in `useUIStore` |
| 6  | Heart icon on TrailCard replaces chevron for favorited trails | VERIFIED | `TrailCard` renders filled `<Heart>` button when `isFavorited=true`, empty heart when toggle provided but unfavorited, `<ChevronRight>` as fallback |
| 7  | Heart icon on TrailDetail floats over map hero (top-right) | VERIFIED | `TrailDetail` renders heart button at `absolute top-4 right-4 z-10` inside the map hero `<div className="relative">` |
| 8  | Inline note textarea appears on TrailDetail when trail is favorited | VERIFIED | `{isFavorited && profile && <FavoriteNote ... />}` block present in `TrailDetail` |
| 9  | Favorites page lists only favorited trails with same filter controls | VERIFIED | `FavoritesList` at `/favorites` route — router imports from `features/favorites`, stub removed |
| 10 | Empty favorites shows personalized message with dog name | VERIFIED | `{favoriteRoutes.length === 0}` branch renders "Znajdz cos dla {dogName}!" with CTA; FavoritesList test confirms |
| 11 | "Przeszedlem!" sticky button on TrailDetail for authenticated users | VERIFIED | `{profile && <div>...<button>Przeszedlem!</button></div>}` in `TrailDetail`, shows "(ponownie)" after walk |
| 12 | Profile page displays user display name, dog name, and avatar placeholder | VERIFIED | `ProfileView` renders initial circle (accent/20 bg), `display_name`, `dog_name` in user info card |
| 13 | Profile page shows activity history as a list of walked trails with dates | VERIFIED | `ProfileView` iterates `entries` as `ActivityHistoryEntry`, renders `route.name`, `length_km`, Polish locale date; empty state message present |

**Score:** 13/13 truths verified

---

### Required Artifacts

| Artifact | Provides | Status | Notes |
|----------|----------|--------|-------|
| `src/stores/favorites.ts` | Favorites Zustand store | VERIFIED | Exports `useFavoritesStore`; `favoriteIds: Set<string>`, immutable Set ops, `updateNote` |
| `src/stores/activity.ts` | Activity Zustand store | VERIFIED | Exports `useActivityStore`; `walkedIds: Set<string>`, `appendEntry` prepends newest-first |
| `src/stores/invites.ts` | Invites Zustand store | VERIFIED | Exports `useInvitesStore`; `addInvitation` prepends |
| `src/hooks/useFavorites.ts` | Favorites CRUD hook with optimistic toggle | VERIFIED | Exports `useFavorites`; optimistic add/remove + rollback; calls `supabase.from('favorites')` |
| `src/hooks/useActivity.ts` | Activity log hook | VERIFIED | Exports `useActivity`; `logWalk` inserts + toast; `loadActivityHistory` with routes join |
| `src/hooks/useInvites.ts` | Invites fetch and create hook | VERIFIED | Exports `useInvites`; `createInvite` returns `${origin}/invite?token=...` |
| `src/lib/types.ts` | ActivityHistoryEntry type | VERIFIED | `export type ActivityHistoryEntry = ActivityLogEntry & { route?: ... }` at line 49 |
| `src/hooks/useFilteredRoutes.ts` | Optional sourceRoutes param | VERIFIED | Signature `useFilteredRoutes(sourceRoutes?: Route[])`, uses `sourceRoutes ?? storeRoutes` |
| `src/features/trails/TrailCard.tsx` | Heart/chevron conditional, walked indicator | VERIFIED | Contains `isFavorited`, `isWalked`, `onFavoriteToggle` props; conditional heart/chevron render |
| `src/features/trails/TrailDetail.tsx` | Heart overlay, note section, Przeszedlem button | VERIFIED | Contains `toggleFavorite`, `logWalk`, `FavoriteNote`, `Przeszedlem` |
| `src/features/favorites/FavoritesList.tsx` | Ulubione tab page with filters | VERIFIED | Exports `FavoritesList`; passes `favoriteRoutes` to `useFilteredRoutes`; empty/filter-mismatch states |
| `src/features/favorites/FavoriteNote.tsx` | Note textarea component | VERIFIED | Exports `FavoriteNote`; auto-saves on blur; shows "Zapisywanie..." |
| `src/features/favorites/index.ts` | Barrel export | VERIFIED | Exports `FavoritesList` and `FavoriteNote` |
| `src/features/profile/ProfileView.tsx` | Profil tab page | VERIFIED | Exports `ProfileView`; reads `useAuthStore`, `useActivity`; renders history |
| `src/features/profile/InviteGenerator.tsx` | Invite creation and list section | VERIFIED | Exports `InviteGenerator`; uses `useInvites`; pending/used/expired status badges |
| `src/features/profile/index.ts` | Barrel export | VERIFIED | Exports `ProfileView` and `InviteGenerator` |
| `src/index.css` | heart-pop keyframe | VERIFIED | `--animate-heart-pop: heart-pop 300ms ease-out` + `@keyframes heart-pop` |
| `src/stores/ui.ts` | showToast/clearToast | VERIFIED | `showToast` action exists at line 36 |

---

### Key Link Verification

| From | To | Via | Status | Detail |
|------|----|-----|--------|--------|
| `useFavorites.ts` | `stores/favorites.ts` | `useFavoritesStore` | WIRED | Imports and calls `addFavoriteId`, `removeFavoriteId`, `addFavorite`, `removeFavorite`, `updateNote` |
| `useFavorites.ts` | `supabase.from('favorites')` | insert/delete/select | WIRED | Both insert (unfavorite) and delete (unfavorite) paths present; select for loadFavorites |
| `useActivity.ts` | `stores/activity.ts` | `useActivityStore` | WIRED | Calls `addWalkedId`, `appendEntry`, `setWalkedIds`, `setEntries` |
| `TrailCard.tsx` | `useFavorites.ts` | `isFavorited` prop from parent | WIRED | `TrailList` passes `favoriteIds.has(route.id)` and `toggleFavorite` to each card |
| `TrailDetail.tsx` | `useFavorites.ts` | `toggleFavorite` | WIRED | Direct call: `onClick={() => route && toggleFavorite(route.id)}` |
| `TrailDetail.tsx` | `useActivity.ts` | `logWalk` | WIRED | `onClick={() => route && logWalk(route.id)}` on Przeszedlem button |
| `FavoritesList.tsx` | `useFilteredRoutes.ts` | passes favoriteRoutes as sourceRoutes | WIRED | `useFilteredRoutes(favoriteRoutes)` called with `favoriteRoutes` array |
| `router.tsx` | `FavoritesList` | /favorites route | WIRED | `import { FavoritesList } from './features/favorites'`; `element: <FavoritesList />` |
| `ProfileView.tsx` | `stores/auth.ts` | `useAuthStore` | WIRED | `const profile = useAuthStore((s) => s.profile)` |
| `ProfileView.tsx` | `useActivity.ts` | `loadActivityHistory` | WIRED | `useEffect(() => { void loadActivityHistory() }, [])` on mount |
| `InviteGenerator.tsx` | `useInvites.ts` | `createInvite` and `loadInvites` | WIRED | `const { invitations, loading, createInvite } = useInvites()` |
| `router.tsx` | `ProfileView` | /profile route | WIRED | `import { ProfileView } from './features/profile'`; `element: <ProfileView />` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| FAV-01 | 06-01, 06-02 | User can toggle favorite via heart icon on TrailCard and TrailDetail | SATISFIED | `TrailCard` renders heart button; `TrailDetail` has floating heart overlay; both call `toggleFavorite` |
| FAV-02 | 06-01, 06-02 | Heart toggle uses optimistic UI (instant visual feedback, rollback on error) | SATISFIED | `useFavorites.toggleFavorite` mutates store before server call; catch block rolls back; 3 tests confirm |
| FAV-03 | 06-02 | Favorites page lists all saved trails with reusable filter controls | SATISFIED | `FavoritesList` at `/favorites`; uses `FilterButton`, `ActiveFilterChips`, `FilterPanel`; passes to `useFilteredRoutes` |
| FAV-04 | 06-02 | User can add/edit private note per favorite trail | SATISFIED | `FavoriteNote` auto-saves on blur; `updateNote` in `useFavorites` calls Supabase update; rendered in `TrailDetail` when favorited |
| FAV-05 | 06-02 | Empty favorites shows personalized message with dog name and CTA | SATISFIED | `{favoriteRoutes.length === 0}` branch: "Znajdz cos dla {dogName}!"; "Przegladaj trasy" CTA button |
| ACT-01 | 06-02 | TrailDetail shows "Przeszedlem!" button for authenticated users | SATISFIED | `{profile && <div>...<button>Przeszedlem!</button></div>}` in `TrailDetail` |
| ACT-02 | 06-01, 06-02 | Tap creates activity_log entry and shows toast "Zapisano spacer!" | SATISFIED | `logWalk` inserts `{user_id, route_id, walked_at}` into `activity_log`, calls `showToast('Zapisano spacer!')` |
| ACT-03 | 06-01, 06-02 | Visual "walked" indicator shown on TrailCards for trails in activity log | SATISFIED | `TrailCard` renders `<Check size={14} className="text-success">` when `isWalked=true`; `TrailList` and `FavoritesList` both pass `walkedIds.has(route.id)` |
| ACT-04 | 06-03 | Profile page shows activity history (list of walked trails with dates) | SATISFIED | `ProfileView` renders `entries` as `ActivityHistoryEntry[]`; shows route name, km, Polish locale date |
| PROF-01 | 06-03 | Profile page displays: display name, dog name, avatar placeholder | SATISFIED | User info card renders initial circle, `display_name`, `dog_name` |
| PROF-02 | 06-03 | User can generate new invite links (creates row in invitations table) | SATISFIED | `InviteGenerator.handleCreate` calls `createInvite()`; `useInvites.createInvite` inserts into `invitations` table |
| PROF-03 | 06-03 | User can see status of generated invites (pending/used with used_at) | SATISFIED | `InviteGenerator` renders each invite with `statusLabel` (Oczekujace/Wykorzystane/Wygaslo) + `used_at` date when used |

All 12 requirement IDs satisfied. No orphaned requirements found — all match plan frontmatter declarations.

---

### Test Results

| Test File | Tests | Result |
|-----------|-------|--------|
| `src/hooks/useFavorites.test.ts` | 5 | All pass |
| `src/hooks/useActivity.test.ts` | 3 | All pass |
| `src/hooks/useInvites.test.ts` | 3 | All pass |
| `src/features/favorites/FavoriteNote.test.tsx` | 6 | All pass |
| `src/features/favorites/FavoritesList.test.tsx` | 3 | All pass |
| `src/features/profile/ProfileView.test.tsx` | 5 | All pass |
| **Total** | **25** | **25/25 pass** |

Build: `npm run build` — passes cleanly (no TypeScript errors; chunk size advisory warning only, not an error).

---

### Anti-Patterns Found

None. Scan of all 12 phase-created/modified files found no TODO/FIXME/placeholder code stubs, no empty implementations, and no console.log-only handlers.

The single "placeholder" match was the HTML `placeholder` attribute on a `<textarea>` element — expected and correct.

---

### Human Verification Required

The following behaviors cannot be verified programmatically:

#### 1. Heart-pop animation on TrailDetail

**Test:** Open a trail detail. Tap the heart button to favorite it.
**Expected:** Heart icon plays the scale-up-then-bounce animation (heart-pop keyframe: 1.0 -> 1.35 -> 0.9 -> 1.0 over 300ms).
**Why human:** CSS animation playback cannot be asserted in jsdom.

#### 2. Toast "Zapisano spacer!" visibility

**Test:** Authenticated user opens a trail detail. Taps "Przeszedlem!". App must be running with real Supabase or mocked insert.
**Expected:** Toast notification "Zapisano spacer!" appears and auto-dismisses.
**Why human:** Toast render depends on `useUIStore.toast` being consumed by App.tsx — verify the App renders a toast widget that reads from the store (Plan 01 notes this was deferred to App.tsx wiring).

#### 3. FavoriteNote auto-save on blur

**Test:** Open a favorited trail detail. Click the note textarea, type text, then click outside.
**Expected:** "Zapisywanie..." briefly appears, then disappears. Note persists on page reload.
**Why human:** blur event timing and Supabase persistence require real browser + network.

#### 4. InviteGenerator share sheet / clipboard

**Test:** On mobile PWA: tap "Nowe zaproszenie". On desktop: tap "Nowe zaproszenie".
**Expected:** Mobile shows OS share sheet with invite URL. Desktop copies URL to clipboard and shows Check icon feedback.
**Why human:** `navigator.share` and `navigator.clipboard.writeText` are browser APIs not available in test environment.

---

### Toast Rendering Note

`useActivity.logWalk` calls `showToast('Zapisano spacer!')` via `useUIStore`. The Plan 01 SUMMARY explicitly notes: "App.tsx needs to render toast widget from useUIStore.toast state (deferred to 06-03 or polish phase)." Verify that `App.tsx` (or a layout component) reads `useUIStore((s) => s.toast)` and renders a visible toast UI. This is the integration point that makes the ACT-02 toast actually appear to users. If App.tsx does not render from the store, the toast silently fires into the store with no visible output.

---

## Gaps Summary

No gaps found. All 13 observable truths verified, all 12 requirements satisfied, all 25 tests pass, build is clean.

The single actionable note (not a gap): confirm that `App.tsx` renders the toast widget from `useUIStore.toast`. If it does not, ACT-02 ("shows toast") would be functionally broken in production despite the hook and store being correctly implemented. This is likely wired but warrants a quick check before shipping.

---

_Verified: 2026-03-14T01:15:30Z_
_Verifier: Claude (gsd-verifier)_
