# Psi Szlak

## What This Is

A PWA trail discovery app for dog owners in Poland. Helps find dog-friendly hiking and walking trails — prioritizing natural surfaces, water access, and open spaces. Excludes urban trails and roads. Invite-only access for a small, closed group of friends. Fully functional as an installable PWA with offline support.

## Core Value

Dog owners can instantly discover nearby trails with water access and natural surfaces — the ONE thing that must work is: open map → see dog-friendly trails near me.

## Requirements

### Validated

- ✓ Project scaffolding (React + Vite + TypeScript + Tailwind CSS 4) — v1.0
- ✓ Supabase schema (6 tables with RLS) — v1.0
- ✓ React Router with tabbed layout + bottom tab bar — v1.0
- ✓ Zustand stores (viewport, filters, ui, auth, favorites, activity) — v1.0
- ✓ PWA manifest + Workbox service worker with offline trail caching — v1.0
- ✓ Design tokens (dark theme, golden accent, Inter font) — v1.0
- ✓ Feature folder structure — v1.0
- ✓ Interactive map with Mapbox Outdoors + geolocation — v1.0
- ✓ Location search (Mapbox Geocoding v6 autocomplete) — v1.0
- ✓ Trail data pipeline (Edge Function → Overpass API → Supabase cache) — v1.0
- ✓ PTTK colored trail polylines on map — v1.0
- ✓ Trail browsing (map/list toggle, TrailCard, TrailDetail with map hero) — v1.0
- ✓ 6-category filter system (length, surface, water, difficulty, distance, marked) — v1.0
- ✓ Invite-only auth (magic link with OTP, invite token validation) — v1.0
- ✓ Onboarding flow (welcome, dog name, preferences, geolocation) — v1.0
- ✓ Favorites with private notes and optimistic UI — v1.0
- ✓ "Przeszedlem!" activity logging with toast confirmation — v1.0
- ✓ Profile with activity history and invite generation — v1.0
- ✓ PWA offline support (last 10 trails cached, offline banner, disabled search) — v1.0
- ✓ Install prompt (Android native + iOS manual instructions) — v1.0
- ✓ PNG icons (192x192 + 512x512) for iOS compatibility — v1.0
- ✓ All UI text in Polish — v1.0
- ✓ Design system tokens used throughout, no hardcoded colors — v1.0
- ✓ Touch targets >= 48px — v1.0
- ✓ Error states and empty states per PRD — v1.0

### Active

(None — v1.0 shipped. Next milestone requirements to be defined.)

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

**Shipped:** v1.0 MVP on 2026-03-14. 9 phases, 21 plans, 43 tasks. ~8,300 LOC across 100 source files.

**Codebase:** Full-featured PWA with map, trail pipeline, browsing, filters, auth, onboarding, favorites, activity logging, profile, and offline support. All feature directories populated. Comprehensive Zustand state management (6 stores). 2 Supabase Edge Functions (search-trails, validate-invite).

**Data sources:** Trails sourced automatically from OpenStreetMap/Overpass API (hiking routes, footpaths, nature reserves) and Polish PTTK marked trails (colored waymarks). No manual trail entry. Water access defaults to 'none' for v1 — around:200 water source subquery deferred.

**Target users:** Owner + small group of friends (5-10 people). All dog owners, primarily with Vizslas. Invite-only access.

**PRD:** Complete in `docs/PRD.md` (Polish language). Implementation plan in `docs/IMPLEMENTATION_PLAN.md`.

**Skills:** 8 agent skills installed in `.agents/skills/` — mapped per phase in CLAUDE.md.

## Constraints

- **Tech stack**: React + Vite + TypeScript + Tailwind CSS 4 + Supabase + Mapbox GL JS
- **Budget**: $0/month — all services on free tiers (Supabase, Mapbox 50k loads, Vercel, OSM/Overpass)
- **Auth model**: Invite-only, magic link only — no passwords, no OAuth
- **Design**: Dark mode only, mobile-first PWA, Strava-inspired
- **Data**: No manual trail entry — all automated from OSM/Overpass
- **Skills**: MUST read `.agents/skills/*/SKILL.md` before implementing each phase (mapped in CLAUDE.md)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `water_access` as text enum | Filter needs 3 states (none/nearby/on_route), boolean loses data | ✓ Good — enum works well with filter pills |
| Keep `moderate` over `medium` | Matches OSM sac_scale terminology, already in schema | ✓ Good |
| Skip `duration_min` in v1 | No capture UI, distance matters more than time for dog walks | ✓ Good |
| Exact bbox_hash for cache | Simple, fast, no PostGIS needed. Redundant fetches cheap for small group | ✓ Good |
| Block `/auth` without invite | Enforces invite-only model, clear UX | ✓ Good — AuthGateSheet pattern works |
| Design decisions per phase | Skills + /gsd:discuss-phase, not upfront specs. Avoids premature design | ✓ Good — each phase got tailored context |
| Compact Mapbox attribution | Comply with ToS, use `compact: true` option | ✓ Good |
| Overpass backoff in Edge Function | Debounce frontend, max 1 concurrent, exponential backoff | ✓ Good |
| Map useRef lifecycle | map.remove() exactly once in cleanup, Strict Mode guard | ✓ Good — no WebGL leaks |
| Mapbox tile cache 50 entries | 500 caused opaque response quota exhaustion (7MB each) | ✓ Good — safe quota |
| NetworkFirst for trail cache | Workbox runtime cache, 10-entry LRU, 3s timeout | ✓ Good — automatic on view |
| OTP code fallback for magic links | Email scanners pre-fetch links, OTP avoids false consumption | ✓ Good |
| OfflineBanner in AuthLayout | Covers all routes including standalone TrailDetail | ✓ Good |
| Install prompt after 3 trail views | Contextual, not aggressive. iOS manual instructions included | ✓ Good |

---
*Last updated: 2026-03-14 after v1.0 milestone*
