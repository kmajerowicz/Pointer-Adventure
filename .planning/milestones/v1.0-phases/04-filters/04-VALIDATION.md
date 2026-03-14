---
phase: 4
slug: filters
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (already configured) |
| **Config file** | `vitest.config.ts` — `environment: 'jsdom'`, `include: ['src/**/*.test.ts']` |
| **Quick run command** | `npx vitest run src/hooks/useFilteredRoutes.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/hooks/useFilteredRoutes.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | FILT-02 | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-01 | 01 | 1 | FILT-03 | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-01 | 01 | 1 | FILT-04 | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-01 | 01 | 1 | FILT-05 | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-01 | 01 | 1 | FILT-06 | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-01 | 01 | 1 | FILT-07 | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-01 | 01 | 1 | FILT-09 | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-01 | 01 | 1 | FILT-10 | unit | `npx vitest run src/stores/filters.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useFilteredRoutes.test.ts` — stubs for FILT-02, FILT-03, FILT-04, FILT-05, FILT-06, FILT-07, FILT-09
- [ ] `src/stores/filters.test.ts` — stubs for FILT-10 (resetAll behavior)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sheet opens with sticky "Zastosuj" button visible | FILT-01 | Requires DOM interaction + visual layout verification | Open filter panel, verify sticky button visible at bottom while scrolling categories |
| Badge count and chip rendering | FILT-08 | Visual verification of badge count + chip bar layout | Apply 2+ filters, verify badge shows count, chips appear below search bar with × dismiss |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
