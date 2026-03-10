# Domain Pitfalls

**Domain:** Map-centric PWA — dog-friendly trail discovery (Psi Szlak)
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH (core pitfalls verified via official docs and GitHub issues; some mitigations from community sources)

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or hard-to-debug runtime failures in production.

---

### Pitfall 1: Overpass API Rate Limiting From a Single Edge Function IP

**What goes wrong:**
The public Overpass API (`overpass-api.de`) enforces per-IP slot-based rate limiting. Each query consumes a slot for its full execution time plus a cooldown period proportional to query complexity. If the Edge Function sends concurrent or rapid sequential queries — for example, when multiple users pan the map at the same time — all requests originate from Supabase's outbound IP range. The server returns HTTP 429 and all in-flight queries are dropped. Because the Edge Function shares an IP with all other Supabase-hosted functions worldwide, a burst from any other tenant can steal your available slots.

**Why it happens:**
- No debounce on the Zustand `viewport` store: every pan/zoom pixel fires a Zustand update (already flagged in CONCERNS.md)
- Edge Function lacks a guard against concurrent execution: two map tabs open = two simultaneous Overpass queries from same IP
- bbox_hash exact-match cache miss on slightly-shifted viewport = unnecessary new Overpass fetch

**Consequences:**
- Trail data silently absent from map for minutes during server load peaks
- Retry storms: if the frontend retries on error without backoff, it worsens the block
- 10+ second query times for hiking relation geometries over large bboxes, hitting Overpass's default 3-minute timeout on complex queries

**Warning signs:**
- HTTP 429 responses in Edge Function logs with no local explanation
- Trail data loads fine in morning, fails in afternoon (Overpass server load varies by time of day)
- `[out:json][timeout:25]` queries timing out on Poland-scale bboxes

**Prevention:**
1. Add `[timeout:60]` and `[maxsize:33554432]` (32 MB) to every Overpass QL query header
2. Set a mutex/semaphore in the Edge Function: return cached data if a query for the same approximate area is already in flight (store in-progress bbox in a short-lived Supabase row or KV)
3. Debounce the map `moveend` handler to 500ms minimum before triggering Edge Function call
4. Use `relation["route"="hiking"]["network"="lwn"|"rwn"]["osmc:symbol"]` to narrow results to marked PTTK-style trails only — reduces result size dramatically vs. bare `route=hiking`
5. Add `Retry-After` header parsing: if Overpass returns 429, wait the indicated seconds before retrying
6. Cache aggressively: the `search_areas` bbox_hash cache is the primary defense — a hit avoids Overpass entirely. Pre-warm cache for high-traffic regions (Tatry, Bieszczady, Beskidy) at deploy time

**Phase:** Phase 2 (Trail Pipeline / Edge Function)

---

### Pitfall 2: Mapbox GL JS WebGL Context Leak on Navigation

**What goes wrong:**
Mapbox GL JS allocates a WebGL rendering context per `Map` instance. Browsers enforce a hard limit of 8–16 active WebGL contexts. In a React SPA, if the `MapView` component unmounts and remounts (e.g., user navigates to /trails then back to /) without properly calling `map.remove()` in the `useEffect` cleanup, each mount creates a new context without releasing the old one. After 8 navigations, the browser issues "Too many active WebGL contexts. Oldest context will be lost." and the map renders as a black rectangle.

**Why it happens:**
- React Strict Mode in development mounts components twice — map initializes twice without cleanup
- `map.remove()` is known to not release all Safari iOS listeners (contextLost/contextRestored events remain attached)
- Controls like `FullscreenControl` attach `document` event listeners referencing the map instance — `map.remove()` does not guarantee all are cleared
- GeoJSON `source.setData()` called repeatedly doubles memory per call (data retained in worker thread AND `_data` member)

**Warning signs:**
- Chrome DevTools Memory tab shows steady heap growth on tab-switching
- "Too many active WebGL contexts" warning in console
- Map turns black/blank after navigating away and returning several times
- iOS Safari crash after ~10 minutes of map use

**Prevention:**
1. Store the map instance in a `useRef`, never in state. Initialize only once inside a `useEffect(() => { ... return () => map.remove(); }, [])` with an empty dependency array
2. Use a single persistent `Map` instance: keep the map mounted permanently in `AppLayout`, hide it with CSS (`visibility: hidden` / `position: absolute; z-index: -1`) when the map tab is not active rather than unmounting the component
3. Call `map.remove()` exactly once in the `useEffect` return function — never in event handlers or conditionally
4. For trail GeoJSON updates, replace `source.setData(newData)` with a diff strategy: remove layers/sources only when bbox changes significantly, otherwise filter client-side using `map.setFilter()`
5. Set a source `tolerance` value (e.g., `0.375`) to simplify polyline geometry and reduce worker memory pressure
6. Pin `mapbox-gl` to an exact version (e.g., `3.19.1`) rather than `^3.19.1` to avoid surprise memory regressions from minor version upgrades

**Phase:** Phase 1 (Map) — establish correct lifecycle from day one; very hard to retrofit

---

### Pitfall 3: Supabase Edge Function Timeout on Overpass Fetch

**What goes wrong:**
The Edge Function must: receive the request, query Overpass (network round-trip + server processing), parse and normalize the response, write to Supabase, and return results — all within the **150-second wall-clock limit** on the free tier. A single Overpass query for hiking relations across a 200km² bbox can take 15–90 seconds depending on server load. If Overpass is slow AND the Edge Function attempts retries, the wall-clock limit is easily exceeded. The client receives a 504 Gateway Timeout with no trail data and no useful error message.

**Why it happens:**
- Overpass server processing time is unpredictable and outside our control
- Cold start adds ~200–500ms before any I/O begins (reduced but not eliminated after Deno 2 upgrade)
- CPU time limit is 200ms active compute: heavy JSON parsing of large Overpass FeatureCollections counts against this
- No streaming response — the Edge Function must receive the full Overpass response before writing to Supabase

**Warning signs:**
- 504 errors in Supabase Edge Function logs tagged `wall_clock_time_limit_reached`
- Trail fetches succeed in morning but time out in European afternoon (Overpass peak hours)
- Large response payloads (>5 MB) from Overpass for dense hiking regions like Tatry

**Prevention:**
1. Set a hard per-attempt Overpass timeout lower than the Edge Function limit: use `[timeout:45]` in OverpassQL so Overpass aborts and returns a partial or empty result rather than holding the connection open
2. Implement a 2-attempt budget: first try with full bbox, if that times out retry with a reduced bbox (split in half); never retry more than twice
3. Return `202 Accepted` with cached (possibly stale) data immediately, then continue processing in the background — but note this requires Pro tier for background tasks exceeding 150s; on free tier, return whatever is in cache instantly and fetch async only if cache is cold
4. Parse Overpass JSON incrementally if possible, or increase `[maxsize]` rather than letting the server truncate mid-stream
5. Move heavy normalization (coordinate simplification, tag extraction) out of the single fetch path into a separate scheduled function or client-side post-processing

**Phase:** Phase 2 (Trail Pipeline) — design the timeout budget into the architecture from the start

---

### Pitfall 4: PWA Service Worker Caching Mapbox Tiles as Opaque Responses

**What goes wrong:**
Mapbox GL JS fetches map tiles from `api.mapbox.com`, `tiles.mapbox.com`, and CDN hosts. The existing Workbox config in `vite.config.ts` only matches `^https://api.mapbox.com/.*` — meaning CDN tile requests are never cached. More dangerously, tile requests made without CORS headers return **opaque responses** (status 0). Workbox by default refuses to cache opaque responses, so the "cache 10 trails for offline" promise is broken by default. If you force-cache opaque responses, Chrome inflates each cached tile to ~7 MB minimum for quota accounting purposes, exhausting the 50 MB typical PWA storage budget within a single map session.

A second failure mode: after a new deploy, the service worker may serve stale cached assets including old JS bundles while the new service worker waits to activate (`skipWaiting` not set), causing mixed old/new code in a single session.

**Warning signs:**
- Chrome DevTools Application > Cache Storage shows map tile cache is empty despite offline mode being active
- Console shows `FetchEvent.respondWith received an error: Only opaque responses can be stored with status 0`
- App works online but shows blank map tiles when network is toggled off
- Users on slow connections see stale UI after a deploy because new SW is waiting

**Prevention:**
1. Do not attempt to cache Mapbox vector tiles via service worker — Mapbox GL JS has its own internal IndexedDB tile cache. Interfere with it and you break their caching. Focus SW caching on app shell assets only
2. For the "last 10 trails offline" feature, cache the **trail GeoJSON data** (from Supabase, not Mapbox tiles) using a `NetworkFirst` strategy with a generous timeout. This gives trail metadata offline without the tile storage problem
3. Add `skipWaiting: true` and `clientsClaim: true` to the Workbox config so new service workers activate immediately on deploy rather than waiting for all tabs to close
4. Fix the existing tile cache pattern: either remove the Mapbox runtime cache entry entirely, or change the strategy to `NetworkOnly` with a fallback so map tiles never block service worker
5. Test the service worker in Chrome DevTools > Application > Service Workers with "Offline" mode before any phase ships PWA features

**Phase:** Phase 6 (PWA/Polish) — but the tile cache pattern fix should be done in Phase 1 to prevent storage pollution from day one

---

### Pitfall 5: Magic Link Auth Failures From Invite-Only Edge Cases

**What goes wrong:**
Supabase magic links are single-use OTPs that expire after 1 hour (configurable, max 24 hours). For an invite-only app with 5–10 users in Poland, several edge cases will occur in practice:

1. **Corporate/ISP email link scanners**: Security software (Barracuda SafeLinks, Microsoft Safe Links) prefetches URLs in emails before the user opens them. This consumes the one-time token, making the link appear "already used" when the user actually clicks it. Polish ISPs and corporate email systems commonly use these.
2. **Multiple browser tabs**: PKCE flow requires the magic link to be opened in the same browser that requested it. If the user requests a link on mobile Chrome, opens their email app (which opens in Safari), and then tries the link in Chrome, the link is invalid.
3. **Email delays**: Polish SMTP deliverability can have 2–5 minute delays to certain providers (WP.pl, Onet). Default 60-second re-request cooldown means users who don't receive the email quickly cannot request another for a full minute — during which the link may still be in transit.
4. **Invite token + magic link two-step**: The invite flow has two tokens in play — the invite token (for registration) and the magic link OTP (for auth). If users bookmark the invite URL and return days later, the invite link may itself be stale if your invite tokens have short TTLs.

**Warning signs:**
- Users report "link invalid" immediately after clicking (scanner pre-fetch)
- Auth failure rate higher on non-Gmail/Apple Mail email clients
- Users say they never received the email (check Supabase Auth logs for delivery status)
- Multiple `/auth` tab opens fail silently after the first succeeds

**Prevention:**
1. Use the PKCE flow (enabled by default in Supabase Auth JS v2+) and verify your `signInWithOtp` call passes the correct `redirectTo` with `emailRedirectTo` — a wrong redirect silently breaks the PKCE code verifier exchange
2. Add a clear, actionable error screen for `AuthApiError: Email link is invalid or has expired` — do not show a generic error. Provide a "Request new link" button inline on the error page
3. Set OTP expiry to 3600 seconds (1 hour) and the rate limit cooldown to 30 seconds (minimum) in Supabase Auth settings to reduce friction
4. Implement OTP fallback: Supabase `signInWithOtp` supports a `shouldCreateUser: false` option with a 6-digit code the user types in — this sidesteps the link-scanner issue entirely. For 5–10 friends, the UX overhead is acceptable
5. For the invite token specifically: validate tokens server-side in the Edge Function (service role), not client-side with the anon key. Check `invitations.used_at IS NULL AND invitations.created_at > NOW() - INTERVAL '7 days'` as the validity window
6. Seed the `invitations` table with initial tokens before testing — `supabase/config.toml` references a `seed.sql` that does not yet exist (CONCERNS.md)

**Phase:** Phase 4 (Auth/Onboarding) — all prevention must be in place before inviting any users

---

## Moderate Pitfalls

---

### Pitfall 6: `water_access` Schema Mismatch Corrupts Filter Logic

**What goes wrong:**
The current migration has `water_access boolean` but the filter store uses `'required' | 'preferred' | 'any'` and the PRD specifies `'none' | 'nearby' | 'on_route'` text enum. If any feature code is written before the migration is fixed, three separate representations will exist in: the database column, the TypeScript type, the Zustand filter store, and the Edge Function normalization logic. The filter will silently return wrong results or no results.

**Warning signs:**
- Trails with water show as "no water" or vice versa in TrailCard
- Water filter checkbox has no effect on the trail list
- Supabase insert from Edge Function silently coerces `'nearby'` to `false` (or fails the boolean constraint)

**Prevention:**
Add the schema-correction migration before writing any feature code in Phase 2 or Phase 3. The migration must: `ALTER TABLE routes ALTER COLUMN water_access TYPE text; ALTER TABLE routes ADD CONSTRAINT water_access_valid CHECK (water_access IN ('none', 'nearby', 'on_route'));`. Update `src/lib/types.ts` in the same commit.

**Phase:** Phase 2 (before Edge Function writes any rows) — this is a blocking prerequisite

---

### Pitfall 7: No Error Boundaries — Mapbox Token Error Crashes Entire App

**What goes wrong:**
If `VITE_MAPBOX_TOKEN` is unset or revoked (e.g., Mapbox domain restriction misconfigured), `mapbox-gl` throws synchronously during map initialization. Without an `ErrorBoundary` around the map component, this crashes the entire React tree to a blank white screen with no recovery path. The user cannot navigate to /trails, /favorites, or /profile.

**Warning signs:**
- Blank screen on first load in staging after a deploy
- Console shows `Error: [...]` from `mapbox-gl` with no React error UI
- Production Vercel deploy shows working build but blank app

**Prevention:**
Wrap the `MapView` component in an `ErrorBoundary` that renders a graceful fallback ("Map unavailable — try refreshing") before Phase 1 is complete. Add a startup guard in `src/lib/supabase.ts` that throws a hard error in development if env vars are missing (CONCERNS.md already flags the silent empty-string fallback).

**Phase:** Phase 1 (Map) — must exist before any map code ships

---

### Pitfall 8: Viewport Store Triggering Edge Function on Every Pan Pixel

**What goes wrong:**
`src/stores/viewport.ts` exposes raw Zustand setters with no throttling. When Phase 1 connects Mapbox `move`, `zoom`, and `moveend` events to these setters, every frame of a pan gesture fires a state update. If the `useTrails` hook subscribes to `bounds` and calls the Edge Function on each change, a 2-second pan gesture generates ~60 Edge Function invocations and ~60 Overpass queries.

**Warning signs:**
- Supabase Edge Function invocation count spikes to thousands per day with only 10 users
- Overpass IP gets rate-limited within minutes of opening the app
- Vercel function logs show hundreds of identical requests per minute

**Prevention:**
Debounce the `setBounds` call at the map event handler level (not in the store): `moveend` only (not `move`), with a 500ms debounce. Never call the Edge Function on `zoom` events alone — wait for `moveend`. Check if the new bbox is meaningfully different from the current cached bbox before triggering a fetch (>20% overlap with existing cached area = skip).

**Phase:** Phase 1 (Map) — establish the debounce pattern when wiring map events to the store

---

## Minor Pitfalls

---

### Pitfall 9: PTTK Colored Trail Polylines Need `osmc:symbol` Tag Parsing

**What goes wrong:**
PTTK trail colors (red, blue, yellow, green, black) are encoded in the `osmc:symbol` OSM tag as a compound string like `red:white:red_bar`. Naively reading the `colour` tag will miss most PTTK trails. A query that only fetches `route=hiking` without parsing `osmc:symbol` renders all PTTK trails in a single default color, destroying the key visual differentiator of the app.

**Prevention:**
In the Edge Function normalization layer, parse `osmc:symbol` first, fall back to `colour`, then fall back to a neutral gray. Map the first segment of `osmc:symbol` (e.g., `red`, `blue`, `yellow`, `green`, `black`) to the Tailwind design token trail colors (`trail-red`, etc.).

**Phase:** Phase 2 (Trail Pipeline normalization)

---

### Pitfall 10: iOS Safari PWA `apple-touch-icon` SVG Not Rendered

**What goes wrong:**
The current `manifest.json` and `index.html` reference SVG icons. iOS requires PNG for `apple-touch-icon`. The icon silently falls back to a generic Safari icon when users add the app to their home screen. For a small friend group who will all add the PWA to their home screens, this is highly visible.

**Prevention:**
Generate 192x192 and 512x512 PNG versions before Phase 6 ships. Update both `manifest.json` and the `<link rel="apple-touch-icon">` tag in `index.html`.

**Phase:** Phase 6 (PWA/Polish)

---

### Pitfall 11: `dist/` Committed to Git Pollutes Code Review

**What goes wrong:**
The `dist/` directory exists in the working tree despite being in `.gitignore`. Every future `git status` will show noise unless cleaned up. CI/Vercel ignore it, but it inflates repo size and confuses reviewers.

**Prevention:**
Run `git rm -r --cached dist/` and commit the removal before Phase 1 begins.

**Phase:** Pre-Phase 1 cleanup task

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 (Map) | Map lifecycle in React | WebGL context leak on navigation (Pitfall 2) | Single persistent Map instance, correct useEffect cleanup |
| Phase 1 (Map) | Viewport store wiring | Unbounded Edge Function calls per pan gesture (Pitfall 8) | Debounce moveend 500ms, skip redundant bbox fetches |
| Phase 1 (Map) | Map init failure | App crash on bad token (Pitfall 7) | ErrorBoundary before first map code ships |
| Phase 2 (Trail Pipeline) | Schema | `water_access` boolean vs. text enum data corruption (Pitfall 6) | Migration fix is prerequisite to Edge Function |
| Phase 2 (Trail Pipeline) | Overpass rate limiting | 429 / IP block from concurrent queries (Pitfall 1) | Mutex, debounce, [timeout:45] in QL header |
| Phase 2 (Trail Pipeline) | Edge Function timeout | 150s wall-clock exceeded on slow Overpass response (Pitfall 3) | Return cached data immediately, bound Overpass timeout |
| Phase 2 (Trail Pipeline) | PTTK colors | All trails render same color (Pitfall 9) | Parse `osmc:symbol` in normalization layer |
| Phase 4 (Auth) | Magic link | Link scanner pre-fetch invalidates OTP (Pitfall 5) | Error recovery UI + OTP code fallback |
| Phase 6 (PWA) | Service worker | Opaque tile responses break offline cache (Pitfall 4) | Cache trail GeoJSON only, not Mapbox tiles |
| Phase 6 (PWA) | iOS icon | SVG apple-touch-icon silently ignored (Pitfall 10) | PNG icons before this phase ships |

---

## Sources

- Mapbox GL JS WebGL context leak: [Issue #9126](https://github.com/mapbox/mapbox-gl-js/issues/9126), [Issue #4862](https://github.com/mapbox/mapbox-gl-js/issues/4862), [Safari fix PR #12224](https://github.com/mapbox/mapbox-gl-js/pull/12224) — MEDIUM confidence (longstanding issues, partial fixes in recent versions)
- Mapbox GeoJSON setData memory: [Issue #5252](https://github.com/mapbox/mapbox-gl-js/issues/5252), [Issue #2607](https://github.com/mapbox/mapbox-gl-js/issues/2607) — MEDIUM confidence (older issues; check if resolved in v3.x)
- Overpass API rate limiting: [OSM Wiki](https://wiki.openstreetmap.org/wiki/Overpass_API), [Commons docs](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html), [Issue #333](https://github.com/drolbr/Overpass-API/issues/333) — HIGH confidence
- Supabase Edge Function timeouts: [Limits docs](https://supabase.com/docs/guides/functions/limits), [Shutdown reasons](https://supabase.com/docs/guides/troubleshooting/edge-function-shutdown-reasons-explained), [Discussion #40074](https://github.com/orgs/supabase/discussions/40074) — HIGH confidence
- Supabase magic link edge cases: [Auth docs](https://supabase.com/docs/guides/auth/auth-email-passwordless), [Scanner issue #1214](https://github.com/supabase/auth/issues/1214), [OTP discussion #16194](https://github.com/orgs/supabase/discussions/16194) — HIGH confidence
- Workbox opaque responses: [Chrome Workbox docs](https://developer.chrome.com/docs/workbox/caching-resources-during-runtime), [Service worker CORS guide](https://mmazzarolo.com/blog/2024-11-06-service-workers-and-cors/), [Issue #8859](https://github.com/mapbox/mapbox-gl-js/issues/8859) — HIGH confidence
- Project-specific context: `.planning/codebase/CONCERNS.md` (2026-03-10 audit) — HIGH confidence
