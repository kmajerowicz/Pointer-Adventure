---
phase: 00-scaffolding-fixes
plan: 02
subsystem: infra
tags: [mapbox, workbox, pwa, vite, css, prd]

# Dependency graph
requires: []
provides:
  - ToS-compliant CSS (no attribution override)
  - Corrected Workbox tile cache config with opaque response caching and quota protection
  - PRD schema accuracy (moderate difficulty, geometry column)
  - Confirmed dist/ not tracked in git
affects: [phase-01-map, phase-06-pwa]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Workbox runtimeCaching opaque responses: cacheableResponse statuses [0,200] required for CDN tiles"
    - "Workbox ExpirationPlugin: purgeOnQuotaError belongs inside expiration options, not top-level options"
    - "Mapbox attribution: never override via CSS — use compact:true AttributionControl in Phase 1"

key-files:
  created: []
  modified:
    - src/index.css
    - vite.config.ts
    - docs/PRD.md

key-decisions:
  - "purgeOnQuotaError placed inside expiration object (ExpirationPluginOptions), not top-level options — required by Workbox type API"
  - "No replacement CSS added for attribution — compact:true AttributionControl deferred to Phase 1 MapView component"

patterns-established:
  - "Workbox opaque tile caching: cacheableResponse: { statuses: [0, 200] } + purgeOnQuotaError: true inside expiration"

requirements-completed: [FOUN-03, FOUN-04, FOUN-05, FOUN-06]

# Metrics
duration: 3min
completed: 2026-03-13
---

# Phase 0 Plan 02: Scaffolding Fixes — CSS, Workbox, PRD Corrections Summary

**Removed ToS-violating Mapbox attribution CSS override, fixed Workbox tile cache for opaque responses with quota protection, and corrected PRD schema column names to match actual migration**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-13T11:23:19Z
- **Completed:** 2026-03-13T11:25:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Deleted `.mapboxgl-ctrl-attrib { display: none !important }` from `src/index.css` — restores Mapbox ToS compliance
- Fixed Workbox `runtimeCaching` in `vite.config.ts`: renamed cache to `psi-szlak-mapbox-tiles`, added `cacheableResponse: { statuses: [0, 200] }` for opaque tile responses, added `purgeOnQuotaError: true` inside `expiration`
- Corrected `docs/PRD.md`: `"medium"` → `"moderate"` in difficulty enum (3 occurrences), `"geojson"` → `"geometry"` in SQL schema block
- Verified `dist/` has 0 tracked files in git (`.gitignore` already contains `dist` entry)
- Confirmed `npm run build` succeeds after all changes

## Task Commits

1. **Task 1: Remove Mapbox CSS override and fix Workbox config** - `ba74e09` (fix)
2. **Task 1 deviation fix: purgeOnQuotaError placement** - `a6b260e` (fix)
3. **Task 2: Verify dist/ git state and fix PRD column names** - `7324531` (fix)

## Files Created/Modified
- `src/index.css` - Removed Mapbox attribution CSS override (4 lines deleted)
- `vite.config.ts` - Updated runtimeCaching: new cache name, cacheableResponse, purgeOnQuotaError
- `docs/PRD.md` - Fixed difficulty enum values and column name (medium→moderate x3, geojson→geometry x1)

## Decisions Made
- `purgeOnQuotaError` moved inside `expiration` object to match `ExpirationPluginOptions` API — top-level placement caused TypeScript error
- No replacement CSS added for attribution control — `compact: true` AttributionControl option deferred to Phase 1 when MapView is built

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Moved purgeOnQuotaError into expiration block**
- **Found during:** Task 1 (Workbox config fix) — build verification step
- **Issue:** Plan specified `purgeOnQuotaError: true` at top-level `options` object, but it belongs to `ExpirationPluginOptions` (inside `expiration`). Top-level placement caused TypeScript type error: "Object literal may only specify known properties, and 'purgeOnQuotaError' does not exist in type"
- **Fix:** Moved `purgeOnQuotaError: true` inside `expiration: { maxEntries: 500, maxAgeSeconds: ..., purgeOnQuotaError: true }`
- **Files modified:** `vite.config.ts`
- **Verification:** `npm run build` succeeds without TypeScript errors
- **Committed in:** `a6b260e`

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix necessary for correctness — purgeOnQuotaError only takes effect when in ExpirationPlugin options. No scope creep.

## Issues Encountered
None — all planned changes applied cleanly. The purgeOnQuotaError placement was a plan inaccuracy auto-corrected.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CSS is clean — MapView can add `compact: true` AttributionControl without conflicting overrides
- Workbox tile cache correctly configured — Phase 6 PWA work builds on a solid foundation
- PRD schema block matches actual migration (`difficulty: moderate`, `geometry` column) — Edge Function development in Phase 2 can rely on PRD as accurate spec

---
*Phase: 00-scaffolding-fixes*
*Completed: 2026-03-13*
