# Codebase Concerns

**Analysis Date:** 2026-03-10

---

## Tech Debt

**All route pages are inline stubs — zero feature code exists:**
- Issue: Every route renders a single `<div>` placeholder. No feature components, hooks, or pages have been built beyond scaffolding.
- Files: `src/router.tsx` (lines 4–9), `src/features/map/`, `src/features/trails/`, `src/features/auth/`, `src/features/favorites/`, `src/features/profile/`, `src/features/onboarding/` (all directories empty)
- Impact: The app has no actual functionality. Phases 1–7 in `docs/IMPLEMENTATION_PLAN.md` are entirely unimplemented.
- Fix approach: Build per phased plan starting with Phase 1 (Map) in `docs/IMPLEMENTATION_PLAN.md`.

**`src/hooks/` directory does not exist:**
- Issue: CLAUDE.md and the implementation plan reference hooks (`useGeolocation`, `useTrails`, `useMapBounds`, `useAuth`, `useFavorites`, `useActivityLog`) that have not been created.
- Files: `CLAUDE.md` (Project Structure section), `docs/IMPLEMENTATION_PLAN.md`
- Impact: Any feature code that imports from `src/hooks/` will fail at build time.
- Fix approach: Create `src/hooks/` directory and implement hooks in Phases 1–5.

**`src/lib/haversine.ts` does not exist:**
- Issue: The implementation plan (Phase 3) and PRD (section 5.3) specify a Haversine distance utility for client-side "distance from location" filtering. The file is referenced in CLAUDE.md's Project Structure but not yet created.
- Files: `docs/IMPLEMENTATION_PLAN.md` (Phase 3), `src/lib/` (missing file)
- Impact: Distance filter will not work without this utility.
- Fix approach: Implement in Phase 3 alongside the filter panel.

**Edge Function is empty — the core data pipeline does not exist:**
- Issue: `supabase/functions/search-trails/` is an empty directory. The entire trail discovery system (Overpass API calls, normalization, cache logic) documented in PRD sections 3.1–3.4 is not implemented.
- Files: `supabase/functions/search-trails/` (empty)
- Impact: No trail data will ever be fetched or displayed. The `routes` and `search_areas` tables remain empty.
- Fix approach: Implement the full Edge Function in Phase 2 per `docs/IMPLEMENTATION_PLAN.md`.

**Schema divergence between PRD and actual migration:**
- Issue: The PRD (section 4) documents fields that do not exist in the actual migration (`supabase/migrations/20260308210000_initial_schema.sql`):
  - `routes` in PRD has `water_type`, `bbox_south/north/east/west`, `source` — none of these exist in the migration.
  - `activity_log` in PRD has `duration_min` — missing from migration.
  - `invitations` in PRD has `used_at` — missing from migration.
  - PRD uses `difficulty: "medium"` but migration enforces `'easy' | 'moderate' | 'hard' | 'unknown'` — a silent mismatch.
  - `water_access` is `boolean | null` in migration vs `"none" | "nearby" | "on_route"` text enum in PRD.
- Files: `supabase/migrations/20260308210000_initial_schema.sql`, `docs/PRD.md` (section 4), `src/lib/types.ts`
- Impact: TypeScript types in `src/lib/types.ts` follow the migration (not the PRD), so any Edge Function code written to the PRD spec will produce data that doesn't match the frontend types. The `water_access: boolean | null` field is especially problematic — the PRD expects three-state `none/nearby/on_route` string, the schema stores a boolean, and the type definition reflects the boolean.
- Fix approach: Decide canonical schema, add a new migration to add missing columns, update `src/lib/types.ts` and PRD to match.

**`dist/` directory is committed to git:**
- Issue: The `.gitignore` excludes `dist` but the `dist/` directory exists in the working tree and contains built assets including JavaScript bundles.
- Files: `dist/` (entire directory — `dist/index.html`, `dist/assets/index-CCk46VVI.js`, `dist/sw.js`, etc.)
- Impact: Repository contains compiled output. On CI/Vercel this is irrelevant (builds from source), but the presence of `dist/` in a clean checkout is misleading and pollutes code review.
- Fix approach: Confirm `.gitignore` has `dist` (it does), then run `git rm -r --cached dist/` and commit.

---

## Security Considerations

**`VITE_` prefix exposes all env vars in the client bundle:**
- Risk: All three secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`) are prefixed with `VITE_`, which causes Vite to inline them into the public JavaScript bundle at build time. Anyone can extract these by reading the production bundle.
- Files: `src/vite-env.d.ts`, `src/lib/supabase.ts`, `.env.example`
- Current mitigation: Supabase anon key is designed to be public (RLS enforces row-level access). Mapbox tokens are also intended for client-side use with domain restrictions.
- Recommendations: Restrict the Mapbox token to the production domain (`psiszlak.pl` / Vercel URL) in the Mapbox dashboard. Confirm Supabase RLS is airtight before launch. Never add any server-side secret (service role key, Overpass credentials) to `VITE_` variables.

**Supabase client falls back to empty strings on missing credentials:**
- Risk: `src/lib/supabase.ts` uses `supabaseUrl ?? ''` and `supabaseAnonKey ?? ''` when env vars are unset, creating a valid (but non-functional) client that silently fails rather than throwing at startup.
- Files: `src/lib/supabase.ts` (line 10)
- Current mitigation: A `console.warn` is logged (line 6–8), but no error is thrown.
- Recommendations: Throw a hard error in development: `if (!supabaseUrl || !supabaseAnonKey) throw new Error(...)`. In production Vercel will always have env vars set.

**Invitation token lookup requires service role — no server-side validation UI:**
- Risk: Token validation for `/invite?token=xyz` must go through the Edge Function (service role) per the schema design. If the Edge Function is not implemented, the invite gate can be trivially bypassed by any client that skips the token check.
- Files: `supabase/migrations/20260308210000_initial_schema.sql` (lines 120–127), `src/features/auth/` (empty), `src/router.tsx`
- Current mitigation: None — `/invite` route renders a placeholder `<div>`.
- Recommendations: Implement invite validation in Edge Function before exposing registration to users. Do not implement client-side token validation that queries Supabase directly with anon key.

**`search_areas` table allows unauthenticated reads:**
- Risk: RLS policy `"Search areas: read by all"` uses `using (true)` with no `to authenticated` restriction. Unauthenticated users can enumerate all cached bounding boxes.
- Files: `supabase/migrations/20260308210000_initial_schema.sql` (line 71–73)
- Current mitigation: The data itself (bbox coordinates) is low sensitivity.
- Recommendations: Low priority, but consider restricting to `to authenticated` for consistency with `routes` table policy.

**Mapbox attribution CSS override:**
- Risk: `src/index.css` includes `.mapboxgl-ctrl-attrib { display: none !important; }` which hides the Mapbox attribution control. Mapbox's Terms of Service require attribution to be displayed.
- Files: `src/index.css` (lines 66–68)
- Current mitigation: None.
- Recommendations: Remove this rule or replace it with a custom attribution component. Violating ToS could result in token revocation.

---

## Performance Bottlenecks

**No lazy loading or code splitting configured:**
- Problem: All routes are statically imported inline in `src/router.tsx`. When Mapbox GL JS (`mapbox-gl` ~3MB), React, and all feature code is bundled, the initial JS payload will be very large.
- Files: `src/router.tsx`, `vite.config.ts`
- Cause: Placeholder routes use inline components, but when real feature components are added, no `React.lazy()` or dynamic import wrapping is in place.
- Improvement path: Phase 6 (`docs/IMPLEMENTATION_PLAN.md`) explicitly plans `dynamic Mapbox import` and lazy loading for `TrailDetail/Profile`. Use `React.lazy(() => import('./features/map/MapView'))` for all route-level components and add a `<Suspense>` wrapper in `AppLayout`.

**Mapbox tile cache pattern may miss API tile URLs:**
- Problem: Workbox runtime cache in `vite.config.ts` matches `^https://api.mapbox.com/.*` but Mapbox GL JS fetches tiles from `api.mapbox.com`, `events.mapbox.com`, and CDN tile servers (`*.maptiles.co` / `tiles.mapbox.com`). The current pattern likely misses actual tile requests.
- Files: `vite.config.ts` (lines 18–26)
- Cause: Mapbox tile URLs don't necessarily originate from `api.mapbox.com`.
- Improvement path: Expand the cache pattern or add a second `runtimeCaching` entry for `tiles.mapbox.com`. Test with DevTools Network panel to identify actual tile request origins.

**No debouncing on map viewport store:**
- Problem: `src/stores/viewport.ts` provides `setCenter`, `setZoom`, and `setBounds` but has no debounce logic. When Phase 1 connects map events to these setters, every pixel of pan/zoom will trigger a Zustand state update and re-render.
- Files: `src/stores/viewport.ts`
- Cause: Store setters are raw Zustand `set()` calls with no throttling.
- Improvement path: Debounce the `moveend`/`zoomend` handlers in the map component (Phase 1), not in the store. A 300ms debounce on `setBounds` before triggering the Edge Function call is critical for API cost control.

---

## Fragile Areas

**`water_access` type is boolean in schema but PRD expects tri-state string:**
- Files: `src/lib/types.ts` (line 15: `water_access: boolean | null`), `supabase/migrations/20260308210000_initial_schema.sql` (line 43: `water_access boolean`), `docs/PRD.md` (section 3.3: `water_access: "none" | "nearby" | "on_route"`)
- Why fragile: Any component displaying water access information (TrailCard, TrailDetail, filters) will behave incorrectly depending on which definition it follows. The filter store uses `'required' | 'preferred' | 'any'` in `src/stores/filters.ts` — none of which map cleanly to a boolean column.
- Safe modification: Resolve the mismatch before implementing Trail browsing (Phase 3). Add a migration to change `water_access boolean` to `water_access text` with a check constraint matching the PRD enum.
- Test coverage: None — no tests exist.

**`difficulty` mismatch: migration uses `'moderate'`, PRD uses `'medium'`:**
- Files: `supabase/migrations/20260308210000_initial_schema.sql` (line 41: check includes `'moderate'`), `docs/PRD.md` (section 3.3 uses `"medium"`), `src/lib/types.ts` (line 9: `'moderate'`)
- Why fragile: The Edge Function (when built) will produce data from OSM/Overpass. If it follows the PRD spec and writes `"medium"`, the Supabase check constraint will reject the insert. If it follows the TypeScript type and writes `"moderate"`, the UI labels may show the wrong value.
- Safe modification: Standardize on `'moderate'` (the migration value) and update `docs/PRD.md` to match.
- Test coverage: None.

**PWA icons are SVG — iOS does not support SVG for `apple-touch-icon`:**
- Files: `public/manifest.json`, `index.html` (line 7: `<link rel="apple-touch-icon" href="/icons/icon-192.svg" />`)
- Why fragile: iOS requires PNG format for `apple-touch-icon`. An SVG icon will silently fall back to a generic browser icon when the app is added to the home screen on iPhone/iPad.
- Safe modification: Generate 192x192 and 512x512 PNG icons and replace the SVG references. The implementation plan notes "Replace SVG placeholder icons with proper PNG icons" as remaining work.
- Test coverage: None.

**`createRoot(document.getElementById('root')!)` uses non-null assertion:**
- Files: `src/main.tsx` (line 6)
- Why fragile: The `!` assertion bypasses the null check. If `index.html` is ever modified and the `id="root"` element is removed or renamed, the app will throw a runtime error with no meaningful message.
- Safe modification: Add a guard: `const root = document.getElementById('root'); if (!root) throw new Error('Root element not found'); createRoot(root).render(...)`.
- Test coverage: None.

---

## Missing Critical Features

**No authentication or route protection:**
- Problem: All routes are publicly accessible. The `/invite`, `/auth` routes are placeholders. There is no `useAuth` hook, no auth context, and no route guard.
- Blocks: All user-specific features (favorites, activity log, profile, invite generation) require auth.

**No error boundaries:**
- Problem: No React `ErrorBoundary` components exist anywhere. A single thrown error in any component will crash the entire app with a blank screen.
- Files: `src/App.tsx`, `src/components/layout/AppLayout.tsx` — neither has an error boundary.
- Blocks: Production stability. The implementation plan lists this for Phase 6, but Mapbox GL JS can throw on initialization if the token is invalid.

**No loading/skeleton states:**
- Problem: No skeleton screens, spinners, or loading indicators exist. Every async operation (trail fetch, auth check) will produce a blank or frozen UI.
- Blocks: Core UX; the PRD requires feedback for every action.

**Seed data for invitations not created:**
- Problem: The implementation plan notes "Seed: owner account + 5 initial invite tokens" as required for Phase 4 and Phase 7. No seed SQL file exists in `supabase/`.
- Files: `supabase/config.toml` (references `./seed.sql` which does not exist)
- Blocks: Cannot test or demo the invitation flow without initial tokens.

---

## Test Coverage Gaps

**Zero test files exist:**
- What's not tested: Everything. No unit tests, no integration tests, no E2E tests.
- Files: All of `src/` — no `.test.ts`, `.spec.ts`, `.test.tsx`, or `.spec.tsx` files found.
- Risk: The entire codebase is unverified. Critical utilities like Haversine distance calculation, Overpass data normalization, and invitation token logic will be shipped without verification.
- Priority: High — Phase 7 targets >= 80% coverage on utilities/data logic.

**No test runner configured:**
- What's not tested: Cannot run tests even if files were created; `vitest` is not in `package.json` devDependencies and no `vitest.config.*` exists.
- Files: `package.json` — no test script, no vitest dependency.
- Risk: Phase 7 plans require Vitest + Playwright. Both need to be installed and configured before any tests can run.
- Priority: High — install `vitest`, `@vitest/ui`, `jsdom`, and Playwright before Phase 7.

---

## Dependencies at Risk

**`mapbox-gl` ^3.19.1 is a large, semver-unpinned dependency:**
- Risk: Mapbox major versions occasionally change token requirements, pricing tiers, or GL rendering APIs. The `^` prefix allows minor/patch auto-upgrades.
- Impact: Unexpected behavior changes in production on `npm install` if a new minor is released.
- Migration plan: Consider pinning to exact version (`3.19.1`) once the map implementation is stable in Phase 1.

**No Sentry SDK installed yet:**
- Risk: Phase 6 plans Sentry error monitoring integration, but `@sentry/react` is not in `package.json`. The implementation plan references it as an MCP tool, not as a project dependency.
- Impact: No error visibility in production until Phase 6.
- Migration plan: Add `@sentry/react` in Phase 6.

---

*Concerns audit: 2026-03-10*
