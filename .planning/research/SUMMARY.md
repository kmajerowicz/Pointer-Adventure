# Project Research Summary

**Project:** Psi Szlak — dog-friendly trail discovery PWA for Poland
**Domain:** Map-centric mobile PWA with OSM data pipeline and invite-only auth
**Researched:** 2026-03-11
**Confidence:** HIGH (brownfield project — stack is fixed; research validated versions, patterns, and pitfalls against official docs and GitHub issues)

## Executive Summary

Psi Szlak is a brownfield project with a sound, modern stack already in place. The technology choices are all current stable versions as of 2026-03-11 and there are no conflicting version constraints. The architecture is a standard React SPA + Supabase backend pattern, with a single Edge Function acting as a caching proxy between the frontend and Overpass API. The primary engineering challenge is not the choice of technologies but their correct wiring: Mapbox GL JS v3 requires careful React lifecycle integration, Workbox tile caching requires opaque-response configuration that is missing from the current scaffolding, and the Overpass data pipeline must be designed with rate limiting and timeout budgets from day one.

The recommended approach is to build strictly in dependency order: map lifecycle first (everything else renders on the map), then the trail data pipeline (no trail UI is possible without data), then display and filtering, then auth and onboarding, then persistence features (favorites, activity log), and finally PWA hardening. The auth phase can be developed in parallel by a second developer but must gate the app before it is used by real users. The key differentiators — PTTK color-coded trail layers, water access filter, and dog-name personalization — are all well-scoped and achievable within the existing architecture.

The top risks are: (1) Overpass API rate limiting, which will manifest as silent trail data absence and can exhaust the Supabase free tier quotas rapidly if debouncing is not in place from Phase 1; (2) Mapbox WebGL context leaks on tab navigation, which are hard to retrofit once the pattern is established; and (3) a pre-existing `water_access` schema type mismatch (boolean vs. text enum) that will corrupt all filter logic if not corrected before the trail pipeline is built. All three risks have clear, verified mitigations that must be applied before the relevant phase starts.

---

## Key Findings

### Recommended Stack

The stack is fixed and validated. All packages are current stable versions. Three specific version-related behaviors require attention: Mapbox GL JS v3.x ships its own TypeScript types (do not install `@types/mapbox-gl`), requires its CSS to be explicitly imported, and has an internal 50 MB tile cache that conflicts with the service worker cache name `mapbox-tiles` — the Workbox cache must use a distinct name. Tailwind CSS 4 is CSS-first (no `tailwind.config.ts`; configuration is in `src/index.css` via `@theme`), and this is already implemented correctly in the scaffolding. Zustand 5 uses `useSyncExternalStore` internally and is fully safe under React 19 concurrent rendering with no special handling required.

**Core technologies:**
- React 19.2.0 + Vite 7.3.1: SPA shell with concurrent rendering; Strict Mode double-mount behavior requires guards in Mapbox initialization
- Mapbox GL JS ^3.19.1: Map rendering; v3 has first-party TS types, mandatory CSS import, and built-in 50 MB tile cache that must not be interfered with
- Supabase (supabase-js ^2.98.0): Auth (magic link + PKCE), PostgreSQL (6 tables, RLS on all), Edge Functions (Deno runtime, 150s wall-clock limit)
- vite-plugin-pwa ^1.2.0 + Workbox ^7.4.0: Service worker; current config has 3 bugs (missing opaque response support, wrong cache name, unsafe entry limit)
- Zustand 5.0.11: Client state for viewport, filters, and UI; `useSyncExternalStore`-based, React 19-safe
- Tailwind CSS 4.2.1: CSS-first design tokens via `@theme`; dark-mode-only app implemented correctly; no `tailwind.config.ts` needed or used

**Known scaffolding issues to fix before feature work:**

| Issue | File | Required Fix |
|-------|------|--------------|
| Attribution hidden via CSS (ToS violation) | `src/index.css` | Remove CSS rule; use `AttributionControl({ compact: true })` |
| Workbox tile cache missing `cacheableResponse` | `vite.config.ts` | Add `{ statuses: [0, 200] }` and `purgeOnQuotaError: true` |
| Workbox cache name conflicts with mapbox-gl internal cache | `vite.config.ts` | Rename `mapbox-tiles` to `psi-szlak-mapbox-tiles` |
| Mapbox CSS not imported in map component | (not yet implemented) | `import 'mapbox-gl/dist/mapbox-gl.css'` in map component |
| `water_access` column is boolean, must be text enum | `supabase/migrations/` | Migration before any trail pipeline code |
| `dist/` committed to git | repo root | `git rm -r --cached dist/` |

### Expected Features

The feature set is well-researched. The PRD's scope is appropriate for 5-10 users in v1. The core product value (dog-specific trail lens) is genuinely differentiated from AllTrails and Komoot, which do not filter by surface type or water proximity as first-class attributes.

**Must have (table stakes — app has no value without these):**
- Interactive map centered on user location with graceful geolocation-denied fallback
- Trail polylines on map with PTTK color coding (red/blue/yellow/green/black from `osmc:symbol`)
- Trail card showing distance, difficulty, surface type, and water access (scannable at 375px width)
- Filter panel: length + surface + water access + difficulty + distance from user (6 filters, bottom sheet UX)
- "Near me" sort using Haversine distance from user's geolocation
- Map/list toggle (tab architecture already supports this)
- Empty states with actionable recovery CTAs in Polish
- Loading states (skeleton cards for list, spinner for map)
- Offline banner (persistent top banner, not a self-dismissing toast)
- Error states with retry

**Should have (differentiators that justify using Psi Szlak over AllTrails):**
- Water access filter (none / nearby / on_route) — no competitor exposes this
- Surface type filter (dirt / gravel / asphalt / mixed) — paw-health concern not addressed elsewhere
- PTTK color-coded trail layer — makes the app feel built for Poland
- Dog-name personalization in empty states and copy
- Private notes on favorites
- Invite-only access model
- "Przeszedlem!" one-tap activity log (no GPS, no complexity)
- Dog onboarding (3 steps max: dog name → geolocation → first map view)

**Defer to v2+:**
- GPS activity recording and turn-by-turn navigation
- User-generated content (photos, ratings, comments)
- Social feed
- Light theme
- Route drawing / custom trail creation
- Weather integration
- Push notifications
- Elevation profiles
- Recommendation engine (collect data now, build algorithm when volume exists)

### Architecture Approach

The architecture is a React SPA with feature-based folder structure (`src/features/*`), three Zustand stores (viewport, filters, UI), and a custom hook layer that mediates between the stores and Supabase/Mapbox. The map instance lives in a `useRef` (not `useState`) to prevent re-render-triggered context destruction. The Mapbox map is the source of truth for camera position — the viewport store is an observer updated on `moveend`, never the reverse. The single Edge Function (`search-trails`) acts as a caching proxy: it checks a `search_areas` table by `bbox_hash` before hitting Overpass, returning cached routes on hit. Filters are applied client-side when bounds are unchanged (same-bbox interaction), and the Edge Function is only re-invoked when bounds change.

**Major components:**
1. `useMapInstance` hook — owns the Mapbox `Map` lifecycle (init, cleanup, `useRef` pattern); prerequisite for everything
2. `search-trails` Edge Function — Overpass caching proxy with retry/backoff; the only server-side logic in the app
3. `useTrails` hook — debounced watcher on viewport bounds + filters; drives both map GeoJSON layer and trail list
4. `FilterPanel` — bottom sheet with sticky Apply button; applies client-side when bounds unchanged, triggers Edge Function re-fetch when bounds change
5. `InviteGate` + `MagicLinkHandler` + `OnboardingFlow` — invite-only auth chain; must gate all other routes in production
6. Service Worker (Workbox) — precaches app shell; CacheFirst for Mapbox tiles (status [0,200]); NetworkFirst for trail GeoJSON

### Critical Pitfalls

1. **Overpass rate limiting from shared Edge Function IP** — Multiple users panning simultaneously sends concurrent requests from Supabase's shared IP range, triggering HTTP 429 blocks. Prevention: debounce `moveend` to 500ms, add `[timeout:45]` to all Overpass QL queries, implement bbox-hash cache as primary defense, parse `Retry-After` header for backoff. Must be designed in at Phase 2.

2. **Mapbox WebGL context leak on tab navigation** — Each `MapView` unmount without correct `map.remove()` cleanup leaks a WebGL context; browsers hard-cap at 8-16 contexts; app goes black after 8 navigations. Prevention: store map in `useRef`, initialize once, call `map.remove()` exactly once in `useEffect` cleanup, and consider keeping the map permanently mounted in `AppLayout` (hidden with CSS when inactive). Must be correct from Phase 1 — very hard to retrofit.

3. **`water_access` schema mismatch corrupts filter logic** — Current migration has `water_access boolean`; PRD and filter store require `'none' | 'nearby' | 'on_route'` text enum. Code written before the migration is corrected will result in three conflicting type representations that silently return wrong filter results. Prevention: run migration (`ALTER COLUMN water_access TYPE text` + CHECK constraint) before any Phase 2 code is written. This is a hard blocker for the trail pipeline.

4. **Supabase Edge Function timeout on slow Overpass response** — Overpass can take 15-90s for large hiking relation queries; the Edge Function has a 150s wall-clock limit (free tier). Prevention: set `[timeout:45]` in QL, use AbortController with 20s timeout per attempt, implement at most 2 retry attempts, return cached (possibly stale) data immediately when available.

5. **Service worker caching Mapbox tiles as opaque responses** — Current Workbox config is missing `cacheableResponse: { statuses: [0, 200] }` and `purgeOnQuotaError: true`; opaque responses inflate Chrome's quota accounting to ~7 MB per tile entry, exhausting PWA storage in a single map session. Prevention: fix the config before Phase 1 ships to prevent storage pollution from day one.

---

## Implications for Roadmap

Based on combined research, the natural phase structure is determined by hard dependencies: the map must exist before anything renders on it, data must exist before display, and auth must gate the app before real users are invited.

### Phase 0: Scaffolding Fixes (pre-feature cleanup)

**Rationale:** Six known issues in the current scaffolding will cause production failures if not addressed before feature work begins. These are not features — they are correctness prerequisites.
**Delivers:** Clean foundation — correct attribution, working service worker config, `water_access` migration, removed ToS violation, `dist/` cleaned from git.
**Addresses:** Pitfalls 2, 4, 6 (schema mismatch) partially; ToS compliance.
**Key tasks:** Fix `vite.config.ts` Workbox issues, remove attribution CSS, add `mapbox-gl/dist/mapbox-gl.css` import, run `water_access` migration, `git rm -r --cached dist/`.

### Phase 1: Map Core

**Rationale:** Every other feature either renders on the map or depends on viewport bounds. The map lifecycle (init, cleanup, event wiring) must be stable and correct before any other component touches it. WebGL context leaks are essentially impossible to retrofit once components are built on top of a broken pattern.
**Delivers:** Stable `useMapInstance` hook, `MapView` container, `useMapBounds` reliably populating `useViewportStore.bounds`, geolocation with `MapControls`, `ErrorBoundary` around the map.
**Addresses:** Table-stakes features: interactive map centered on user location.
**Avoids:** Pitfall 2 (WebGL context leak — correct pattern from day one), Pitfall 7 (ErrorBoundary before any map code ships), Pitfall 8 (debounce wiring established here).
**Research flag:** Standard pattern; no additional research needed. The `useMapInstance` implementation is fully specified in ARCHITECTURE.md and STACK.md.

### Phase 2: Trail Data Pipeline

**Rationale:** No trail UI is meaningful without data. The Edge Function and `useTrails` hook define the data contract (`Route[]`) that all display components depend on. Building these independently of the UI allows the data shape and caching behavior to be tested in isolation.
**Delivers:** `search-trails` Edge Function (Overpass fetch + normalization + bbox cache), `useTrails` hook with 400ms debounce, GeoJSON layer on map, `water_access` type fully resolved.
**Uses:** Supabase Edge Functions (Deno), Overpass API, Supabase `routes` and `search_areas` tables.
**Implements:** Caching proxy architecture, exponential backoff retry pattern, `osmc:symbol` parsing for PTTK colors.
**Blocker:** `water_access` schema migration must be in place (Phase 0).
**Avoids:** Pitfall 1 (Overpass rate limiting — debounce + timeout + backoff), Pitfall 3 (Edge Function timeout budget), Pitfall 9 (PTTK color normalization).
**Research flag:** The Overpass query pattern and Edge Function structure are specified in STACK.md and ARCHITECTURE.md. The CORS and JWT patterns are fully documented. No additional research phase needed, but the timeout budget (20s Overpass + 3 retries + backoff = ~65s max) should be validated in staging against real Overpass load.

### Phase 3: Trail Display and Browsing

**Rationale:** Depends on Phase 1 (map canvas) and Phase 2 (data). Once `useTrails` returns `Route[]`, the display layer is straightforward React component work.
**Delivers:** PTTK color-coded polylines on map, `TrailCard` (distance/difficulty/surface/water chips), `TrailList`, `TrailDetail`, map/list toggle.
**Addresses:** Must-have features: trail polylines, trail cards, map/list toggle. Core differentiators: PTTK colors, water access and surface display.
**Avoids:** Anti-pattern of adding map sources/layers before style load (use `map.on('load', ...)`).
**Research flag:** Standard React component work with well-documented Mapbox GeoJSON layer patterns. No research phase needed.

### Phase 4: Filters

**Rationale:** Filters require a working trail list to be meaningful. The `useFiltersStore` is already scaffolded. This phase wires it to the display and defines the client-side vs. server-side filter decision.
**Delivers:** `FilterPanel` bottom sheet (6 filters, sticky Apply, active-filter count badge), filter chip bar, client-side filter application for same-bounds interactions, active filter count badge on trigger.
**Implements:** The architectural decision to apply filters client-side when bounds are unchanged (avoiding unnecessary Edge Function calls against the 500k/month Supabase free tier limit).
**Research flag:** Standard bottom-sheet UX pattern; well-documented. No research phase needed.

### Phase 5: Auth and Onboarding

**Rationale:** Auth can be developed in parallel with Phases 1-4, but must gate the entire app before real users are invited. Placed here as a phase because it depends on having a working app to test the full onboarding-to-map flow. The invite-only model has non-trivial edge cases (email scanners, PKCE browser mismatch) that require explicit handling.
**Delivers:** `InviteGate`, `MagicLinkHandler`, `OnboardingFlow` (3 steps: dog name → geolocation → map), auth guard on all routes, dog name personalization in empty states, error recovery UI for invalid/expired links.
**Addresses:** Differentiators: invite-only access, dog-name personalization, onboarding flow.
**Avoids:** Pitfall 5 (magic link edge cases — OTP code fallback, error recovery screen, 7-day invite token TTL).
**Research flag:** Supabase PKCE magic link patterns are well-documented. The scanner pre-fetch issue is a known problem with a known solution (OTP code fallback). No additional research needed, but the 7-day invite token TTL configuration must be set explicitly in `invitations.expires_at` — PRD does not specify this.

### Phase 6: Favorites and Activity Log

**Rationale:** Depends on auth (Phase 5) for user identity and trail detail view (Phase 3) for the UI surface. Pure Supabase CRUD — no new architectural complexity. Optimistic updates with rollback are the key UX pattern.
**Delivers:** `FavoritesList`, heart toggle on `TrailCard` with optimistic update, private notes on `TrailDetail`, `useActivityLog`, "Przeszedlem!" button on `TrailDetail`.
**Addresses:** Retention features: favorites with private notes, activity log.
**Research flag:** Standard Supabase CRUD with optimistic UI. No research phase needed.

### Phase 7: PWA Hardening and Offline

**Rationale:** Offline scenarios require a working app to validate. The service worker config exists but has known issues. This phase fixes and extends it, adds the offline banner, and hardens the iOS icon issue.
**Delivers:** Fixed Workbox tile cache (opaque response support, correct cache name, safe entry limit), trail data `NetworkFirst` cache (last 10 trails), offline banner UI, PNG icons for iOS `apple-touch-icon`, geocoding disabled in offline state.
**Avoids:** Pitfall 4 (opaque tile responses — fixed config), Pitfall 10 (iOS SVG icons — generate PNGs).
**Research flag:** The specific Workbox configuration is fully specified in STACK.md and ARCHITECTURE.md. No research phase needed. Validate in Chrome DevTools offline mode before shipping.

### Phase Ordering Rationale

- Phases 1 → 2 → 3 are strictly sequenced by hard technical dependencies: map before data, data before display.
- Phase 4 (Filters) is logically after Phase 3 because filters only make sense with a populated trail list.
- Phase 5 (Auth) could start in parallel with Phase 1-2 work, but must complete before any real users touch the app.
- Phase 6 (Favorites) requires both auth identity (Phase 5) and trail detail UI (Phase 3).
- Phase 7 (PWA) is last because offline testing requires a complete working app. However, the Workbox config bugs from Phase 0 must be fixed immediately to prevent cache storage pollution from day one.
- Phase 0 is not a feature phase — it is a correctness prerequisite that must complete before any code is written.

### Research Flags

Phases that need deeper research during planning:
- **Phase 2 (Trail Pipeline):** The Overpass QL query for PTTK hiking relations in Poland should be validated against live Overpass data for the target regions (Tatry, Bieszczady, Beskidy) before the Edge Function is considered complete. The specific network tags (`lwn|rwn|nwn`) and `osmc:symbol` values present in OSM Poland data should be sampled to ensure the normalization layer handles them correctly.

Phases with standard patterns (research phase can be skipped):
- **Phase 1 (Map Core):** Implementation pattern is fully specified across STACK.md and ARCHITECTURE.md.
- **Phase 3 (Trail Display):** Standard React + Mapbox GeoJSON layer patterns.
- **Phase 4 (Filters):** Standard bottom-sheet UX with documented Zustand integration.
- **Phase 5 (Auth):** Supabase magic link patterns are well-documented; pitfalls are catalogued with mitigations.
- **Phase 6 (Favorites):** Standard Supabase CRUD.
- **Phase 7 (PWA):** Specific Workbox configuration is fully specified.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Brownfield — versions verified against npm; specific v3 Mapbox behaviors, Tailwind 4 patterns, and Supabase limits confirmed against official docs and GitHub issues |
| Features | MEDIUM-HIGH | Table stakes and anti-features are HIGH (verified against AllTrails, Komoot, Mapy.cz); differentiator value propositions are MEDIUM (based on competitor gap analysis + PRD alignment, not user testing) |
| Architecture | HIGH | Codebase-validated; patterns confirmed against official documentation for all major components; data flow diagrams match actual scaffolded store/hook structure |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (1, 2, 3, 4, 5) verified against official docs and GitHub issues; moderate pitfalls (6, 7, 8) confirmed from codebase audit and official docs; minor pitfalls (9, 10, 11) are well-known issues with documented mitigations |

**Overall confidence:** HIGH

### Gaps to Address

- **Overpass query validation for Polish OSM data:** The Overpass QL query pattern is documented but has not been tested against live data for the specific Polish regions in scope. The `osmc:symbol` tag distribution and PTTK relation coverage in OSM Poland should be sampled before the Edge Function normalization layer is finalized. Address during Phase 2.

- **Invite token TTL:** The PRD does not specify the expiry duration for invite tokens in the `invitations` table. Research recommends 7 days minimum (vs. the 1-hour default for magic links). This must be an explicit decision documented before Phase 5 implements the `InviteGate`.

- **Supabase free tier invocation budget:** The 500,000 Edge Function invocations/month free tier limit has not been modeled against expected usage (5-10 users, estimated map sessions per day). With correct debouncing and bbox caching, this should not be an issue, but it should be validated during Phase 2 testing before inviting real users.

- **Vite 7 + Mapbox worker bundling:** The Vite 7 behavior with Mapbox's Web Workers is confirmed working for Vite 5/6 patterns but Vite 7 behavior is extrapolated. This should be verified with a working map instance in Phase 1 before building on top of it.

---

## Sources

### Primary (HIGH confidence)
- [Supabase Edge Functions Limits](https://supabase.com/docs/guides/functions/limits) — timeout budgets, free tier constraints
- [Supabase Edge Functions CORS](https://supabase.com/docs/guides/functions/cors) — manual CORS handling requirement
- [Supabase Auth magic link / PKCE](https://supabase.com/docs/guides/auth/auth-email-passwordless) — invite-only auth patterns
- [Mapbox GL JS Migrate to v3](https://docs.mapbox.com/mapbox-gl-js/guides/migrate-to-v3/) — type changes, CSS requirement
- [Chrome Workbox caching strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview) — NetworkFirst, CacheFirst patterns
- [workbox-cacheable-response module](https://developer.chrome.com/docs/workbox/modules/workbox-cacheable-response) — opaque response fix
- [Understanding storage quota](https://developer.chrome.com/docs/workbox/understanding-storage-quota) — 7KB = 7MB opaque response inflation
- [Tailwind CSS v4 Theme variables](https://tailwindcss.com/docs/theme) — @theme CSS-first configuration
- [React 19 StrictMode](https://react.dev/reference/react/StrictMode) — double-mount behavior
- [Zustand v5 changelog](https://www.npmjs.com/package/zustand) — React 19 / useSyncExternalStore safety
- [Overpass API Commons documentation](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html) — rate limiting behavior
- [React StrictMode + useRef cleanup issue #26315](https://github.com/facebook/react/issues/26315) — double-mount guard pattern

### Secondary (MEDIUM confidence)
- [Mapbox GL JS Issue #9126, #4862](https://github.com/mapbox/mapbox-gl-js/issues/9126) — WebGL context leak
- [Mapbox GL JS Issue #8967](https://github.com/mapbox/mapbox-gl-js/issues/8967) — internal tile cache name conflict
- [Supabase magic link scanner issue #1214](https://github.com/supabase/auth/issues/1214) — email pre-fetch invalidation
- [Supabase Edge Function discussion #40074](https://github.com/orgs/supabase/discussions/40074) — wall-clock limit behavior
- [Tailwind CSS v4 discussion #18471](https://github.com/tailwindlabs/tailwindcss/discussions/18471) — @theme vs :root distinction
- [vite-plugin-pwa generateSW docs](https://vite-pwa-org.netlify.app/workbox/generate-sw) — Workbox config patterns
- AllTrails, Komoot, Mapy.cz feature analysis — table stakes and differentiator validation

### Tertiary (LOW confidence / extrapolated)
- Vite 7 + Mapbox worker bundling behavior — extrapolated from Vite 5/6 confirmed patterns; validate in Phase 1

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
