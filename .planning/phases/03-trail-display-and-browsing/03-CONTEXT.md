# Phase 3: Trail Display and Browsing - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can browse trails in both map and list views, see full trail details, and understand each trail's key attributes at a glance. TrailCard, TrailList (Trasy tab), TrailDetail page with map inset, and empty state. Filters are Phase 4. Favorites/activity buttons are Phase 6.

</domain>

<decisions>
## Implementation Decisions

### TrailCard layout & density
- Compact horizontal row layout (Strava activity list style) — dense, scannable
- Line 1: trail name + length in km (right-aligned)
- Line 2: surface badge · water icon · difficulty badge + distance from user (right-aligned) + chevron
- PTTK trail color shown as 4px colored left border (red/blue/yellow/green/black); non-PTTK trails have no colored border
- Water access: solid blue droplet icon for `on_route`, outline/faded droplet for `nearby`, no icon for `none`
- Distance from user (or map center if no GPS) shown as muted secondary text on the card — uses existing `haversine.ts` utility
- 2-3 cards visible without scrolling on 375px screen (BROW-05)
- Tapping a TrailCard navigates to `/trails/:id` TrailDetail page (full-screen transition with back button)

### Map/list toggle behavior
- Mapa tab = map with pins (Phase 1+2). Trasy tab = scrollable trail list. No separate toggle button needed — bottom tab bar provides the switch
- Both views show the same trails from the current map viewport — Trasy list reflects whatever area the map is showing
- Sorted by nearest first: distance from user GPS location (if available) or map center (fallback)

### TrailDetail page
- Map hero layout: top ~40% is an interactive Mapbox map showing the trail polyline fitted to bounds
- Map inset is interactive (pannable/zoomable) — a second Mapbox instance (WebGL context management must be careful)
- Below map: trail name, all attributes (length, surface, difficulty, water access, PTTK color, distance), description if available
- Back button overlays the map hero (top-left)
- No action buttons in Phase 3 — display only. Heart and "Przeszedlem!" arrive in Phase 6 with auth
- Route: `/trails/:id` as a standalone route (not inside AppLayout tabs, or with modified layout)

### Empty state
- Appears only in Trasy list view (map view shows no pins — absence is the message, per Phase 2)
- Custom SVG illustration (user will provide externally via GPT) — code renders a placeholder `<img>` or inline SVG slot
- Text: "Brak tras w okolicy" + secondary line
- CTA button: "Szukaj w promieniu 50 km" — tapping zooms the map out to ~50km radius around current center and triggers a new trail fetch

### Claude's Discretion
- Exact card padding, font sizes, badge pill styling
- TrailDetail scroll behavior and section spacing
- Map inset height ratio (approximately 40% but flexible)
- Polyline styling in detail map inset (color, weight)
- Loading skeleton for TrailDetail page
- Placeholder SVG design until user provides custom one
- How to handle trails with no name (fallback display text)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Route` interface (src/lib/types.ts): Full type with all fields needed — name, length_km, surface_type, water_access, difficulty, trail_color, center_lat, center_lon
- `useUIStore` (src/stores/ui.ts): Already has `viewMode: 'map' | 'list'` with setters
- `useFiltersStore` (src/stores/filters.ts): Full filter state already scaffolded (Phase 4 wires it)
- `useViewportStore` (src/stores/viewport.ts): Has center, zoom, bounds — needed for "50km zoom out" CTA
- `haversine.ts` (src/lib/haversine.ts): Distance calculation utility — use for "nearest first" sort and distance display
- `BottomTabBar` (src/components/ui/BottomTabBar.tsx): Already has Mapa/Trasy/Ulubione/Profil tabs
- `MapView` (src/features/map/MapView.tsx): Map with trail layers already integrated (Phase 2), pin popup shows trail name
- Trail color tokens in `src/index.css`: `trail-red`, `trail-blue`, `trail-yellow`, `trail-green`, `trail-black` already defined

### Established Patterns
- Zustand for client state (viewport, filters, ui stores)
- Feature folder structure: trail display code goes in `src/features/trails/`
- Design tokens from `src/index.css` — no hardcoded colors
- Compact toast pattern (Phase 1 GPS denial, Phase 2 fetch error) — reuse for any feedback
- Map instance in `useRef` — second instance for TrailDetail needs same lifecycle care

### Integration Points
- `router.tsx`: Trasy tab currently renders a stub — replace with TrailList component. Add `/trails/:id` route for TrailDetail
- `useTrailsStore` (from Phase 2): Provides routes array — TrailList reads from this store
- MapView pin popup: Phase 2 shows trail name on pin tap — Phase 3 should add navigation to TrailDetail from popup
- `useGeolocation` hook: Provides user position for "nearest first" sort

</code_context>

<specifics>
## Specific Ideas

- Cards should feel like Strava activity list — compact, scannable, data-dense without noise
- PTTK color left border is a hiking app convention (mapy.cz style) — familiar to Polish hikers
- Empty state SVG will be created externally by user via GPT — implementation should have a clean placeholder slot
- "Nearest first" sort makes the list immediately useful for "what's close to me" discovery

</specifics>

<deferred>
## Deferred Ideas

- Filter button and filter panel — Phase 4
- Heart/favorite toggle on TrailCard — Phase 6
- "Przeszedlem!" activity button on TrailDetail — Phase 6
- "Walked" indicator badge on TrailCard — Phase 6
- Share/copy-link button — future phase

</deferred>

---

*Phase: 03-trail-display-and-browsing*
*Context gathered: 2026-03-13*
