---
phase: 0
slug: scaffolding-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 0 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | `vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 00-01-01 | 01 | 1 | FOUN-01 | unit | `npx vitest run src/lib/types.test.ts -t "water_access"` | ❌ W0 | ⬜ pending |
| 00-01-02 | 01 | 1 | FOUN-02 | unit | `npx vitest run src/lib/types.test.ts -t "Route fields"` | ❌ W0 | ⬜ pending |
| 00-01-03 | 01 | 1 | FOUN-03 | manual/grep | `grep -r "mapboxgl-ctrl-attrib" src/` returns empty | N/A | ⬜ pending |
| 00-01-04 | 01 | 1 | FOUN-04 | unit | `npx vitest run vite.config.test.ts` | ❌ W0 | ⬜ pending |
| 00-01-05 | 01 | 1 | FOUN-05 | manual | `git ls-files dist/` returns empty | N/A | ⬜ pending |
| 00-01-06 | 01 | 1 | FOUN-06 | manual/grep | `grep "medium\|geojson" docs/PRD.md` returns empty | N/A | ⬜ pending |
| 00-01-07 | 01 | 1 | FOUN-07 | unit | `npx vitest run src/lib/types.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/types.test.ts` — stubs for FOUN-01, FOUN-02, FOUN-07 (TypeScript type shape assertions)
- [ ] `vitest.config.ts` — minimal config pointing at `src/**/*.test.ts`
- [ ] Framework install: `npm install --save-dev vitest @vitest/coverage-v8`

*FOUN-03, FOUN-05, FOUN-06 do not require test files — verified by grep/git commands in task acceptance criteria.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No `.mapboxgl-ctrl-attrib` CSS override | FOUN-03 | Text search sufficient | `grep -r "mapboxgl-ctrl-attrib" src/` must return empty |
| `dist/` not in git tracking | FOUN-05 | Git state check | `git ls-files dist/` must return empty |
| PRD uses `moderate` and `geometry` | FOUN-06 | Document text check | `grep "medium\|geojson" docs/PRD.md` must return empty |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
