---
phase: 05-auth-and-onboarding
plan: 01
subsystem: auth
tags: [zustand, supabase, auth, edge-function, vitest, postgresql, trigger, rpc]

# Dependency graph
requires:
  - phase: 00-scaffolding-fixes
    provides: TypeScript strict mode, vitest config baseline
  - phase: 04-filters
    provides: Zustand store patterns (ui.ts, filters.ts)
provides:
  - Zustand auth store with session/user/profile/loading/initialized state
  - WalkPreferences interface and walk_preferences field on User type
  - validate-invite Edge Function with full token lifecycle handling
  - DB migration with walk_preferences column, handle_new_user trigger, consume_invite RPC
  - Vitest .tsx support and 9 Wave 0 test stubs for all phase 5 features
affects:
  - 05-02 (auth UI: InvitePage, RegisterForm, AuthPage depend on useAuthStore)
  - 05-03 (onboarding UI: OnboardingFlow, DogStep, GeolocationStep use auth store)
  - 06-favorites-and-activity (favorites use auth session from this store)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Zustand auth store pattern (session+user+profile separated, setters only — no async logic in store)
    - Supabase Edge Function with service role client for privileged DB operations
    - SECURITY DEFINER PostgreSQL functions for cross-RLS operations
    - Wave 0 test scaffolding: it.todo() stubs ensure test files exist before implementation

key-files:
  created:
    - src/stores/auth.ts
    - supabase/migrations/20260314000000_auth_support.sql
    - supabase/functions/validate-invite/index.ts
    - src/stores/auth.test.ts
    - src/features/auth/validateInvite.test.ts
    - src/features/auth/InvitePage.test.tsx
    - src/features/auth/RegisterForm.test.tsx
    - src/features/auth/AuthPage.test.tsx
    - src/components/ui/BottomTabBar.test.tsx
    - src/features/onboarding/OnboardingFlow.test.tsx
    - src/features/onboarding/DogStep.test.tsx
    - src/features/onboarding/GeolocationStep.test.tsx
  modified:
    - src/lib/types.ts (added WalkPreferences interface and walk_preferences field to User)
    - vitest.config.ts (updated include pattern to cover .tsx test files)

key-decisions:
  - "use import type for @supabase/supabase-js Session/User — TypeScript verbatimModuleSyntax requires type-only imports for type aliases"
  - "Auth init logic (getSession, onAuthStateChange) excluded from store — belongs in App.tsx (Plan 03)"
  - "validate-invite checks used_at before expires_at — used token is already consumed regardless of expiry"
  - "Wave 0 test stubs use it.todo() not it.skip() — todos are reported as skipped, never fail vitest run"

patterns-established:
  - "Auth store pattern: separate session (supabase), user (extracted from session), profile (app User type)"
  - "Edge Function service role pattern: Deno.env SUPABASE_SERVICE_ROLE_KEY for bypassing RLS"
  - "Import type pattern: always use import type for supabase-js types to satisfy verbatimModuleSyntax"

requirements-completed: [AUTH-01, AUTH-03, AUTH-06, AUTH-07]

# Metrics
duration: 3min
completed: 2026-03-14
---

# Phase 05 Plan 01: Auth Foundation Summary

**Zustand auth store, validate-invite Deno Edge Function, PostgreSQL trigger+RPC migration, vitest .tsx support, and 9 Wave 0 test stubs establishing the complete phase 5 test surface**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-14T00:45:30Z
- **Completed:** 2026-03-14T00:48:10Z
- **Tasks:** 3 (Task 0, Task 1, Task 2)
- **Files modified:** 14

## Accomplishments

- Zustand auth store exports useAuthStore with session/user/profile/loading/initialized; setSession auto-extracts user; clear resets all auth state
- validate-invite Edge Function handles all 4 token states (not_found/expired/used/valid) using service role client, following the search-trails pattern
- DB migration adds walk_preferences JSONB column, handle_new_user trigger that auto-creates public.users on auth signup, and consume_invite SECURITY DEFINER RPC
- Vitest updated to include .tsx files; all 9 Wave 0 test stubs (40 todos) pass without failures

## Task Commits

Each task was committed atomically:

1. **Task 0: Wave 0 test scaffolding** - `bd70a74` (chore)
2. **Task 1: Auth store and types update** - `fa57c40` (feat)
3. **Task 2: DB migration and validate-invite Edge Function** - `f746332` (feat)

## Files Created/Modified

- `src/stores/auth.ts` — Zustand auth store with session/user/profile/loading/initialized
- `src/lib/types.ts` — Added WalkPreferences interface and walk_preferences field to User
- `supabase/migrations/20260314000000_auth_support.sql` — walk_preferences column, handle_new_user trigger, consume_invite RPC
- `supabase/functions/validate-invite/index.ts` — Edge Function for token validation (4 states)
- `vitest.config.ts` — Updated include pattern to cover .tsx test files
- `src/stores/auth.test.ts` — Wave 0 stubs for auth store
- `src/features/auth/validateInvite.test.ts` — Wave 0 stubs for invite validation logic
- `src/features/auth/InvitePage.test.tsx` — Wave 0 stubs for InvitePage
- `src/features/auth/RegisterForm.test.tsx` — Wave 0 stubs for RegisterForm
- `src/features/auth/AuthPage.test.tsx` — Wave 0 stubs for AuthPage
- `src/components/ui/BottomTabBar.test.tsx` — Wave 0 stubs for auth interception
- `src/features/onboarding/OnboardingFlow.test.tsx` — Wave 0 stubs for onboarding flow
- `src/features/onboarding/DogStep.test.tsx` — Wave 0 stubs for DogStep
- `src/features/onboarding/GeolocationStep.test.tsx` — Wave 0 stubs for GeolocationStep

## Decisions Made

- Used `import type` for `@supabase/supabase-js` types — TypeScript strict verbatimModuleSyntax requires type-only imports for type aliases (auto-fixed Rule 1 during Task 1)
- Auth init logic (getSession, onAuthStateChange) excluded from store — belongs in App.tsx integration (Plan 03)
- validate-invite checks used_at before expires_at — a used token is already consumed regardless of remaining TTL
- Wave 0 test stubs use `it.todo()` not `it.skip()` — todos are reported as skipped, never fail vitest run

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed import type for verbatimModuleSyntax compliance**
- **Found during:** Task 1 (Auth store and types update)
- **Issue:** `import { Session, User } from '@supabase/supabase-js'` caused TS1484 errors — TypeScript verbatimModuleSyntax mode requires type-only imports for type aliases
- **Fix:** Changed to `import type { Session, User as SupabaseUser } from '@supabase/supabase-js'` and `import type { User as AppUser } from '../lib/types'`
- **Files modified:** `src/stores/auth.ts`
- **Verification:** `npm run build` passes cleanly after fix
- **Committed in:** `fa57c40` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Auto-fix necessary for TypeScript compilation. No scope creep.

## Issues Encountered

- Pre-existing `src/features/map/TrailLayers.test.ts` failures (3 tests) found during full vitest run. Confirmed pre-existing (failures exist before plan 05-01 changes). Logged to `deferred-items.md` and not fixed per scope boundary rules.

## User Setup Required

None — no external service configuration required. The Edge Function and migration will be applied to Supabase during deployment in later plans.

## Next Phase Readiness

- Auth store ready for App.tsx initialization (Plan 03)
- validate-invite Edge Function ready for InvitePage integration (Plan 02)
- DB migration ready for Supabase deployment
- All 9 Wave 0 test stubs in place — each subsequent plan can run `npx vitest run src/features/auth/` or `src/features/onboarding/` to verify implementations

---
*Phase: 05-auth-and-onboarding*
*Completed: 2026-03-14*

## Self-Check: PASSED

All files exist. All commits found: bd70a74, fa57c40, f746332.
