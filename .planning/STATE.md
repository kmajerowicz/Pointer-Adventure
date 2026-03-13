# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** Dog owners can instantly discover nearby trails with water access and natural surfaces — open map → see dog-friendly trails near me
**Current focus:** Phase 0 — Scaffolding Fixes

## Current Position

Phase: 0 of 8 (Scaffolding Fixes)
Plan: 0 of 1 in current phase
Status: Ready to plan
Last activity: 2026-03-11 — Roadmap created; Phase 0 is next

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 0]: `water_access` must be text enum (`none`/`nearby`/`on_route`) before any trail pipeline code — hard blocker
- [Phase 0]: Mapbox CSS override for attribution is a ToS violation — must be replaced with `compact: true` AttributionControl option
- [Phase 0]: Workbox cache name `mapbox-tiles` conflicts with Mapbox GL internal 50 MB tile cache — rename to `psi-szlak-mapbox-tiles`
- [Phase 1]: Map instance must live in `useRef`, never `useState`; `map.remove()` called exactly once in cleanup — WebGL context leak is impossible to retrofit
- [Phase 2]: Overpass debounce 400ms + `[timeout:25]` in QL + AbortController 20s + max 2 retries — must be wired from day one
- [Phase 5]: Invite token TTL is 30 days (`invitations.expires_at`); magic link email scanners pre-fetch links — OTP code fallback required

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2 research flag: Overpass QL query for PTTK hiking relations in Poland (`lwn|rwn|nwn` + `osmc:symbol`) should be validated against live Overpass data for Tatry/Bieszczady/Beskidy before normalizing Edge Function output is finalized
- Phase 1: Vite 7 + Mapbox Web Worker bundling behavior is extrapolated from Vite 5/6 — validate with a working map instance before building on top of it

## Session Continuity

Last session: 2026-03-11
Stopped at: Roadmap and STATE.md created; REQUIREMENTS.md traceability updated
Resume file: None
