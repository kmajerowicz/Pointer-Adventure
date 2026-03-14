# Phase 6: Favorites and Activity - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Authenticated users can save trails (heart toggle with optimistic UI), add private notes on favorites, log completed walks ("Przeszedłem!"), view activity history, and manage invites on their profile page. Auth/onboarding is Phase 5. PWA hardening is Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Heart toggle & favorites list
- Heart icon on TrailCard replaces the chevron — heart IS the indicator for favorited trails; unfavorited trails keep chevron for navigation
- Heart icon on TrailDetail as a floating button overlaying the map hero (top-right, mirrors back button on top-left)
- Optimistic UI: instant visual feedback on tap, rollback on server error (FAV-02)
- Heart animation: Claude's discretion
- Favorites page (Ulubione tab) uses the same filter controls as the main trail list — FilterButton + ActiveFilterChips + useFilteredRoutes (FAV-03)
- Empty favorites shows personalized message with dog name (FAV-05)

### Private notes on favorites
- Inline text area on TrailDetail below trail attributes — always visible when trail is favorited
- Notes only available on favorited trails (FAV-04) — unfavoriting removes the note section
- Note display on favorites list: Claude's discretion (preview line vs detail-only)
- Note save behavior: Claude's discretion (auto-save on blur vs explicit button)

### Activity log & walked indicator
- "Przeszedłem!" button as a sticky full-width accent button fixed at the bottom of TrailDetail — always reachable, prominent CTA
- Only visible for authenticated users (ACT-01)
- Each tap creates a new activity_log entry — supports multiple walks on the same trail (dog walkers revisit)
- Toast "Zapisano spacer!" on success (ACT-02)
- Post-tap button state: Claude's discretion (show walk count vs reset)
- Walked indicator on TrailCards: Claude's discretion (checkmark badge, muted text, or tint)

### Profile page layout
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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Route` interface (src/lib/types.ts): Full type; `Favorite`, `ActivityLogEntry`, `User`, `Invitation` interfaces already defined
- `TrailCard` (src/features/trails/TrailCard.tsx): Compact horizontal row with chevron — heart replaces chevron for favorited trails
- `TrailDetail` (src/features/trails/TrailDetail.tsx): Map hero + attributes — heart overlays map, "Przeszedłem!" goes in sticky bottom bar
- `useFilteredRoutes` hook (src/hooks/useFilteredRoutes.ts): Reuse for favorites list filtering (FAV-03)
- `FilterButton` + `ActiveFilterChips` (src/features/map/): Reuse on favorites page
- `useFiltersStore` (src/stores/filters.ts): Already has all filter types + resetAll
- Toast pattern (Phase 1/2): Reuse for "Zapisano spacer!" and error feedback
- `supabase` client (src/lib/supabase.ts): Ready for favorites/activity CRUD
- `BottomTabBar` (src/components/ui/BottomTabBar.tsx): Ulubione and Profil tabs are stubs — replace with real pages

### Established Patterns
- Zustand for client state — favorites store and activity store should follow same pattern
- Feature folder structure — favorites code in `src/features/favorites/`, profile in `src/features/profile/`
- Optimistic UI: instant local state update, server call in background, rollback on error
- Design tokens from `src/index.css` — accent color for buttons, bg-surface for cards

### Integration Points
- `router.tsx`: Ulubione and Profil tabs currently stub placeholders — replace with FavoritesList and ProfileView
- `TrailCard.tsx`: Needs heart icon prop and onClick handler for favorite toggle
- `TrailDetail.tsx`: Needs heart overlay, note section, and sticky "Przeszedłem!" bar
- Supabase RLS: `favorites` and `activity_log` tables need user_id-based policies
- Auth context from Phase 5: `useAuth` hook provides user state for conditional rendering

</code_context>

<specifics>
## Specific Ideas

- Heart replacing chevron on TrailCard is a clean way to show favorite status without adding visual elements
- Floating heart on TrailDetail map hero mirrors the back button — symmetrical, always accessible
- Sticky "Przeszedłem!" button at bottom of TrailDetail is the primary CTA for the detail page — accent gold, prominent
- Multiple walks per trail makes sense for a dog walking app — people walk the same routes regularly
- Reusing FilterButton + useFilteredRoutes on favorites page keeps UX consistent across the app

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-favorites-and-activity*
*Context gathered: 2026-03-14*
