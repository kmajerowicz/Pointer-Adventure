---
phase: 2
slug: trail-data-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` (jsdom environment, `src/**/*.test.ts`) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | PIPE-01 | unit | `npx vitest run src/hooks/useTrails.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | PIPE-02 | unit | `npx vitest run src/hooks/useTrails.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | PIPE-03 | unit | `npx vitest run src/features/map/normalizeTrail.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | PIPE-04 | unit | `npx vitest run src/features/map/normalizeTrail.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | PIPE-05 | manual-only | N/A — requires live Supabase | ❌ — | ⬜ pending |
| 02-01-06 | 01 | 1 | PIPE-06 | unit | `npx vitest run src/lib/fetchOverpass.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | PIPE-07 | unit | `npx vitest run src/hooks/useTrails.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | PIPE-08 | unit | `npx vitest run src/features/map/TrailLayers.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | PIPE-09 | unit | `npx vitest run src/features/map/TrailLayers.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | PIPE-10 | unit | `npx vitest run src/hooks/useTrails.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useTrails.test.ts` — stubs for PIPE-01, PIPE-02, PIPE-07, PIPE-10
- [ ] `src/features/map/normalizeTrail.test.ts` — stubs for PIPE-03, PIPE-04
- [ ] `src/lib/fetchOverpass.test.ts` — stubs for PIPE-06
- [ ] `src/features/map/TrailLayers.test.ts` — stubs for PIPE-08, PIPE-09 (mock mapboxgl)
- [ ] Extract normalization logic to `src/features/map/normalizeTrail.ts` to make it unit-testable outside Edge Function

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Routes upserted dedupe on source_id | PIPE-05 | Requires live Supabase instance with real DB | Deploy Edge Function, trigger two fetches for same bbox, verify no duplicate rows in `routes` table |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
