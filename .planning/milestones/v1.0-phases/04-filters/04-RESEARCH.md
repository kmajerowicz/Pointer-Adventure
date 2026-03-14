# Phase 4: Filters - Research

**Researched:** 2026-03-13
**Domain:** Bottom-sheet filter UI, client-side filtering, Zustand state management, Tailwind v4 animations
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Bottom sheet behavior**
- Half-sheet with drag — opens at ~50% screen height, draggable to expand full or dismiss downward (Apple Maps / Google Maps style)
- Dark backdrop behind sheet — tapping backdrop closes without applying (changes discarded)
- Closing without tapping "Zastosuj" resets to currently-applied filter state — no draft persistence
- "Zastosuj" button is sticky at the bottom of the sheet — always visible regardless of scroll position
- "Wyczysc wszystko" reset link inside the sheet (FILT-10)

**Filter control styling**
- All multi-option filters (length, surface, water, difficulty, distance) use horizontal pill toggle groups — tap to select, tap again to deselect (Airbnb filter pattern)
- Water access filter has hint text subtitle under "Mile widziana": "Trasy z woda wyzej" — explains boost behavior
- Distance filter uses same pill group as others (< 10 km / < 30 km / < 50 km) — consistent controls throughout
- Marked trail filter ("Szlak oznaczony") uses a toggle switch — visually distinct binary control, not pills
- All filter labels in Polish per DS-06

**Chip bar placement and UX**
- Horizontal chip bar appears below the search bar on the map — visible on both map view and list view
- Each chip has an x button to remove that filter; tapping the chip body opens the filter panel scrolled to that category — quick edit
- Chip label format: Claude's discretion (category + value vs. value only)
- Chip overflow: Claude's discretion (horizontal scroll or wrap)

**Filter trigger button**
- Floating circular button at bottom-left of map — opposite the geolocation button (bottom-right), balanced layout
- Button visible in both map and list views — users can open filters from either context
- Active filter count badge: Claude's discretion (accent circle with count or filled button state)
- Filters affect BOTH map pins AND trail list — filtered-out trails disappear from both views

### Claude's Discretion
- Chip overflow behavior (horizontal scroll vs wrap)
- Chip label format (category + value vs value only)
- Count badge styling
- Bottom sheet animation timing and spring physics
- Exact pill group sizing and spacing
- Filter category ordering within the sheet
- Sheet handle/grip indicator styling

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FILT-01 | Filter panel opens as bottom sheet with sticky "Zastosuj" button | Bottom-sheet CSS-only pattern with sticky footer documented below |
| FILT-02 | Length filter: `< 5 km` / `5-15 km` / `> 15 km` | `length_km` field on Route; thresholds map to 'short'/'medium'/'long' in store |
| FILT-03 | Surface filter: Ziemia / Zwir / Asfalt / Mieszana / Nieznana | `surface_type` on Route maps to Polish label set; store already typed |
| FILT-04 | Water access filter with "Mile widziana" boost behavior | Sort logic documented; `water_access` field is 'none'/'nearby'/'on_route' |
| FILT-05 | Difficulty filter: Latwa / Srednia / Trudna / Nieznana | `difficulty` on Route; store already typed |
| FILT-06 | Distance from user filter using Haversine | `haversineKm` utility already in `src/lib/haversine.ts`; needs `useGeolocation` |
| FILT-07 | Marked trail filter toggle | `is_marked` boolean on Route; store `marked: boolean | null` ready |
| FILT-08 | Active filter count badge + chip bar | Count derived from store; chip bar is new component in filter feature folder |
| FILT-09 | Client-side filtering without Edge Function re-invocation | Filter derived from `useTrailsStore.routes` in a `useMemo`; no new fetch needed |
| FILT-10 | "Wyczysc wszystko" reset | `resetAll()` already on `useFiltersStore` |
</phase_requirements>

---

## Summary

Phase 4 is a pure frontend UI and client-state phase — no new API endpoints, no schema changes. The filter store (`useFiltersStore`) is already scaffolded with all 6 filter types, setters, and `resetAll()`. The `Route` type has all required fields. The `haversineKm` utility exists. The pattern is: derive a `filteredRoutes` computed value from `useTrailsStore.routes` using `useMemo`, then pass it to both `MapView` (for GeoJSON layer data) and `TrailList` (for rendering). No Edge Function is called when only filters change.

The core implementation challenge is the bottom sheet with drag behavior. This must be built without a heavy third-party library to keep bundle lean. A CSS-only approach using a `fixed` overlay + Tailwind `translate-y` transitions is preferred, with optional pointer-event drag tracking for the handle. The sheet uses a "draft state" pattern: a local copy of filters is held in component state while the sheet is open; "Zastosuj" commits to the Zustand store, close/backdrop-tap reverts.

The chip bar is a horizontally scrolling row of dismissible pills rendered below `LocationSearch` inside the MapView overlay. The filter trigger button at bottom-left mirrors the geolocation button pattern (floating circle, `absolute bottom-4 left-4`) established in Phase 1.

**Primary recommendation:** Build everything as custom components using project tokens — no new library installs required. The architecture is: `useFilteredRoutes` hook (pure derived state) + `FilterPanel` (sheet UI with draft state) + `ActiveFilterChips` (chip bar) + `FilterButton` (floating trigger).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | already installed | Filter store, UI open/close state | Already used throughout project |
| React (useMemo, useState) | already installed | Draft state, derived filtered routes | Standard React primitives |
| Tailwind CSS v4 | already installed | Styling, animations, tokens | Project design system |
| Lucide-react | already installed | Filter icon, X icon, SlidersHorizontal | Consistent with existing icons |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `haversineKm` (local) | n/a | Distance filter calculation | Already exists at `src/lib/haversine.ts` |
| `useGeolocation` (local) | n/a | User position for distance filter | Already exists at `src/hooks/useGeolocation.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom bottom sheet | `@radix-ui/react-dialog` as sheet | Radix Dialog is centered modal; would need heavy overrides to become bottom sheet — not worth it for this use case |
| Custom bottom sheet | `vaul` (Drawer) | Vaul is excellent for this exact use case (touch drag included) but adds a new dependency; custom CSS approach is sufficient given the app's mobile-primary simple UX |
| Custom toggle switch | `@radix-ui/react-switch` | Radix Switch is accessible and well-tested; worth using if accessibility is critical for the marked filter; adds minimal bundle weight |

**Installation:** No new packages required. All needed primitives are already in the project.

---

## Architecture Patterns

### Recommended Project Structure
```
src/features/map/
├── FilterPanel.tsx         # Bottom sheet UI with draft state logic
├── FilterPanel.test.ts     # Unit: draft state, apply, reset
├── ActiveFilterChips.tsx   # Chip bar — horizontal scroll row
├── FilterButton.tsx        # Floating circular trigger with badge
└── (existing files)

src/hooks/
├── useFilteredRoutes.ts    # Derived state: filter + sort routes
└── useFilteredRoutes.test.ts
```

Chip bar and filter button live in the `map` feature because they are map-overlay UI elements. `useFilteredRoutes` lives in `hooks/` because it will be consumed by both the map view and the (Phase 3) trail list.

### Pattern 1: Draft State for Filter Panel

The sheet holds a local draft copy of filters. "Zastosuj" commits to store. Closing without applying reverts.

**What:** `useState` copy of filter values inside `FilterPanel`, initialized from current store state when sheet opens.
**When to use:** Anytime a multi-field form needs transactional apply/cancel semantics.

```typescript
// Source: standard React pattern — verified against project conventions
function FilterPanel({ isOpen, onClose }: FilterPanelProps) {
  const appliedFilters = useFiltersStore()
  const [draft, setDraft] = useState<FilterDraft>(toFilterDraft(appliedFilters))

  // Re-initialize draft from store when sheet opens
  useEffect(() => {
    if (isOpen) {
      setDraft(toFilterDraft(appliedFilters))
    }
  }, [isOpen])

  function handleApply() {
    appliedFilters.setLength(draft.length)
    appliedFilters.setSurface(draft.surface)
    // ... set all 6 filters
    onClose()
  }

  function handleReset() {
    setDraft(defaultFilterDraft)
  }

  function handleBackdropClick() {
    // Discard draft — do NOT apply
    onClose()
  }
  // ...
}
```

### Pattern 2: useFilteredRoutes Hook (Client-Side Filter + Sort)

**What:** Derives filtered + sorted route array from raw routes + filter state. Never calls Edge Function.
**When to use:** Anywhere the trail list or map needs filtered data. Single source of truth.

```typescript
// src/hooks/useFilteredRoutes.ts
export function useFilteredRoutes(): Route[] {
  const routes = useTrailsStore((s) => s.routes)
  const filters = useFiltersStore()
  const geolocation = useGeolocation()
  const userLat = geolocation.state.status === 'success'
    ? geolocation.state.position.coords.latitude : null
  const userLon = geolocation.state.status === 'success'
    ? geolocation.state.position.coords.longitude : null

  return useMemo(() => {
    let result = routes

    // Length filter
    if (filters.length) {
      result = result.filter((r) => {
        if (r.length_km == null) return true // include unknown
        if (filters.length === 'short') return r.length_km < 5
        if (filters.length === 'medium') return r.length_km >= 5 && r.length_km <= 15
        if (filters.length === 'long') return r.length_km > 15
        return true
      })
    }

    // Surface filter
    if (filters.surface) {
      result = result.filter((r) => r.surface_type === filters.surface)
    }

    // Difficulty filter
    if (filters.difficulty) {
      result = result.filter((r) => r.difficulty === filters.difficulty)
    }

    // Water access filter
    if (filters.water === 'required') {
      result = result.filter((r) => r.water_access === 'on_route' || r.water_access === 'nearby')
    }
    // 'preferred' keeps all but sorts water trails first (see sort step below)

    // Marked filter
    if (filters.marked === true) {
      result = result.filter((r) => r.is_marked)
    }

    // Distance filter
    if (filters.distance && userLat != null && userLon != null) {
      result = result.filter((r) => {
        const dist = haversineKm(userLat, userLon, r.center_lat, r.center_lon)
        return dist <= filters.distance!
      })
    }

    // Water "preferred" boost — sort trails with water access to top
    if (filters.water === 'preferred') {
      result = [...result].sort((a, b) => {
        const aHas = a.water_access !== 'none' ? 1 : 0
        const bHas = b.water_access !== 'none' ? 1 : 0
        return bHas - aHas
      })
    }

    return result
  }, [routes, filters, userLat, userLon])
}
```

### Pattern 3: Bottom Sheet (CSS-Only, No Library)

**What:** Fixed overlay with `translate-y` transition. Sheet slides up from bottom. Drag behavior uses pointer events on handle.
**When to use:** Half-sheet UI on mobile-primary PWA.

```css
/* In src/index.css @theme block — add these keyframes */
@keyframes sheet-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes sheet-down {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}
```

```tsx
// FilterPanel.tsx structure
{isOpen && (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 z-40 bg-black/60"
      onClick={handleBackdropClick}
      aria-hidden="true"
    />
    {/* Sheet */}
    <div
      role="dialog"
      aria-label="Filtry tras"
      aria-modal="true"
      className="fixed bottom-0 left-0 right-0 z-50 bg-bg-surface rounded-t-2xl flex flex-col
                 max-h-[85vh] animate-[sheet-up_250ms_ease-out]"
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-2 shrink-0">
        <div className="w-10 h-1 rounded-full bg-bg-elevated" />
      </div>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Filter sections */}
      </div>
      {/* Sticky footer */}
      <div className="shrink-0 px-4 py-4 border-t border-bg-elevated bg-bg-surface">
        <button
          onClick={handleApply}
          className="w-full h-12 rounded-xl bg-accent text-bg-base font-semibold text-sm
                     active:scale-[0.98] transition-transform"
        >
          Zastosuj
        </button>
      </div>
    </div>
  </>
)}
```

### Pattern 4: Pill Toggle Group

**What:** Row of pill buttons for multi-option selection. Tap to select, tap again to deselect.
**When to use:** Length, surface, water, difficulty, distance filters.

```tsx
// Reusable pill group component — internal to FilterPanel
function PillGroup<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T | null
  onChange: (v: T | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(value === opt.value ? null : opt.value)}
          className={[
            'px-4 py-2 rounded-full text-sm font-medium min-h-[2.75rem]',
            'border transition-colors',
            value === opt.value
              ? 'bg-accent text-bg-base border-accent'
              : 'bg-transparent text-text-secondary border-bg-elevated hover:border-text-muted',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
```

### Pattern 5: Active Filter Chips Bar

**What:** Horizontally scrolling row below the search bar. Visible only when at least one filter is active.
**When to use:** Showing applied filters, allowing quick removal.

**Recommendation:** Horizontal scroll (`overflow-x-auto`, `flex-nowrap`). Rationale: on a 375px screen with several active filters, wrapping would push the map content down unpredictably. Scrollable row keeps height predictable. Add `-ms-overflow-style: none; scrollbar-width: none` to hide scrollbar on mobile.

**Chip label format recommendation:** Value only (e.g., "< 5 km", "Ziemia", "Łatwa"). Category labels would make chips too wide on small screens. The × button makes the association clear.

```tsx
// Placement in MapView — below LocationSearch, above map content
// The search bar is at top-4 left-4 right-4; chip bar follows
{activeChips.length > 0 && (
  <div className="absolute top-[calc(3.5rem+1rem)] left-4 right-4 z-10">
    <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {activeChips.map((chip) => (
        <div
          key={chip.key}
          className="flex items-center gap-1.5 shrink-0 bg-bg-elevated border border-bg-elevated
                     rounded-full pl-3 pr-2 py-1.5 text-xs text-text-primary"
        >
          <button
            onClick={() => scrollFilterPanelTo(chip.category)}
            className="leading-none"
          >
            {chip.label}
          </button>
          <button
            onClick={() => chip.remove()}
            aria-label={`Usun filtr: ${chip.label}`}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  </div>
)}
```

**Note on chip bar height offset:** The `LocationSearch` container is `top-4` with padding ~3rem + 1rem gap = `top-[calc(3.5rem+1rem)]`. Exact value needs to be measured against actual rendered search bar height (~3.25rem from `py-3` + text). Use `top-[calc(3.25rem+1.5rem)]` or a named CSS variable for maintainability.

### Pattern 6: Filter Button (Floating, Bottom-Left)

**What:** Mirrors geolocation button pattern. `absolute bottom-4 left-4`, `w-12 h-12 rounded-full`.
**When to use:** Placed inside same relative container as geolocation button in `MapView`.

```tsx
// FilterButton.tsx
export function FilterButton({ onPress }: { onPress: () => void }) {
  const activeCount = useActiveFilterCount() // derived from store
  return (
    <button
      onClick={onPress}
      aria-label={`Filtry tras${activeCount > 0 ? `, ${activeCount} aktywne` : ''}`}
      className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-bg-surface text-text-primary
                 shadow-lg flex items-center justify-center active:scale-95 transition-transform relative"
    >
      <SlidersHorizontal size={20} strokeWidth={1.75} />
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-bg-base
                         text-[0.6rem] font-bold flex items-center justify-center leading-none">
          {activeCount}
        </span>
      )}
    </button>
  )
}
```

**Count badge recommendation:** Accent circle (`bg-accent text-bg-base`) at top-right of button, 20px circle with count number. This is legible on dark background and matches the accent gold already used for active states throughout the app.

### Pattern 7: MapView Integration — Filtered Routes

**What:** Pass `filteredRoutes` from `useFilteredRoutes` to `updateTrailData` and to the trail list.

```tsx
// In MapView.tsx — replace direct routes usage:
const filteredRoutes = useFilteredRoutes() // replaces direct useTrailsStore routes

// In updateTrailData effect:
useEffect(() => {
  const map = mapRef.current
  if (!map) return
  if (!map.getSource('trails')) return
  updateTrailData(map, filteredRoutes) // was: routes
}, [filteredRoutes])
```

### Anti-Patterns to Avoid

- **Calling Edge Function on filter change:** Filters are client-side. The `useTrails` hook triggers on `bounds` change only. Never add filter state as a dependency to `useTrails`.
- **Storing draft state in Zustand:** Draft lives in `FilterPanel` component state only. Committing half-formed filter state to the global store would cause the map to re-filter on every pill tap while sheet is open.
- **Using the native `<dialog>` element for the sheet:** Native dialog is centered by default; the CSS overrides needed to make it a bottom sheet are messier than a plain `fixed` div with backdrop.
- **Adding position:fixed to the chip bar:** The chip bar must be `position:absolute` inside the map container (same stacking context as LocationSearch), not fixed to viewport, so it scrolls correctly when the view transitions to list mode.
- **Forgetting `shrink-0` on chips:** Flex children without `shrink-0` will squash in the overflow-x-auto row, making chips unreadable.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Class merging | Custom concatenation | `cn()` / clsx+twMerge pattern | Conditional Tailwind classes need deduplication |
| Distance calc | Custom trig | `haversineKm` already in `src/lib/haversine.ts` | Already tested; handles edge cases |
| Filter count | Custom count fn | `useMemo` over store state | Trivially derived; no separate utility needed |

**Key insight:** This phase is 100% composition of existing patterns. No new utility libraries are needed.

---

## Common Pitfalls

### Pitfall 1: Draft State Desync on Multiple Opens
**What goes wrong:** Sheet is opened, user changes pills, closes without applying. On next open, draft shows previous session's unsaved state.
**Why it happens:** Component remains mounted (conditionally rendered but with CSS, or via React conditional), so `useState` persists.
**How to avoid:** Re-initialize draft in a `useEffect` with `isOpen` as dependency. When `isOpen` becomes `true`, reset draft to current committed store values.
**Warning signs:** Reopening the sheet shows "ghost" selections that weren't applied.

### Pitfall 2: Z-Index Conflict with Mapbox Controls
**What goes wrong:** Backdrop or sheet appears below map controls or Mapbox attribution.
**Why it happens:** Mapbox GL renders its canvas + controls in their own stacking context. Mapbox controls default to `z-index` values in the 1–10 range.
**How to avoid:** Use `z-40` for backdrop and `z-50` for sheet. The map container is `relative`; absolutely-positioned overlays within it stack correctly as long as the parent has no `overflow: hidden` clipping.
**Warning signs:** Sheet is visible but tapping sheet area hits map beneath it.

### Pitfall 3: Chip Bar Obscuring Search Suggestions
**What goes wrong:** When search dropdown is open and chips are active, the suggestions list appears behind the chip bar.
**Why it happens:** `LocationSearch` uses `z-10`; chip bar also uses `z-10`. Suggestion list is a child of `LocationSearch`, so it can't exceed the parent's z-context.
**How to avoid:** Keep chip bar at `z-10` but render it AFTER `LocationSearch` in the JSX tree (later in tree = higher paint order at same z). Alternatively set suggestion list to `z-20` by moving the `z-index` from container to the `<ul>` specifically.
**Warning signs:** Suggestion dropdown appears clipped by chip bar.

### Pitfall 4: Distance Filter Without User Location
**What goes wrong:** Distance filter is active but geolocation is denied/pending — all or no routes show.
**Why it happens:** `haversineKm` is called with `null` lat/lon.
**How to avoid:** In `useFilteredRoutes`, skip distance filtering if `userLat == null`. Show a hint in the filter panel: "Wymaga lokalizacji" when geolocation is not available.
**Warning signs:** Selecting distance filter makes all trails disappear despite there being nearby trails.

### Pitfall 5: "Preferred" Water Sort Mutating Routes Array
**What goes wrong:** `routes.sort()` mutates the array in place; Zustand store array is mutated; `useMemo` equality check misses the change.
**Why it happens:** `.sort()` mutates in place — spreading first (`[...result].sort(...)`) is required.
**How to avoid:** Always spread before sorting: `[...result].sort(...)`. This is documented in the code example above.
**Warning signs:** After applying "Mile widziana", removing the filter does not restore original order.

---

## Code Examples

Verified against existing project code:

### Active Filter Count (derived from store)
```typescript
// src/hooks/useActiveFilterCount.ts
export function useActiveFilterCount(): number {
  return useFiltersStore((s) => {
    let count = 0
    if (s.length !== null) count++
    if (s.surface !== null) count++
    if (s.water !== 'any') count++
    if (s.difficulty !== null) count++
    if (s.distance !== null) count++
    if (s.marked !== null) count++
    return count
  })
}
```

### Filter Label Maps (Polish, per DS-06)
```typescript
export const SURFACE_LABELS: Record<SurfaceType, string> = {
  dirt: 'Ziemia',
  gravel: 'Zwir',
  asphalt: 'Asfalt',
  mixed: 'Mieszana',
  unknown: 'Nieznana',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Latwa',
  moderate: 'Srednia',
  hard: 'Trudna',
  unknown: 'Nieznana',
}

export const LENGTH_OPTIONS = [
  { label: '< 5 km', value: 'short' as const },
  { label: '5–15 km', value: 'medium' as const },
  { label: '> 15 km', value: 'long' as const },
]

export const DISTANCE_OPTIONS = [
  { label: '< 10 km', value: 10 as const },
  { label: '< 30 km', value: 30 as const },
  { label: '< 50 km', value: 50 as const },
]

export const WATER_OPTIONS = [
  { label: 'Wymagana', value: 'required' as const },
  { label: 'Mile widziana', value: 'preferred' as const },
  { label: 'Obojętne', value: 'any' as const },
]
```

### Toggle Switch (for Marked Filter)
```tsx
// Simple accessible toggle switch using project tokens
function ToggleSwitch({ checked, onChange, id }: {
  checked: boolean
  onChange: (v: boolean) => void
  id: string
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'relative w-11 h-6 rounded-full transition-colors',
        checked ? 'bg-accent' : 'bg-bg-elevated',
      ].join(' ')}
    >
      <span className={[
        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-bg-surface shadow transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0',
      ].join(' ')} />
    </button>
  )
}
```

### Scroll to Filter Category (via Ref)
```tsx
// FilterPanel uses section refs to support "scroll to category" from chip tap
const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

function scrollToCategory(category: string) {
  const el = sectionRefs.current[category]
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Exposed via: onChipTap prop or event, called from ActiveFilterChips
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Third-party bottom sheet (react-spring-bottom-sheet) | CSS `translate-y` + `fixed` overlay | 2024 — CSS transitions now sufficient for mobile | No extra bundle cost |
| `forwardRef` for ref passing | Ref as regular prop (React 19) | React 19 (project is on React 19) | No `forwardRef` wrapping needed |
| `@tailwind base` directives | `@import "tailwindcss"` in CSS | Tailwind v4 | Already in use in this project |

**Deprecated/outdated:**
- `tailwind.config.ts` for custom tokens: project already uses `@theme` in `src/index.css` — do not add a config file.
- `window.matchMedia` for detecting scroll direction in bottom sheet: not needed; simple pointer events on the drag handle are sufficient.

---

## Open Questions

1. **Chip bar vertical position offset**
   - What we know: `LocationSearch` is `top-4` (16px) with a rendered height of approximately 48px (py-3 = 12px * 2 + ~20px text + border = ~52px). Chip bar should be `top-[4.5rem]` or `top-[calc(1rem+3.25rem)]`.
   - What's unclear: Exact pixel height is not confirmed without running the app. The `LocationSearch` container uses `py-3` + `text-sm` + border.
   - Recommendation: Use `mt-2` on the chip bar container rather than a calculated `top-` value, by making the chip bar a sibling `<div>` inside the `LocationSearch` component's outer `div` (which is `absolute top-4 left-4 right-4`). This way the chip bar naturally follows below the search input.

2. **Sheet animation exit (close)**
   - What we know: `animate-[sheet-up_250ms_ease-out]` handles open. Exit animation requires the element to remain mounted briefly.
   - What's unclear: Whether to use conditional rendering (simpler) vs CSS `display` toggling with `@starting-style`.
   - Recommendation: Use a controlled `isClosing` state flag. On close trigger, set `isClosing=true`, apply `animate-[sheet-down_200ms_ease-in]`, then after 200ms set `isOpen=false` and `isClosing=false`. This avoids a library while still giving smooth exit.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already configured) |
| Config file | `vitest.config.ts` — `environment: 'jsdom'`, `include: ['src/**/*.test.ts']` |
| Quick run command | `npx vitest run src/hooks/useFilteredRoutes.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FILT-02 | Length filter: short/medium/long thresholds | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | Wave 0 |
| FILT-03 | Surface filter: exact match | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | Wave 0 |
| FILT-04 | Water required excludes none; preferred sorts | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | Wave 0 |
| FILT-05 | Difficulty filter: exact match | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | Wave 0 |
| FILT-06 | Distance filter uses haversineKm correctly | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | Wave 0 |
| FILT-07 | Marked filter: true hides unmarked | unit | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | Wave 0 |
| FILT-09 | No Edge Function invoked on filter change | unit (mock spy) | `npx vitest run src/hooks/useFilteredRoutes.test.ts` | Wave 0 |
| FILT-10 | resetAll restores all defaults | unit | `npx vitest run src/stores/filters.test.ts` | Wave 0 |
| FILT-01 | Sheet opens with sticky button visible | manual | — | manual-only: requires DOM interaction |
| FILT-08 | Badge count and chip rendering | manual | — | manual-only: visual verification |

**Note on FILT-01/FILT-08:** Vitest config currently only includes `*.test.ts` (TypeScript files), not `*.test.tsx`. Testing React components requires adding `.tsx` to the vitest `include` pattern and installing `@testing-library/react`. Given the project has no existing component tests, unit testing the pure filtering logic in `useFilteredRoutes` is the correct scope. UI behavior is verified manually.

### Sampling Rate
- **Per task commit:** `npx vitest run src/hooks/useFilteredRoutes.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useFilteredRoutes.test.ts` — covers FILT-02, FILT-03, FILT-04, FILT-05, FILT-06, FILT-07, FILT-09
- [ ] `src/stores/filters.test.ts` — covers FILT-10 (`resetAll` behavior)

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/stores/filters.ts`, `src/stores/trails.ts`, `src/stores/ui.ts` — filter store is fully scaffolded, all 6 types, setters, resetAll
- Direct code inspection: `src/lib/types.ts` — all Route fields confirmed (`length_km`, `surface_type`, `water_access`, `difficulty`, `is_marked`, `center_lat`, `center_lon`)
- Direct code inspection: `src/lib/haversine.ts` — `haversineKm(lat1, lon1, lat2, lon2)` function exists and is tested
- Direct code inspection: `src/features/map/MapControls.tsx` — floating button pattern (`absolute bottom-4 right-4`, `w-12 h-12 rounded-full`) confirmed
- Direct code inspection: `src/features/map/LocationSearch.tsx` — `absolute top-4 left-4 right-4 z-10` container pattern confirmed
- Direct code inspection: `src/index.css` — all design tokens confirmed; `slide-up` keyframe already defined; `bg-bg-surface`, `bg-bg-elevated`, `text-accent`, `bg-accent` available
- Direct code inspection: `vitest.config.ts` — `environment: 'jsdom'`, `include: ['src/**/*.test.ts']`
- `.planning/phases/04-filters/04-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- `.agents/skills/tailwind-design-system/SKILL.md` — Tailwind v4 `@theme` patterns, native CSS animations with `@keyframes` inside `@theme`
- `.agents/skills/vercel-react-best-practices/SKILL.md` — `rerender-defer-reads` (subscribe to derived booleans), `rerender-derived-state-no-effect` (derive during render with useMemo)

### Tertiary (LOW confidence)
- None — all claims supported by direct code inspection or skill files

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are already installed; confirmed via direct file inspection
- Architecture: HIGH — draft state pattern, useMemo derivation, and CSS bottom sheet are standard React patterns; all integration points confirmed from existing code
- Pitfalls: HIGH — each pitfall identified from concrete code patterns in the existing codebase
- Filter logic: HIGH — all Route fields confirmed present in types.ts, all filter types confirmed in filters.ts

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable stack, no moving dependencies)
