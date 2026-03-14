# Phase 5: Auth and Onboarding - Research

**Researched:** 2026-03-14
**Domain:** Supabase Auth (magic link + OTP), React Router v6 route guarding, Zustand auth store, 4-step onboarding flow
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Invite flow & validation:**
- `/invite?token=xyz` → Edge Function `validate-invite` checks token validity (not expired, not used)
- Valid token → registration form with name + email fields only (no password, no avatar)
- Expired/used token → Polish error message "Zaproszenie wygasło" + guidance "Poproś znajomego o nowe zaproszenie do Psi Szlak"
- `/auth` without invite context → "Dostęp tylko przez zaproszenie" (AUTH-04)
- Token consumed (used_by + used_at set) only AFTER magic link is successfully sent — if send fails, token stays valid for retry
- Token validation is server-side via Edge Function — token never trusted client-side

**Magic link + OTP experience:**
- After form submission: "Sprawdź swój email" screen with OTP 6-digit code input below
- User can either click magic link in email OR type the 6-digit OTP code (handles email scanner pre-fetch problem)
- "Wyślij ponownie" link with 60-second cooldown timer showing countdown, max 3 resends, then "Spróbuj później"
- Returning users at `/auth`: same flow — enter email, get magic link + OTP
- Session persists via Supabase localStorage (AUTH-06) — returning users rarely need to re-login

**Onboarding (4 steps):**
- Full-screen cards with progress dots at top, "Dalej" button at bottom
- Step 1 — Welcome: "Witaj, {name}! 🐾" + intro to Psi Szlak
- Step 2 — Dog: Imię psa (required) + rasa (optional). Dog name used in personalized empty states
- Step 3 — Walk preferences: Length (< 5km / 5-15km / > 15km) + water (ważny/obojętny) + surface (ziemia/żwir/asfalt/mieszana/obojętne). Values saved as default filters
- Step 4 — Geolocation: Explain why GPS needed, request permission. On approval → map centers on user location
- Skip policy: dog name is required, all other steps have "Pomiń" → defaults applied
- First-time detection: `user.dog_name is null` → onboarding. Returning user (dog_name exists) → straight to map
- Single tooltip after onboarding: "Filtruj trasy tutaj" pointing to filter trigger

**Route guarding & unauth experience:**
- Unauthenticated users CAN browse map and trail list (Mapa + Trasy tabs work fully)
- Ulubione and Profil tabs tap shows bottom sheet: "Zaloguj się, aby zapisać ulubione trasy 🐾" + "Dostęp tylko przez zaproszenie" + "Zaloguj się →" CTA
- Same bottom sheet pattern for any auth-gated action
- "Zaloguj się" button navigates to `/auth`

### Claude's Discretion
- Exact onboarding card animations/transitions
- OTP input field styling and auto-focus behavior
- Edge Function error response formats
- Session refresh strategy
- How to store walk preferences (extend users table or separate table)
- Tooltip implementation for "Filtruj trasy tutaj"

### Deferred Ideas (OUT OF SCOPE)
- AI-generated trail recommendations based on preferences
- Social login (Google, Apple) — magic link only
- Password auth
- Dog photo upload during onboarding
- Multiple dogs per user
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | New user arrives at `/invite?token=xyz`, token validated server-side via Edge Function | Edge Function pattern from `search-trails`; service role client with `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` |
| AUTH-02 | Valid token → registration form (name + email) → magic link sent → token consumed on success | `signInWithOtp({ email, options: { shouldCreateUser: true } })` then mark token used |
| AUTH-03 | Expired/used token shows clear Polish error message | Edge Function returns `{ valid: false, reason: 'expired' | 'used' }` → UI maps to Polish strings |
| AUTH-04 | `/auth` without invite context shows "Dostęp tylko przez zaproszenie" | Simple conditional: if no `?from=invite` query param → show gate message |
| AUTH-05 | Magic link click → session established → redirect to onboarding or map | Supabase implicit flow: `onAuthStateChange` fires `SIGNED_IN` on magic link click; emailRedirectTo points to app URL |
| AUTH-06 | Session persists across browser refresh via localStorage | Default Supabase behavior: `createClient` stores session in localStorage automatically |
| AUTH-07 | Invite tokens expire after 30 days (invitations.expires_at) | Schema already has `expires_at timestamptz default (now() + interval '30 days')`; Edge Function checks `expires_at > now()` |
| AUTH-08 | Unauthenticated users can browse trails and map but cannot favorite/log/profile | Auth store `isAuthenticated` boolean; BottomTabBar intercepts Ulubione/Profil taps |
| ONBR-01 | First-time user after magic link sees 4-step onboarding | React state machine: `step: 1 | 2 | 3 | 4`; trigger: `user.dog_name === null` |
| ONBR-02 | Dog name saved to `users.dog_name` and used in personalized empty states | `supabase.from('users').update({ dog_name }).eq('id', user.id)` with RLS "update own" |
| ONBR-03 | Geolocation step explains GPS; on approval map centers on user location | Reuse existing `useGeolocation` hook; navigate to `/` with viewport store updated |
| ONBR-04 | Single tooltip after onboarding: "Filtruj trasy tutaj" | One-shot flag in `useUIStore`; CSS-positioned tooltip pointing at filter trigger |
</phase_requirements>

---

## Summary

Phase 5 implements invite-only magic link auth with OTP fallback, a 4-step onboarding wizard, and route guarding via auth state. The core Supabase APIs are well-understood: `signInWithOtp` for sending magic links, `verifyOtp` for the 6-digit code path, and `onAuthStateChange` for reactive session tracking.

The most important architectural insight is the **dual-variable email template**: include both `{{ .ConfirmationURL }}` and `{{ .Token }}` in the same Magic Link template. This is officially supported and gives users both a clickable link and a code to type — the code path bypasses email scanner pre-fetch invalidation. The `verifyOtp({ email, token, type: 'email' })` call handles the code submission.

Auth state should live in a Zustand store (`useAuthStore`) initialized from `supabase.auth.getSession()` on mount and kept current via `onAuthStateChange`. The store must be initialized at the app root (`App.tsx`) so all components can read `session` and `user` synchronously. The `validate-invite` Edge Function follows the same pattern as the existing `search-trails` function, using the service role client to bypass RLS for token lookup.

**Primary recommendation:** Build in this order — (1) `useAuthStore` + `App.tsx` init, (2) `validate-invite` Edge Function + migration for `walk_preferences`, (3) `/invite` page components, (4) `/auth` returning-user flow, (5) onboarding wizard, (6) BottomTabBar auth interception.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | `^2.98.0` (installed) | Auth API: signInWithOtp, verifyOtp, onAuthStateChange | Already in project; v2 stable API |
| `zustand` | `^5.0.11` (installed) | Auth store (session, user, loading state) | Already used for filters/ui/viewport stores |
| `react-router-dom` | `^7.13.1` (installed) | Route definitions; `/invite`, `/auth`, `/onboarding` | Already used; hooks `useNavigate`, `useSearchParams` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | `^0.577.0` (installed) | Icons in auth/onboarding UI (Mail, Check, ChevronRight) | Already in project |
| Supabase Dashboard email templates | N/A | Customize Magic Link template to include both URL and Token | One-time config, not code |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand auth store | React Context + useReducer | Context has prop-drilling; Zustand consistent with existing stores |
| Custom OTP countdown | `setTimeout` in component | `useRef`-based interval is simpler and avoids stale closure |

**Installation:** No new packages needed — all dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stores/
│   └── auth.ts                    # NEW: useAuthStore (session, user, profile)
├── hooks/
│   └── useAuth.ts                 # NEW: thin wrapper around useAuthStore
├── features/
│   ├── auth/
│   │   ├── InvitePage.tsx         # /invite?token=xyz
│   │   ├── AuthPage.tsx           # /auth (returning users)
│   │   ├── RegisterForm.tsx       # name + email form after valid invite
│   │   ├── MagicLinkSent.tsx      # "Sprawdź email" + OTP input + resend
│   │   └── AuthGateSheet.tsx      # Bottom sheet for unauth action intercept
│   └── onboarding/
│       ├── OnboardingFlow.tsx     # 4-step wizard controller
│       ├── WelcomeStep.tsx        # Step 1
│       ├── DogStep.tsx            # Step 2 (dog name + breed)
│       ├── PreferencesStep.tsx    # Step 3 (walk preferences)
│       └── GeolocationStep.tsx   # Step 4
├── components/
│   └── ui/
│       └── BottomTabBar.tsx       # MODIFY: auth-aware tab interception
└── components/
    └── layout/
        └── AppLayout.tsx          # MODIFY: render AuthGateSheet when needed
supabase/
└── functions/
    └── validate-invite/
        └── index.ts               # NEW: Edge Function
supabase/
└── migrations/
    └── YYYYMMDD_add_walk_preferences.sql  # NEW: users.walk_preferences or separate table
```

### Pattern 1: Auth Store Init at App Root
**What:** Initialize Supabase session in Zustand store at app startup, keep synced via `onAuthStateChange`.
**When to use:** App-wide auth state required by BottomTabBar, route guards, and feature components.

```typescript
// src/stores/auth.ts
import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import type { User as AppUser } from '../lib/types'

interface AuthState {
  session: Session | null
  user: User | null           // Supabase auth user
  profile: AppUser | null     // public.users row
  loading: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: AppUser | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}))
```

```typescript
// src/App.tsx — initialize once at root
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAuthStore } from './stores/auth'

export function App() {
  const { setSession, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        supabase.from('users').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data))
      }
      setLoading(false)
    })

    // Subscribe to auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) {
          supabase.from('users').select('*').eq('id', session.user.id).single()
            .then(({ data }) => setProfile(data))
        } else {
          setProfile(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // ...render RouterProvider
}
```
Source: Supabase onAuthStateChange docs — keep callbacks lightweight, no async/await

### Pattern 2: signInWithOtp + verifyOtp Dual-Path
**What:** Send magic link + OTP code in one email; handle both verification paths.
**When to use:** New user registration and returning user sign-in.

```typescript
// Send magic link + OTP (same call)
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,       // for new users (invite flow)
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})

// Verify OTP code (user typed 6-digit code)
const { data, error } = await supabase.auth.verifyOtp({
  email,
  token: otpCode,   // 6-digit string entered by user
  type: 'email',
})
// On success: data.session is set, onAuthStateChange fires SIGNED_IN
```
Source: supabase.com/docs/reference/javascript/auth-verifyotp

**Email template config (Supabase Dashboard → Auth → Email Templates → Magic Link):**
```html
<p>Kliknij link, aby się zalogować:</p>
<a href="{{ .ConfirmationURL }}">Zaloguj się do Psi Szlak</a>
<p>Lub wpisz kod: <strong>{{ .Token }}</strong></p>
```
Both variables in same template = both magic link AND OTP code sent — officially supported.

### Pattern 3: validate-invite Edge Function
**What:** Server-side token validation using service role client (bypasses RLS).
**When to use:** `/invite?token=xyz` page load; token must never be validated client-side.

```typescript
// supabase/functions/validate-invite/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { token } = await req.json()

  // Service role client bypasses RLS
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data, error } = await adminClient
    .from('invitations')
    .select('id, expires_at, used_at, used_by')
    .eq('token', token)
    .single()

  if (error || !data) {
    return new Response(JSON.stringify({ valid: false, reason: 'not_found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const isExpired = new Date(data.expires_at) < new Date()
  const isUsed = data.used_at !== null

  if (isExpired) return new Response(JSON.stringify({ valid: false, reason: 'expired' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  if (isUsed) return new Response(JSON.stringify({ valid: false, reason: 'used' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  return new Response(JSON.stringify({ valid: true, invitation_id: data.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
```
Pattern matches existing `search-trails` Edge Function — use `SUPABASE_SERVICE_ROLE_KEY` env var (auto-injected in Supabase functions).

### Pattern 4: BottomTabBar Auth Interception
**What:** Intercept taps on Ulubione/Profil tabs for unauthenticated users; show bottom sheet instead of navigating.
**When to use:** Replaces NavLink default behavior for locked tabs.

```typescript
// src/components/ui/BottomTabBar.tsx (modified)
const { session } = useAuthStore()
const [showAuthSheet, setShowAuthSheet] = useState(false)

// For locked tabs, use onClick instead of NavLink navigation:
const handleProtectedTab = (e: React.MouseEvent) => {
  if (!session) {
    e.preventDefault()
    setShowAuthSheet(true)
  }
}
```

### Pattern 5: Magic Link Callback Route
**What:** Handle magic link click redirect in SPA. For implicit flow (default), Supabase JS client automatically parses the URL hash fragment on page load and fires `onAuthStateChange('SIGNED_IN', session)`.
**When to use:** User clicks magic link in email, browser navigates to `emailRedirectTo` URL.

For the **implicit flow** (correct choice for this Vite SPA):
- Set `emailRedirectTo` to `${window.location.origin}` (root URL)
- Supabase client auto-reads `#access_token=...&refresh_token=...` from the URL hash
- `onAuthStateChange` fires `SIGNED_IN` — auth store updates
- After `SIGNED_IN`, check `profile.dog_name === null` → navigate to `/onboarding` or stay at `/`
- No separate `/auth/callback` route needed for implicit flow

```typescript
// In App.tsx onAuthStateChange handler:
supabase.auth.onAuthStateChange((event, session) => {
  setSession(session)
  if (event === 'SIGNED_IN' && session) {
    // Fetch profile to check onboarding status
    supabase.from('users').select('*').eq('id', session.user.id).single()
      .then(({ data: profile }) => {
        setProfile(profile)
        if (!profile?.dog_name) {
          // First time — redirect to onboarding
          navigate('/onboarding')
        }
      })
  }
})
```

### Pattern 6: Walk Preferences Storage
**What:** Store walk preferences gathered in onboarding step 3.
**When to use:** After onboarding step 3 completion — set as default filters.

**Recommendation (Claude's discretion):** Extend `public.users` table with a `walk_preferences` JSONB column. Rationale: preferences are 1:1 with user, JSONB is flexible for adding fields later, no JOIN needed.

```sql
-- Migration: add walk_preferences to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS walk_preferences jsonb;
```

```typescript
// Save at step 3 completion
await supabase.from('users').update({
  walk_preferences: { length: 'medium', water: 'any', surface: 'dirt' }
}).eq('id', user.id)

// Apply as defaults to filter store
useFiltersStore.getState().setLength(prefs.length)
useFiltersStore.getState().setWater(prefs.water)
useFiltersStore.getState().setSurface(prefs.surface)
```

### Anti-Patterns to Avoid
- **Async in onAuthStateChange callback:** "Limit the number of await calls in async callbacks" — defer Supabase calls to prevent deadlocks. Use `.then()` instead of `await` inside the callback.
- **Validating invite token client-side:** Token must go to Edge Function. Never trust `expires_at` or `used_at` read from client-side Supabase query.
- **Calling `getSession()` repeatedly:** Call once on mount; use `onAuthStateChange` for updates. Repeated `getSession()` on each component mount causes unnecessary network requests.
- **PKCE flow for this SPA:** Use implicit flow (default). PKCE requires server-side callback handling; this is a client-only Vite SPA with no SSR.
- **shouldCreateUser: false for invite flow:** The invite flow creates NEW users, so `shouldCreateUser: true` (default) is correct. `shouldCreateUser: false` is for returning-user-only flows.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session persistence | Custom localStorage session storage | Supabase default localStorage strategy | `createClient` auto-persists and auto-refreshes tokens |
| Token refresh | Manual JWT refresh logic | Supabase auto-refresh | `@supabase/supabase-js` refreshes access tokens automatically before expiry |
| Email delivery | Custom SMTP integration | Supabase Auth email | Built-in, configurable templates |
| Invite token generation | Custom `crypto.randomUUID()` logic | Already in schema: `encode(extensions.gen_random_bytes(24), 'hex')` | Already exists in `invitations` table default |
| OTP rate limiting | Custom attempt counter | Supabase built-in: 1 OTP per 60s, expires after 1hr | Configurable in Auth dashboard, not code |

**Key insight:** Supabase handles all auth plumbing. The custom work in this phase is: (1) the invite validation Edge Function, (2) the React UI flows, (3) the auth store pattern.

---

## Common Pitfalls

### Pitfall 1: Magic Link Pre-fetch Invalidation
**What goes wrong:** Corporate email scanners (Microsoft Defender, Proofpoint) GET the magic link URL before the user clicks it, consuming the token. User clicks link → "Token expired" error.
**Why it happens:** Email security software follows all URLs in emails to check for malware.
**How to avoid:** Include BOTH `{{ .ConfirmationURL }}` and `{{ .Token }}` in email template. The OTP code path (`verifyOtp`) does not involve a URL and cannot be pre-fetched. The "Sprawdź email" UI must ALWAYS show the OTP input, not only as fallback.
**Warning signs:** Users report "link doesn't work" on corporate email domains.

### Pitfall 2: Async in onAuthStateChange Deadlock
**What goes wrong:** Using `await` inside `onAuthStateChange` callback can deadlock the Supabase client internals.
**Why it happens:** The auth state change handler runs synchronously; awaiting another Supabase call re-enters the client.
**How to avoid:** Use `.then()` chains inside the callback, never `async/await`. Or fire-and-forget with `void supabase.from(...)`.
**Warning signs:** Auth state updates stall, session never resolves after sign-in.

### Pitfall 3: invite token consumed before confirming email send
**What goes wrong:** Token marked used before `signInWithOtp` call succeeds. Email send fails. User cannot retry.
**Why it happens:** Optimistic token consumption.
**How to avoid:** Only mark token `used_by + used_at` AFTER `signInWithOtp` returns without error. The `validate-invite` Edge Function only validates; the `consume-invite` step (UPDATE invitations SET used_by, used_at) runs in client code AFTER successful `signInWithOtp`.
**Warning signs:** User sees "Zaproszenie wygasło" on retry after email delivery failure.

### Pitfall 4: onboarding redirect loop
**What goes wrong:** After completing onboarding and setting `dog_name`, navigation to `/` triggers `onAuthStateChange` again, which reads stale profile (dog_name still null), redirects back to `/onboarding`.
**Why it happens:** Profile update in DB not yet reflected when onAuthStateChange fires.
**How to avoid:** Update the auth store's `profile.dog_name` locally (optimistic) immediately when onboarding step 2 saves. Don't re-check `dog_name` from DB on every `SIGNED_IN` event — only check on first `INITIAL_SESSION` or explicit page load.
**Warning signs:** Infinite redirect between `/onboarding` and `/` after completing onboarding.

### Pitfall 5: Token validation RLS gap
**What goes wrong:** `invitations` table policy is "read own created" — client cannot query tokens they didn't create. Edge Function must use service role.
**Why it happens:** Existing RLS policy intentionally blocks public token lookup.
**How to avoid:** Always use `SUPABASE_SERVICE_ROLE_KEY` in the `validate-invite` Edge Function (auto-injected, no manual setup needed).
**Warning signs:** Edge Function returns `not_found` for valid tokens.

### Pitfall 6: Supabase vitest.config.ts includes .tsx files
**What goes wrong:** Current `vitest.config.ts` has `include: ['src/**/*.test.ts']` — `.tsx` test files are excluded.
**Why it happens:** Phase 1/2 tests were `.ts` only. Component tests need `.tsx`.
**How to avoid:** Update `include` to `['src/**/*.test.{ts,tsx}']` in Wave 0.
**Warning signs:** Component tests run 0 tests without error.

---

## Code Examples

### OTP 6-digit Input with Auto-advance
```typescript
// Source: project pattern — OTP input
// 6 separate single-char inputs with auto-focus advance
function OtpInput({ onComplete }: { onComplete: (code: string) => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    if (value && index < 5) inputs.current[index + 1]?.focus()
    if (next.every(Boolean)) onComplete(next.join(''))
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          className="w-12 h-14 text-center text-xl font-bold bg-bg-surface border border-bg-elevated rounded-lg text-text-primary focus:border-accent focus:outline-none"
        />
      ))}
    </div>
  )
}
```

### Resend Cooldown Timer
```typescript
// Resend with 60s cooldown, max 3 attempts
function useResendCooldown(maxResends = 3) {
  const [cooldown, setCooldown] = useState(0)
  const [resendCount, setResendCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCooldown = () => {
    setCooldown(60)
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const resend = async (sendFn: () => Promise<void>) => {
    if (cooldown > 0 || resendCount >= maxResends) return
    await sendFn()
    setResendCount((n) => n + 1)
    startCooldown()
  }

  return { cooldown, resendCount, resend, exhausted: resendCount >= maxResends }
}
```

### Onboarding Step Navigation
```typescript
// OnboardingFlow.tsx — state machine for 4 steps
const STEPS = 4
function OnboardingFlow() {
  const [step, setStep] = useState(1)
  const { profile, setProfile } = useAuthStore()
  const navigate = useNavigate()

  const handleComplete = async () => {
    // Final step done — navigate to map with tooltip flag
    useUIStore.getState().setShowFilterTooltip(true)
    navigate('/')
  }

  return (
    <div className="fixed inset-0 bg-bg-base flex flex-col">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-safe-top pt-4">
        {Array.from({ length: STEPS }, (_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i + 1 <= step ? 'bg-accent' : 'bg-bg-elevated'}`} />
        ))}
      </div>
      {/* Step content */}
      {step === 1 && <WelcomeStep name={profile?.display_name} onNext={() => setStep(2)} />}
      {step === 2 && <DogStep onNext={() => setStep(3)} />}
      {step === 3 && <PreferencesStep onNext={() => setStep(4)} onSkip={() => setStep(4)} />}
      {step === 4 && <GeolocationStep onNext={handleComplete} onSkip={handleComplete} />}
    </div>
  )
}
```

### validate-invite Edge Function — Consume Token Pattern
```typescript
// Client code after successful signInWithOtp — consume the invite
// Called only when signInWithOtp succeeds (no error)
async function consumeInvite(invitationId: string, userId: string) {
  // This runs as the user (they are now in the DB via auth trigger)
  // But used_by update requires service role — call another Edge Function
  // OR: use a DB trigger on auth.users INSERT to auto-consume invitation
  // Recommendation: use a Postgres function called via RPC
}
```

**Note:** Token consumption requires UPDATE on `invitations` with `used_by` (a foreign key to `users`). The new user's `users` row is created by a DB trigger on `auth.users` INSERT (standard Supabase pattern). The cleanest approach: a `consume_invite(token text, user_id uuid)` Postgres function invoked via `supabase.rpc('consume_invite', { token, user_id })` with `SECURITY DEFINER` to bypass RLS.

---

## Database Schema Additions Required

### Migration: users.walk_preferences + users row trigger
```sql
-- Add walk_preferences to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS walk_preferences jsonb;

-- Trigger: auto-create users row on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SECURITY DEFINER function for consuming invites
CREATE OR REPLACE FUNCTION public.consume_invite(p_token text, p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.invitations
  SET used_by = p_user_id, used_at = now()
  WHERE token = p_token AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Why trigger matters:** When `signInWithOtp` creates a new auth.users row, the `public.users` row must also exist for RLS policies to function. Without this trigger, subsequent queries on `public.users` return empty for new users.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase implicit flow only | PKCE recommended for SSR, implicit still valid for CSR SPAs | 2023+ | Vite SPA: keep implicit. Don't add PKCE complexity. |
| Separate OTP email template | Both `{{ .ConfirmationURL }}` + `{{ .Token }}` in one template | Always supported | Dual-path in one email — email scanner safe |
| `supabase.auth.session()` (deprecated) | `supabase.auth.getSession()` | v2 breaking change | Use getSession() |
| Manually refreshing session | Auto-refresh by supabase-js client | v2 default | No code needed |

**Deprecated/outdated:**
- `supabase.auth.session()`: replaced by `supabase.auth.getSession()` in v2
- `supabase.auth.user()`: replaced by `session.user` from `getSession()` or `onAuthStateChange`

---

## Open Questions

1. **Where does invite token consumption happen atomically?**
   - What we know: Token must be consumed only after successful magic link send; update needs service role or SECURITY DEFINER function
   - What's unclear: Whether `signInWithOtp` triggers a webhook that could be used, or if client-side RPC is sufficient
   - Recommendation: Use `SECURITY DEFINER` Postgres function `consume_invite(token, user_id)` called via `supabase.rpc()` after onboarding step 1 saves `display_name`. This keeps the token valid through the email send, and consumation happens once the user proves they received the email (by completing name step of onboarding).

2. **`/auth/callback` route needed?**
   - What we know: Implicit flow handles magic link via URL hash fragment automatically. No callback route needed for the magic link click path.
   - What's unclear: Whether Supabase dashboard "Site URL" needs to be set to root or a specific callback path
   - Recommendation: Set `emailRedirectTo: window.location.origin` in `signInWithOtp`. The root page handles the hash on load via `onAuthStateChange`. No separate route needed.

3. **Tooltip implementation for ONBR-04**
   - What we know: Single tooltip "Filtruj trasy tutaj" after onboarding; no library decided
   - What's unclear: CSS positioning vs. portal vs. floating-ui
   - Recommendation: Use a simple absolute-positioned div with `useUIStore.showFilterTooltip` boolean. The filter trigger button in `MapView` is in a known position — CSS `absolute` tooltip with arrow pointing down is sufficient. No floating-ui needed.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16.x |
| Config file | `vitest.config.ts` (root, needs `include` update for `.tsx`) |
| Quick run command | `npx vitest run src/features/auth` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | validate-invite returns valid/invalid/expired/used | unit (Edge Fn mock) | `npx vitest run src/features/auth/validateInvite.test.ts` | Wave 0 |
| AUTH-02 | RegisterForm submits correctly; shows MagicLinkSent on success | unit | `npx vitest run src/features/auth/RegisterForm.test.tsx` | Wave 0 |
| AUTH-03 | InvitePage shows Polish error messages for invalid tokens | unit | `npx vitest run src/features/auth/InvitePage.test.tsx` | Wave 0 |
| AUTH-04 | AuthPage without invite context shows gate message | unit | `npx vitest run src/features/auth/AuthPage.test.tsx` | Wave 0 |
| AUTH-05 | onAuthStateChange SIGNED_IN redirects to onboarding/map | unit | `npx vitest run src/stores/auth.test.ts` | Wave 0 |
| AUTH-06 | Session persists (localStorage) | manual smoke | N/A — Supabase client behavior, not testable in unit | N/A |
| AUTH-07 | Token expires after 30 days | unit (date mock) | `npx vitest run src/features/auth/validateInvite.test.ts` | Wave 0 |
| AUTH-08 | BottomTabBar intercepts Ulubione/Profil when unauthenticated | unit | `npx vitest run src/components/ui/BottomTabBar.test.tsx` | Wave 0 |
| ONBR-01 | OnboardingFlow renders correct step component | unit | `npx vitest run src/features/onboarding/OnboardingFlow.test.tsx` | Wave 0 |
| ONBR-02 | DogStep saves dog_name to profile (mock supabase) | unit | `npx vitest run src/features/onboarding/DogStep.test.tsx` | Wave 0 |
| ONBR-03 | GeolocationStep calls useGeolocation.locate() | unit | `npx vitest run src/features/onboarding/GeolocationStep.test.tsx` | Wave 0 |
| ONBR-04 | Tooltip renders after onboarding completion | unit | `npx vitest run src/features/onboarding/OnboardingFlow.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/features/auth src/features/onboarding src/stores/auth.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — update `include` to `['src/**/*.test.{ts,tsx}']` (current only matches `.ts`)
- [ ] `src/stores/auth.test.ts` — covers AUTH-05, AUTH-06
- [ ] `src/features/auth/InvitePage.test.tsx` — covers AUTH-01, AUTH-03
- [ ] `src/features/auth/RegisterForm.test.tsx` — covers AUTH-02
- [ ] `src/features/auth/AuthPage.test.tsx` — covers AUTH-04
- [ ] `src/features/auth/validateInvite.test.ts` — covers AUTH-07 (date mock test)
- [ ] `src/components/ui/BottomTabBar.test.tsx` — covers AUTH-08
- [ ] `src/features/onboarding/OnboardingFlow.test.tsx` — covers ONBR-01, ONBR-04
- [ ] `src/features/onboarding/DogStep.test.tsx` — covers ONBR-02
- [ ] `src/features/onboarding/GeolocationStep.test.tsx` — covers ONBR-03

---

## Sources

### Primary (HIGH confidence)
- [supabase.com/docs/reference/javascript/auth-signinwithotp](https://supabase.com/docs/reference/javascript/auth-signinwithotp) — signInWithOtp params, shouldCreateUser, emailRedirectTo
- [supabase.com/docs/reference/javascript/auth-verifyotp](https://supabase.com/docs/reference/javascript/auth-verifyotp) — verifyOtp params, type: 'email', token_hash vs token
- [supabase.com/docs/reference/javascript/auth-onauthstatechange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange) — events (SIGNED_IN, SIGNED_OUT, INITIAL_SESSION, TOKEN_REFRESHED), async callback warning
- [supabase.com/docs/guides/auth/auth-email-templates](https://supabase.com/docs/guides/auth/auth-email-templates) — template variables including both `{{ .ConfirmationURL }}` and `{{ .Token }}` simultaneously
- [supabase.com/docs/guides/auth/passwordless-login/auth-email-otp](https://supabase.com/docs/guides/auth/passwordless-login/auth-email-otp) — complete OTP flow with verifyOtp syntax
- Project codebase — existing types.ts, stores, migrations, search-trails Edge Function pattern

### Secondary (MEDIUM confidence)
- [supabase.com/docs/guides/auth/quickstarts/react](https://supabase.com/docs/guides/auth/quickstarts/react) — implicit flow for SPA, token_hash URL param pattern, emailRedirectTo config
- [github.com/orgs/supabase/discussions/19806](https://github.com/orgs/supabase/discussions/19806) — community confirmation that both template variables work simultaneously

### Tertiary (LOW confidence)
- WebSearch results on email scanner pre-fetch — consistent across multiple sources, aligns with STATE.md decision
- Community pattern for SECURITY DEFINER consume_invite function — common Supabase pattern, not in official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, APIs verified against official docs
- Architecture: HIGH — patterns verified against official Supabase JS v2 docs; existing project code patterns confirmed
- Pitfalls: HIGH for auth/OTP issues (multiple sources); MEDIUM for consume_invite atomicity (common pattern, not officially documented)
- Email template dual-variable: MEDIUM — officially listed in docs as supported, but community report of historic bug; recommend testing in dev

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (Supabase JS v2 API is stable; 30-day horizon)
