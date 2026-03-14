---
phase: 6
slug: favorites-and-activity
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` — environment: jsdom |
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Creates Test File | Status |
|---------|------|------|-------------|-----------|-------------------|-------------------|--------|
| 06-01-01 | 01 | 1 | FAV-01 | unit (store) | `npm run build` | No (stores tested via hooks) | ⬜ pending |
| 06-01-02 | 01 | 1 | FAV-01, FAV-02 | unit | `npx vitest run src/hooks/useFavorites.test.ts` | Yes — TDD | ⬜ pending |
| 06-01-02 | 01 | 1 | ACT-02, ACT-03 | unit | `npx vitest run src/hooks/useActivity.test.ts` | Yes — TDD | ⬜ pending |
| 06-01-02 | 01 | 1 | PROF-02, PROF-03 | unit | `npx vitest run src/hooks/useInvites.test.ts` | Yes — TDD | ⬜ pending |
| 06-02-01 | 02 | 2 | FAV-04 | unit | `npx vitest run src/features/favorites/FavoriteNote.test.tsx` | Yes | ⬜ pending |
| 06-02-02 | 02 | 2 | FAV-03, FAV-05 | unit | `npx vitest run src/features/favorites/FavoritesList.test.tsx` | Yes | ⬜ pending |
| 06-03-01 | 03 | 2 | PROF-01, ACT-04 | unit | `npx vitest run src/features/profile/ProfileView.test.tsx` | Yes | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 is satisfied inline — test files are created as part of TDD tasks within each plan:

- [x] `src/hooks/useFavorites.test.ts` — created in Plan 01 Task 2 (TDD)
- [x] `src/hooks/useActivity.test.ts` — created in Plan 01 Task 2 (TDD)
- [x] `src/hooks/useInvites.test.ts` — created in Plan 01 Task 2 (TDD)
- [x] `src/features/favorites/FavoriteNote.test.tsx` — created in Plan 02 Task 1
- [x] `src/features/favorites/FavoritesList.test.tsx` — created in Plan 02 Task 2
- [x] `src/features/profile/ProfileView.test.tsx` — created in Plan 03 Task 1

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Heart animation visual quality | FAV-01 | CSS animation visual | Tap heart on TrailCard and TrailDetail, verify visual feedback |
| Optimistic UI revert visual | FAV-02 | Requires network failure simulation | Disable network, tap heart, verify it reverts |
| Empty favorites personalized message | FAV-05 | Requires auth context with dog_name | Log in, verify empty state shows dog name |
| "Przeszedlem!" hidden for unauth | ACT-01 | Requires auth state testing | View TrailDetail while logged out |
| Profile page layout | PROF-01 | Visual layout verification | Navigate to profile tab, verify name/dog/avatar |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify with test commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covered inline via TDD tasks (no separate Wave 0 plan needed)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
