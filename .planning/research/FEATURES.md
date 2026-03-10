# Feature Landscape: Psi Szlak

**Domain:** Dog-friendly trail discovery PWA (Poland)
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH (cross-referenced AllTrails, Komoot, Mapy.cz, Strava patterns + UX research)

---

## Table Stakes

Features that users of ANY trail/hiking app expect. Missing or broken = users abandon on first session.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Interactive map centered on user location | Core promise of the app. "Where are trails near me?" — AllTrails, Komoot, Mapy.cz all do this in under 3 seconds | Low-Med | Requires geolocation permission flow and a graceful fallback (search bar) when denied |
| Trail polylines on map | Users expect to see WHERE a trail goes, not just a pin. 75% of surveyed hikers called apps without terrain infographics "hard to navigate" | Med | Mapbox Outdoors style includes topo context; PTTK color-coded lines are a Polish-specific expectation |
| Trail card with distance, difficulty, surface | Users scan cards, not detail pages. Key info must be visible without tapping. Distance and difficulty are the top two criteria users filter by | Low | Card must display these without truncation on a 375px screen |
| Filter by difficulty and distance | Standard in every hiking app (AllTrails, Komoot, Mapy.cz). Users routinely set these before browsing | Med | The 6-filter panel defined in PRD is comprehensive — matches industry standard |
| "Near me" sort/proximity filtering | Users open the app because they want something nearby. Distance-from-location is the implicit primary sort | Low-Med | Haversine on center_lat/center_lon is the right approach for MVP |
| Map/list toggle | Industry standard pattern (AllTrails uses it, Komoot uses it). Different users prefer browsing spatially vs. by list. Removing it causes disorientation | Low | Map tab + Trails tab architecture in router already supports this |
| Empty state with actionable recovery | AllTrails and Komoot both show illustrated empties with CTA. Users who hit a blank screen and see nothing will uninstall | Low | PRD defines these — "Szukaj w promieniu 50 km" is the right CTA |
| Loading state (skeleton or spinner) | Map tiles and trail data load asynchronously. Users need confirmation the app is working | Low | Skeleton cards are preferred over spinners for list; spinner acceptable on map |
| Offline indicator | PWA users have spotty connectivity on trails. Users must know if they're seeing stale data | Low | A persistent top banner (not just a toast) is better UX for offline mode — the banner should stay visible until reconnection, unlike a self-dismissing toast |
| Favorites (save trails) | Every comparable app (AllTrails, Komoot, Mapy.cz) offers saves/lists. Users who can't bookmark will not return | Low | PRD has this with private notes — notes are a differentiator, not just the save action |
| Auth state persistence (stay logged in) | Users on mobile do not re-authenticate every session. Supabase session persistence is standard | Low | Already handled by Supabase client |
| Error state with retry | API failures happen. A silent failure looks like a bug. Users need feedback + a retry action | Low | PRD defines retry with exponential backoff (1s → 2s → 4s) — correct pattern |

---

## Differentiators

Features that set Psi Szlak apart from generic hiking apps. These create the specific value for dog owners.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Water access filter (on_route / nearby / none) | No other app surfaces water proximity as a first-class filter. Vizslas (and most dogs) need water every 30-45 min on a hike. This is the #1 dog-specific need not covered by AllTrails' simple "dog friendly" checkbox | Med | The 3-state enum (none/nearby/on_route) computed via Overpass `around:200` is the key technical differentiator. AllTrails only has a binary dog-friendly flag — no water context |
| Surface type filter (dirt / gravel / asphalt / mixed) | Dogs' paws wear on asphalt. Natural surface preference is a real dog-owner concern. AllTrails doesn't filter by surface type at list level | Med | Requires OSM `surface=*` tag coverage. Where tags are absent show "Nieznana" rather than hiding trails |
| PTTK color-coded trail layer | Polish hikers use PTTK waymark colors as a wayfinding system (red = main ridge, blue = transverse, yellow = local). No app except Mapy.cz renders these correctly. Makes Psi Szlak feel built for Poland, not a generic app | High | Requires OSM relation parsing + custom Mapbox layer with `trail_color` rendering. This is technically complex but visually striking |
| Dog-name-personalized empty states | "Nie masz jeszcze ulubionych tras. Znajdź coś dla [imię psa]!" creates emotional connection. No competing app uses the dog's name in UI copy | Low | Uses `users.dog_name` — requires onboarding to collect it first |
| Private notes on favorites | AllTrails' "lists" feature is public-facing. A private, per-trail note ("mud at the river crossing after rain") is a personal utility that power users love. Komoot doesn't offer this for saved routes | Low | Already in schema as `favorites.note`. Text area in FavoriteNote component |
| Invite-only access | Creates genuine exclusivity and trust within the group. Users know everyone on the platform is a trusted friend. Eliminates spam, harassment, and content moderation burden | Med | The single-use token + magic link pattern is the right architecture. No OAuth = simpler, no password reset flows |
| "Przeszedłem!" one-tap activity log | A frictionless way to log a walk with a single tap. No GPS tracking, no route recording — just "we did this trail today." Lower cognitive overhead than Strava's record session. Data feeds a future recommendation engine | Low | The value is simplicity. Do NOT add duration/distance tracking to this in v1 — that creates app-switching anxiety |
| Dog onboarding (dog name collection) | Asking for the dog's name in onboarding creates an immediately personalized experience that sets the emotional tone. Slack's data shows invite-onboarding completes in under 5 minutes — the dog name step fits within this window | Low | Keep the onboarding to 3 steps max: dog name → geolocation → first map view. Any more and users drop off |
| Automatic negative exclusions (dogs=no, residential, major roads) | AllTrails shows trails with "no dogs" tags and lets users filter them out manually. Psi Szlak never shows these in the first place. The absence of bad results is a feature | Low (data layer) | This is implemented in the Overpass query filters. No UI is needed — it should be invisible to users |

---

## Anti-Features

Things to deliberately NOT build in v1. Each one has a clear reason and an alternative.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| GPS activity recording / turn-by-turn navigation | Adds massive complexity (background geolocation, battery drain, route deviation detection, permission flows). Strava and Komoot took years to build this well. Building it poorly creates trust-breaking failures | Collect "Przeszedłem!" one-tap log. Navigation deferred to v2 |
| User-generated trail content (photos, ratings, comments) | For 5-10 users, there is not enough content to make ratings meaningful. Empty stars are worse than no stars. Photo moderation adds operational burden | Private notes on favorites cover personal use case. Community features deferred to v2 |
| Social feed / activity sharing | Strava's social feed only works with >50 active users. At 5-10 people, a feed looks abandoned and makes the app feel dead | Friends use WhatsApp to share trails. The app is a discovery tool, not a social platform in v1 |
| Light theme | Doubles all design tokens, all component variants, and all visual QA. Dark theme is correct for outdoor use (screen glare). Per PRD: dark mode only | Ship dark mode first. Light theme is a v2 nice-to-have, not a blocker |
| Route drawing / custom trail creation | Mapbox GL Draw integration is non-trivial. Requires UI for drawing, editing, snapping. OSM/Overpass gives 95% of real trails automatically | Deferred to v1.1. Users add missing trails by noting them in private notes |
| Weather integration | Weather APIs add cost (or rate limit complexity), and weather is not a differentiator — users check their phone's weather app. Integration adds a maintenance surface | Out of scope. Users already have excellent free weather apps |
| Push notifications | iOS PWA push requires iOS 16.4+ and opt-in. Small user base means notification value is low. If every trail update sends a push, users disable notifications immediately | In-app toasts for key events are sufficient. Push deferred to v2 |
| Difficulty system with elevation profiles | Elevation data requires DEM tiles or an elevation API (additional cost/complexity). OSM `sac_scale` gives easy/medium/hard which is sufficient for MVP | Use OSM sac_scale mapping. Show "Nieznana" when absent. No elevation chart in v1 |
| Complex recommendation engine | Requires activity_log data volume that doesn't exist yet (5-10 users in v1). An algorithm with sparse data produces embarrassingly bad recommendations | Collect activity_log data silently from MVP. Build recommendations in v2 when data exists |
| Onboarding tutorial with multiple tooltips | The single tooltip ("Filtruj trasy tutaj") defined in PRD is correct. Multiple tooltips increase cognitive load and are routinely dismissed. Research: users skip tutorials | One contextual tooltip max. Let users discover through use |

---

## Feature Dependencies

```
Invite token in URL
  → Registration form (pre-filled token)
    → Magic link email
      → Supabase auth session
        → Onboarding: dog name collection
          → Onboarding: geolocation request
            → Map view centered on user
              → Trail data pipeline (Edge Function → Overpass → Supabase)
                → Trail markers on map
                  → Trail card (click marker or list item)
                    → Trail detail view
                      → Favorites (heart icon)
                        → Private notes on favorite
                      → "Przeszedłem!" button
                        → activity_log insert

Filter state (Zustand)
  → Filter panel (bottom sheet)
    → Trail list filtered client-side
    → Map markers filtered

Geolocation (or search fallback)
  → Distance-from-user calculation (Haversine)
    → Distance filter (< 10 km / < 30 km / < 50 km)

PTTK OSM relations
  → trail_color field on route
    → Color-coded polyline layer on map
    → PTTK badge on trail card

Service Worker (Workbox)
  → Offline tile cache (last Mapbox viewport)
  → Offline trail cache (last 10 trails)
    → Offline banner display

Profile
  → Invite generation (requires auth'd user)
    → Single-use token → invitations table
      → Invite link shared externally
```

---

## MVP Feature Priority

### Must ship (app has no value without these)

1. Map with trail markers + PTTK polylines — the core experience
2. Trail card with distance, difficulty, surface, water access — the dog-specific lens
3. Filter panel: length + surface + water + difficulty + distance — the selection mechanism
4. Invite-only auth + onboarding with dog name — the access model and personalization hook
5. Empty states and error states — prevents silent failures

### Ship for retention (users will not return without these)

6. Favorites with private notes — the personal utility
7. "Przeszedłem!" log — frictionless activity tracking
8. Offline support with banner — credibility on actual trails

### Nice to have in v1 (but not blockers)

9. Location search (Mapbox Geocoding) — users who deny geolocation need this, but it's a fallback path
10. Profile page with invite generation — needed for network growth but not day-one use

---

## UX Pattern Recommendations by Feature Area

### Trail Card Design

Based on research into AllTrails, Komoot, and hiking UX studies:

- **Information order (scan priority):** Trail name (large) → Distance + Difficulty on the same line (icon + value pairs) → Surface type chip → Water access chip (with icon: droplet) → PTTK color badge if applicable
- **Visual weight:** Distance and difficulty get the most space. Water access should use a colored icon (blue droplet = on_route, gray droplet = nearby, empty = none)
- **Card height:** Keep compact enough to show 2-3 cards without scrolling on a 375px screen. Do not cram everything in — blank space is better than clutter
- **Minimap:** A small route thumbnail adds value for users deciding between trails. Low complexity with GeoJSON + Mapbox static image or canvas render. However this increases card height — consider as an optional expanded state rather than default

### Filter UX

Based on research from Pencil & Paper filter UX analysis and Mobbin bottom sheet patterns:

- **Pattern:** Bottom sheet slide-up, not sidebar, not fullscreen modal. Keeps map context visible
- **Trigger:** A floating "Filtruj" button (or icon in header) with an active-filter count badge. Users need to know filters are applied when they close the panel
- **Filter chips:** Show applied filters as horizontal chip bar below the search input when filters are active. Each chip shows the active value with an × to remove. Provides immediate visual feedback
- **Apply button:** Sticky at the bottom of the sheet. Always visible — never hidden below scroll
- **Auto-apply vs. explicit apply:** For 6 filters with potential Overpass re-fetch implications, explicit Apply is safer. Avoids thrashing the Edge Function on every toggle
- **Reset:** "Wyczyść wszystko" text link near the top, next to the filter count

### Offline Map Caching UX

Based on Mapbox documentation, PWA caching strategy research, and MDN guidance:

- **What to cache:** Mapbox tiles are cached automatically by GL JS in a 50MB in-browser cache (Cache API). This is passive — no explicit UI needed. Workbox should additionally cache the last 10 trail GeoJSON payloads from the Supabase Edge Function response
- **User communication:** A persistent amber/orange top banner ("Tryb offline — wyświetlam zapisane trasy") should appear when `navigator.onLine === false`. This banner persists until reconnection — unlike a toast, which users miss. The PRD's "baner informacyjny" is correct — do not downgrade this to a toast
- **What NOT to show offline:** Geocoding search should be disabled with a grayed-out state and tooltip: "Wyszukiwarka niedostępna offline." Favorites sync should show a queued state if user attempts to add/remove
- **Storage limit concern:** iOS Safari restricts PWA storage. 50MB tile cache + 10 trail GeoJSON payloads is well within limits. Do not attempt to pre-cache entire map areas — only serve what was organically viewed

### Invite-Only Onboarding Flow

Based on Supabase auth patterns, Slack onboarding research (82% complete in < 5 min), and magic link best practices:

- **Token expiry:** 7 days minimum for invite links (not the 10-minute default for magic links). Users may receive an invite and not open it immediately. The PRD does not specify this — it should be set explicitly on the `invitations.expires_at` column
- **One-page registration:** Show only name + email on the registration screen. Do not ask for dog name here — that belongs in onboarding, after the magic link confirms identity
- **Error on invalid token:** The `/auth` route without a valid token shows "Dostęp wymaga zaproszenia" with no registration form. Clear, not cryptic
- **Onboarding length:** Maximum 3 steps after magic link click: (1) "Jak masz na imię?" + dog name, (2) geolocation request with explanation, (3) first map view. No welcome carousel. No tooltips beyond the one filter hint
- **Session persistence:** After magic link auth, Supabase session should persist in localStorage so returning users skip all auth steps

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Table stakes | HIGH | Verified against AllTrails, Komoot, Mapy.cz feature sets; consistent with UX research literature |
| Differentiators | MEDIUM | Water access and PTTK layers are product decisions — confidence comes from absence of this in competitor apps + PRD alignment |
| Anti-features | HIGH | Based on well-documented patterns from Strava/AllTrails post-mortems and scope analysis |
| Filter UX patterns | HIGH | Multiple sources agree: bottom sheet + sticky apply + chip bar is current standard |
| Offline caching UX | MEDIUM | Mapbox tile auto-caching is documented; Workbox strategy for trail JSON is standard but not Mapbox-specific |
| Invite onboarding | MEDIUM | Magic link patterns are well-documented; invite token expiry recommendations come from general SaaS guidance, not Supabase-specific docs |
| Trail card design | MEDIUM | Based on multiple UX case studies; exact information hierarchy for dog-specific attributes is our own design decision |

---

## Sources

- [AllTrails App Teardown Analysis — NextSprints](https://nextsprints.com/guide/alltrails-product-teardown-analysis)
- [AllTrails iOS UX Case Study — Alexander Moon](https://medium.com/@moonsicles/alltrails-for-ios-a-ux-case-study-b86b3d39fb29)
- [AllTrails CTO on the algorithmic outdoors — Globetrender, 2026](https://globetrender.com/2026/01/26/alltrails-james-graham-algorithmic-outdoors/)
- [Komoot Modern Design Roadmap — Business Wire, 2025](https://www.businesswire.com/news/home/20250915468295/en/Komoot-Unveils-Modern-Design-as-Part-of-Ambitious-Product-Roadmap)
- [Mobile Filter UX Design Patterns — Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-mobile-filters)
- [Bottom Sheet UX Guidelines — Nielsen Norman Group](https://www.nngroup.com/articles/bottom-sheet/)
- [Mapy.cz — Google Play features](https://play.google.com/store/apps/details?id=cz.seznam.mapy)
- [PWA Caching Strategies — MagicBell](https://www.magicbell.com/blog/offline-first-pwas-service-worker-caching-strategies)
- [Mapbox Offline Maps Help](https://docs.mapbox.com/help/troubleshooting/mobile-offline/)
- [Magic Links UX — BaytechConsulting, 2025](https://www.baytechconsulting.com/blog/magic-links-ux-security-and-growth-impacts-for-saas-platforms-2025)
- [Login & Signup UX 2025 — Authgear](https://www.authgear.com/post/login-signup-ux-guide)
- [Usability Issues in Hiking Applications — UX TBE](https://uxtbe.medium.com/usability-issues-in-hiking-applications-how-to-improve-user-experience-eeebc287d633)
- [PWA Web Almanac 2025 — HTTP Archive](https://almanac.httparchive.org/en/2025/pwa)
