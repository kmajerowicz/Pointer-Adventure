# Requirements: Psi Szlak

**Defined:** 2026-03-11
**Core Value:** Dog owners can instantly discover nearby trails with water access and natural surfaces

## v1 Requirements

### Foundation

- [x] **FOUN-01**: Schema migration fixes `water_access` from boolean to text enum (`none`/`nearby`/`on_route`)
- [x] **FOUN-02**: Schema migration adds `routes.source` (`osm`/`pttk`), `routes.water_type` (`river`/`lake`/`stream`/null), `invitations.used_at` columns
- [x] **FOUN-03**: Mapbox attribution CSS override removed; compact attribution used instead
- [x] **FOUN-04**: Workbox config fixed: `cacheableResponse: { statuses: [0, 200] }`, `purgeOnQuotaError: true`, cache name changed from `mapbox-tiles` to `psi-szlak-mapbox-tiles`
- [x] **FOUN-05**: `dist/` directory removed from git tracking
- [x] **FOUN-06**: PRD updated to match schema: `difficulty` uses `moderate` (not `medium`), `geojson` column renamed to `geometry`
- [x] **FOUN-07**: `types.ts` updated: `water_access` becomes `'none' | 'nearby' | 'on_route'`, `source` and `water_type` fields added

### Map

- [x] **MAP-01**: User sees interactive Mapbox Outdoors map centered on Poland (`[19.145, 51.919]`, zoom 6) on app load
- [x] **MAP-02**: User can tap "Gdzie jestem" to center map on current GPS location with fly-to animation
- [x] **MAP-03**: User can search Polish locations via Mapbox Geocoding and map flies to result
- [x] **MAP-04**: Map viewport (center, zoom, bounds) syncs to Zustand store on `moveend` (not every frame)
- [x] **MAP-05**: When GPS is denied, user sees fallback message and search bar per PRD section 7
- [x] **MAP-06**: Map uses single-instance `useRef` pattern to prevent WebGL context leaks on tab navigation
- [x] **MAP-07**: Error boundary wraps map component — invalid token or WebGL failure shows recovery UI

### Trail Pipeline

- [ ] **PIPE-01**: Edge Function `/search-trails` accepts POST with bounding box, checks `search_areas` by `bbox_hash`, returns cached routes on hit
- [ ] **PIPE-02**: On cache miss, Edge Function queries Overpass API for hiking routes, footpaths, nature reserves, and PTTK relations within bbox
- [ ] **PIPE-03**: Overpass query excludes: primary/secondary/tertiary roads, residential/commercial areas, `dogs=no` trails
- [ ] **PIPE-04**: Edge Function normalizes results per schema: `surface_type`, `difficulty`, `water_access` (via Overpass `around:200`), `trail_color`, `source`, `water_type`
- [ ] **PIPE-05**: Edge Function upserts to `routes` (dedupe on `source_id`), inserts to `search_areas` with 7-day TTL
- [ ] **PIPE-06**: Overpass queries include `[timeout:25]`; Edge Function uses AbortController with 20s per attempt, max 2 retries with exponential backoff
- [ ] **PIPE-07**: Frontend calls Edge Function on `moveend` with 400ms debounce via `useTrails` hook
- [ ] **PIPE-08**: Trail markers render as clustered pins on map; clusters expand on zoom
- [ ] **PIPE-09**: PTTK trails render as colored polylines matching `trail_color` (red/blue/yellow/green/black)
- [ ] **PIPE-10**: Loading state shown during trail fetch; error state with retry button on failure

### Browsing

- [ ] **BROW-01**: User can toggle between map view and list view
- [ ] **BROW-02**: TrailCard displays: name, length (km), surface badge, water access icon, difficulty badge, trail color indicator (if PTTK)
- [ ] **BROW-03**: TrailDetail page shows full trail info, map with route polyline, and action buttons
- [ ] **BROW-04**: Empty state shows illustration + "Brak tras" message + "Szukaj w promieniu 50 km" CTA
- [ ] **BROW-05**: 2-3 TrailCards visible without scrolling on 375px screen width

### Filters

- [ ] **FILT-01**: Filter panel opens as bottom sheet with sticky "Zastosuj" button
- [ ] **FILT-02**: Length filter: `< 5 km` / `5–15 km` / `> 15 km`
- [ ] **FILT-03**: Surface filter: Ziemia / Żwir / Asfalt / Mieszana / Nieznana
- [ ] **FILT-04**: Water access filter: Wymagana / Mile widziana / Obojętne — "Mile widziana" boosts water trails higher, does not exclude others
- [ ] **FILT-05**: Difficulty filter: Łatwa / Średnia / Trudna / Nieznana
- [ ] **FILT-06**: Distance from user filter: `< 10 km` / `< 30 km` / `< 50 km` (client-side Haversine on `center_lat`/`center_lon`)
- [ ] **FILT-07**: Marked trail filter: Tak / Obojętne
- [ ] **FILT-08**: Active filter count badge shown on filter trigger button; horizontal chip bar shows applied filters with × to remove
- [ ] **FILT-09**: Filters applied client-side when bounds unchanged; Edge Function only re-invoked on bounds change
- [ ] **FILT-10**: "Wyczyść wszystko" reset link clears all filters

### Auth

- [ ] **AUTH-01**: New user arrives at `/invite?token=xyz`, token is validated server-side via Edge Function
- [ ] **AUTH-02**: Valid token → registration form (name + email only) → magic link sent → token consumed on successful registration
- [ ] **AUTH-03**: Expired or used token shows clear error message in Polish
- [ ] **AUTH-04**: `/auth` without invite context shows "Dostęp tylko przez zaproszenie" — no registration form
- [ ] **AUTH-05**: Magic link click → Supabase session established → redirect to onboarding (first login) or map (returning)
- [ ] **AUTH-06**: Session persists across browser refresh via Supabase localStorage
- [ ] **AUTH-07**: Invite tokens expire after 30 days (`invitations.expires_at`)
- [ ] **AUTH-08**: Unauthenticated users can browse trails and map but cannot favorite, log activity, or access profile

### Onboarding

- [ ] **ONBR-01**: First-time user after magic link sees 3-step onboarding: welcome + name → dog name → geolocation request
- [ ] **ONBR-02**: Dog name saved to `users.dog_name` and used in personalized empty states throughout app
- [ ] **ONBR-03**: Geolocation step explains why GPS is needed; on approval, map centers on user location with first trails loaded
- [ ] **ONBR-04**: Single tooltip after onboarding: "Filtruj trasy tutaj" pointing to filter trigger

### Favorites

- [ ] **FAV-01**: User can toggle favorite via heart icon on TrailCard and TrailDetail
- [ ] **FAV-02**: Heart toggle uses optimistic UI (instant visual feedback, rollback on error)
- [ ] **FAV-03**: Favorites page lists all saved trails with reusable filter controls
- [ ] **FAV-04**: User can add/edit private note per favorite trail
- [ ] **FAV-05**: Empty favorites shows personalized message: "Nie masz jeszcze ulubionych tras. Znajdź coś dla [dog name]!" + CTA

### Activity

- [ ] **ACT-01**: TrailDetail shows "Przeszedłem!" button for authenticated users
- [ ] **ACT-02**: Tap creates `activity_log` entry (user_id, route_id, walked_at = now) and shows toast "Zapisano spacer!"
- [ ] **ACT-03**: Visual "walked" indicator shown on TrailCards for trails in user's activity log
- [ ] **ACT-04**: Profile page shows activity history (list of walked trails with dates)

### Profile

- [ ] **PROF-01**: Profile page displays: display name, dog name, avatar placeholder
- [ ] **PROF-02**: User can generate new invite links (creates row in `invitations` table)
- [ ] **PROF-03**: User can see status of generated invites (pending/used with `used_at`)

### PWA

- [ ] **PWA-01**: App installable on Android and iOS home screen with proper icon, name, and splash
- [ ] **PWA-02**: Service worker precaches app shell and bundles
- [ ] **PWA-03**: Last 10 viewed trail details cached via NetworkFirst strategy for offline access
- [ ] **PWA-04**: Persistent top banner "Tryb offline — wyświetlam zapisane trasy" when `navigator.onLine === false`; disappears on reconnect
- [ ] **PWA-05**: Geocoding search disabled in offline mode with grayed-out state
- [ ] **PWA-06**: PNG icons (192x192, 512x512) replace SVG placeholders for iOS compatibility
- [ ] **PWA-07**: Manifest: `display: standalone`, theme color `#111318`, portrait orientation

### Design System

- [ ] **DS-01**: All components use design tokens from `src/index.css` — no hardcoded colors
- [ ] **DS-02**: Touch targets minimum 48px throughout the app
- [ ] **DS-03**: Bottom tab bar: Mapa / Trasy / Ulubione / Profil with `var(--spacing-tab-bar)` height
- [ ] **DS-04**: Trail color indicators use: `trail-red`, `trail-blue`, `trail-yellow`, `trail-green`, `trail-black` token classes
- [ ] **DS-05**: Every user action gets feedback (toast, animation, or state change)
- [ ] **DS-06**: All UI text in Polish

## v2 Requirements

### Navigation
- **NAV-01**: Turn-by-turn navigation during walk
- **NAV-02**: GPS activity recording with route tracking

### Content
- **CONT-01**: Photos attached to trails
- **CONT-02**: Ratings and comments on trails

### Social
- **SOCL-01**: Activity feed of friends' walks
- **SOCL-02**: Social trail sharing

### Platform
- **PLAT-01**: Light theme option
- **PLAT-02**: Custom domain psiszlak.pl
- **PLAT-03**: Route drawing / custom trail creation
- **PLAT-04**: Push notifications
- **PLAT-05**: React Native mobile app

### Intelligence
- **INTL-01**: "Jeszcze tu nie byłeś" — trails nearby not in user's history
- **INTL-02**: "Podobne do Twoich ulubionych" — attribute matching
- **INTL-03**: "Popularne wśród znajomych" — social ranking

## Out of Scope

| Feature | Reason |
|---------|--------|
| Walk duration tracking | No capture UI in v1; distance matters more for dog walks |
| Weather integration | Users have dedicated weather apps; adds cost/complexity |
| Elevation profiles | Requires DEM tiles or elevation API; OSM sac_scale sufficient for v1 |
| Complex recommendation engine | Insufficient data from 5-10 users; collect activity_log, build in v2 |
| Multiple onboarding tooltips | Users skip tutorials; single filter tooltip per PRD |
| Spatial containment cache | `bbox_hash` exact match is simpler and sufficient for small user group |
| OAuth / password auth | Magic link only — simpler, no password reset flows needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 0 | Complete |
| FOUN-02 | Phase 0 | Complete |
| FOUN-03 | Phase 0 | Complete |
| FOUN-04 | Phase 0 | Complete |
| FOUN-05 | Phase 0 | Complete |
| FOUN-06 | Phase 0 | Complete |
| FOUN-07 | Phase 0 | Complete |
| MAP-01 | Phase 1 | Complete |
| MAP-02 | Phase 1 | Complete |
| MAP-03 | Phase 1 | Complete |
| MAP-04 | Phase 1 | Complete |
| MAP-05 | Phase 1 | Complete |
| MAP-06 | Phase 1 | Complete |
| MAP-07 | Phase 1 | Complete |
| PIPE-01 | Phase 2 | Pending |
| PIPE-02 | Phase 2 | Pending |
| PIPE-03 | Phase 2 | Pending |
| PIPE-04 | Phase 2 | Pending |
| PIPE-05 | Phase 2 | Pending |
| PIPE-06 | Phase 2 | Pending |
| PIPE-07 | Phase 2 | Pending |
| PIPE-08 | Phase 2 | Pending |
| PIPE-09 | Phase 2 | Pending |
| PIPE-10 | Phase 2 | Pending |
| BROW-01 | Phase 3 | Pending |
| BROW-02 | Phase 3 | Pending |
| BROW-03 | Phase 3 | Pending |
| BROW-04 | Phase 3 | Pending |
| BROW-05 | Phase 3 | Pending |
| FILT-01 | Phase 4 | Pending |
| FILT-02 | Phase 4 | Pending |
| FILT-03 | Phase 4 | Pending |
| FILT-04 | Phase 4 | Pending |
| FILT-05 | Phase 4 | Pending |
| FILT-06 | Phase 4 | Pending |
| FILT-07 | Phase 4 | Pending |
| FILT-08 | Phase 4 | Pending |
| FILT-09 | Phase 4 | Pending |
| FILT-10 | Phase 4 | Pending |
| AUTH-01 | Phase 5 | Pending |
| AUTH-02 | Phase 5 | Pending |
| AUTH-03 | Phase 5 | Pending |
| AUTH-04 | Phase 5 | Pending |
| AUTH-05 | Phase 5 | Pending |
| AUTH-06 | Phase 5 | Pending |
| AUTH-07 | Phase 5 | Pending |
| AUTH-08 | Phase 5 | Pending |
| ONBR-01 | Phase 5 | Pending |
| ONBR-02 | Phase 5 | Pending |
| ONBR-03 | Phase 5 | Pending |
| ONBR-04 | Phase 5 | Pending |
| FAV-01 | Phase 6 | Pending |
| FAV-02 | Phase 6 | Pending |
| FAV-03 | Phase 6 | Pending |
| FAV-04 | Phase 6 | Pending |
| FAV-05 | Phase 6 | Pending |
| ACT-01 | Phase 6 | Pending |
| ACT-02 | Phase 6 | Pending |
| ACT-03 | Phase 6 | Pending |
| ACT-04 | Phase 6 | Pending |
| PROF-01 | Phase 6 | Pending |
| PROF-02 | Phase 6 | Pending |
| PROF-03 | Phase 6 | Pending |
| PWA-01 | Phase 7 | Pending |
| PWA-02 | Phase 7 | Pending |
| PWA-03 | Phase 7 | Pending |
| PWA-04 | Phase 7 | Pending |
| PWA-05 | Phase 7 | Pending |
| PWA-06 | Phase 7 | Pending |
| PWA-07 | Phase 7 | Pending |
| DS-01 | All | Pending |
| DS-02 | All | Pending |
| DS-03 | All | Pending |
| DS-04 | All | Pending |
| DS-05 | All | Pending |
| DS-06 | All | Pending |

**Coverage:**
- v1 requirements: 73 total
- Mapped to phases: 73
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after initial definition*
