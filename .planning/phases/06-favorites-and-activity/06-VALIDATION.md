---
phase: 6
slug: favorites-and-activity
status: draft
nyquist_compliant: false
wave_0_complete: false
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | FAV-01 | unit | `npx vitest run src/hooks/useFavorites.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-01 | 01 | 1 | FAV-02 | unit | `npx vitest run src/hooks/useFavorites.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | FAV-03 | unit | `npx vitest run src/features/favorites/FavoritesList.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | FAV-04 | unit | `npx vitest run src/features/favorites/FavoriteNote.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | FAV-05 | unit | `npx vitest run src/features/favorites/FavoritesList.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | ACT-01 | unit | `npx vitest run src/hooks/useActivity.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | ACT-02 | unit | `npx vitest run src/hooks/useActivity.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | ACT-03 | unit | `npx vitest run src/hooks/useActivity.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | ACT-04 | unit | `npx vitest run src/hooks/useActivity.test.ts` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | PROF-01 | unit | `npx vitest run src/features/profile/ProfileView.test.ts` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | PROF-02 | unit | `npx vitest run src/hooks/useInvites.test.ts` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | PROF-03 | unit | `npx vitest run src/hooks/useInvites.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useFavorites.test.ts` — stubs for FAV-01, FAV-02
- [ ] `src/hooks/useActivity.test.ts` — stubs for ACT-02, ACT-03, ACT-04
- [ ] `src/hooks/useInvites.test.ts` — stubs for PROF-02, PROF-03
- [ ] `src/features/favorites/FavoritesList.test.ts` — stubs for FAV-03, FAV-05
- [ ] `src/features/favorites/FavoriteNote.test.ts` — stubs for FAV-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Heart animation visual quality | FAV-01 | CSS animation visual | Tap heart on TrailCard and TrailDetail, verify visual feedback |
| Optimistic UI revert visual | FAV-02 | Requires network failure simulation | Disable network, tap heart, verify it reverts |
| Empty favorites personalized message | FAV-05 | Requires auth context with dog_name | Log in, verify empty state shows dog name |
| "Przeszedłem!" hidden for unauth | ACT-01 | Requires auth state testing | View TrailDetail while logged out |
| Profile page layout | PROF-01 | Visual layout verification | Navigate to profile tab, verify name/dog/avatar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
