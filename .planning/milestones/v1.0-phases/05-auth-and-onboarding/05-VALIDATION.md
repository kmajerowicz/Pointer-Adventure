---
phase: 5
slug: auth-and-onboarding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react 16.x |
| **Config file** | `vitest.config.ts` (needs include update for .tsx) |
| **Quick run command** | `npx vitest run src/features/auth src/features/onboarding` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/features/auth src/features/onboarding src/stores/auth.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | AUTH-01, AUTH-07 | unit | `npx vitest run src/features/auth/validateInvite.test.ts` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | AUTH-02, AUTH-03 | unit | `npx vitest run src/features/auth/InvitePage.test.tsx` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 1 | AUTH-04 | unit | `npx vitest run src/features/auth/AuthPage.test.tsx` | ❌ W0 | ⬜ pending |
| 5-01-04 | 01 | 1 | AUTH-05, AUTH-06 | unit | `npx vitest run src/stores/auth.test.ts` | ❌ W0 | ⬜ pending |
| 5-01-05 | 01 | 1 | AUTH-08 | unit | `npx vitest run src/components/ui/BottomTabBar.test.tsx` | ❌ W0 | ⬜ pending |
| 5-02-01 | 02 | 2 | ONBR-01 | unit | `npx vitest run src/features/onboarding/OnboardingFlow.test.tsx` | ❌ W0 | ⬜ pending |
| 5-02-02 | 02 | 2 | ONBR-02 | unit | `npx vitest run src/features/onboarding/DogStep.test.tsx` | ❌ W0 | ⬜ pending |
| 5-02-03 | 02 | 2 | ONBR-03 | unit | `npx vitest run src/features/onboarding/GeolocationStep.test.tsx` | ❌ W0 | ⬜ pending |
| 5-02-04 | 02 | 2 | ONBR-04 | unit | `npx vitest run src/features/onboarding/OnboardingFlow.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — update `include` to `['src/**/*.test.{ts,tsx}']`
- [ ] `src/stores/auth.test.ts` — covers AUTH-05, AUTH-06
- [ ] `src/features/auth/InvitePage.test.tsx` — covers AUTH-01, AUTH-03
- [ ] `src/features/auth/RegisterForm.test.tsx` — covers AUTH-02
- [ ] `src/features/auth/AuthPage.test.tsx` — covers AUTH-04
- [ ] `src/features/auth/validateInvite.test.ts` — covers AUTH-07
- [ ] `src/components/ui/BottomTabBar.test.tsx` — covers AUTH-08
- [ ] `src/features/onboarding/OnboardingFlow.test.tsx` — covers ONBR-01, ONBR-04
- [ ] `src/features/onboarding/DogStep.test.tsx` — covers ONBR-02
- [ ] `src/features/onboarding/GeolocationStep.test.tsx` — covers ONBR-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session persists across refresh | AUTH-06 | Supabase localStorage behavior | Log in → refresh browser → still logged in |
| Magic link email arrives | AUTH-02 | External email system | Register → check email → click link |
| OTP code works when magic link pre-fetched | AUTH-02 | Email scanner simulation | Register → enter OTP code manually |
| Geolocation permission prompt | ONBR-03 | Browser permission dialog | Complete onboarding → step 4 → allow GPS |
| Filter tooltip after onboarding | ONBR-04 | Visual CSS positioning | Complete onboarding → verify tooltip points to filter |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 8s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
