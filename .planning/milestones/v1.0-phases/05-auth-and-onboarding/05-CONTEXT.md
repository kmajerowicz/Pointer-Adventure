# Phase 5: Auth and Onboarding - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Invite-only magic link auth with OTP fallback, 4-step onboarding (welcome → dog → preferences → geolocation), dog-name personalization, and route guarding for unauthenticated users. Users join via invite link, complete onboarding to build their profile, and get a personalized map experience. Favorites, activity logging, and profile features are Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Invite flow & validation
- `/invite?token=xyz` → Edge Function `validate-invite` checks token validity (not expired, not used)
- Valid token → registration form with name + email fields only (no password, no avatar)
- Expired/used token → Polish error message "Zaproszenie wygasło" + guidance "Poproś znajomego o nowe zaproszenie do Psi Szlak"
- `/auth` without invite context → "Dostęp tylko przez zaproszenie" (AUTH-04)
- Token consumed (used_by + used_at set) only AFTER magic link is successfully sent — if send fails, token stays valid for retry
- Token validation is server-side via Edge Function — token never trusted client-side

### Magic link + OTP experience
- After form submission: "Sprawdź swój email" screen with OTP 6-digit code input below
- User can either click magic link in email OR type the 6-digit OTP code (handles email scanner pre-fetch problem per STATE.md)
- "Wyślij ponownie" link with 60-second cooldown timer showing countdown, max 3 resends, then "Spróbuj później"
- Returning users at `/auth`: same flow — enter email, get magic link + OTP
- Session persists via Supabase localStorage (AUTH-06) — returning users rarely need to re-login

### Onboarding (4 steps)
- Full-screen cards with progress dots at top, "Dalej" button at bottom
- **Step 1 — Welcome:** "Witaj, {name}! 🐾" + intro to Psi Szlak
- **Step 2 — Dog:** Imię psa (required) + rasa (optional). Dog name used in personalized empty states throughout app (ONBR-02)
- **Step 3 — Walk preferences:** Length preference (< 5km / 5-15km / > 15km) + water access (ważny / obojętny) + surface preference (ziemia / żwir / asfalt / mieszana / obojętne). Values saved as default filters
- **Step 4 — Geolocation:** Explain why GPS is needed, request permission. On approval → map centers on user location with first trails loaded (ONBR-03)
- Skip policy: dog name is required, all other steps have "Pomiń" → defaults applied
- First-time detection: `user.dog_name is null` → onboarding. Returning user (dog_name exists) → straight to map
- Single tooltip after onboarding: "Filtruj trasy tutaj" pointing to filter trigger (ONBR-04)

### Route guarding & unauth experience
- Unauthenticated users CAN browse map and trail list (Mapa + Trasy tabs work fully)
- Ulubione and Profil tabs look normal (no visual lock indicator) but tap shows bottom sheet: "Zaloguj się, aby zapisać ulubione trasy 🐾" + "Dostęp tylko przez zaproszenie" + "Zaloguj się →" CTA
- Same bottom sheet pattern for any auth-gated action (heart, activity log, profile)
- "Zaloguj się" button in bottom sheet navigates to `/auth`

### Claude's Discretion
- Exact onboarding card animations/transitions
- OTP input field styling and auto-focus behavior
- Edge Function error response formats
- Session refresh strategy
- How to store walk preferences (extend users table or separate table)
- Tooltip implementation for "Filtruj trasy tutaj"

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `supabase` client (src/lib/supabase.ts): Ready for auth API calls (signInWithOtp, verifyOtp, onAuthStateChange)
- `User` interface (src/lib/types.ts): Has `display_name`, `dog_name`, `avatar_url`
- `Invitation` interface (src/lib/types.ts): Has `token`, `created_by`, `used_by`, `used_at`, `expires_at`
- `useFiltersStore` (src/stores/filters.ts): Already has all filter types (length, surface, water, difficulty, distance, marked) — onboarding preferences can set these as defaults
- `BottomTabBar` (src/components/ui/BottomTabBar.tsx): Needs auth-aware conditional behavior for Ulubione/Profil tabs

### Established Patterns
- Edge Functions in `supabase/functions/` (search-trails exists as reference)
- Zustand for client state — auth store should follow same pattern
- Toast pattern from Phase 1/2 — reuse for auth feedback
- Dark theme, design tokens from `src/index.css`
- Polish language UI throughout

### Integration Points
- `router.tsx`: `/invite` and `/auth` routes are stubs — replace with real components
- `supabase/migrations/`: Schema has `users` (linked to auth.users), `invitations` with RLS
- Supabase Auth: magic link via `supabase.auth.signInWithOtp({ email })`, OTP via `supabase.auth.verifyOtp()`
- `BottomTabBar`: Needs to know auth state to show bottom sheet on locked tabs
- Walk preferences from onboarding → set as default values in `useFiltersStore`

</code_context>

<specifics>
## Specific Ideas

- OTP fallback is critical — email scanners at companies pre-fetch magic links, invalidating them. The "Sprawdź email" screen must always show the OTP input
- Onboarding should feel warm and dog-themed, not like a corporate signup
- Walk preferences gathered in onboarding become the user's default filter settings — personalization from first interaction
- Bottom sheet for auth gates is non-intrusive — doesn't scare away users who are just browsing

</specifics>

<deferred>
## Deferred Ideas

- AI-generated trail recommendations based on preferences — future phase
- Social login (Google, Apple) — out of scope, magic link only
- Password auth — out of scope per requirements
- Dog photo upload during onboarding — future enhancement
- Multiple dogs per user — future phase

</deferred>

---

*Phase: 05-auth-and-onboarding*
*Context gathered: 2026-03-14*
