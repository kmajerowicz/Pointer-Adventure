# Phase 1: Map Core - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Interactive Mapbox Outdoors map with geolocation, location search, and WebGL lifecycle management. Users can open the app and see a map of Poland, locate themselves, and search for Polish locations. Trail display, filters, and auth are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Geolocation button & behavior
- Button placement: bottom-right floating circular button, above the tab bar (Strava/Google Maps pattern)
- App opens on Poland overview (center `[19.145, 51.919]`, zoom 6) every time — no auto-centering on GPS
- Auto-center for returning users deferred to Phase 5 onboarding (ONBR-03 captures location preference)
- Pulsing animation on button while GPS is being acquired
- After GPS acquired: map flies to user location at zoom 12 (city/town level, ~10km area)
- Standard accuracy GPS (`enableHighAccuracy: false`) — precise position not needed for trail discovery
- GPS timeout: 10 seconds, then show failure toast and stop pulsing

### Search bar placement & interaction
- Always-visible floating search bar at top of map screen
- Custom dark-themed input using app design tokens (bg-bg-surface, text-text-primary, accent border on focus) — NOT the Mapbox Geocoder plugin
- Autocomplete: dropdown list below search bar showing up to 5 Mapbox Geocoding suggestions
- Search scoped to Poland only (`country=pl` parameter)
- On result selection: map flies to location + temporary pin marker (pin disappears when user pans away or taps elsewhere)

### GPS denial fallback
- On GPS denied: Polish toast message "Brak dostępu do lokalizacji" + briefly pulse/highlight the search bar
- Geolocation button stays active after denial — user can tap to retry (browser may re-prompt)
- On GPS timeout (10s): toast "Nie udało się znaleźć lokalizacji" and stop pulsing animation

### Map controls layout
- No zoom +/- buttons — pinch-to-zoom only (Strava-minimal approach)
- Compass appears only when map is rotated (Mapbox default); tapping resets north
- Only two floating overlays on map: search bar (top) and geolocation button (bottom-right)
- No filter button or other placeholders in Phase 1 — added in their respective phases

### Claude's Discretion
- Exact search bar dimensions and padding
- Temporary pin marker design/icon
- Dropdown autocomplete styling details
- Fly-to animation duration and easing
- Error boundary recovery UI design

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useViewportStore` (src/stores/viewport.ts): Already has center, zoom, bounds with setters — wire to map `moveend`
- `useUIStore` (src/stores/ui.ts): Has `viewMode` ('map'|'list') — Phase 1 only uses 'map' mode
- `BottomTabBar` (src/components/ui/BottomTabBar.tsx): Tab bar already rendered by AppLayout
- `AppLayout` (src/components/layout/AppLayout.tsx): Flex column with overflow-hidden main area — map should fill this

### Established Patterns
- Zustand for client state (no Redux, no Context)
- Feature folder structure: map code goes in `src/features/map/`
- Design tokens in `src/index.css` — all colors via CSS variables
- React Router v6 with Outlet pattern in AppLayout

### Integration Points
- `router.tsx`: MapPage is currently a stub placeholder at index route — replace with real MapView component
- `src/hooks/`: Empty — `useGeolocation` hook will be first custom hook
- Map instance via `useRef` (decided in Phase 0 STATE.md) — not useState, to prevent WebGL context leaks
- Mapbox token from `VITE_MAPBOX_TOKEN` env var (already typed in vite-env.d.ts)

</code_context>

<specifics>
## Specific Ideas

- Strava-inspired minimal map UI — clean, dark, not cluttered with controls
- Search bar should feel native to the dark theme, not a bolted-on Mapbox widget
- Geolocation button behavior mirrors Google Maps / Strava: tap → pulsing → fly-to

</specifics>

<deferred>
## Deferred Ideas

- Auto-center on GPS for returning users — Phase 5 onboarding captures location preference
- Filter button on map overlay — Phase 4
- Trail pins and polylines on map — Phase 2
- Map/list toggle — Phase 3

</deferred>

---

*Phase: 01-map-core*
*Context gathered: 2026-03-13*
