# Roadmap: Psi Szlak

## Overview

Starting from a complete Phase 0 scaffolding, this roadmap builds the app in strict dependency order: map lifecycle first (everything else renders on or depends on it), then the trail data pipeline (no UI is meaningful without data), then display and browsing, then filters, then auth and onboarding, then favorites and activity logging, and finally PWA hardening. Phase 0 addresses correctness prerequisites — known scaffolding defects that will corrupt features if left in place. The result is a deployed, invite-only PWA where dog owners in Poland can instantly discover nearby trails with water access and natural surfaces.

## Phases

**Phase Numbering:**
- Integer phases (0, 1, 2, ...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 0: Scaffolding Fixes** - Correctness prerequisites: schema migration, Workbox config, attribution ToS compliance, git cleanup (completed 2026-03-13)
- [x] **Phase 1: Map Core** - Stable interactive map with geolocation, search, and WebGL lifecycle managed correctly from day one (completed 2026-03-13)
- [x] **Phase 2: Trail Data Pipeline** - Edge Function caching proxy (Overpass → Supabase), `useTrails` hook, trail pins on map (completed 2026-03-13)
- [x] **Phase 3: Trail Display and Browsing** - TrailCard, TrailList, TrailDetail, PTTK polylines, map/list toggle (completed 2026-03-13)
- [x] **Phase 4: Filters** - 6-category filter panel (bottom sheet), client-side filter application, chip bar (completed 2026-03-13)
- [ ] **Phase 5: Auth and Onboarding** - Invite-only magic link auth, 4-step onboarding, dog-name personalization, route guarding
- [ ] **Phase 6: Favorites and Activity** - Heart toggle with optimistic UI, private notes, "Przeszedlem!" log, profile page
- [ ] **Phase 7: PWA Hardening** - Fixed Workbox tile cache, offline banner, NetworkFirst trail cache, PNG icons

## Phase Details

### Phase 0: Scaffolding Fixes
**Goal**: All known correctness defects in the scaffolding are resolved before any feature code is written
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04, FOUN-05, FOUN-06, FOUN-07
**Skills**: tailwind-design-system + vercel-react-best-practices + supabase-postgres-best-practices
**Success Criteria** (what must be TRUE):
  1. `water_access` column is `text` with CHECK constraint (`none`/`nearby`/`on_route`) — the filter system can store and query 3-state values
  2. Mapbox attribution is visible and compact on map load — no CSS `display:none` override exists anywhere
  3. Workbox tile cache is named `psi-szlak-mapbox-tiles` with `cacheableResponse: { statuses: [0, 200] }` and `purgeOnQuotaError: true` — opaque tile responses do not exhaust storage quota
  4. `dist/` does not appear in `git status` as tracked — build artifacts are excluded from version control
  5. `REQUIREMENTS.md` types.ts and PRD reflect final column names (`geometry`, `moderate`, `water_access` text enum)
**Plans**: 2 plans

Plans:
- [x] 00-01-PLAN.md — Schema migration, TypeScript types, and vitest setup (FOUN-01, FOUN-02, FOUN-07)
- [ ] 00-02-PLAN.md — CSS fix, Workbox config, dist/ verification, PRD column names (FOUN-03, FOUN-04, FOUN-05, FOUN-06)

### Phase 1: Map Core
**Goal**: Users can open the app and see an interactive map centered on Poland, with geolocation, location search, and WebGL lifecycle managed correctly so no context leaks are possible
**Depends on**: Phase 0
**Requirements**: MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06, MAP-07
**Skills**: frontend-design + responsive-design + tailwind-design-system + vercel-react-best-practices
**Success Criteria** (what must be TRUE):
  1. User opens app and sees the Mapbox Outdoors map centered on Poland (zoom 6) with no blank screen or error
  2. User taps "Gdzie jestem" and the map flies to their GPS position; if GPS is denied, a Polish-language fallback message appears with the search bar
  3. User types a Polish location into the search bar and the map flies to the geocoded result
  4. Switching between bottom tabs (Mapa / Trasy / Ulubione / Profil) and returning to Mapa does not degrade map rendering — no black screens after repeated navigation
  5. If the Mapbox token is invalid or WebGL fails, a recovery UI appears instead of a crash
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — MapView lifecycle, geolocation button, viewport sync, error boundary (MAP-01, MAP-02, MAP-04, MAP-05, MAP-06, MAP-07)
- [x] 01-02-PLAN.md — Location search with Geocoding v6 autocomplete and temporary pin (MAP-03)
- [ ] 01-03-PLAN.md — Gap closure: fix dragstart listener timing bug for search pin removal (MAP-03)

### Phase 2: Trail Data Pipeline
**Goal**: Trail data from OpenStreetMap and PTTK is automatically fetched, cached, and surfaced on the map as the user pans
**Depends on**: Phase 1
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-07, PIPE-08, PIPE-09, PIPE-10
**Skills**: supabase-postgres-best-practices + vercel-react-best-practices + frontend-design
**Success Criteria** (what must be TRUE):
  1. Panning the map to a new area triggers a trail fetch (after 400ms debounce) and trail pins appear on the map within a few seconds
  2. Panning back to the same area serves results from Supabase cache — no second Overpass request is made
  3. PTTK trails render as colored polylines on the map matching their `trail_color` (red/blue/yellow/green/black)
  4. Dog-unfriendly trails (`dogs=no`) and roads (primary/secondary/tertiary) do not appear on the map
  5. A loading indicator appears during trail fetch; if the fetch fails a retry button appears — the app does not hang silently
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Edge Function search-trails: Overpass fetch, normalization, bbox cache, upsert (PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06)
- [ ] 02-02-PLAN.md — useTrails hook, Zustand trail store, map GeoJSON layers, cluster pins, PTTK polylines, loading/error UI (PIPE-07, PIPE-08, PIPE-09, PIPE-10)

### Phase 3: Trail Display and Browsing
**Goal**: Users can browse trails in both map and list views, see full trail details, and understand each trail's key attributes at a glance
**Depends on**: Phase 2
**Requirements**: BROW-01, BROW-02, BROW-03, BROW-04, BROW-05
**Skills**: frontend-design + responsive-design + tailwind-design-system + vercel-react-best-practices + web-design-guidelines
**Success Criteria** (what must be TRUE):
  1. User can toggle between map view and list view via the tab bar — both show the same trails currently in the viewport
  2. TrailCard shows name, length (km), surface badge, water access icon, difficulty badge, and PTTK color indicator — all readable on a 375px screen with at least 2-3 cards visible without scrolling
  3. Tapping a TrailCard opens TrailDetail with full trail info, a map inset showing the route polyline, and action buttons
  4. When no trails are in the current area, an empty state with illustration, "Brak tras" message, and "Szukaj w promieniu 50 km" CTA appears instead of a blank list
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md — TrailCard, TrailList, EmptyTrailState, haversine utility, Trasy tab wiring (BROW-01, BROW-02, BROW-04, BROW-05)
- [ ] 03-02-PLAN.md — TrailDetail page with map hero, route polyline, map pin navigation (BROW-03)

### Phase 4: Filters
**Goal**: Users can filter trails by 6 attributes using a bottom-sheet panel, with instant client-side results when bounds are unchanged
**Depends on**: Phase 3
**Requirements**: FILT-01, FILT-02, FILT-03, FILT-04, FILT-05, FILT-06, FILT-07, FILT-08, FILT-09, FILT-10
**Skills**: frontend-design + responsive-design + tailwind-design-system + vercel-react-best-practices + web-design-guidelines
**Success Criteria** (what must be TRUE):
  1. Filter button opens a bottom sheet with all 6 filter categories (length, surface, water, difficulty, distance, marked) and a sticky "Zastosuj" button
  2. Applied filters appear as dismissible chips in a horizontal bar below the search bar; the filter button shows a count badge when filters are active
  3. Setting filters and tapping "Zastosuj" updates the trail list instantly (client-side) without triggering a new Edge Function call if the map bounds have not changed
  4. "Wyczysc wszystko" clears all filters and restores the full trail list
  5. The water access filter "Mile widziana" boosts trails with water access to the top of the list without hiding others
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — useFilteredRoutes hook (TDD), useActiveFilterCount, filter label constants (FILT-02, FILT-03, FILT-04, FILT-05, FILT-06, FILT-07, FILT-09, FILT-10)
- [ ] 04-02-PLAN.md — FilterPanel bottom sheet, FilterButton, ActiveFilterChips, MapView/TrailList wiring (FILT-01, FILT-08, FILT-10)

### Phase 5: Auth and Onboarding
**Goal**: New users can join via invite link and complete onboarding to reach their first personalized map view; existing users are recognized on return
**Depends on**: Phase 3
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, ONBR-01, ONBR-02, ONBR-03, ONBR-04
**Skills**: supabase-postgres-best-practices + frontend-design + responsive-design + tailwind-design-system + vercel-react-best-practices
**Success Criteria** (what must be TRUE):
  1. Visiting `/invite?token=xyz` with a valid token shows the registration form (name + email); submitting sends a magic link and marks the token as consumed
  2. Visiting `/invite?token=xyz` with an expired or used token shows a clear Polish-language error — no registration form is offered
  3. Visiting `/auth` without an invite token shows "Dostep tylko przez zaproszenie" — no registration path exists
  4. Clicking the magic link establishes a session and routes first-time users to the 4-step onboarding (welcome → dog name → preferences → geolocation); returning users go directly to the map
  5. Dog name entered during onboarding appears in personalized empty states throughout the app (e.g., "Znajdz cos dla [dog name]!")
  6. Session persists across browser refresh — user does not need to log in again
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — Auth store, types update, DB migration (walk_preferences, trigger, RPC), validate-invite Edge Function (AUTH-01, AUTH-03, AUTH-06, AUTH-07)
- [ ] 05-02-PLAN.md — InvitePage, RegisterForm, MagicLinkSent with OTP, AuthPage, AuthGateSheet, BottomTabBar auth interception (AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-08)
- [ ] 05-03-PLAN.md — App.tsx auth init, OnboardingFlow (4 steps), route guards, dog-name personalization, filter tooltip (AUTH-02, AUTH-05, AUTH-06, AUTH-08, ONBR-01, ONBR-02, ONBR-03, ONBR-04)

### Phase 6: Favorites and Activity
**Goal**: Authenticated users can save trails, add private notes, log completed walks, and view their history on their profile
**Depends on**: Phase 5
**Requirements**: FAV-01, FAV-02, FAV-03, FAV-04, FAV-05, ACT-01, ACT-02, ACT-03, ACT-04, PROF-01, PROF-02, PROF-03
**Skills**: frontend-design + shadcn-ui + vercel-react-best-practices + supabase-postgres-best-practices
**Success Criteria** (what must be TRUE):
  1. Tapping the heart on a TrailCard or TrailDetail toggles favorite status instantly (optimistic UI); if the request fails the heart reverts
  2. The Favorites page lists all saved trails with the same filter controls as the main trail list
  3. User can add or edit a private note on any favorited trail from TrailDetail
  4. Tapping "Przeszedlem!" on TrailDetail creates an activity log entry and shows a "Zapisano spacer!" toast; a "walked" indicator appears on that TrailCard
  5. Profile page shows display name, dog name, activity history (walked trails with dates), and a button to generate new invite links with their status (pending/used)
**Plans**: TBD

Plans:
- [ ] 06-01: Favorites toggle, FavoritesList, private notes
- [ ] 06-02: Activity log, "Przeszedlem!" button, walked indicator
- [ ] 06-03: Profile page, invite generation

### Phase 7: PWA Hardening
**Goal**: The app installs correctly on Android and iOS, works offline with the last 10 viewed trails, and never silently fails due to service worker storage issues
**Depends on**: Phase 6
**Requirements**: PWA-01, PWA-02, PWA-03, PWA-04, PWA-05, PWA-06, PWA-07
**Skills**: frontend-design + web-design-guidelines + responsive-design + vercel-react-best-practices
**Success Criteria** (what must be TRUE):
  1. App can be added to home screen on Android and iOS with correct icon (PNG 192x192 and 512x512), name "Psi Szlak", and standalone display mode
  2. With network disabled, previously viewed trail details are accessible — the app shows a persistent top banner "Tryb offline — wyswietlam zapisane trasy"
  3. With network disabled, the geocoding search bar is visibly grayed out and non-functional
  4. Mapbox tile caching does not exhaust PWA storage quota in a typical map session (verified in Chrome DevTools with opaque response accounting)
**Plans**: TBD

Plans:
- [ ] 07-01: Workbox config fix, NetworkFirst trail cache, offline banner
- [ ] 07-02: PNG icons, manifest polish, iOS compatibility

## Progress

**Execution Order:**
Phases execute in numeric order: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Scaffolding Fixes | 2/2 | Complete    | 2026-03-13 |
| 1. Map Core | 3/3 | Complete   | 2026-03-13 |
| 2. Trail Data Pipeline | 2/2 | Complete   | 2026-03-13 |
| 3. Trail Display and Browsing | 2/2 | Complete   | 2026-03-13 |
| 4. Filters | 2/2 | Complete   | 2026-03-13 |
| 5. Auth and Onboarding | 0/3 | Not started | - |
| 6. Favorites and Activity | 0/3 | Not started | - |
| 7. PWA Hardening | 0/2 | Not started | - |
