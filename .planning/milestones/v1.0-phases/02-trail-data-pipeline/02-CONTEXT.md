# Phase 2: Trail Data Pipeline - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Trail data from OpenStreetMap and PTTK is automatically fetched via Supabase Edge Function, cached with 7-day TTL, and surfaced on the map as pins and polylines as the user pans. Browsing UI (TrailCard, TrailList, TrailDetail) is Phase 3. Filters are Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Trail pin appearance
- Minimal colored dots (not icon pins) — Strava-minimal aesthetic
- Non-PTTK trails use accent gold (#C9A84C) dots
- PTTK trails use their `trail_color` for the dot
- Clustering: numbered cluster circles showing count (e.g. "12"), expand on zoom (standard Mapbox GL clustering)
- Tapping a pin shows a small popup/tooltip with the trail name (Phase 3 adds full TrailDetail navigation)

### PTTK polyline rendering
- Medium line weight (4-5px) — visible without dominating the map
- Dark outline (casing) around the colored fill line — standard hiking map depth effect, stands out on varied terrain
- Tapping a polyline shows the same name popup as pins — consistent interaction
- When a PTTK trail has both geometry (polyline) and center point: show BOTH pin and polyline — pin marks center for discoverability at low zoom, polyline shows route at higher zoom

### Loading & error states
- Subtle thin progress bar at the very top of the map during trail fetch (like YouTube/GitHub loading bar) — doesn't block map interaction
- On fetch failure: Polish toast "Nie udało się pobrać tras" with "Spróbuj ponownie" retry button in toast — matches Phase 1 GPS denial toast pattern
- Existing trail pins stay visible while new area loads — pins accumulate as user explores, map feels alive
- When panning to an area with zero trails: nothing happens, just no pins appear — absence is the message (Phase 3 adds empty state for list view)

### Cache & freshness
- 7-day TTL auto-expiry (from requirements) — no user action needed for normal use
- Small muted timestamp text at bottom-left of map: "Zaktualizowano: X dni temu" — transparency without clutter
- Small refresh icon next to the timestamp — tapping forces re-fetch of current viewport (bypasses cache)
- Refresh icon provides explicit manual control without conflicting with map pan gestures

### Claude's Discretion
- Exact dot size and cluster circle styling
- Progress bar color and animation
- Popup/tooltip styling and positioning
- Polyline casing width ratio
- Timestamp text size and exact formatting
- Refresh icon design

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useViewportStore` (src/stores/viewport.ts): Already has bounds with north/south/east/west — `useTrails` hook can subscribe to bounds and pass bbox to Edge Function
- `MapView` (src/features/map/MapView.tsx): Map instance in `mapRef` — trail GeoJSON source and layers will be added to this instance
- `Route` interface (src/lib/types.ts): Full type definition with `trail_color`, `geometry`, `water_access` etc. — ready for Edge Function response typing
- `SearchArea` interface (src/lib/types.ts): Has `bbox_hash`, bounds, and `expires_at` — matches cache check pattern
- `supabase` client (src/lib/supabase.ts): Ready for Edge Function invocation

### Established Patterns
- Zustand for client state — trail data store should follow same pattern as viewport store
- Feature folder structure — trail pipeline code goes in `src/features/map/` (map-layer code) and `src/hooks/useTrails.ts`
- Design tokens in `src/index.css` — trail color tokens (`trail-red`, `trail-blue`, etc.) already defined
- Toast pattern from Phase 1 (GPS denial) — reuse for fetch error toast

### Integration Points
- `MapView.tsx` moveend handler: Already syncs viewport to Zustand — `useTrails` hook triggers on bounds change
- `supabase/functions/search-trails/`: Directory exists but empty — Edge Function code goes here
- `supabase/migrations/`: Schema already has `routes` and `search_areas` tables with correct columns
- Map layers: Added via `map.addSource()` and `map.addLayer()` on the mapRef instance after map loads

</code_context>

<specifics>
## Specific Ideas

- Trail pins should feel like Strava heat map points — minimal, data-dense without visual noise
- PTTK polylines with dark casing is the standard hiking map convention (mapy.cz, UMP) — familiar to Polish hikers
- Loading bar at top is the modern web app pattern (YouTube, GitHub) — unobtrusive and non-blocking
- Accumulating pins as user explores makes the map feel alive and rewarding to pan around
- Refresh icon next to timestamp is honest about data freshness without being paranoid

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-trail-data-pipeline*
*Context gathered: 2026-03-13*
