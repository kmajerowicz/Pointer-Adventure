# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Feature-Sliced SPA with Server-Side Cache Layer

**Key Characteristics:**
- React SPA deployed as a PWA via Vite + Workbox service worker
- Feature-based folder structure under `src/features/` — each feature is a self-contained vertical slice
- Client state managed exclusively with Zustand stores; server state fetched directly via Supabase JS client or hooks
- Backend is serverless: Supabase for auth + PostgreSQL + RLS; Edge Function handles the only complex server-side logic (trail fetching + caching)
- No dedicated API layer on the frontend — components and hooks call `supabase` client directly

## Layers

**Entry / Bootstrap:**
- Purpose: Mount the React app and register the service worker
- Location: `src/main.tsx`, `index.html`
- Contains: ReactDOM root creation, CSS import
- Depends on: `src/App.tsx`
- Used by: Browser

**Routing:**
- Purpose: Declare all client-side routes and bind them to layout + page components
- Location: `src/router.tsx`
- Contains: `createBrowserRouter` config — tabbed routes under `AppLayout`, standalone routes `/invite` and `/auth`
- Depends on: `src/components/layout/AppLayout.tsx`, feature page components
- Used by: `src/App.tsx`

**Layout:**
- Purpose: Persistent shell wrapping the four tabbed views
- Location: `src/components/layout/AppLayout.tsx`
- Contains: `<Outlet />` for child routes, `<BottomTabBar />` fixed at bottom
- Depends on: `src/components/ui/BottomTabBar.tsx`
- Used by: Router (wraps `/`, `/trails`, `/favorites`, `/profile`)

**Shared UI Components:**
- Purpose: Reusable presentational primitives used across features
- Location: `src/components/ui/`
- Contains: `BottomTabBar.tsx` (navigation), and planned Button, Card, Toast components
- Depends on: Tailwind design tokens from `src/index.css`
- Used by: Feature components, AppLayout

**Feature Modules:**
- Purpose: All business logic, UI, and data access for a single product area
- Location: `src/features/{feature}/`
- Contains: Page components, sub-components, feature-specific logic
- Feature list: `map/`, `trails/`, `favorites/`, `auth/`, `onboarding/`, `profile/`
- Depends on: `src/hooks/`, `src/stores/`, `src/lib/`
- Used by: Router

**Custom Hooks:**
- Purpose: Encapsulate data fetching and side-effect logic, reusable across features
- Location: `src/hooks/`
- Contains (planned): `useGeolocation`, `useTrails`, `useMapBounds`, `useAuth`, `useFavorites`, `useActivityLog`
- Depends on: `src/lib/supabase.ts`, Zustand stores
- Used by: Feature components

**Zustand Stores (Client State):**
- Purpose: Global ephemeral UI and map state, shared across features without prop drilling
- Location: `src/stores/`
- Contains:
  - `viewport.ts` — map center `[lng, lat]`, zoom, current bounds
  - `filters.ts` — active trail filter values (length, surface, water, difficulty, distance, marked)
  - `ui.ts` — `viewMode` (map | list), `isFilterOpen`
- Depends on: `src/lib/types.ts` (type imports only)
- Used by: Feature components, hooks

**Shared Library:**
- Purpose: Singleton clients, shared types, and pure utility functions
- Location: `src/lib/`
- Contains:
  - `supabase.ts` — initialized `supabase` client singleton
  - `types.ts` — all domain TypeScript interfaces and union types
  - `haversine.ts` (planned) — client-side distance calculation
- Depends on: `@supabase/supabase-js`, Vite env vars
- Used by: Hooks, feature components, stores

**Backend — Supabase:**
- Purpose: PostgreSQL database with auth, RLS policies, and Edge Functions
- Location: `supabase/`
- Contains:
  - `migrations/` — SQL schema migrations with RLS policies
  - `functions/search-trails/` — Deno Edge Function: bounding box cache check → Overpass API fetch → upsert to `routes`
- Depends on: Overpass API (external), pgcrypto extension
- Used by: Frontend via Supabase JS client

## Data Flow

**Trail Discovery (core flow):**

1. User pans/zooms map — `useViewportStore.setBounds()` updates with new bounding box
2. `useTrails` hook (or `useMapBounds`) detects bounds change, calls Supabase Edge Function `/search-trails` with `{south, north, west, east}`
3. Edge Function checks `search_areas` table for cached coverage (TTL: 7 days)
4. Cache hit → returns routes from `routes` table for that bbox
5. Cache miss → Edge Function queries Overpass API, normalizes results, upserts to `routes`, inserts into `search_areas`, returns routes
6. Hook stores result in local React state; components render trail pins/cards

**Auth Flow:**

1. New user arrives at `/invite?token=xyz`
2. `InviteGate` validates token via Supabase Edge Function (service role)
3. User submits email → Supabase sends magic link
4. User clicks magic link → redirected to `/auth` → Supabase session established
5. Onboarding flow: `WelcomeScreen` → `DogNameStep` → `GeolocationStep` → main map
6. Returning users: Supabase persists session in localStorage; auto-login on app load

**Favorites Flow:**

1. User taps heart icon on trail card
2. `useFavorites` hook calls `supabase.from('favorites').insert(...)` (RLS enforces `user_id = auth.uid()`)
3. Optimistic update or refetch; toast confirmation rendered

**State Management:**
- Map viewport (center, zoom, bounds): `useViewportStore` in `src/stores/viewport.ts`
- Trail filters: `useFiltersStore` in `src/stores/filters.ts`
- UI mode (map/list, filter panel): `useUIStore` in `src/stores/ui.ts`
- Auth session: Supabase client handles internally; exposed via `supabase.auth.getSession()` or `onAuthStateChange`
- Server data (trails, favorites): fetched in hooks, held in component/hook local state

## Key Abstractions

**Route (Trail):**
- Purpose: Represents a dog-friendly walking or hiking trail from OSM/PTTK
- Type definition: `src/lib/types.ts` — `Route` interface
- Database: `public.routes` table in Supabase
- Pattern: Fetched server-side via Edge Function, never mutated client-side

**SearchArea:**
- Purpose: Bounding box cache record tracking which geographic areas have been queried
- Type definition: `src/lib/types.ts` — `SearchArea` interface
- Database: `public.search_areas` table; 7-day TTL
- Pattern: Managed exclusively by Edge Function, never written from frontend

**Favorite:**
- Purpose: User's saved trail with optional private note
- Type definition: `src/lib/types.ts` — `Favorite` interface
- Database: `public.favorites` table; RLS restricts to owner
- Pattern: CRUD via Supabase JS client from `useFavorites` hook

**Invitation:**
- Purpose: One-time invite token enabling new user registration
- Type definition: `src/lib/types.ts` — `Invitation` interface
- Database: `public.invitations` table; validated via service-role Edge Function
- Pattern: Generated by authenticated users, consumed once at `/invite`

**Zustand Store:**
- Purpose: Lightweight global state without reducers or context providers
- Pattern: `create<StateInterface>((set) => ({ ...initialState, setX: (x) => set({ x }) }))`
- Examples: `src/stores/viewport.ts`, `src/stores/filters.ts`, `src/stores/ui.ts`
- Consumed: via named hook `useViewportStore`, `useFiltersStore`, `useUIStore`

## Entry Points

**Browser Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loads `index.html`, imports `src/main.tsx`
- Responsibilities: Mount React app in StrictMode into `#root`

**App Shell:**
- Location: `src/App.tsx`
- Triggers: Rendered by `main.tsx`
- Responsibilities: Provide `RouterProvider` — single wrapper, no other logic

**Router Config:**
- Location: `src/router.tsx`
- Triggers: Imported once at app init
- Responsibilities: Define all routes; `AppLayout` wraps tabbed routes; `/invite` and `/auth` are standalone

**Service Worker:**
- Location: Generated by `vite-plugin-pwa` via Workbox config in `vite.config.ts`
- Triggers: Browser install/update lifecycle
- Responsibilities: Precache static assets; runtime-cache Mapbox tile requests (CacheFirst, 7-day TTL, 500 entry cap)

**Edge Function:**
- Location: `supabase/functions/search-trails/` (Deno runtime)
- Triggers: POST from frontend hooks with bounding box payload
- Responsibilities: Cache check, Overpass API fetch, normalize trail data, upsert to Supabase, return routes

## Error Handling

**Strategy:** Surface errors to users via toast notifications; retry with exponential backoff for network failures; fallback to Supabase-cached data when Edge Function is unavailable.

**Patterns:**
- Offline: Service Worker serves cached assets; app detects `navigator.onLine` and shows offline banner
- GPS denied: Fall back to geocoding search; default map center Poland `[19.145, 51.919]` zoom 6
- No trails in area: Empty-state UI with "expand search" CTA, not an error condition
- Auth session missing: Redirect to `/auth`; Supabase `onAuthStateChange` drives navigation

## Cross-Cutting Concerns

**Logging:** `console.warn` for missing env vars (see `src/lib/supabase.ts`); no structured logging framework
**Validation:** TypeScript strict mode; Supabase RLS enforces data access rules at DB level; no frontend validation library present yet
**Authentication:** Magic link via Supabase Auth; invite-only (token validated server-side); session persisted in localStorage by Supabase JS client; RLS on all 6 tables enforces row-level ownership

---

*Architecture analysis: 2026-03-10*
