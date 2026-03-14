---
phase: 05-auth-and-onboarding
plan: 02
subsystem: auth
tags: [react, supabase, magic-link, otp, zustand, react-router]

# Dependency graph
requires:
  - phase: 05-auth-and-onboarding plan 01
    provides: useAuthStore with session/profile state, auth init in App.tsx, test stubs

provides:
  - InvitePage with validate-invite Edge Function call and RegisterForm rendering
  - RegisterForm with display_name metadata and signInWithOtp
  - MagicLinkSent with 6-digit OTP auto-advance input and verifyOtp
  - MagicLinkSent resend with 60s cooldown and max 3 attempts via useRef interval
  - AuthPage with returning-user email login (shouldCreateUser:false)
  - AuthGateSheet slide-up bottom sheet with isClosing+200ms animation
  - BottomTabBar auth interception for Ulubione/Profil tabs
  - /onboarding route stub

affects: [05-auth-and-onboarding, 06-pwa-polish, 07-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useRef interval for countdown — avoids stale closures vs setTimeout chain"
    - "sessionStorage for pending invite token — survives auth redirect, consumed post-session"
    - "isClosing + 200ms delay pattern for sheet exit animation"
    - "Protected tab as button (intercepted) vs NavLink (authenticated) — conditional tab rendering"

key-files:
  created:
    - src/features/auth/InvitePage.tsx
    - src/features/auth/RegisterForm.tsx
    - src/features/auth/MagicLinkSent.tsx
    - src/features/auth/AuthPage.tsx
    - src/features/auth/AuthGateSheet.tsx
  modified:
    - src/components/ui/BottomTabBar.tsx
    - src/router.tsx
    - src/features/auth/InvitePage.test.tsx
    - src/features/auth/RegisterForm.test.tsx
    - src/features/auth/AuthPage.test.tsx
    - src/components/ui/BottomTabBar.test.tsx

key-decisions:
  - "AuthPage always shows email login form — 'Dostep tylko przez zaproszenie' is subtitle text, not a gate blocking returning users"
  - "Pending invite token stored in sessionStorage after OTP verification so App.tsx can consume it after onAuthStateChange fires"
  - "Protected tab intercepted as <button> element (not NavLink) to cleanly prevent navigation without e.preventDefault() hacks"
  - "cleanup() called in afterEach for RTL tests — prevents DOM bleed between render calls in same test file"

patterns-established:
  - "Auth-gated tabs: render as <button onClick=openSheet> when !session, <NavLink> when session exists"
  - "Bottom sheet animation: isOpen → setMounted(true) + isClosing=false; close → isClosing=true + setTimeout 200ms → setMounted(false)"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-08]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 05 Plan 02: Auth and Onboarding Summary

**Full invite-to-session auth flow: token validation → RegisterForm → MagicLinkSent with 6-digit OTP + resend cooldown, plus AuthPage for returning users and AuthGateSheet intercepting protected tabs**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-13T23:50:37Z
- **Completed:** 2026-03-14T23:54:37Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Complete invite flow: InvitePage validates token via Edge Function, shows RegisterForm on success with name+email fields, then MagicLinkSent with OTP
- MagicLinkSent has 6-digit OTP with auto-advance inputs (inputMode=numeric), verifyOtp on completion, resend with 60s cooldown via useRef interval (max 3 attempts)
- BottomTabBar auth interception — Ulubione/Profil render as buttons opening AuthGateSheet when unauthenticated, as NavLinks when authenticated
- AuthGateSheet slides up from bottom with isClosing+200ms delay pattern matching FilterPanel from Phase 4
- Test stubs (it.todo) upgraded to real assertions across InvitePage, RegisterForm, AuthPage, and BottomTabBar tests

## Task Commits

Each task was committed atomically:

1. **Task 1: InvitePage, RegisterForm, MagicLinkSent with OTP** - `b25ccf0` (feat)
2. **Task 2: AuthPage, AuthGateSheet, BottomTabBar, router** - `1d47d18` (feat)

**Plan metadata:** (docs commit — see state updates)

## Files Created/Modified

- `src/features/auth/InvitePage.tsx` — Token validation via validate-invite, error states in Polish
- `src/features/auth/RegisterForm.tsx` — Name+email form, signInWithOtp with display_name metadata
- `src/features/auth/MagicLinkSent.tsx` — OTP 6-digit auto-advance, verifyOtp, resend cooldown, sessionStorage for token
- `src/features/auth/AuthPage.tsx` — Returning-user email login with shouldCreateUser:false
- `src/features/auth/AuthGateSheet.tsx` — Slide-up bottom sheet with 200ms exit animation
- `src/components/ui/BottomTabBar.tsx` — Auth-aware with AuthGateSheet integration
- `src/router.tsx` — Real InvitePage/AuthPage imports, /onboarding stub added
- `src/features/auth/InvitePage.test.tsx` — 4 real tests (loading, expired, used, not_found)
- `src/features/auth/RegisterForm.test.tsx` — 3 real tests (fields render, disabled when empty, enabled when filled)
- `src/features/auth/AuthPage.test.tsx` — 2 real tests (login form, invite-only subtitle)
- `src/components/ui/BottomTabBar.test.tsx` — 4 real tests (normal tabs, Ulubione/Profil gate, authenticated navigation)

## Decisions Made

- AuthPage always shows the email login form; "Dostep tylko przez zaproszenie" is subtitle text. The plan's "show invite-only gate" applies to the InvitePage (no token), not AuthPage — returning users need the form at all times.
- Pending invite token stored in sessionStorage after OTP verification so App.tsx can call `consume_invite` via RPC after onAuthStateChange fires and profile is loaded.
- Protected tab rendered as `<button>` (not NavLink with onClick) — cleaner DOM semantics and avoids preventDefault on NavLink which doesn't guarantee no navigation.
- `cleanup()` in afterEach added to RegisterForm tests after discovering DOM bleed between test renders caused false "multiple elements" error.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test DOM bleed between render calls**
- **Found during:** Task 1 (RegisterForm tests)
- **Issue:** Multiple `render()` calls in same test file accumulate in jsdom without cleanup, causing `getByRole` to find duplicate elements
- **Fix:** Added `afterEach(() => cleanup())` to RegisterForm.test.tsx (and proactively to AuthPage and BottomTabBar tests)
- **Files modified:** src/features/auth/RegisterForm.test.tsx, src/features/auth/AuthPage.test.tsx, src/components/ui/BottomTabBar.test.tsx
- **Verification:** All tests pass (14 passing, 10 todos)
- **Committed in:** b25ccf0 (Task 1), 1d47d18 (Task 2)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Test infrastructure fix only. No scope creep, no architectural changes.

## Issues Encountered

- TypeScript strict mode flagged unused `_fromInvite` variable in AuthPage — removed, `searchParams.get('from')` access via `void` expression to avoid lint warning.

## User Setup Required

None — no external service configuration required for this plan. The validate-invite Edge Function was deployed in Plan 01.

## Next Phase Readiness

- Auth UI flow complete: invite validation → registration → OTP → session established
- Returning user login flow complete
- AuthGateSheet available for use by any protected feature in Phase 5+
- /onboarding route stub ready for Plan 03 (OnboardingFlow)
- Invite token in sessionStorage ready for App.tsx consume_invite call (Plan 01 wired this)

## Self-Check: PASSED

All files found. Both task commits verified in git log.

---
*Phase: 05-auth-and-onboarding*
*Completed: 2026-03-14*
