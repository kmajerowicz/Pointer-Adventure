---
phase: 05-auth-and-onboarding
plan: 03
subsystem: auth
tags: [react, supabase, onboarding, zustand, react-router, geolocation]

# Dependency graph
requires:
  - phase: 05-01
    provides: auth store (useAuthStore), Supabase client, invite token flow
  - phase: 05-02
    provides: AuthPage, InvitePage, sessionStorage invite token, router /onboarding stub

provides:
  - useAuthInit hook: getSession on mount, onAuthStateChange subscription, redirect logic
  - AuthLayout: root route wrapper with loading spinner until auth initialized
  - 4-step onboarding wizard: WelcomeStep, DogStep, PreferencesStep, GeolocationStep
  - FilterTooltip: one-shot filter hint after onboarding
  - Dog name required step saved to DB + optimistic auth store update (prevents redirect loop)
  - Walk preferences saved to DB + applied as default filter values
  - Geolocation request with viewport center update on success
  - Invite token consumed via consume_invite RPC after sign-in

affects: [06-favorites, 07-pwa-hardening, all features using auth state]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AuthLayout pattern: root route wrapper using useAuthInit hook for initialization
    - hasRedirected ref: prevents onboarding redirect loops after dog_name saved
    - Optimistic profile update in DogStep prevents re-trigger of onboarding redirect
    - consumeInviteToken async helper wraps Supabase RPC to avoid PromiseLike .catch() type error

key-files:
  created:
    - src/hooks/useAuthInit.ts
    - src/components/layout/AuthLayout.tsx
    - src/features/onboarding/OnboardingFlow.tsx
    - src/features/onboarding/WelcomeStep.tsx
    - src/features/onboarding/DogStep.tsx
    - src/features/onboarding/PreferencesStep.tsx
    - src/features/onboarding/GeolocationStep.tsx
    - src/features/onboarding/FilterTooltip.tsx
  modified:
    - src/router.tsx
    - src/stores/ui.ts
    - src/hooks/useActivity.ts

key-decisions:
  - "AuthLayout wraps all routes as parent route element — useAuthInit runs inside Router context for useNavigate access"
  - "hasRedirected ref in useAuthInit prevents SIGNED_IN from re-redirecting after onboarding completion"
  - "DogStep optimistically updates auth store profile locally before navigating — prevents redirect loop check on re-render"
  - "consumeInviteToken is an async function (not chained .catch()) — Supabase rpc() returns PromiseLike not Promise, has no .catch method"
  - "FilterTooltip auto-dismisses after 5s via useEffect timer + useUIStore showFilterTooltip flag"

patterns-established:
  - "AuthLayout pattern: root route element runs auth hooks that need Router context (useNavigate)"
  - "Optimistic local state update after DB write for redirect-sensitive fields"

requirements-completed: [AUTH-02, AUTH-05, AUTH-06, AUTH-08, ONBR-01, ONBR-02, ONBR-03, ONBR-04]

# Metrics
duration: 6min
completed: 2026-03-14
---

# Phase 05 Plan 03: Onboarding Wizard + Auth Init Summary

**4-step dog-themed onboarding wizard (Welcome, Dog name, Preferences, Geolocation) with AuthLayout root wrapper that initializes Supabase auth on mount and redirects first-time users to /onboarding**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-13T23:57:14Z
- **Completed:** 2026-03-14T00:03:05Z
- **Tasks:** 2 (+ 1 deviation fix)
- **Files modified:** 10 created/modified

## Accomplishments

- Auth initialization runs inside Router context via AuthLayout parent route, enabling useNavigate for redirect logic
- First-time users (dog_name null) redirect to /onboarding; returning users go directly to /
- Dog name required and saved to DB with optimistic auth store update — breaks potential redirect loop
- Walk preferences from step 3 become default filter values via useFiltersStore setters
- Geolocation step centers map on user's position via useViewportStore.setCenter
- One-shot FilterTooltip appears after onboarding, auto-dismisses after 5 seconds
- Invite token consumed from sessionStorage via consume_invite RPC after sign-in
- Upgraded 6 onboarding test stubs from it.todo() to real render+assertion tests

## Task Commits

1. **Task 1: App auth init, AuthLayout root wrapper, router restructure** - `3e3b678` (feat)
2. **Task 2: 4-step onboarding wizard + FilterTooltip** - `a036386` (feat)

## Files Created/Modified

- `src/hooks/useAuthInit.ts` — Auth init hook: getSession, onAuthStateChange, invite consumption, redirect logic
- `src/components/layout/AuthLayout.tsx` — Root route wrapper, shows loading spinner until initialized
- `src/router.tsx` — Restructured to wrap all routes under AuthLayout; /onboarding added
- `src/stores/ui.ts` — Added showFilterTooltip, showAuthGate, showToast, clearToast
- `src/features/onboarding/OnboardingFlow.tsx` — 4-step wizard controller with progress dots
- `src/features/onboarding/WelcomeStep.tsx` — Step 1: personalized greeting with dog paw
- `src/features/onboarding/DogStep.tsx` — Step 2: required dog name, saves to DB + auth store
- `src/features/onboarding/PreferencesStep.tsx` — Step 3: length/water/surface pills, saves preferences + sets default filters
- `src/features/onboarding/GeolocationStep.tsx` — Step 4: GPS permission, centers viewport on success
- `src/features/onboarding/FilterTooltip.tsx` — One-shot tooltip, auto-dismisses after 5s

## Decisions Made

- AuthLayout wraps all routes as parent route element so useAuthInit runs inside Router context with useNavigate access
- hasRedirected ref prevents SIGNED_IN from retriggering /onboarding redirect after onboarding completion
- DogStep optimistically updates auth store profile locally before navigating — prevents redirect loop when profile is re-read
- consumeInviteToken is an async wrapper function, not .catch() chaining — Supabase rpc() returns PromiseLike which has no .catch() method (TypeScript TS2339)
- FilterTooltip uses absolute positioning with calc based on --spacing-tab-bar CSS variable for filter button area

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Supabase rpc() PromiseLike type missing .catch() method**
- **Found during:** Task 1 (useAuthInit hook, invite consumption)
- **Issue:** `supabase.rpc().then().catch()` caused TS2339 — rpc() returns PromiseLike not Promise, which has no .catch() method
- **Fix:** Extracted invite consumption into `async consumeInviteToken()` helper using try/catch/finally block
- **Files modified:** `src/hooks/useAuthInit.ts`
- **Verification:** Build passes with no TypeScript errors
- **Committed in:** 3e3b678 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed pre-existing ActivityHistoryEntry type mismatch in useActivity.ts**
- **Found during:** Task 2 build verification
- **Issue:** `data as ActivityHistoryEntry[]` failed type check because Supabase join returns route as array, but type expects single object — neither type sufficiently overlaps
- **Fix:** Changed to `data as unknown as ActivityHistoryEntry[]` for double cast
- **Files modified:** `src/hooks/useActivity.ts`
- **Verification:** Build passes with no TypeScript errors
- **Committed in:** a036386 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes necessary for build to pass. No scope creep — useActivity.ts was a pre-existing issue that blocked compilation.

## Issues Encountered

- Testing library DOM accumulation between tests caused false "multiple elements" errors — resolved by adding `afterEach(cleanup)` to each test file that renders multiple times
- Onboarding test stubs converted from `it.todo()` to real render tests with proper mocking for useAuthStore, useUIStore, useGeolocation, useViewportStore

## User Setup Required

None — no external service configuration required for this plan.

## Next Phase Readiness

- End-to-end auth + onboarding flow complete: invite → auth → onboarding → personalized map
- FilterTooltip renders inside map view — needs to be wired into MapView or AppLayout to display (currently created but not yet mounted in parent component)
- Phase 6 (Favorites) can proceed — auth store and user profile available via useAuthStore
- FilterTooltip mounting point: add `<FilterTooltip />` inside AppLayout or MapView component

## Self-Check: PASSED

All files found. Both task commits verified in git log.

---
*Phase: 05-auth-and-onboarding*
*Completed: 2026-03-14*
