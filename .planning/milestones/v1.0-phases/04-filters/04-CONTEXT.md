# Phase 4: Filters - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

6-category filter panel as a bottom sheet, client-side filter application on both map pins and trail list, horizontal chip bar for active filters, filter trigger button with count badge. Auth, favorites, and trail detail actions are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Bottom sheet behavior
- Half-sheet with drag — opens at ~50% screen height, draggable to expand full or dismiss downward (Apple Maps / Google Maps style)
- Dark backdrop behind sheet — tapping backdrop closes without applying (changes discarded)
- Closing without tapping "Zastosuj" resets to currently-applied filter state — no draft persistence
- "Zastosuj" button is sticky at the bottom of the sheet — always visible regardless of scroll position
- "Wyczyść wszystko" reset link inside the sheet (FILT-10)

### Filter control styling
- All multi-option filters (length, surface, water, difficulty, distance) use horizontal pill toggle groups — tap to select, tap again to deselect (Airbnb filter pattern)
- Water access filter has hint text subtitle under "Mile widziana": "Trasy z wodą wyżej" — explains boost behavior
- Distance filter uses same pill group as others (< 10 km / < 30 km / < 50 km) — consistent controls throughout
- Marked trail filter ("Szlak oznaczony") uses a toggle switch — visually distinct binary control, not pills
- All filter labels in Polish per DS-06

### Chip bar placement & UX
- Horizontal chip bar appears below the search bar on the map — visible on both map view and list view
- Chip overflow: Claude's discretion (horizontal scroll or wrap)
- Each chip has an × button to remove that filter; tapping the chip body opens the filter panel scrolled to that category — quick edit
- Chip label format: Claude's discretion (category + value vs. value only)

### Filter trigger button
- Floating circular button at bottom-left of map — opposite the geolocation button (bottom-right), balanced layout
- Button visible in both map and list views — users can open filters from either context
- Active filter count badge: Claude's discretion (accent circle with count or filled button state)
- Filters affect BOTH map pins AND trail list — filtered-out trails disappear from both views for consistent experience

### Claude's Discretion
- Chip overflow behavior (horizontal scroll vs wrap)
- Chip label format (category + value vs value only)
- Count badge styling
- Bottom sheet animation timing and spring physics
- Exact pill group sizing and spacing
- Filter category ordering within the sheet
- Sheet handle/grip indicator styling

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useFiltersStore` (src/stores/filters.ts): Fully scaffolded with all 6 filter types (length, surface, water, difficulty, distance, marked), setters, and `resetAll()` — ready to wire
- `Route` interface (src/lib/types.ts): Has all fields needed for client-side filtering — `length_km`, `surface_type`, `water_access`, `difficulty`, `is_marked`, `center_lat`, `center_lon`
- `haversine.ts` (src/lib/haversine.ts): Distance calculation utility — needed for distance filter
- Trail color tokens in `src/index.css`: design tokens already defined for consistent styling
- `useTrailsStore` (src/stores/trails.ts): Provides routes array that filters will operate on
- `useGeolocation` hook (src/hooks/useGeolocation.ts): Provides user position for distance filter calculation

### Established Patterns
- Zustand for client state — filter store already follows this pattern
- Design tokens from `src/index.css` — pill colors, badge colors, sheet backdrop
- Toast pattern (Phase 1, Phase 2) — potential feedback on filter apply
- Floating button pattern: geolocation button (bottom-right) established in Phase 1 — filter button mirrors at bottom-left

### Integration Points
- `MapView.tsx`: Needs to read filter state and apply to GeoJSON source data (filter map pins)
- TrailList component (Phase 3): Needs to apply filters to route array before rendering TrailCards
- `LocationSearch` component: Chip bar sits below search bar — needs coordination for vertical positioning
- `useTrails` hook: FILT-09 says filters are client-side when bounds unchanged — no Edge Function re-invocation needed

</code_context>

<specifics>
## Specific Ideas

- Bottom sheet should feel like Apple Maps or Google Maps filter panels — smooth drag, half-sheet default, expand on pull
- Pill toggle groups match Airbnb's filter UI — compact, dark theme friendly, familiar mobile pattern
- Water filter hint text ("Trasy z wodą wyżej") is important — the boost behavior is non-obvious and should be explained inline
- Filter button at bottom-left creates a balanced floating button layout with geolocation at bottom-right — symmetrical Strava-minimal aesthetic
- Filters affecting both map and list keeps the experience consistent — no confusion about "where did my trails go"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-filters*
*Context gathered: 2026-03-13*
