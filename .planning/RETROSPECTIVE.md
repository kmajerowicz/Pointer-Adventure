# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-14
**Phases:** 9 | **Plans:** 21 | **Sessions:** ~10

### What Was Built
- Full-featured trail discovery PWA with Mapbox map, Overpass trail pipeline, and PTTK polylines
- 6-category filter system with bottom sheet, client-side filtering, and chip bar
- Invite-only auth with magic link OTP, 4-step onboarding with dog-name personalization
- Favorites with optimistic UI, private notes, activity logging with toast feedback
- PWA hardening: offline banner, NetworkFirst trail cache, PNG icons, install prompt (Android + iOS)
- 100 source files, ~8,300 LOC TypeScript/React

### What Worked
- **Wave-based parallel execution** — Plans 07-01 and 07-02 ran in parallel with zero conflicts, halving wave time
- **Phase-level context isolation** — Each executor agent got fresh 200k context, never hit limits despite large codebase
- **discuss-phase → research → plan → verify loop** — Caught 2 plan metadata issues (07-02 key_links, 07-03 missing file) before execution
- **Integration checker at audit** — Found the toast renderer gap that manual phase verification missed (cross-phase wiring issue)
- **Gap closure cycle** — Phase 8 cleanly resolved the one audit gap in a single plan

### What Was Inefficient
- **Phase 5 stale verification** — ONBR-04 (FilterTooltip) was flagged as failed but was actually resolved by the time Phase 6 ran. The verification wasn't re-run after the fix landed, causing a stale `gaps_found` status that persisted into the milestone audit
- **Toast renderer deferred too long** — 06-01 SUMMARY noted "App.tsx needs to render toast widget" as deferred, but no plan picked it up in Phase 6. Required a gap closure phase
- **DS-01 through DS-06 traceability** — Cross-cutting "All phases" requirements never got checked off during phase execution because no individual phase owned them

### Patterns Established
- **OfflineBanner in AuthLayout** (not AppLayout) — covers all routes including standalone pages
- **Zustand store + useEffect auto-dismiss** — pattern for transient UI (toast, tooltip)
- **Workbox runtime cache per API** — separate named caches for Mapbox tiles and Supabase API
- **beforeinstallprompt + iOS UA detection** — dual-path install prompt pattern
- **useRef lifecycle for Mapbox** — map.remove() exactly once, Strict Mode double-init guard

### Key Lessons
1. **Cross-phase wiring issues are invisible to phase-level verification** — The toast renderer gap was only caught by the integration checker at milestone audit. Phase verifiers check within their scope but can't see broken chains across phases.
2. **"Deferred" items in SUMMARY.md need explicit tracking** — When a plan defers work, it should create a todo or flag for the next phase. Otherwise deferred items get lost.
3. **Cross-cutting requirements need an owner** — DS-01 through DS-06 were assigned to "All" but no phase verified them. Future milestones should assign cross-cutting requirements to the final phase or a dedicated polish phase.

### Cost Observations
- Model mix: ~20% opus (orchestration), ~80% sonnet (research, planning, execution, verification)
- Sessions: ~10 across 2 days
- Notable: Parallel wave execution and fresh agent context kept total token usage efficient despite 21 plans

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~10 | 9 | First milestone — established discuss → research → plan → verify → execute pipeline |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | ~15 unit tests | Partial (unit + manual) | 0 new deps (all in scaffold) |

### Top Lessons (Verified Across Milestones)

1. Cross-phase integration checking at milestone level catches gaps that phase-level verification misses
2. Deferred work items need explicit tracking mechanisms to avoid being dropped
