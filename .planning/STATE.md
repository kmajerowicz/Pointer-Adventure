---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 08-01-PLAN.md
last_updated: "2026-03-14T11:02:46.000Z"
last_activity: 2026-03-13 — Plan 01-01 complete (map core, geolocation, error boundary)
progress:
  total_phases: 9
  completed_phases: 9
  total_plans: 21
  completed_plans: 21
  percent: 75
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** Dog owners can instantly discover nearby trails with water access and natural surfaces — open map → see dog-friendly trails near me
**Current focus:** Phase 1 — Map Core

## Current Position

Phase: 1 of 8 (Map Core)
Plan: 1 of 1 completed in current phase
Status: Plan 01-01 complete — Phase 1 Map Core done
Last activity: 2026-03-13 — Plan 01-01 complete (map core, geolocation, error boundary)

Progress: [████████░░] 75%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 2m
- Total execution time: 2m

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 0 — Scaffolding Fixes | 1 | 2m | 2m |
| 1 — Map Core | 1 | 3m | 3m |

**Recent Trend:**
- Last 5 plans: 2m
- Trend: —

*Updated after each plan completion*
| Phase 00-scaffolding-fixes P02 | 3 | 2 tasks | 3 files |
| Phase 01-map-core P02 | 4m | 2 tasks | 6 files |
| Phase 01-map-core P03 | 1m | 1 tasks | 1 files |
| Phase 02-trail-data-pipeline P01 | 7 | 2 tasks | 6 files |
| Phase 02-trail-data-pipeline P02 | 5 | 2 tasks | 10 files |
| Phase 03-trail-display-and-browsing P01 | 4 | 2 tasks | 8 files |
| Phase 03-trail-display-and-browsing P02 | 3 | 2 tasks | 6 files |
| Phase 04-filters P01 | 1 | 1 tasks | 4 files |
| Phase 04-filters P02 | 15 | 3 tasks | 6 files |
| Phase 05-auth-and-onboarding P01 | 3 | 3 tasks | 14 files |
| Phase 05-auth-and-onboarding P02 | 4 | 2 tasks | 11 files |
| Phase 05-auth-and-onboarding P03 | 6 | 2 tasks | 10 files |
| Phase 06-favorites-and-activity P01 | 7 | 2 tasks | 16 files |
| Phase 06-favorites-and-activity P03 | 4 | 2 tasks | 8 files |
| Phase 06-favorites-and-activity P02 | 4 | 2 tasks | 9 files |
| Phase 07-pwa-hardening P02 | 2 | 2 tasks | 6 files |
| Phase 07-pwa-hardening P01 | 2 | 2 tasks | 6 files |
| Phase 07-pwa-hardening P03 | 2m | 2 tasks | 5 files |
| Phase 08-polish-and-gap-closure P01 | 3m | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 0 Plan 01]: `water_access` changed from `boolean | null` to `'none' | 'nearby' | 'on_route'` text enum — migration uses DROP+ADD (no production data)
- [Phase 0 Plan 01]: Migration uses `ADD COLUMN IF NOT EXISTS` for `source`, `water_type`, `used_at` — safe idempotent additions
- [Phase 0 Plan 01]: `WaterAccess` and `WaterType` exported as type aliases for downstream trail pipeline use
- [Phase 0]: `water_access` must be text enum (`none`/`nearby`/`on_route`) before any trail pipeline code — hard blocker
- [Phase 0]: Mapbox CSS override for attribution is a ToS violation — must be replaced with `compact: true` AttributionControl option
- [Phase 0]: Workbox cache name `mapbox-tiles` conflicts with Mapbox GL internal 50 MB tile cache — rename to `psi-szlak-mapbox-tiles`
- [Phase 1]: Map instance must live in `useRef`, never `useState`; `map.remove()` called exactly once in cleanup — WebGL context leak is impossible to retrofit
- [Phase 2]: Overpass debounce 400ms + `[timeout:25]` in QL + AbortController 20s + max 2 retries — must be wired from day one
- [Phase 5]: Invite token TTL is 30 days (`invitations.expires_at`); magic link email scanners pre-fetch links — OTP code fallback required
- [Phase 00-scaffolding-fixes]: purgeOnQuotaError placed inside expiration object (ExpirationPluginOptions), not top-level options — required by Workbox type API
- [Phase 00-scaffolding-fixes]: No replacement CSS added for attribution — compact:true AttributionControl deferred to Phase 1 MapView component
- [Phase 1 Plan 01]: useRef lifecycle pattern for Mapbox map instance — map.remove() called exactly once in cleanup, Strict Mode double-init guard in useEffect
- [Phase 1 Plan 01]: mapboxgl.supported() checked at render time and thrown to MapErrorBoundary — same boundary handles WebGL-unsupported and runtime map errors
- [Phase 1 Plan 01]: MapControls imports Mapbox types as named import (not namespace) to avoid TypeScript unused-import error
- [Phase 1 Plan 01]: vitest.config.ts updated to jsdom environment — required for @testing-library/react renderHook
- [Phase 01-map-core]: flyTo zoom 14 for search results (neighborhood level); onMouseDown on suggestions to prevent blur before click; searchHighlighted lifted to MapView for sibling prop communication
- [Phase 01-map-core]: map.once('dragstart', removeMarker) attached inside handleSelect after marker placement — listener always fires because map is guaranteed non-null at that point
- [Phase 01-map-core]: Defensive map.off in handleClear and unmount cleanup — prevents stale once-listener firing after manual clear or component unmount
- [Phase 02-01]: Overpass QL uses unquoted filter [dogs\!=no] not quoted form — test spec expected unquoted and both are valid Overpass QL
- [Phase 02-01]: vi.stubGlobal('fetch') instead of global.fetch assignment — avoids TypeScript Cannot find name 'global' in browser lib
- [Phase 02-01]: Normalization functions inlined in Edge Function — Deno cannot resolve Vite aliases or src/ paths; extractable module exists for testability
- [Phase 02-01]: water_access defaults to 'none' for v1 — around:200 water source subquery deferred
- [Phase 02-02]: setRetry stores plain function reference, not thunk — Zustand would invoke () => fn at set time and store the return value
- [Phase 02-02]: Trail layer init uses map.on('style.load') — ensures sources/layers added after style is fully loaded
- [Phase 02-02]: Workbox maximumFileSizeToCacheInBytes raised to 4 MiB — Mapbox GL JS bundle exceeds 2 MiB default
- [Phase 03-trail-display-and-browsing]: Explicit class map for PTTK border colors — dynamic string interpolation purged by Tailwind v4
- [Phase 03-trail-display-and-browsing]: trail_color black uses border-l-[#808080] — #1A1A1A is invisible on dark bg-bg-surface
- [Phase 03-trail-display-and-browsing]: Warsaw-Wroclaw haversine result is ~301km straight-line, not ~292km — test range corrected to 295-310
- [Phase 03-trail-display-and-browsing]: navigateRef pattern in MapView: navigate stored in ref so style.load closure accesses latest stable function
- [Phase 03-trail-display-and-browsing]: setupTrailInteractions onTrailClick is optional with popup fallback for backward compatibility
- [Phase 03-trail-display-and-browsing]: /trails/:id added as top-level standalone route (not inside AppLayout) — no tab bar on detail page
- [Phase 04-filters]: null length_km routes always pass the length filter — unknown lengths included in all buckets
- [Phase 04-filters]: Water preferred sort uses spread-before-sort [...result].sort() to prevent Zustand store array mutation
- [Phase 04-filters]: Distance filter silently skipped when geolocation status is not success — null lat/lon guard in useFilteredRoutes
- [Phase 04-filters]: Draft state kept in FilterPanel local useState — not Zustand; committed only on Zastosuj, discarded on backdrop close
- [Phase 04-filters]: ActiveFilterChips positioned absolute inside map container (top-[4.25rem]) not fixed — avoids z-index conflicts with tab bar
- [Phase 04-filters]: Sheet exit animation uses isClosing flag + 200ms delay before DOM removal — smooth UX without CSS Animations API
- [Phase 05-auth-and-onboarding]: import type for supabase-js types required by verbatimModuleSyntax — use import type for all supabase type aliases
- [Phase 05-auth-and-onboarding]: Auth init logic (getSession, onAuthStateChange) excluded from store — belongs in App.tsx; store is pure state+setters
- [Phase 05-auth-and-onboarding]: Wave 0 test stubs use it.todo() not it.skip() — todos are skipped never fail
- [Phase 05-auth-and-onboarding]: AuthPage always shows email login form — Dostep tylko przez zaproszenie is subtitle text not a blocking gate for returning users
- [Phase 05-auth-and-onboarding]: Pending invite token stored in sessionStorage after OTP verification so App.tsx can consume it after onAuthStateChange fires
- [Phase 05-auth-and-onboarding]: Protected tabs render as button elements (not NavLinks) for clean auth interception without preventDefault hacks
- [Phase 05-auth-and-onboarding]: AuthLayout wraps all routes as parent route element so useAuthInit runs inside Router context with useNavigate access
- [Phase 05-auth-and-onboarding]: hasRedirected ref in useAuthInit prevents SIGNED_IN from re-redirecting after onboarding completion; DogStep optimistic profile update breaks redirect loop
- [Phase 05-auth-and-onboarding]: consumeInviteToken is async helper (not .catch() chaining) because Supabase rpc() returns PromiseLike without .catch() method
- [Phase 06-favorites-and-activity]: showToast added to useUIStore — hooks call store action directly, App renders toast widget from store state
- [Phase 06-favorites-and-activity]: ActivityHistoryEntry = ActivityLogEntry & route join intersection type — avoids duplication while keeping ActivityLogEntry clean
- [Phase 06-favorites-and-activity]: useFavorites.toggleFavorite optimistic pattern: mutate store immediately (new Set spread), rollback on catch
- [Phase 06-favorites-and-activity]: Avatar uses letter initial circle (accent/20 bg) instead of icon — cleaner for user profile context
- [Phase 06-favorites-and-activity]: vitest globals:true added so @testing-library/jest-dom can extend global expect without explicit imports per test file
- [Phase 06-favorites-and-activity]: InviteGenerator copy: navigator.share first (mobile PWA UX), clipboard fallback for desktop
- [Phase 06-02]: TrailCard changed from button wrapper to div+role=button — HTML forbids button-inside-button; heart action remains proper button with stopPropagation
- [Phase 06-02]: FavoritesList manages its own FilterPanel state via local useState — avoids coupling to global UIStore.isFilterOpen shared with MapView
- [Phase 07-pwa-hardening]: OfflineBanner mounted in AuthLayout (wraps all routes) not AppLayout — ensures TrailDetail and standalone routes also show the banner
- [Phase 07-pwa-hardening]: AppLayout adds pt-9 top padding when offline — prevents content overlap with fixed banner without re-mounting banner in AppLayout
- [Phase 07-pwa-hardening]: LocationSearch outer div uses opacity-50 pointer-events-none for disabled state — clean visual gray-out for offline mode
- [Phase 07-pwa-hardening]: Mapbox CacheFirst maxEntries reduced from 500 to 50 — opaque responses attribute full quota, 500 entries risks 3.5GB attribution causing QuotaExceededError
- [Phase 07-pwa-hardening]: Supabase NetworkFirst with 3s networkTimeoutSeconds — fresh data preferred but falls back to cache for offline/slow network users
- [Phase 07-pwa-hardening]: PNG icons generated via Node.js built-in zlib (raw PNG binary) — avoids adding canvas/sharp dev dependency for one-time icon generation
- [Phase 07-pwa-hardening]: BeforeInstallPromptEvent declared in vite-env.d.ts alongside ImportMetaEnv — single file for all global type augmentations
- [Phase 07-pwa-hardening]: trailViewCount in UIStore resets on reload intentionally — avoids surfacing install prompt on cold start to first-time visitors
- [Phase 07-pwa-hardening]: InstallPrompt positioned via CSS bottom: var(--spacing-tab-bar) to stay in sync with tab bar height token
- [Phase 08-01]: ToastRenderer placed in AuthLayout (not AppLayout) so toast visible on standalone routes like TrailDetail
- [Phase 08-01]: Added --animate-fade-in and --animate-slide-up tokens to index.css @theme — required by Tailwind v4 animate- classes

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2 research flag: Overpass QL query for PTTK hiking relations in Poland (`lwn|rwn|nwn` + `osmc:symbol`) should be validated against live Overpass data for Tatry/Bieszczady/Beskidy before normalizing Edge Function output is finalized
- Phase 1: Vite 7 + Mapbox Web Worker bundling behavior is extrapolated from Vite 5/6 — validate with a working map instance before building on top of it

## Session Continuity

Last session: 2026-03-14T11:02:45.996Z
Stopped at: Completed 08-01-PLAN.md
Resume file: None
