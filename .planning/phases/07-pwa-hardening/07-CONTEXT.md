# Phase 7: PWA Hardening - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

The app installs correctly on Android and iOS, works offline with the last 10 viewed trails, and never silently fails due to service worker storage issues. No new features — this phase hardens the existing PWA shell from Phase 0 into a production-ready installable app with meaningful offline support.

</domain>

<decisions>
## Implementation Decisions

### Offline banner
- Persistent top bar, fixed at the very top of the screen
- Text: "Tryb offline — wyświetlam zapisane trasy"
- Amber/warning style using bg-accent (#C9A84C) with dark text
- Stays visible until `navigator.onLine` returns true (listen for `online` event)
- Disappears automatically on reconnect — no dismiss button needed

### Offline map & search behavior
- Geocoding search bar grayed out and non-functional when offline
- Claude's Discretion: How map behaves offline (cached tiles vs fallback), whether to auto-switch to list view or stay on current view

### Trail caching
- Cache trail data on view — when user opens TrailDetail, that trail's data gets stored
- Use Workbox runtime cache with NetworkFirst strategy on Supabase API calls
- Max 10 entries with LRU eviction — "last 10 viewed trails"
- Claude's Discretion: Whether to show offline badge on cached TrailCards, and optimal Mapbox tile cache limit to prevent quota issues

### App icons
- Replace SVG placeholders with PNG icons (192x192 and 512x512)
- Golden accent (#C9A84C) elements on dark background (#111318)
- Square PNGs — let OS handle corner radius and masking
- No custom Apple splash screen — just icons
- Claude's Discretion: Exact icon design/motif

### Install prompt
- Custom install banner shown after user has browsed 2-3 trails (not immediately)
- Bottom sheet above tab bar, dismissible with ×
- Uses `beforeinstallprompt` API on Android/Chrome
- iOS-specific: detect Safari, show manual instructions ("Kliknij Udostępnij → Dodaj do ekranu głównego" with share icon)
- Claude's Discretion: Re-prompt strategy after dismiss (e.g., once more after 7 days)

### Manifest
- `display: standalone`, `theme_color: #111318`, `orientation: portrait-primary` — already configured
- Update icon entries from SVG to PNG with correct MIME types

### Claude's Discretion
- Offline map behavior (cached tiles rendering, view switching)
- Offline badge indicator on cached TrailCards
- Mapbox tile cache size tuning for quota safety
- Icon design/motif
- Install prompt re-prompt timing
- Loading skeleton design for offline transitions

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vite.config.ts`: VitePWA plugin already configured with Workbox generateSW, autoUpdate, CacheFirst for Mapbox tiles
- `public/manifest.json`: Complete manifest with correct name, display, theme_color, orientation — only icons need PNG update
- `src/components/ui/BottomTabBar.tsx`: Tab bar component — install banner sits above this
- `src/features/map/FilterPanel.tsx`: Bottom sheet pattern — reusable for install banner slide-up
- `src/hooks/useGeolocation.ts`: Pattern for browser API hooks — similar pattern for useOnlineStatus
- `src/stores/ui.ts`: Zustand UI store — can hold install prompt dismissed state

### Established Patterns
- Workbox runtime caching via vite-plugin-pwa config (not custom SW code)
- Zustand for client state (viewport, filters, ui stores)
- Toast feedback for user actions (existing toast system)
- Design tokens in src/index.css — bg-accent, bg-bg-base, text-text-primary etc.

### Integration Points
- `vite.config.ts` workbox.runtimeCaching — add NetworkFirst route for Supabase trail API
- `public/manifest.json` icons array — swap SVG refs to PNG
- `public/icons/` — replace SVG files with PNG files
- `src/features/map/MapView.tsx` — search bar disabled state when offline
- TrailDetail page — trigger trail cache on view
- AppLayout or App.tsx — mount offline banner and install prompt components

</code_context>

<specifics>
## Specific Ideas

- Offline banner uses the golden accent color (bg-accent) — signals "attention" without alarming red, stays on-brand
- Install banner follows the same bottom-sheet-above-tab-bar pattern as the filter panel — consistent interaction model
- iOS install instructions are important because target users (friends group) likely include iPhone users
- Trail caching is automatic/invisible — no "save for offline" button, just works based on viewing history

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-pwa-hardening*
*Context gathered: 2026-03-14*
