---
phase: 05-auth-and-onboarding
verified: 2026-03-14T00:07:43Z
status: gaps_found
score: 10/11 must-haves verified
gaps:
  - truth: "Single tooltip 'Filtruj trasy tutaj' appears after onboarding completion"
    status: failed
    reason: "FilterTooltip component is created and wired to UIStore, and OnboardingFlow sets the flag, but the component is never imported or rendered in any parent (AppLayout, MapView, or AppLayout). The flag fires into the void — no tooltip ever displays."
    artifacts:
      - path: "src/features/onboarding/FilterTooltip.tsx"
        issue: "Component exists and reads showFilterTooltip from UIStore but is orphaned — no parent imports or renders it"
    missing:
      - "Import and render <FilterTooltip /> inside src/components/layout/AppLayout.tsx (or MapView) so it overlays the map after onboarding completes"
---

# Phase 5: Auth and Onboarding Verification Report

**Phase Goal:** New users can join via invite link and complete onboarding to reach their first personalized map view; existing users are recognized on return
**Verified:** 2026-03-14T00:07:43Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                              | Status     | Evidence                                                                                                                                       |
|----|----------------------------------------------------------------------------------------------------|------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| 1  | Any component can read the current user session and profile without prop drilling                   | VERIFIED   | `src/stores/auth.ts` exports `useAuthStore` with session/user/profile/loading/initialized; 29 lines, fully substantive, wired in BottomTabBar, AuthLayout, DogStep, PreferencesStep, OnboardingFlow |
| 2  | validate-invite Edge Function returns valid/invalid/expired/used for any token                      | VERIFIED   | `supabase/functions/validate-invite/index.ts` (89 lines): handles not_found (404), used (410), expired (410), valid (200) with service role client |
| 3  | New auth.users row auto-creates a public.users row via DB trigger                                   | VERIFIED   | `supabase/migrations/20260314000000_auth_support.sql` has `handle_new_user` SECURITY DEFINER trigger on `AFTER INSERT ON auth.users`           |
| 4  | consume_invite RPC marks token as used only when called explicitly                                  | VERIFIED   | Migration has `consume_invite(p_token, p_user_id)` SECURITY DEFINER function; called from `useAuthInit.ts` after SIGNED_IN event              |
| 5  | Visiting /invite?token=xyz with valid token shows registration form (name + email)                  | VERIFIED   | `InvitePage.tsx` calls `supabase.functions.invoke('validate-invite', ...)` and renders `<RegisterForm>` on valid response                      |
| 6  | Visiting /invite?token=xyz with expired/used token shows Polish error message                       | VERIFIED   | InvitePage renders "Zaproszenie wygaslo" for expired/used, "Nieprawidlowy link zaproszenia" for not_found — all in Polish                      |
| 7  | Submitting registration form sends magic link and shows OTP input screen                            | VERIFIED   | `RegisterForm.tsx` calls `supabase.auth.signInWithOtp` with `display_name` metadata; on success transitions to `<MagicLinkSent>` with 6-digit OTP |
| 8  | Tapping Ulubione/Profil tabs when unauthenticated shows auth gate bottom sheet                      | VERIFIED   | `BottomTabBar.tsx` renders protected tabs as `<button>` when `!session`, opening `AuthGateSheet`; NavLink when authenticated                  |
| 9  | App.tsx initializes auth store from supabase.auth.getSession on mount, session persists on refresh  | VERIFIED   | `useAuthInit.ts` calls `getSession()` on mount via `AuthLayout` root route wrapper; Supabase uses localStorage by default                      |
| 10 | First-time user (dog_name is null) is redirected to /onboarding; returning user goes to /           | VERIFIED   | `useAuthInit.ts` SIGNED_IN handler fetches profile: if `!profile?.dog_name` → navigate('/onboarding'), else navigate('/'); `hasRedirected` ref prevents loops |
| 11 | Single tooltip 'Filtruj trasy tutaj' appears after onboarding completion                            | FAILED     | `FilterTooltip.tsx` exists and reads `showFilterTooltip` from UIStore. `OnboardingFlow.tsx` sets the flag on completion. But `FilterTooltip` is never imported or rendered in any parent component — it is orphaned. |

**Score:** 10/11 truths verified

### Required Artifacts

| Artifact                                              | Min Lines | Actual | Status    | Details                                                              |
|-------------------------------------------------------|-----------|--------|-----------|----------------------------------------------------------------------|
| `src/stores/auth.ts`                                  | —         | 29     | VERIFIED  | Exports `useAuthStore`, session/user/profile/loading/initialized, setSession auto-extracts user |
| `supabase/functions/validate-invite/index.ts`         | —         | 89     | VERIFIED  | Service role client, 4 token states, CORS headers                   |
| `supabase/migrations/20260314000000_auth_support.sql` | —         | 33     | VERIFIED  | walk_preferences column, handle_new_user trigger, consume_invite RPC |
| `vitest.config.ts`                                    | —         | —      | VERIFIED  | `include: ['src/**/*.test.{ts,tsx}']`                               |
| `src/features/auth/InvitePage.tsx`                    | 40        | 119    | VERIFIED  | Token validation via Edge Function, all error states in Polish       |
| `src/features/auth/RegisterForm.tsx`                  | 30        | 102    | VERIFIED  | name+email form, signInWithOtp with display_name metadata            |
| `src/features/auth/MagicLinkSent.tsx`                 | 60        | 185    | VERIFIED  | 6-digit OTP auto-advance, verifyOtp, resend 60s cooldown (max 3), sessionStorage for token |
| `src/features/auth/AuthPage.tsx`                      | 30        | 87     | VERIFIED  | Email login with shouldCreateUser:false, "Dostep tylko przez zaproszenie" subtitle |
| `src/features/auth/AuthGateSheet.tsx`                 | 20        | 77     | VERIFIED  | Slide-up bottom sheet, isClosing+200ms animation, "Zaloguj sie" CTA navigates to /auth |
| `src/components/ui/BottomTabBar.tsx`                  | —         | 56     | VERIFIED  | Auth-aware: gated tabs render as button, useAuthStore wired         |
| `src/hooks/useAuthInit.ts`                            | —         | 96     | VERIFIED  | getSession, onAuthStateChange, invite consumption, redirect logic, hasRedirected ref |
| `src/components/layout/AuthLayout.tsx`                | —         | 25     | VERIFIED  | Root route wrapper: useAuthInit + loading spinner until initialized  |
| `src/features/onboarding/OnboardingFlow.tsx`          | 40        | 64     | VERIFIED  | 4-step wizard, progress dots, handleComplete sets showFilterTooltip and navigates to / |
| `src/features/onboarding/WelcomeStep.tsx`             | —         | 24     | VERIFIED  | Personalized greeting with display_name                              |
| `src/features/onboarding/DogStep.tsx`                 | 30        | 93     | VERIFIED  | Required dog name, DB save via supabase.from('users').update, optimistic auth store update |
| `src/features/onboarding/PreferencesStep.tsx`         | 40        | 147    | VERIFIED  | Pill selectors (length/water/surface), DB save + useFiltersStore setters applied |
| `src/features/onboarding/GeolocationStep.tsx`         | 30        | 68     | VERIFIED  | useGeolocation hook, useViewportStore.setCenter on success, skip option |
| `src/features/onboarding/FilterTooltip.tsx`           | —         | 34     | ORPHANED  | Component is substantive (reads UIStore, renders tooltip, auto-dismisses after 5s) but is never imported or rendered in any parent component |

### Key Link Verification

| From                                        | To                                            | Via                                     | Status      | Details                                                            |
|---------------------------------------------|-----------------------------------------------|-----------------------------------------|-------------|--------------------------------------------------------------------|
| `src/stores/auth.ts`                        | `src/lib/supabase.ts`                         | supabase.auth.getSession / onAuthStateChange | WIRED  | Used in `useAuthInit.ts` (not the store itself — correct per plan design) |
| `supabase/functions/validate-invite/index.ts` | `public.invitations`                        | SUPABASE_SERVICE_ROLE_KEY               | WIRED       | `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` present               |
| `src/features/auth/InvitePage.tsx`          | validate-invite Edge Function                 | `supabase.functions.invoke`             | WIRED       | `supabase.functions.invoke('validate-invite', { body: { token } })` |
| `src/features/auth/RegisterForm.tsx`        | `supabase.auth.signInWithOtp`                 | direct API call                         | WIRED       | `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, data: { display_name } } })` |
| `src/features/auth/MagicLinkSent.tsx`       | `supabase.auth.verifyOtp`                     | OTP code submission                     | WIRED       | `supabase.auth.verifyOtp({ email, token: code, type: 'email' })` on all 6 digits |
| `src/components/ui/BottomTabBar.tsx`        | `src/stores/auth.ts`                          | useAuthStore session check              | WIRED       | `const { session } = useAuthStore()` with conditional render       |
| `src/App.tsx`                               | `src/stores/auth.ts`                          | useAuthStore (via AuthLayout)           | WIRED       | `AuthLayout` runs `useAuthInit()` which drives useAuthStore        |
| `src/App.tsx`                               | `supabase.auth.onAuthStateChange`             | subscription in useEffect               | WIRED       | `supabase.auth.onAuthStateChange` in `useAuthInit.ts`             |
| `src/features/onboarding/DogStep.tsx`       | `supabase.from('users').update`               | save dog_name to DB                     | WIRED       | `supabase.from('users').update({ dog_name }).eq('id', session.user.id)` |
| `src/features/onboarding/PreferencesStep.tsx` | `src/stores/filters.ts`                     | set default filters from preferences    | WIRED       | `useFiltersStore` setters called after DB save                     |
| `src/features/onboarding/GeolocationStep.tsx` | `src/hooks/useGeolocation`                  | request GPS permission                  | WIRED       | `const { state, locate } = useGeolocation()` + `setCenter` on success |
| `src/features/onboarding/FilterTooltip.tsx` | `src/components/layout/AppLayout.tsx`         | rendered in parent                      | NOT_WIRED   | FilterTooltip is never imported or rendered in AppLayout, MapView, or any other component |

### Requirements Coverage

| Requirement | Source Plan   | Description                                                                                         | Status        | Evidence                                                                             |
|-------------|---------------|-----------------------------------------------------------------------------------------------------|---------------|--------------------------------------------------------------------------------------|
| AUTH-01     | 05-01, 05-02  | New user arrives at /invite?token=xyz, token validated server-side via Edge Function                | SATISFIED     | InvitePage calls validate-invite Edge Function on mount                              |
| AUTH-02     | 05-02, 05-03  | Valid token → registration form → magic link sent → token consumed on successful registration       | SATISFIED     | RegisterForm sends OTP; MagicLinkSent stores token in sessionStorage; useAuthInit consumes via RPC |
| AUTH-03     | 05-01, 05-02  | Expired or used token shows clear error message in Polish                                           | SATISFIED     | InvitePage renders "Zaproszenie wygaslo" (expired/used) and "Nieprawidlowy link" (not_found) |
| AUTH-04     | 05-02         | /auth without invite context shows "Dostep tylko przez zaproszenie" — no registration form         | SATISFIED     | AuthPage always shows email-only login form (shouldCreateUser:false) with subtitle "Dostep tylko przez zaproszenie" — no name field, no account creation |
| AUTH-05     | 05-02, 05-03  | Magic link click → session established → redirect to onboarding (first) or map (returning)         | SATISFIED     | useAuthInit SIGNED_IN handler checks dog_name: null → /onboarding, else → /        |
| AUTH-06     | 05-01, 05-03  | Session persists across browser refresh via Supabase localStorage                                   | SATISFIED     | getSession() called on mount in useAuthInit; Supabase client uses localStorage by default |
| AUTH-07     | 05-01         | Invite tokens expire after 30 days (invitations.expires_at)                                         | SATISFIED     | validate-invite compares `new Date(data.expires_at) < new Date()` and returns reason:expired |
| AUTH-08     | 05-02, 05-03  | Unauthenticated users can browse trails and map; cannot favorite, log activity, or access profile   | SATISFIED     | BottomTabBar intercepts Ulubione/Profil for unauthenticated; Mapa/Trasy are always accessible |
| ONBR-01     | 05-03         | First-time user after magic link sees onboarding: welcome + name → dog name → geolocation request  | SATISFIED     | OnboardingFlow has 4 steps (Welcome, DogStep, PreferencesStep, GeolocationStep); PRD says 3-step but plan extended to 4 — Preferences step is an intentional addition per plan design |
| ONBR-02     | 05-03         | Dog name saved to users.dog_name                                                                    | SATISFIED     | DogStep calls `supabase.from('users').update({ dog_name })` and optimistically updates auth store |
| ONBR-03     | 05-03         | Geolocation step explains why GPS needed; on approval, map centers on user location                 | SATISFIED     | GeolocationStep has explanation text, useGeolocation hook, setCenter on success      |
| ONBR-04     | 05-03         | Single tooltip after onboarding: "Filtruj trasy tutaj" pointing to filter trigger                  | BLOCKED       | FilterTooltip.tsx exists and is substantive, OnboardingFlow sets the flag — but component is never mounted in any parent, so tooltip never renders |

### Anti-Patterns Found

| File                                           | Line | Pattern                           | Severity | Impact                                                    |
|------------------------------------------------|------|-----------------------------------|----------|-----------------------------------------------------------|
| `src/features/onboarding/FilterTooltip.tsx`    | —    | Orphaned component (never mounted) | Blocker  | ONBR-04 cannot be satisfied; tooltip never renders to user |
| `src/router.tsx`                               | 11-12 | Placeholder page components (FavoritesPage, ProfilePage) | Info  | Expected stubs for phase 6 — not blocking phase 5 goal |

### Human Verification Required

#### 1. End-to-End Invite Flow

**Test:** On a real device with Supabase deployed, visit `/invite?token=[valid-token]`, complete registration, receive magic link email, enter 6-digit OTP code.
**Expected:** Token validated, name+email form shown, OTP email received, entering code establishes session, redirects to /onboarding.
**Why human:** Requires live Supabase project, real email delivery, and browser interaction.

#### 2. Onboarding → Map Personalization

**Test:** Complete all 4 onboarding steps with dog name "Burek", select preferences (5-15 km, water required, gravel), approve GPS.
**Expected:** Dog name saved to DB, filter panel defaults to those preferences, map centers on GPS location.
**Why human:** Requires live Supabase + real GPS permission dialog.

#### 3. Auth Gate Bottom Sheet Visual Behavior

**Test:** Without authenticating, tap "Ulubione" tab.
**Expected:** Bottom sheet slides up from bottom with dog paw emoji, "Zaloguj sie, aby zapisac ulubione trasy" heading, and "Zaloguj sie" CTA button. Backdrop tap dismisses it.
**Why human:** Visual animation behavior and touch interaction cannot be verified via grep.

#### 4. Session Persistence on Refresh

**Test:** Sign in, refresh the browser, check that user is still recognized and shown the map (not redirected to /auth).
**Expected:** Loading spinner shown briefly, then map view with session intact.
**Why human:** Requires live browser with localStorage and Supabase session.

### Gaps Summary

One blocking gap prevents full goal achievement:

**FilterTooltip is orphaned.** The component `src/features/onboarding/FilterTooltip.tsx` is a complete, substantive implementation (34 lines, reads `showFilterTooltip` from UIStore, renders tooltip with auto-dismiss after 5s, has tap-to-dismiss). `OnboardingFlow.tsx` correctly sets `showFilterTooltip(true)` on completion. However, `FilterTooltip` is never imported or rendered in `AppLayout.tsx`, `MapView`, or any other component. This was flagged in the SUMMARY as a known gap ("FilterTooltip mounting point: add `<FilterTooltip />` inside AppLayout or MapView component").

The fix is minimal: add `import { FilterTooltip } from '../features/onboarding/FilterTooltip'` and `<FilterTooltip />` to `src/components/layout/AppLayout.tsx` (which already uses `relative` positioning context via its flex container).

All other 10 truths are fully verified with substantive implementations and correct wiring. The auth foundation (store, Edge Function, DB migration), the complete invite-to-session flow, the onboarding wizard, and the auth gate are all working.

---

_Verified: 2026-03-14T00:07:43Z_
_Verifier: Claude (gsd-verifier)_
