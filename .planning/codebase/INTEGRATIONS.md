# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**Mapping:**
- Mapbox GL JS - Interactive map rendering and geocoding for trail discovery
  - SDK/Client: `mapbox-gl` ^3.19.1 (loaded directly in map feature)
  - Auth: `VITE_MAPBOX_TOKEN`
  - Style: `mapbox://styles/mapbox/outdoors-v12`
  - Default center: Poland `[19.145, 51.919]`, zoom 6
  - Geocoding: Mapbox Geocoding API (used in `src/features/map/` LocationSearch)
  - Tile caching: Workbox `CacheFirst` strategy via service worker (`vite.config.ts`) — caches `https://api.mapbox.com/*`, 500 entries, 7-day TTL

## Data Storage

**Databases:**
- Supabase PostgreSQL - Primary database
  - Connection: `VITE_SUPABASE_URL` (project URL), `VITE_SUPABASE_ANON_KEY` (public anon key)
  - Client: `@supabase/supabase-js` ^2.98.0, initialized in `src/lib/supabase.ts`
  - Schema defined in `supabase/migrations/20260308210000_initial_schema.sql`

**Tables:**
- `public.users` — User profiles (display_name, dog_name, avatar_url), mirrors `auth.users`
- `public.routes` — Trail/route data with GeoJSON geometry stored as `jsonb`
- `public.search_areas` — Bounding-box cache to avoid redundant Overpass/OSM fetches (7-day expiry)
- `public.favorites` — User-route many-to-many with optional note
- `public.activity_log` — Walk history per user per route
- `public.invitations` — Invite tokens (30-day expiry), hex-encoded random bytes via pgcrypto

**Row Level Security:** Enabled on all 6 tables. Policies enforce per-user data isolation. Service role used in Edge Functions for elevated operations (token validation, search area inserts).

**Extensions:**
- `pgcrypto` — Required for `gen_random_bytes()` used in invitation token generation

**File Storage:**
- Not configured (avatar_url column present in `users` table but no storage bucket integration detected)

**Caching:**
- `public.search_areas` table acts as a server-side bbox cache for trail data fetches
- Mapbox tiles cached client-side via PWA service worker

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Magic link (passwordless email)
  - Implementation: invite-only flow — users must have a valid `invitations` token before registration
  - Routes: `/invite` (token validation), `/auth` (magic link send/receive)
  - Auth state consumed via `@supabase/supabase-js` client in `src/lib/supabase.ts`
  - Hook: `src/hooks/useAuth` (planned per CLAUDE.md)
  - After registration, a matching row is inserted into `public.users` (enforced by RLS `insert own` policy)

## Serverless / Edge Functions

**Supabase Edge Functions:**
- `supabase/functions/search-trails/` — Handles trail search requests
  - Uses service role to bypass RLS for `search_areas` cache inserts and `invitations` token lookups
  - No source files present yet (directory is empty — planned implementation)

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Datadog, or similar SDK in dependencies)

**Logs:**
- `console.warn` for missing Supabase credentials at startup (`src/lib/supabase.ts`)
- No structured logging library detected

## CI/CD & Deployment

**Hosting:**
- Vercel — project name `pointer-adventure`, linked via `.vercel/project.json`
  - Project ID: `prj_byduuw8NM6o1GCIz456jOUeTEC1T`
  - Org ID: `team_JWeKKxk2y05j5QJbZns4UIwq`

**CI Pipeline:**
- Not detected (no GitHub Actions, CircleCI, or similar config files found)

**Build Command:**
```bash
npm run build   # tsc -b && vite build
```

## PWA / Offline

**Service Worker:**
- Registered via `vite-plugin-pwa` with `registerType: 'autoUpdate'`
- Precaches: `**/*.{js,css,html,ico,png,svg,woff2}`
- Runtime cache: Mapbox API tiles (CacheFirst, 7 days)
- Manifest: `public/manifest.json` (standalone display, dark theme `#111318`)

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` — Supabase project REST endpoint
- `VITE_SUPABASE_ANON_KEY` — Supabase public anon key (safe for client)
- `VITE_MAPBOX_TOKEN` — Mapbox public access token

**Secrets location:**
- `.env` and `.env.local` at project root (not committed; `.env.example` documents required vars)
- Supabase service role key used only within Edge Functions (server-side, not exposed to client)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

---

*Integration audit: 2026-03-10*
