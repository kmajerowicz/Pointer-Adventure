---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 03-trail-display-and-browsing/03-02-PLAN.md
last_updated: "2026-03-13T21:05:06.074Z"
last_activity: 2026-03-13 — Plan 01-01 complete (map core, geolocation, error boundary)
progress:
  total_phases: 8
  completed_phases: 4
  total_plans: 11
  completed_plans: 9
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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2 research flag: Overpass QL query for PTTK hiking relations in Poland (`lwn|rwn|nwn` + `osmc:symbol`) should be validated against live Overpass data for Tatry/Bieszczady/Beskidy before normalizing Edge Function output is finalized
- Phase 1: Vite 7 + Mapbox Web Worker bundling behavior is extrapolated from Vite 5/6 — validate with a working map instance before building on top of it

## Session Continuity

Last session: 2026-03-13T19:20:03.522Z
Stopped at: Completed 03-trail-display-and-browsing/03-02-PLAN.md
Resume file: None
