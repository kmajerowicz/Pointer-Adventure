# Psi Szlak

## What This Is

A PWA trail discovery app for dog owners in Poland. Helps find dog-friendly hiking and walking trails — prioritizing natural surfaces, water access, and open spaces. Excludes urban trails and roads. Invite-only access for a small, closed group of friends.

## Core Value

Dog owners can instantly discover nearby trails with water access and natural surfaces — the ONE thing that must work is: open map → see dog-friendly trails near me.

## Requirements

### Validated

- ✓ Project scaffolding (React + Vite + TypeScript + Tailwind CSS 4) — Phase 0
- ✓ Supabase schema (6 tables with RLS) — Phase 0
- ✓ React Router with tabbed layout + bottom tab bar — Phase 0
- ✓ Zustand stores (viewport, filters, ui) — Phase 0
- ✓ PWA manifest + basic service worker — Phase 0
- ✓ Design tokens (dark theme, golden accent, Inter font) — Phase 0
- ✓ Feature folder structure — Phase 0

### Active

- [ ] Interactive map with Mapbox Outdoors + geolocation
- [ ] Location search (Mapbox Geocoding)
- [ ] Trail data pipeline (Edge Function → Overpass API → Supabase cache)
- [ ] PTTK colored trail polylines
- [ ] Trail browsing (map/list toggle, TrailCard, TrailDetail)
- [ ] 6-category filter system (length, surface, water, difficulty, distance, marked)
- [ ] Invite-only auth (magic link, invite tokens)
- [ ] Onboarding flow (name, dog name, geolocation)
- [ ] Favorites with private notes
- [ ] "Przeszłem!" activity logging
- [ ] Profile with invite generation
- [ ] PWA offline support (last 10 trails cached)
- [ ] Error states and empty states per PRD

### Out of Scope

- Route drawing / custom trails — v1.1
- Custom domain psiszlak.pl — v1.1
- Turn-by-turn navigation — v2
- Photos on trails — v2
- Ratings and comments — v2
- Weather integration — v2
- Push notifications — v2
- Native app (React Native) — v2
- Recommendation engine — v2 (activity_log data collected from MVP)
- Walk duration tracking — no capture UI in v1, add with timer feature in v2
- Light theme — dark mode only

## Context

**Existing codebase:** Phase 0 is complete — scaffolding, schema, routing, stores, design tokens, and PWA shell are in place. All feature directories are empty stubs. No feature code, hooks, or tests exist yet.

**Data sources:** Trails sourced automatically from OpenStreetMap/Overpass API (hiking routes, footpaths, nature reserves) and Polish PTTK marked trails (colored waymarks). No manual trail entry.

**Target users:** Owner + small group of friends (5-10 people). All dog owners, primarily with Vizslas. Invite-only access.

**PRD:** Complete in `docs/PRD.md` (Polish language). Implementation plan in `docs/IMPLEMENTATION_PLAN.md`.

**Skills:** 8 agent skills installed in `.agents/skills/` — mapped per phase in CLAUDE.md. Skills cover frontend design, responsive design, Tailwind, React patterns, Supabase, testing, and web design.

**Schema decisions from PRD audit:**
- `water_access` must be text enum (`none/nearby/on_route`), not boolean — current migration needs fix
- `difficulty` uses `moderate` (not PRD's `medium`) — PRD to be updated
- Missing columns to add: `routes.source` (osm/pttk), `routes.water_type` (river/lake/stream), `invitations.used_at`
- Column `geometry` (not `geojson`) — PRD to be updated
- Cache lookup uses exact `bbox_hash` match, not spatial containment
- Mapbox attribution CSS override must be removed (ToS violation)
- Overpass rate limiting handled in Edge Function (debounce + backoff), not in PRD
- `/auth` without invite token shows "invite required" screen

## Constraints

- **Tech stack**: React + Vite + TypeScript + Tailwind CSS 4 + Supabase + Mapbox GL JS — already scaffolded
- **Budget**: $0/month — all services on free tiers (Supabase, Mapbox 50k loads, Vercel, OSM/Overpass)
- **Auth model**: Invite-only, magic link only — no passwords, no OAuth
- **Design**: Dark mode only, mobile-first PWA, Strava-inspired
- **Data**: No manual trail entry — all automated from OSM/Overpass
- **Skills**: MUST read `.agents/skills/*/SKILL.md` before implementing each phase (mapped in CLAUDE.md)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `water_access` as text enum | Filter needs 3 states (none/nearby/on_route), boolean loses data | — Pending migration |
| Keep `moderate` over `medium` | Matches OSM sac_scale terminology, already in schema | — Pending PRD update |
| Skip `duration_min` in v1 | No capture UI, distance matters more than time for dog walks | ✓ Good |
| Exact bbox_hash for cache | Simple, fast, no PostGIS needed. Redundant fetches cheap for small group | — Pending |
| Block `/auth` without invite | Enforces invite-only model, clear UX | — Pending |
| Design decisions per phase | Skills + /gsd:discuss-phase, not upfront specs. Avoids premature design | — Pending |
| Compact Mapbox attribution | Comply with ToS, use `compact: true` option | — Pending |
| Overpass backoff in Edge Function | Implementation detail: debounce frontend, max 1 concurrent, exponential backoff | — Pending |

---
*Last updated: 2026-03-11 after initialization*
