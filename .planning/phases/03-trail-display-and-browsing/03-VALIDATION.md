---
phase: 3
slug: trail-display-and-browsing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/features/trails` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/features/trails`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | haversine | unit | `npx vitest run src/lib/haversine.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | BROW-02 | unit | `npx vitest run src/features/trails/TrailCard.test.tsx` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | BROW-01, BROW-04 | unit | `npx vitest run src/features/trails/TrailList.test.tsx` | ❌ W0 | ⬜ pending |
| 3-01-04 | 01 | 1 | BROW-05 | unit | `npx vitest run src/features/trails/TrailCard.test.tsx` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | BROW-03 | unit | `npx vitest run src/features/trails/TrailDetail.test.tsx` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | BROW-03 | manual/smoke | Visual check of map inset + polyline | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/haversine.ts` — haversine distance utility (referenced in CLAUDE.md but does not exist)
- [ ] `src/lib/haversine.test.ts` — unit tests for haversine distance calculation
- [ ] `src/features/trails/TrailCard.test.tsx` — covers BROW-02, BROW-05 (card content, card height)
- [ ] `src/features/trails/TrailList.test.tsx` — covers BROW-01, BROW-04 (list rendering, empty state)
- [ ] `src/features/trails/TrailDetail.test.tsx` — covers BROW-03 data layer (route lookup, not-found)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TrailDetail map inset renders polyline | BROW-03 | Mapbox GL requires real WebGL2 | Open TrailDetail → verify polyline visible on map |
| 2-3 cards visible on 375px screen | BROW-05 | Responsive layout needs real viewport | Chrome DevTools → 375px → verify card count |
| PTTK left border color matches trail_color | BROW-02 | CSS visual verification | Dev server → find PTTK trail → verify colored border |
| Empty state SVG placeholder renders | BROW-04 | Visual check | Navigate to area with no trails → verify empty state |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
