# Psi Szlak — Implementation Plan

## Context
PRD is complete and pushed to `github.com/kmajerowicz/Pointer-Adventure`. Now we need to build the app phase-by-phase. Each phase is independently deployable. The plan maps specific skills and plugins to each phase — modeled on the proven Vitis-App CLAUDE.md pattern.

## Skills to install (from Vitis-App sources)

| Skill | GitHub Source |
|-------|--------------|
| `frontend-design` | anthropics/claude-code |
| `responsive-design` | supercent-io/skills-template |
| `shadcn-ui` | giuseppe-trisciuoglio/developer-kit |
| `supabase-postgres-best-practices` | supabase/agent-skills |
| `tailwind-design-system` | wshobson/agents |
| `vercel-react-best-practices` | vercel-labs/agent-skills |
| `vitest` | antfu/skills |
| `web-design-guidelines` | vercel-labs/agent-skills |

## Plugins to install (from official marketplace)

| Plugin | Purpose | When needed |
|--------|---------|-------------|
| `typescript-lsp` | TS intellisense | All phases |
| `supabase` | DB operations, SQL, Edge Functions | Phase 0, 2, 4, 5 |
| `vercel` | Deployment management | Phase 0, 1, 4, 6 |
| `security-guidance` | Security hooks on file edits | Phase 4, 7 |
| `sentry` | Error monitoring (already as MCP) | Phase 6, 7 |
| `playwright` | E2E browser testing | Phase 3, 5, 6, 7 |
| `context7` | Up-to-date docs (Vite, Mapbox, etc.) | Phase 0, 1, 2, 3 |
| `semgrep` | Security scanning | Phase 6, 7 |
| `coderabbit` | AI code review | Phase 7 |

---

## Phase 0: Project Setup & Scaffolding

**Status: COMPLETE**

**What was built:**
- `npm create vite@latest` — React + TypeScript
- Tailwind CSS 4 with design tokens from PRD section 8 (`#111318` bg, `#1C1F26`/`#252930` surfaces, `#C9A84C` accent, Inter font)
- React Router v6 with placeholder routes: `/`, `/trails`, `/favorites`, `/profile`, `/invite`, `/auth`
- Supabase migration: all 6 tables (`routes`, `search_areas`, `favorites`, `activity_log`, `users`, `invitations`) with RLS enabled
- Install all 8 skills into `.agents/skills/`, create CLAUDE.md with full skill mapping
- `vite-plugin-pwa` + basic `manifest.json`
- Supabase client in `src/lib/supabase.ts`
- Feature folder structure: `src/features/{map,trails,favorites,profile,auth,onboarding}`
- `AppLayout` with bottom tab bar (Mapa / Trasy / Ulubione / Profil)
- Zustand stores (viewport, filters, ui)
- TypeScript types for all DB tables

**Skills:** `tailwind-design-system` + `vercel-react-best-practices` + `supabase-postgres-best-practices`
**Plugins:** `supabase`, `vercel`, `context7`

**Remaining (requires credentials):**
- Create Supabase project and run migration
- Create Vercel project: link repo, set env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`)
- Replace SVG placeholder icons with proper PNG icons

---

## Phase 1: Map Foundation + Geolocation

**What gets built:**
- Mapbox GL JS with Outdoors style, centered on Poland
- "Gdzie jestem" button — browser geolocation, fly to user
- Mapbox Geocoding search bar — search Polish locations
- Map viewport state in Zustand (`bounds`, `center`, `zoom`)
- `useGeolocation` hook with permission handling
- GPS denied fallback: search bar + map on Poland center (PRD section 7)
- Full-height map layout minus bottom tab bar
- On `moveend`/`zoomend` — store bounding box in Zustand

**Skills:** `frontend-design` + `responsive-design` + `tailwind-design-system` + `vercel-react-best-practices`
**Plugins:** `context7`, `vercel`

**Acceptance:**
- Map renders Outdoors style on mobile/desktop
- Geolocation works with fly-to animation
- Geocoding returns Polish locations
- GPS denial shows fallback per PRD
- Bounding box tracked on every map move

---

## Phase 2: Trail Data Pipeline (Edge Function + Display)

**What gets built:**
- Supabase Edge Function `/search-trails`:
  - POST with bbox → check `search_areas` (TTL 7 days) → if miss, query Overpass API
  - Overpass query: `route=hiking`, `route=foot`, `highway=path|track`, PTTK relations `relation[route=hiking][network~"lwn|rwn|nwn"]`
  - Exclusions: `highway=primary/secondary/tertiary`, `landuse=residential/commercial`, `access=no`, `dogs=no`
  - Normalize per PRD 3.3 (`surface_type`, `difficulty`, `water_access` via `around:200`, `trail_color`)
  - Upsert `routes` (dedupe on `source_id`), insert `search_areas`
  - Return `{ routes, from_cache }`
- Frontend: debounced call on map `moveend`
- Clustered trail markers (Mapbox GeoJSON source + clusters)
- PTTK colored polylines (`trail_color` → line color)
- Loading/error states per PRD section 7
- `useTrails` hook with debounce + caching
- RLS: `routes` readable by all auth users; `search_areas` readable by all, writable by service role

**Skills:** `supabase-postgres-best-practices` + `vercel-react-best-practices` + `frontend-design`
**Plugins:** `supabase`, `context7`

**Acceptance:**
- Map movement triggers debounced trail fetch
- Clusters expand on zoom
- PTTK trails render as colored polylines
- Cache hit returns `from_cache: true`
- Error state with retry on Overpass failure

---

## Phase 3: Trail Browsing (List + Detail + Filters)

**What gets built:**
- Map/list toggle view
- `TrailCard`: name, length, surface badge, water icon, difficulty badge, trail color, mini-map
- `TrailDetail` page: full info, map with route, all attributes, action buttons (disabled until auth)
- Filter panel (bottom sheet):
  - Length: `< 5 km` / `5–15 km` / `> 15 km`
  - Surface: Ziemia / Zwir / Asfalt / Mieszana / Nieznana
  - Water: Wymagana / Mile widziana / Obojętne
  - Difficulty: Łatwa / Średnia / Trudna / Nieznana
  - Distance: `< 10 km` / `< 30 km` / `< 50 km` (client-side Haversine on `center_lat`/`center_lon`)
  - Marked trail: Tak / Obojętne
- `src/lib/haversine.ts` utility
- Filter state in Zustand, applied client-side
- "Mile widziana woda" — boosts water trails, doesn't exclude others
- Empty state per PRD section 7

**Skills:** `frontend-design` + `responsive-design` + `tailwind-design-system` + `vercel-react-best-practices` + `web-design-guidelines`
**Plugins:** `context7`, `playwright`

**Acceptance:**
- Map/list toggle works
- All 6 filter categories work independently and combined
- Distance uses Haversine correctly
- Empty state renders with CTA
- Filtering 200+ trails < 100ms

---

## Phase 4: Auth + Open Registration + Onboarding

**What gets built:**
- Supabase Auth: email + password, no OAuth
- Open registration: `/app/auth?mode=register` → name + email + password → account created
- Login: `/app/auth` → email + password → session
- Toggle between login/register on AuthPage
- Onboarding (post first-login): welcome → dog name → geolocation request → map with trails
- Session persistence (Supabase auto-login)
- `useAuth` hook, auth context/provider
- Protected routes (favorites, profile)
- RLS policies:
  - `favorites`: CRUD own rows only
  - `activity_log`: INSERT/SELECT own rows only
  - `users`: read all, update own only
- Profile page: name, dog name, avatar placeholder

**Skills:** `supabase-postgres-best-practices` + `frontend-design` + `responsive-design` + `tailwind-design-system` + `vercel-react-best-practices`
**Plugins:** `supabase`, `security-guidance`, `vercel`

**Acceptance:**
- Registration (name + email + password) → login works
- Login (email + password) → login works
- First-time user sees full onboarding
- Returning user auto-logs in
- RLS prevents cross-user access (tested with 2 users)
- Unauthenticated can browse but not favorite/log
- `/invite` redirects to `/`

---

## Phase 5: Favorites + Activity Logging

**What gets built:**
- Heart icon toggle on TrailCard + TrailDetail → `favorites` row
- Favorites page: list with filtering (reuse Phase 3 filters)
- Favorite notes: text input, saved to `favorites.note`
- Empty favorites: dog illustration + personalized message
- "Przeszedłem!" button on TrailDetail → `activity_log` entry + toast "Zapisano spacer!"
- Visual "walked" indicator on TrailCard
- Activity history on profile page
- Optimistic UI for favorite toggle + activity logging
- `useFavorites`, `useActivityLog` hooks

**Skills:** `frontend-design` + `shadcn-ui` (patterns only) + `vercel-react-best-practices` + `supabase-postgres-best-practices`
**Plugins:** `supabase`, `playwright`

**Acceptance:**
- Heart toggles with animation
- Notes editable per favorite
- "Przeszedłem!" creates entry + shows toast
- "Walked" indicator visible on cards
- Empty favorites shows dog name message
- Optimistic updates feel instant

---

## Phase 6: PWA + Offline + Polish

**What gets built:**
- Service Worker (Workbox via `vite-plugin-pwa`):
  - Precache: app shell, bundles, Inter font
  - Runtime cache: last 10 trail details
  - Mapbox tile cache (cache-first)
- Offline banner: "Tryb offline — wyświetlam zapisane trasy"
- Offline mode: cached trails only, disable search/favorites/activity
- Install prompt: custom "Dodaj do ekranu" banner
- Manifest finalization: icons (192/512), splash, `display: standalone`, theme `#111318`
- Performance: lazy load TrailDetail/Profile, dynamic Mapbox import, skeleton states
- Error boundaries, retry with exponential backoff
- Sentry integration
- Touch targets >= 48px, smooth transitions

**Skills:** `frontend-design` + `web-design-guidelines` + `responsive-design` + `vercel-react-best-practices`
**Plugins:** `sentry`, `playwright`, `vercel`, `semgrep`

**Acceptance:**
- App installable on Android/iOS
- Last 10 trails available offline
- Offline banner appears when disconnected
- Lighthouse PWA >= 90, Performance >= 80
- Sentry captures errors
- Initial bundle < 200KB (excl. Mapbox)

---

## Phase 7: Testing + Launch Prep

**What gets built:**
- Unit tests: `haversine.ts`, filter logic, Overpass query builder, data normalization
- Component tests: TrailCard variants, filter panel, auth gate, favorite toggle
- E2E (Playwright): onboarding flow, trail discovery, favorites, activity, offline mode
- Edge Function tests: cache hit/miss, Overpass parsing, deduplication
- RLS audit: all tables enforce user isolation
- Security review: no exposed keys, CORS, rate limiting
- README.md with setup instructions
- Seed: owner account + 5 invite tokens

**Skills:** `vitest` + `supabase-postgres-best-practices` + `vercel-react-best-practices`
**Plugins:** `playwright`, `security-guidance`, `semgrep`, `coderabbit`, `sentry`

**Acceptance:**
- Unit coverage >= 80% on utilities/data logic
- All E2E flows pass on Chrome mobile
- RLS audit confirms no cross-user leaks
- Security scan — no critical findings
- README enables setup from scratch
- Production deploy serves complete app

---

## Target Project Structure

```
pointer-adventure/
  docs/PRD.md
  docs/IMPLEMENTATION_PLAN.md
  CLAUDE.md
  .agents/skills/           (8 skills)
  supabase/
    migrations/             (SQL schema + RLS)
    functions/search-trails/ (Edge Function)
  src/
    main.tsx, App.tsx, router.tsx
    index.css               (Tailwind + tokens)
    components/ui/          (Button, Card, Toast, BottomTabBar)
    components/layout/      (AppLayout, MapLayout)
    features/
      map/                  (MapView, MapControls, LocationSearch)
      trails/               (TrailList, TrailCard, TrailDetail, filters)
      favorites/            (FavoritesList, FavoriteNote)
      auth/                 (MagicLink, InviteGate, RegisterForm)
      onboarding/           (WelcomeScreen, DogNameStep, GeolocationStep)
      profile/              (ProfileView, InviteGenerator, ActivityHistory)
    hooks/                  (useGeolocation, useTrails, useMapBounds, useAuth, useFavorites, useActivityLog)
    lib/                    (supabase.ts, haversine.ts, types.ts)
    stores/                 (Zustand: filters, viewport, UI)
  public/manifest.json, icons/
  vite.config.ts, tailwind.config.ts
```

## Skill Combos Per Phase (for CLAUDE.md)

```
Phase 0 (Scaffolding):     tailwind-design-system + vercel-react-best-practices + supabase-postgres-best-practices
Phase 1 (Map):             frontend-design + responsive-design + tailwind-design-system + vercel-react-best-practices
Phase 2 (Trail Pipeline):  supabase-postgres-best-practices + vercel-react-best-practices + frontend-design
Phase 3 (Browsing/Filter): frontend-design + responsive-design + tailwind-design-system + vercel-react-best-practices + web-design-guidelines
Phase 4 (Auth/Onboarding): supabase-postgres-best-practices + frontend-design + responsive-design + tailwind-design-system + vercel-react-best-practices
Phase 5 (Favorites):       frontend-design + shadcn-ui + vercel-react-best-practices + supabase-postgres-best-practices
Phase 6 (PWA/Polish):      frontend-design + web-design-guidelines + responsive-design + vercel-react-best-practices
Phase 7 (Testing):         vitest + supabase-postgres-best-practices + vercel-react-best-practices
```

## Critical Reference Files
- `docs/PRD.md` — source of truth for features and requirements
- `CLAUDE.md` — Claude Code instructions and skill mapping
- `.agents/skills/*/SKILL.md` — skill instructions
- `.claude/settings.local.json` — permissions
