# Phase 6: Favorites and Activity - Research

**Researched:** 2026-03-14
**Domain:** Supabase CRUD (favorites/activity_log/invitations), optimistic UI with Zustand, Supabase RLS, React component composition
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Heart toggle and favorites list:**
- Heart icon on TrailCard replaces the chevron for favorited trails; unfavorited trails keep chevron for navigation
- Heart icon on TrailDetail as a floating button overlaying the map hero (top-right, mirrors back button on top-left)
- Optimistic UI: instant visual feedback on tap, rollback on server error (FAV-02)
- Favorites page (Ulubione tab) uses the same filter controls as the main trail list — FilterButton + ActiveFilterChips + useFilteredRoutes (FAV-03)
- Empty favorites shows personalized message with dog name (FAV-05)

**Private notes on favorites:**
- Inline text area on TrailDetail below trail attributes — always visible when trail is favorited
- Notes only available on favorited trails (FAV-04) — unfavoriting removes the note section
- Note display on favorites list: Claude's discretion (preview line vs detail-only)
- Note save behavior: Claude's discretion (auto-save on blur vs explicit button)

**Activity log and walked indicator:**
- "Przeszedłem!" button as a sticky full-width accent button fixed at the bottom of TrailDetail — always reachable, prominent CTA
- Only visible for authenticated users (ACT-01)
- Each tap creates a new activity_log entry — supports multiple walks on the same trail
- Toast "Zapisano spacer!" on success (ACT-02)
- Post-tap button state: Claude's discretion (show walk count vs reset)
- Walked indicator on TrailCards: Claude's discretion (checkmark badge, muted text, or tint)

**Profile page layout:**
- Layout structure: Claude's discretion (card-based sections vs single scroll)
- Avatar placeholder: Claude's discretion (initial circle or paw icon)
- Displays: display name, dog name, avatar (PROF-01)
- Activity history: list of walked trails with dates (ACT-04)
- Invite generation: Claude's discretion (copy-to-clipboard vs native share sheet)
- Invite status display: Claude's discretion (simple badges vs expandable rows)

### Claude's Discretion
- Heart toggle animation style
- Note preview on favorites list (show first line or detail-only)
- Note save pattern (auto-save on blur vs explicit save button)
- Post-walk button state (walk count vs reset)
- Walked indicator visual style on TrailCards
- Profile page layout structure
- Avatar placeholder design
- Invite generation UX (clipboard vs share sheet)
- Invite status display detail level

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FAV-01 | User can toggle favorite via heart icon on TrailCard and TrailDetail | `useFavoritesStore` with Set of route IDs; `supabase.from('favorites').insert/delete` in `useFavorites` hook |
| FAV-02 | Heart toggle uses optimistic UI (instant visual feedback, rollback on error) | Zustand optimistic pattern: update local state first, await server, rollback in catch; established in previous phases |
| FAV-03 | Favorites page lists all saved trails with reusable filter controls | FavoritesList uses `useFilteredRoutes` filtered to favorited route IDs; reuse FilterButton + ActiveFilterChips from `src/features/map/` |
| FAV-04 | User can add/edit private note per favorite trail | `supabase.from('favorites').update({ note })` where `user_id = auth.uid() AND route_id = ?`; note textarea in TrailDetail when favorited |
| FAV-05 | Empty favorites shows personalized message with dog name | `useAuthStore` provides `user.dog_name`; FavoritesList renders empty state with `"Nie masz jeszcze ulubionych tras. Znajdź coś dla {dogName}!"` |
| ACT-01 | TrailDetail shows "Przeszedłem!" button for authenticated users | `useAuthStore` `isAuthenticated` gates button rendering; sticky bottom bar inside TrailDetail |
| ACT-02 | Tap creates `activity_log` entry and shows toast "Zapisano spacer!" | `supabase.from('activity_log').insert({ user_id, route_id, walked_at: new Date().toISOString() })`; reuse existing toast pattern |
| ACT-03 | Visual "walked" indicator on TrailCards for trails in user's activity log | `useActivityStore` holds Set of walked route IDs; TrailCard accepts optional `isWalked` prop |
| ACT-04 | Profile page shows activity history (walked trails with dates) | Join activity_log with routes via Supabase select with embedded relation |
| PROF-01 | Profile page displays display name, dog name, avatar placeholder | Read from `useAuthStore` `user` object; `public.users` has `display_name`, `dog_name`, `avatar_url` |
| PROF-02 | User can generate new invite links | `supabase.from('invitations').insert({ created_by: user.id })`; schema generates token via `encode(extensions.gen_random_bytes(24), 'hex')` |
| PROF-03 | User can see status of generated invites (pending/used with used_at) | `supabase.from('invitations').select('*').eq('created_by', user.id).order('created_at', { ascending: false })` |
</phase_requirements>

---

## Summary

Phase 6 implements the personal layer of Psi Szlak: favorites, private notes, activity logging, and profile. All data operations run against tables already defined in the schema (`favorites`, `activity_log`, `invitations`, `users`). RLS policies are already in place — this phase adds no schema migrations.

The core implementation challenge is optimistic UI for the heart toggle: the store must update instantly, the server call must run in the background, and a failed call must roll back the local state without jarring the user. This same pattern works for the note save. Activity logging is simpler — append-only, no optimistic update needed because the user already sees the toast as confirmation.

The Favorites page reuses `useFilteredRoutes` by feeding it only the favorited subset of routes. This requires the favorites store to expose a Set of favorited route IDs and the filtered-routes hook to accept an optional `sourceRoutes` override (or a new hook `useFavoriteRoutes` that wraps the same logic).

**Primary recommendation:** Build three Zustand stores (`useFavoritesStore`, `useActivityStore`, `useInvitesStore`) with matching data-fetching hooks (`useFavorites`, `useActivity`, `useInvites`). All Supabase calls are isolated in hooks — stores hold only derived client state (Sets of IDs + the raw arrays for display).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.98.0 | Favorites/activity/invitations CRUD + auth session | Already configured in `src/lib/supabase.ts` |
| `zustand` | ^5.0.11 | Client state for favorites Set, activity Set, invites array | Established pattern across Phases 1-4 |
| `lucide-react` | ^0.577.0 | Heart icon, Check icon, Copy icon | Already installed; Heart in icon set |
| `react-router-dom` | ^7.13.1 | FavoritesList and ProfileView as tab routes | Already used for all routing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` + `@testing-library/react` | ^4.1.0 / ^16.3.2 | Unit tests for hooks and store logic | Required for every hook; jsdom environment configured in `vitest.config.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand for favorites | TanStack Query | TanStack Query adds optimistic updates out of the box but introduces a new dependency; Zustand + manual optimistic is already proven in this codebase |
| Supabase RLS (already set) | Edge Function for writes | RLS on `favorites` uses `for all using (auth.uid() = user_id)` — anon client can write directly; no Edge Function needed |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/
│   ├── favorites/
│   │   ├── FavoritesList.tsx       # Ulubione tab page
│   │   ├── FavoriteNote.tsx        # Note textarea shown in TrailDetail when favorited
│   │   └── index.ts
│   └── profile/
│       ├── ProfileView.tsx         # Profil tab page
│       ├── InviteGenerator.tsx     # Invite creation + list section
│       └── index.ts
├── hooks/
│   ├── useFavorites.ts             # Supabase CRUD + optimistic toggle
│   ├── useActivity.ts              # Supabase insert + fetch walked IDs
│   └── useInvites.ts               # Supabase fetch + insert invites
├── stores/
│   ├── favorites.ts                # Set<string> favoriteIds + Favorite[] for notes
│   ├── activity.ts                 # Set<string> walkedIds + ActivityLogEntry[]
│   └── invites.ts                  # Invitation[] + loading/error
```

### Pattern 1: Optimistic Heart Toggle
**What:** Update local Zustand state immediately, send server request, rollback on failure.
**When to use:** FAV-01, FAV-02 — any toggle that must feel instant.
**Example:**
```typescript
// src/hooks/useFavorites.ts
import { supabase } from '../lib/supabase'
import { useFavoritesStore } from '../stores/favorites'
import { useAuthStore } from '../stores/auth'  // from Phase 5

export function useFavorites() {
  const user = useAuthStore((s) => s.user)
  const { favoriteIds, addFavoriteId, removeFavoriteId, addFavorite, removeFavorite } =
    useFavoritesStore((s) => s)

  async function toggleFavorite(routeId: string) {
    if (!user) return
    const isFav = favoriteIds.has(routeId)

    // Optimistic: update immediately
    if (isFav) {
      removeFavoriteId(routeId)
      removeFavorite(routeId)
    } else {
      addFavoriteId(routeId)
      // Note: full Favorite row added after server confirms
    }

    try {
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('route_id', routeId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, route_id: routeId })
          .select()
          .single()
        if (error) throw error
        addFavorite(data)  // add full row with note field
      }
    } catch {
      // Rollback
      if (isFav) {
        addFavoriteId(routeId)
      } else {
        removeFavoriteId(routeId)
        removeFavorite(routeId)
      }
    }
  }

  return { favoriteIds, toggleFavorite }
}
```

### Pattern 2: Favorites Store
**What:** Two data structures — a `Set<string>` for O(1) "is this favorited?" checks, and a `Favorite[]` array for note access.
**When to use:** FAV-01 through FAV-04.
**Example:**
```typescript
// src/stores/favorites.ts
import { create } from 'zustand'
import type { Favorite } from '../lib/types'

interface FavoritesState {
  favoriteIds: Set<string>          // O(1) lookup for any component
  favorites: Favorite[]             // full rows (for notes)
  setFavorites: (favs: Favorite[]) => void
  addFavoriteId: (id: string) => void
  removeFavoriteId: (id: string) => void
  addFavorite: (fav: Favorite) => void
  removeFavorite: (routeId: string) => void
  updateNote: (routeId: string, note: string | null) => void
}

export const useFavoritesStore = create<FavoritesState>((set) => ({
  favoriteIds: new Set(),
  favorites: [],
  setFavorites: (favs) =>
    set({ favorites: favs, favoriteIds: new Set(favs.map((f) => f.route_id)) }),
  addFavoriteId: (id) =>
    set((s) => ({ favoriteIds: new Set([...s.favoriteIds, id]) })),
  removeFavoriteId: (id) =>
    set((s) => {
      const next = new Set(s.favoriteIds)
      next.delete(id)
      return { favoriteIds: next }
    }),
  addFavorite: (fav) =>
    set((s) => ({ favorites: [...s.favorites, fav] })),
  removeFavorite: (routeId) =>
    set((s) => ({ favorites: s.favorites.filter((f) => f.route_id !== routeId) })),
  updateNote: (routeId, note) =>
    set((s) => ({
      favorites: s.favorites.map((f) => (f.route_id === routeId ? { ...f, note } : f)),
    })),
}))
```

### Pattern 3: FavoritesList reusing useFilteredRoutes
**What:** Filter the trails store to only favorited routes, then apply the same filter controls.
**When to use:** FAV-03 — Favorites page needs identical filter UX to the main trail list.
**Example:**
```typescript
// src/features/favorites/FavoritesList.tsx (sketch)
import { useMemo } from 'react'
import { useTrailsStore } from '../../stores/trails'
import { useFavoritesStore } from '../../stores/favorites'
import { useFilteredRoutes } from '../../hooks/useFilteredRoutes'

// Option A: filter routes to favorites before passing to useFilteredRoutes
// Requires useFilteredRoutes to accept sourceRoutes param, OR
// Option B: create useFavoriteRoutes that reads favoriteIds and calls useFilteredRoutes
// on the subset. Both are equivalent — Option B is lower-risk (no change to existing hook).

export function useFavoriteRoutes() {
  const allRoutes = useTrailsStore((s) => s.routes)
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds)
  const favoriteRoutes = useMemo(
    () => allRoutes.filter((r) => favoriteIds.has(r.id)),
    [allRoutes, favoriteIds]
  )
  // NOTE: useFilteredRoutes reads from useTrailsStore internally.
  // We need to temporarily set a filtered view, or inline the filter logic.
  // Recommendation: add optional `routes` parameter to useFilteredRoutes,
  // defaulting to useTrailsStore routes when not provided.
  return favoriteRoutes
}
```

**Key decision for planner:** `useFilteredRoutes` currently reads from `useTrailsStore` directly. To reuse it for favorites, add an optional `routes?: Route[]` parameter. Default behavior unchanged; FavoritesList passes only favorited routes.

### Pattern 4: Note Save (Auto-save on blur)
**What:** Textarea fires `onBlur`, debounced update sent to Supabase only if value changed.
**When to use:** FAV-04 — private note editing.
**Example:**
```typescript
// Inside FavoriteNote component
const [draft, setDraft] = useState(initialNote ?? '')

async function handleBlur() {
  if (draft === initialNote) return   // no change, skip
  const { error } = await supabase
    .from('favorites')
    .update({ note: draft || null })
    .eq('user_id', user.id)
    .eq('route_id', routeId)
  if (error) {
    setDraft(initialNote ?? '')       // revert on error
    showToast('Nie udało się zapisać notatki')
  } else {
    updateNote(routeId, draft || null) // sync store
  }
}
```
**Recommendation:** Auto-save on blur. No explicit button needed — simpler UX for a mobile-first app.

### Pattern 5: Activity Log Insert
**What:** Append-only insert; no optimistic update (toast is instant feedback).
**When to use:** ACT-01, ACT-02.
**Example:**
```typescript
// src/hooks/useActivity.ts
export function useActivity() {
  const user = useAuthStore((s) => s.user)
  const { addWalkedId, appendEntry } = useActivityStore((s) => s)

  async function logWalk(routeId: string) {
    if (!user) return
    const walked_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('activity_log')
      .insert({ user_id: user.id, route_id: routeId, walked_at })
      .select()
      .single()
    if (error) {
      showToast('Nie udało się zapisać spaceru')
      return
    }
    addWalkedId(routeId)
    appendEntry(data)
    showToast('Zapisano spacer!')
  }

  return { logWalk }
}
```

### Pattern 6: Invite Generation
**What:** Insert into `invitations` table — token is auto-generated by Postgres default.
**When to use:** PROF-02.
**Example:**
```typescript
const { data, error } = await supabase
  .from('invitations')
  .insert({ created_by: user.id })
  .select()
  .single()
// data.token is the generated hex string
const inviteUrl = `${window.location.origin}/invite?token=${data.token}`
await navigator.clipboard.writeText(inviteUrl)
```
**Recommendation:** Copy-to-clipboard via `navigator.clipboard.writeText`. Mobile share sheet (`navigator.share`) is an enhancement but not all browsers support it consistently — use clipboard as the baseline with an optional share sheet fallback when `navigator.share` is defined.

### Pattern 7: TrailCard Heart vs Chevron Conditional
**What:** TrailCard renders Heart when `isFavorited=true`, ChevronRight otherwise.
**When to use:** FAV-01 — heart replaces chevron for favorited trails.
**Example:**
```typescript
// TrailCard prop additions
interface TrailCardProps {
  route: Route
  distanceKm: number | null
  onClick: () => void
  isFavorited?: boolean
  isWalked?: boolean            // ACT-03: walked indicator
  onFavoriteToggle?: (e: React.MouseEvent) => void
}

// Right side of card
<div className="flex items-center pr-3 pl-1 text-text-muted">
  {isFavorited ? (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onFavoriteToggle?.(e) }}
      aria-label="Usuń z ulubionych"
      className="p-1 min-w-[48px] min-h-[48px] flex items-center justify-center"
    >
      <Heart size={18} className="text-accent" fill="currentColor" />
    </button>
  ) : (
    <ChevronRight size={16} />
  )}
</div>
```
**Note:** Heart button must `e.stopPropagation()` to prevent the row click from also firing.

### Anti-Patterns to Avoid
- **Reading Zustand Set with `.includes()`:** Zustand stores `Set` as a JavaScript `Set` object — use `.has()` not `.includes()` (arrays have `.includes`, Sets do not).
- **Mutating Zustand Set directly:** Always create a new `Set` via `new Set([...existing])` before calling `set()` — Zustand shallowly compares state, direct mutation bypasses re-renders.
- **Fetching favorites inside TrailCard:** TrailCard must not fetch data; it receives `isFavorited` as a prop from its parent list component.
- **Activity log without walked_at:** Insert must include `walked_at = now()` explicitly — the column has a DB default but passing it explicitly from the client gives the correct timestamp in the user's actual walk time.
- **Note save on every keystroke:** Save only on blur, not onChange — avoids Supabase rate limits and write amplification.
- **Duplicate walk indicator queries:** Load walked route IDs once on auth and store in `useActivityStore`; never re-query per-card.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard copy | Custom copy button with flash animation | `navigator.clipboard.writeText()` | Built-in, async, Promise-based, handles permissions |
| Invite token generation | Random string in JS | Postgres `encode(extensions.gen_random_bytes(24), 'hex')` default on `invitations.token` | Already in schema; cryptographically secure; server-generated |
| Auth session in favorites hook | Direct `supabase.auth.getUser()` | `useAuthStore` from Phase 5 | Phase 5 establishes a single auth store; duplicating auth checks in every hook causes stale state |
| Toast implementation | New toast system | Existing toast pattern from Phase 1/2 | Already built; reuse for "Zapisano spacer!" and error feedback |
| Filter logic for favorites | Reimplemented filter chain | Extend `useFilteredRoutes` with optional `routes` param | Filter chain already handles all 6 filter types correctly; duplication risks divergence |

**Key insight:** The schema is already fully correct for this phase. No new migrations needed — `favorites`, `activity_log`, `invitations`, and `users` tables are all present with proper RLS. This phase is purely frontend + hook work.

---

## Common Pitfalls

### Pitfall 1: Zustand Set Not Triggering Re-renders
**What goes wrong:** `favoriteIds.add(id)` mutates the existing Set in place; Zustand's shallow equality check sees the same object reference and skips re-render.
**Why it happens:** JavaScript `Set` is mutable; Zustand compares by reference, not deep equality.
**How to avoid:** Always create a new `Set` in the setter: `new Set([...s.favoriteIds, id])`.
**Warning signs:** Heart icon doesn't update after toggle despite store setter being called.

### Pitfall 2: Heart Button Click Bubbles to Row Navigation
**What goes wrong:** Tapping the heart on a TrailCard also triggers `onClick` on the row, navigating to TrailDetail.
**Why it happens:** React's synthetic event bubbles from heart button to parent button/div.
**How to avoid:** `e.stopPropagation()` inside the heart button's onClick handler.
**Warning signs:** Both heart toggle AND navigation happen on single tap.

### Pitfall 3: Favorites Page Shows All Trails (Not Just Favorited)
**What goes wrong:** `useFilteredRoutes` reads from `useTrailsStore` which contains all loaded trails.
**Why it happens:** The hook does not know it's being used in a favorites context.
**How to avoid:** Add optional `routes?: Route[]` parameter to `useFilteredRoutes`. When provided, filter that array instead of `useTrailsStore` routes.
**Warning signs:** Favorites page shows dozens of trails even with few favorites.

### Pitfall 4: Invite URL Uses Wrong Origin in Production
**What goes wrong:** `window.location.origin` returns `http://localhost:5173` when invite is generated in dev but used in prod.
**Why it happens:** Invite URL is constructed client-side with current origin.
**How to avoid:** Use `window.location.origin` — this is correct because the user generating the invite is on the prod domain when deployed. This is a non-issue in production but developers must test invite links on the deployed URL.
**Warning signs:** Invite links work locally but redirect to localhost when sent to others.

### Pitfall 5: Empty Favorites with No Dog Name
**What goes wrong:** Empty state renders "Znajdź coś dla undefined!" when Phase 5 auth/onboarding has not yet run.
**Why it happens:** `user.dog_name` is `null` until onboarding Step 2 completes.
**How to avoid:** Fallback: `dogName ?? 'swojego psa'` in the empty state string.
**Warning signs:** "undefined" visible in empty state message.

### Pitfall 6: RLS on Activity Log Missing SELECT Policy Scope
**What goes wrong:** `activity_log` has `select own` policy (`auth.uid() = user_id`). But the `activity_log` join for profile history via foreign key embedded select may fail if the query is structured differently.
**Why it happens:** Supabase embedded relations still go through RLS — no bypass. Checking: `select('*, routes(name, length_km)')` works if the `routes` table policy allows authenticated reads (it does: `Routes: read by authenticated`).
**How to avoid:** Use `supabase.from('activity_log').select('*, route:routes(id, name, length_km)').eq('user_id', user.id)` — explicit user_id filter satisfies the RLS policy.
**Warning signs:** Empty activity history despite entries existing in the database.

### Pitfall 7: TrailCard Prop Interface Breakage
**What goes wrong:** Adding `isFavorited` and `isWalked` to TrailCard props and forgetting to pass them in all call sites (TrailList, FavoritesList).
**Why it happens:** TypeScript optional props (`isFavorited?: boolean`) won't warn when omitted — they'll just be `undefined`, which renders nothing instead of the heart.
**How to avoid:** Make them optional with `false` defaults in the component: `{ isFavorited = false, isWalked = false }`. TrailList passes the values from the stores; existing tests don't break.

---

## Code Examples

Verified patterns from official sources:

### Supabase Favorites CRUD
```typescript
// Insert favorite (RLS: user_id must equal auth.uid())
const { data, error } = await supabase
  .from('favorites')
  .insert({ user_id: user.id, route_id: routeId })
  .select()
  .single()

// Delete favorite
const { error } = await supabase
  .from('favorites')
  .delete()
  .eq('user_id', user.id)
  .eq('route_id', routeId)

// Load all favorites for user
const { data, error } = await supabase
  .from('favorites')
  .select('*')
  .eq('user_id', user.id)

// Update note
const { error } = await supabase
  .from('favorites')
  .update({ note: noteText || null })
  .eq('user_id', user.id)
  .eq('route_id', routeId)
```

### Supabase Activity Log
```typescript
// Insert walk
const { data, error } = await supabase
  .from('activity_log')
  .insert({ user_id: user.id, route_id: routeId, walked_at: new Date().toISOString() })
  .select()
  .single()

// Fetch history with route details (for profile page)
const { data, error } = await supabase
  .from('activity_log')
  .select('id, walked_at, route:routes(id, name, length_km)')
  .eq('user_id', user.id)
  .order('walked_at', { ascending: false })

// Fetch walked route IDs only (for TrailCard indicator — lightweight)
const { data, error } = await supabase
  .from('activity_log')
  .select('route_id')
  .eq('user_id', user.id)
```

### Supabase Invitations
```typescript
// Generate invite (token generated by Postgres default)
const { data, error } = await supabase
  .from('invitations')
  .insert({ created_by: user.id })
  .select()
  .single()
// data.token is available immediately

// Fetch own invites
const { data, error } = await supabase
  .from('invitations')
  .select('id, token, used_by, used_at, expires_at, created_at')
  .eq('created_by', user.id)
  .order('created_at', { ascending: false })
```

### Zustand Activity Store
```typescript
// src/stores/activity.ts
import { create } from 'zustand'
import type { ActivityLogEntry } from '../lib/types'

interface ActivityState {
  walkedIds: Set<string>
  entries: ActivityLogEntry[]
  setWalkedIds: (ids: string[]) => void
  addWalkedId: (id: string) => void
  appendEntry: (entry: ActivityLogEntry) => void
  setEntries: (entries: ActivityLogEntry[]) => void
}

export const useActivityStore = create<ActivityState>((set) => ({
  walkedIds: new Set(),
  entries: [],
  setWalkedIds: (ids) => set({ walkedIds: new Set(ids) }),
  addWalkedId: (id) =>
    set((s) => ({ walkedIds: new Set([...s.walkedIds, id]) })),
  appendEntry: (entry) =>
    set((s) => ({ entries: [entry, ...s.entries] })),
  setEntries: (entries) => set({ entries }),
}))
```

### Clipboard Copy with Share Sheet Fallback
```typescript
async function copyInviteLink(token: string) {
  const url = `${window.location.origin}/invite?token=${token}`
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Zaproszenie do Psi Szlak', url })
    } else {
      await navigator.clipboard.writeText(url)
      showToast('Link skopiowany!')
    }
  } catch {
    // Fallback: select input value (e.g., if clipboard permission denied)
    showToast('Nie udało się skopiować linku')
  }
}
```

### Heart Animation (CSS, no JS library needed)
```typescript
// Tailwind v4 keyframe already in src/index.css: @keyframes fade-in
// Add to @theme: @keyframes heart-pop
@keyframes heart-pop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.35); }
  70%  { transform: scale(0.9); }
  100% { transform: scale(1); }
}

// In TrailDetail floating heart button:
<Heart
  className={`transition-colors ${isFavorited ? 'text-accent [animation:heart-pop_300ms_ease-out]' : 'text-text-muted'}`}
  fill={isFavorited ? 'currentColor' : 'none'}
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom optimistic hooks | Manual Zustand optimistic pattern | This codebase convention | Consistent with Phases 1-4; no TanStack Query needed |
| RLS disabled → filter in app | RLS enabled on all tables | Initial schema | Security enforced at DB level; client queries don't need WHERE user_id |
| `supabase.auth.getSession()` in every component | Single `useAuthStore` from Phase 5 | Phase 5 establishes this | One source of truth for auth state |

**Deprecated/outdated:**
- `for insert with check (auth.uid() = user_id)` is already on both `favorites` and `activity_log` — no additional policy needed for INSERT in this phase.

---

## Open Questions

1. **`useAuthStore` shape from Phase 5**
   - What we know: Phase 5 is pending; it will create an auth store with `user`, `isAuthenticated`, and session management
   - What's unclear: The exact exported store name and interface (`useAuthStore`? `useAuth`? stored in `src/stores/auth.ts`?)
   - Recommendation: Plan 06-01 should import from `src/stores/auth` with `useAuthStore`; if Phase 5 uses a different name, it's a one-line fix. Document the assumed interface clearly in the plan.

2. **useFilteredRoutes signature change**
   - What we know: `useFilteredRoutes` reads from `useTrailsStore` internally
   - What's unclear: Whether the planner wants to modify `useFilteredRoutes` or create a new `useFavoriteRoutes` hook
   - Recommendation: Add optional `routes?: Route[]` param to `useFilteredRoutes`. Defaults to `useTrailsStore` routes. This is a 3-line change and keeps a single filter implementation.

3. **Profile page — `users` table data freshness**
   - What we know: Phase 5 will populate `users.display_name` and `users.dog_name` during onboarding
   - What's unclear: Whether `useAuthStore` caches the full `users` row or just the Supabase `auth.users` data
   - Recommendation: `useAuthStore` should hold the `public.users` row (fetched after sign-in). If it only holds `auth.users`, ProfileView needs an additional `supabase.from('users').select().eq('id', user.id).single()` on mount.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` — environment: jsdom, include: `src/**/*.test.ts` |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test -- --run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FAV-01 | toggleFavorite inserts/deletes from DB and updates store | unit | `npm run test -- --run src/hooks/useFavorites.test.ts` | ❌ Wave 0 |
| FAV-02 | Optimistic rollback on server error | unit | `npm run test -- --run src/hooks/useFavorites.test.ts` | ❌ Wave 0 |
| FAV-03 | FavoritesList filters by favoriteIds only | unit | `npm run test -- --run src/features/favorites/FavoritesList.test.ts` | ❌ Wave 0 |
| FAV-04 | Note saves on blur, reverts on error | unit | `npm run test -- --run src/features/favorites/FavoriteNote.test.ts` | ❌ Wave 0 |
| FAV-05 | Empty state shows dog name | unit | (within FavoritesList.test.ts) | ❌ Wave 0 |
| ACT-01 | "Przeszedłem!" hidden for unauthenticated user | unit | `npm run test -- --run src/features/trails/TrailDetail.test.ts` | ❌ Wave 0 |
| ACT-02 | logWalk inserts entry and emits toast | unit | `npm run test -- --run src/hooks/useActivity.test.ts` | ❌ Wave 0 |
| ACT-03 | walkedIds Set used to derive isWalked prop on TrailCard | unit | `npm run test -- --run src/hooks/useActivity.test.ts` | ❌ Wave 0 |
| ACT-04 | Activity history fetch returns joined route names | unit | `npm run test -- --run src/hooks/useActivity.test.ts` | ❌ Wave 0 |
| PROF-01 | ProfileView renders display_name and dog_name | unit | `npm run test -- --run src/features/profile/ProfileView.test.ts` | ❌ Wave 0 |
| PROF-02 | createInvite inserts row and returns token | unit | `npm run test -- --run src/hooks/useInvites.test.ts` | ❌ Wave 0 |
| PROF-03 | fetchInvites returns list ordered by created_at desc | unit | `npm run test -- --run src/hooks/useInvites.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test -- --run`
- **Per wave merge:** `npm run test -- --run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useFavorites.test.ts` — covers FAV-01, FAV-02 (vi.stubGlobal('fetch') pattern from Phase 2 or mock supabase client)
- [ ] `src/hooks/useActivity.test.ts` — covers ACT-02, ACT-03, ACT-04
- [ ] `src/hooks/useInvites.test.ts` — covers PROF-02, PROF-03
- [ ] `src/features/favorites/FavoritesList.test.ts` — covers FAV-03, FAV-05
- [ ] `src/features/favorites/FavoriteNote.test.ts` — covers FAV-04
- [ ] `src/features/profile/ProfileView.test.ts` — covers PROF-01
- [ ] `src/features/trails/TrailDetail.test.ts` — covers ACT-01 (heart overlay + sticky button conditional rendering)

**Test mock pattern** (established in Phase 2 for supabase calls):
```typescript
// vi.mock the supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockFavorite, error: null }),
    })),
  },
}))
```

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `src/lib/types.ts`, `src/stores/`, `src/hooks/`, `src/features/`, `supabase/migrations/` — all schema and type definitions verified
- `supabase/migrations/20260308210000_initial_schema.sql` — RLS policies and table structure confirmed

### Secondary (MEDIUM confidence)
- Supabase JS v2 client API — `from().insert().select().single()` chaining pattern consistent with v2.x API; verified against @supabase/supabase-js ^2.98.0 in package.json
- Phase 5 RESEARCH.md — auth store structure and `useAuthStore` naming convention documented

### Tertiary (LOW confidence)
- `navigator.clipboard.writeText()` + `navigator.share` — widely supported in 2026 mobile browsers but exact behavior on iOS Safari PWA context should be validated manually; fallback to copy already included

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use
- Architecture: HIGH — pattern follows established Zustand + hook conventions from Phases 1-4; schema fully verified
- Pitfalls: HIGH — most pitfalls derived from concrete code review (TrailCard structure, Zustand Set mutation, event bubbling)
- Validation architecture: HIGH — vitest config verified, test file naming follows existing pattern

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable stack; Supabase JS v2 API changes slowly)
