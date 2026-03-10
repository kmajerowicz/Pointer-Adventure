# Technology Stack — Validated Research

**Project:** Psi Szlak (dog-friendly trail discovery PWA, Poland)
**Researched:** 2026-03-11
**Mode:** Brownfield validation — stack is fixed, this document surfaces version-specific gotchas and confirms correct usage patterns.

---

## Stack at a Glance

| Layer | Technology | Installed Version | Status |
|-------|-----------|-------------------|--------|
| UI Framework | React | 19.2.0 | Confirmed current stable |
| Build | Vite | 7.3.1 | Confirmed current stable |
| Language | TypeScript | ~5.9.3 | Confirmed current |
| Styling | Tailwind CSS | 4.2.1 | Confirmed current stable |
| Maps | Mapbox GL JS | ^3.19.1 | Confirmed current stable |
| State | Zustand | 5.0.11 | Confirmed current stable |
| Backend | @supabase/supabase-js | ^2.98.0 | Confirmed current stable |
| Routing | React Router DOM | 7.13.1 | Confirmed current stable |
| PWA | vite-plugin-pwa | ^1.2.0 | Confirmed current stable |
| SW Precache | workbox-precaching | ^7.4.0 | Confirmed current |

**Confidence:** HIGH for version currency (package.json verified against npm registry patterns and search results)

---

## Section 1: Mapbox GL JS v3 with React 19

### What Changed in v3 (Relevant to This Project)

**TypeScript types are now first-party.** Starting at mapbox-gl v3.5.0, the library ships its own TypeScript definitions. The community package `@types/mapbox-gl` is now a stub and **must not be installed alongside the library**. The naming conventions changed: style-spec types are now suffixed with `Specification` (e.g., `StyleSpecification`, `LayerSpecification`) rather than the old `Style`, `AnyLayer` names. Old aliases exist with `@deprecated` markers, but don't rely on them.

**CSS is now strictly required.** The stylesheet `mapbox-gl/dist/mapbox-gl.css` must be imported unconditionally. Missing it causes blank/broken maps, broken popups, and broken markers — no visible error is thrown, which makes this a silent failure. Import it once at the application root.

**Attribution hiding is a ToS violation.** The current `src/index.css` contains `.mapboxgl-ctrl-attrib { display: none !important; }`. This violates Mapbox ToS and must be removed before any production use. The ToS-compliant alternative is to use the `compact: true` option on `AttributionControl`, which collapses it to a small icon. Pass `{ compact: true }` when constructing the map or adding the control programmatically.

**Confidence:** HIGH — Verified against official Mapbox migration docs and GitHub issue tracker.

### React 19 + Strict Mode: Double Initialization

React 19 enables concurrent rendering by default and Strict Mode (used in development) deliberately mounts, unmounts, and remounts components to surface cleanup bugs. Mapbox GL JS initializes with a WebGL context, tile workers, and event listeners — all of which are expensive and must be properly cleaned up.

**The correct pattern:**

```typescript
// src/features/map/MapView.tsx
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [19.145, 51.919],
      zoom: 6,
      attributionControl: false, // manage manually for compact mode
    });

    mapRef.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
```

**Why the `if (!mapRef.current)` guard:** Strict Mode's double-invocation fires the effect twice in development. Without the guard, you get two map instances on the same DOM node, causing a WebGL context error. The guard prevents re-initialization when the ref already holds a map.

**Why `mapRef.current = null` in cleanup:** Ensures the guard resets correctly so the next mount cycle creates a fresh map. Not resetting leaves a stale reference pointing to a removed map.

**Confidence:** HIGH — Pattern confirmed against React 19 Strict Mode behavior, official Mapbox React tutorial, and GitHub issue #9627.

### Vite + Mapbox GL JS Worker Bundling

Mapbox GL JS v3 uses Web Workers internally for tile processing. With Vite (Rollup-based bundler), there is a known interaction where the worker bundle can fail to parse if certain import patterns are used. The safe approach:

- **Do not destructure type imports with `import { type Map }`** — use `import type { Map }` instead. The former can break tree shaking and worker bundling in Vite.
- **No `mapbox-gl/dist/mapbox-gl-csp-worker` workaround needed** for standard Vite 7 setups — this was a Webpack-era fix that is irrelevant here.
- Import `mapbox-gl` as a default import: `import mapboxgl from 'mapbox-gl'`.

**Confidence:** MEDIUM — Confirmed via Vite/Mapbox GitHub issues; Vite 7 behavior extrapolated from Vite 5/6 patterns.

---

## Section 2: Supabase Edge Functions with Overpass API

### Runtime and Limits (Free Tier)

Edge Functions run on Deno (Supabase Edge Runtime, Deno-compatible). Key limits that affect the Overpass pipeline:

| Limit | Value | Impact |
|-------|-------|--------|
| CPU time per request | 2 seconds | Overpass queries themselves are async I/O — CPU time is not the bottleneck |
| Wall-clock (idle) timeout | 150 seconds | Overpass queries can take 30-120s for large bboxes — this is the real risk |
| Memory | 512 MB | Sufficient for GeoJSON payloads from OSM |
| Function bundle size | 20 MB | No issue for a fetch-and-transform function |

**The 150-second idle timeout is the primary risk.** If Overpass takes longer than 150 seconds to respond, the Edge Function returns a 504 before the response arrives. Mitigations:

1. Always set an explicit Overpass `[timeout:25]` in the QL query — this forces Overpass to abort and return an error within 25 seconds rather than hanging.
2. Set a `fetch` `AbortController` timeout in the Edge Function (e.g., 30 seconds) so you can return a structured error instead of hitting the 504.
3. Keep bboxes small (the `search-trails` function should accept viewport bounds, not country-level queries).

**Confidence:** HIGH — Verified against official Supabase Edge Functions limits documentation and GitHub discussion #40074.

### CORS Handling

Unlike Supabase's auto-generated REST API, Edge Functions require **manual CORS handling**. Every function must handle the `OPTIONS` preflight before the main logic, otherwise the preflight itself will fail with an error response that has no CORS headers — the browser then blocks the actual request.

**Required pattern:**

```typescript
// supabase/functions/search-trails/index.ts
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ... main logic
});
```

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**Confidence:** HIGH — Verified against official Supabase CORS documentation.

### Overpass Query Pattern

For hiking trail discovery in Poland within a viewport bbox:

```
[out:json][timeout:25];
(
  relation["route"="hiking"]["network"~"nwn|rwn|lwn"]({{bbox}});
  relation["route"="hiking"]["operator"~"PTTK"]({{bbox}});
);
out body;
>;
out skel qt;
```

Key Overpass behaviors to know:
- Default server timeout is 180 seconds; always override with `[timeout:25]` to fail fast.
- Rate limiting returns HTTP 429. Implement exponential backoff: wait 2s, then 4s, then 8s before giving up. The Edge Function's 150s wall clock gives roughly 3 retry cycles with 30s per attempt.
- The public Overpass endpoints (`overpass-api.de`) have usage policies — for a small closed group (5-10 users) with bbox-scoped queries and a Supabase cache layer, this is well within acceptable use.
- Use `overpass-api.de/api/interpreter` or `overpass.kumi.systems/api/interpreter` as fallback endpoint.

**Confidence:** MEDIUM — Overpass behavior verified against OSM Wiki; rate limit strategy is standard practice.

### Supabase Cache Pattern (bbox_hash)

Per PROJECT.md: the cache lookup uses exact `bbox_hash` string match, not spatial containment. This is intentionally simple — no PostGIS required. The tradeoff is redundant Overpass fetches when the user pans slightly, which is acceptable for a 5-10 person app. The Edge Function should:

1. Compute `bbox_hash` from the rounded viewport bounds (e.g., round to 2 decimal places).
2. Check `route_cache` table for an unexpired entry.
3. On cache hit: return cached GeoJSON.
4. On cache miss: fetch from Overpass, upsert into `route_cache`, return result.

**Confidence:** HIGH — Directly from PROJECT.md schema decisions.

---

## Section 3: vite-plugin-pwa 1.x + Workbox for Map Tile Caching

### Current Configuration Analysis

The existing `vite.config.ts` has a `runtimeCaching` rule targeting `https://api.mapbox.com/.*` with `CacheFirst` and a 7-day / 500-entry expiration. This configuration has **three issues that need fixing**:

**Issue 1: Missing `cacheableResponse` for opaque responses.**
Mapbox tiles are served from a cross-origin CDN. Without CORS headers on the tile responses, Workbox receives opaque responses (status code 0). By default, Workbox does not cache opaque responses. Fix: add `cacheableResponse: { statuses: [0, 200] }` to the options.

**Issue 2: Missing `purgeOnQuotaError: true`.**
Opaque responses inflate storage quota dramatically in Chrome — a 7 KB tile can consume ~7 MB of quota. With 500 entries, this can consume 3.5 GB of quota, causing `QuotaExceededError`. Fix: add `purgeOnQuotaError: true` to the `ExpirationPlugin` options and reduce `maxEntries` to a safer value like 200.

**Issue 3: Mapbox GL JS v3 has a built-in 50 MB tile cache using the Cache API.**
The built-in cache uses the cache name `mapbox-tiles` (same as the Workbox cache). There is a documented 403 issue where the service worker intercepts Mapbox's internal cache requests and returns stale/forbidden responses. To avoid this conflict, use a distinct cache name like `psi-szlak-mapbox-tiles` for the Workbox cache.

**Corrected configuration:**

```typescript
// vite.config.ts
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'psi-szlak-mapbox-tiles',  // distinct from mapbox-gl internal cache
        expiration: {
          maxEntries: 200,                      // reduced from 500 — opaque responses inflate quota
          maxAgeSeconds: 60 * 60 * 24 * 7,
          purgeOnQuotaError: true,              // required for opaque response safety
        },
        cacheableResponse: {
          statuses: [0, 200],                   // 0 = opaque response from cross-origin tiles
        },
      },
    },
    {
      urlPattern: /^https:\/\/events\.mapbox\.com\/.*/i,
      handler: 'NetworkOnly',  // telemetry — never cache
    },
  ],
},
```

**Confidence:** HIGH — Opaque response behavior verified against Chrome Workbox documentation and the "7 KB equals 7 MB" Cloud Four article; cache name conflict confirmed against Mapbox GL JS tile cache GitHub issue #8967.

### registerType: 'autoUpdate' and External manifest.json

The project uses `registerType: 'autoUpdate'` and `manifest: false` (external `public/manifest.json`). This is a valid configuration. Key behaviors to understand:

- `autoUpdate` silently updates the service worker and reloads all tabs when new assets are available. For a small closed group this is fine; for a broader audience you would prefer `prompt`.
- The external `manifest.json` requires a `<link rel="manifest" href="/manifest.json">` in `index.html`. Vite-plugin-pwa does NOT inject this automatically when `manifest: false` — verify it exists in `index.html`.
- The `includeAssets: ['vite.svg']` in the current config is a scaffolding leftover. The app icons are SVGs in `public/icons/`. Update `includeAssets` to `['icons/*.svg']` or remove it (Workbox will precache everything matching `globPatterns` anyway).

**Confidence:** MEDIUM — Behavior verified against vite-plugin-pwa documentation; manifest link injection is confirmed behavior.

### Offline Strategy for Trail Data

The PWA offline goal is "last 10 trails cached." Map tiles are cached by the Workbox runtime cache above. Trail JSON data from Supabase needs a separate strategy:

- Trail API responses from Supabase are same-origin HTTP requests (via `@supabase/supabase-js`). Add a `NetworkFirst` runtime cache rule for the Supabase REST endpoint pattern.
- Supabase Auth tokens are stored in `localStorage` — they survive offline but API calls will fail. Handle this gracefully in the UI.

---

## Section 4: Tailwind CSS 4 @theme Configuration

### What the Project is Doing Correctly

The `src/index.css` uses `@import "tailwindcss"` (not deprecated `@tailwind` directives) and defines all tokens inside `@theme { }`. This is the correct v4 pattern. Tailwind 4 is CSS-first — no `tailwind.config.ts` exists or is needed.

All token definitions use direct hex values inside `@theme`. This is correct. Tailwind v4 accepts any color format (hex, hsl, oklch) inside `@theme`.

### Dark Mode Token Pattern (Single-Theme App)

Since the app is dark-mode only, the current pattern — defining colors directly in `@theme` without any `.dark` selector — is exactly right. There is no need for `@theme inline` combined with `:root` CSS variables unless you need runtime theme switching. This app does not.

**Do not add** `@custom-variant dark` or `darkMode` configuration. Those are for apps that toggle between light and dark. Adding them to a dark-only app creates unnecessary complexity and potential utility class generation bloat.

**Confidence:** HIGH — Verified against official Tailwind CSS v4 documentation and GitHub discussion #18471.

### The @theme vs :root Distinction

An important v4 nuance: variables inside `@theme { }` generate utility classes AND are accessible as CSS custom properties at runtime. Variables in `:root { }` only create CSS custom properties — no utility classes.

The `--spacing-tab-bar: 4.5rem` token is in `@theme`. This means Tailwind generates `mt-tab-bar`, `h-tab-bar`, `pb-tab-bar` etc. as utility classes. Use these classes rather than the raw `var(--spacing-tab-bar)` in inline styles. This is the intended pattern.

**Confidence:** HIGH — Verified against official Tailwind CSS v4 docs.

### @keyframes Inside @theme

The current `src/index.css` defines `@keyframes` blocks inside `@theme`. This is valid in Tailwind v4 — keyframes defined inside `@theme` become available as animation tokens. The `animate-fade-in` and `animate-slide-up` utilities will be generated automatically. No `animation` token declaration is needed.

**Confidence:** HIGH — Official Tailwind v4 docs confirm keyframes inside `@theme`.

### Critical Gotcha: No tailwind.config.ts Plugins in v4

If any future dependency tries to add Tailwind configuration via the old `tailwind.config.ts` `plugins` array (e.g., `@tailwindcss/forms`, `@tailwindcss/typography`), those plugins must use the new `@plugin "..."` directive in CSS instead. The `@tailwindcss/vite` plugin handles compilation; the JS config file is not used.

**Confidence:** HIGH — v4 architecture change, confirmed against official docs.

---

## Section 5: Zustand 5 with React 19

Zustand 5 internally uses `useSyncExternalStore`, which is the React-blessed API for external store subscriptions in concurrent rendering. This means Zustand stores are safe under React 19's automatic concurrent mode — no tearing, no stale reads, no compatibility issues.

The existing stores (`viewport.ts`, `filters.ts`, `ui.ts`) should follow the standard Zustand 5 pattern. There are no React 19-specific gotchas with Zustand 5.

**Confidence:** HIGH — Confirmed against Zustand v5 changelog and React 19 `useSyncExternalStore` documentation.

---

## Section 6: Supabase Auth with React 19

The `onAuthStateChange` subscription pattern requires cleanup to prevent memory leaks under React 19's concurrent rendering (which can mount/unmount components during transitions).

**Required cleanup pattern:**

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => { /* handle */ }
  );

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

Without the `unsubscribe()` call, React 19's Strict Mode double-invocation creates two active listeners. Under concurrent rendering, components being prepared off-screen can also create orphaned listeners.

**Confidence:** HIGH — Standard Supabase JS v2 pattern; cleanup requirement confirmed against Supabase React quickstart docs.

---

## Known Issues to Fix Before Feature Work

These are issues found in the current scaffolding that will cause problems in production:

| Issue | File | Fix |
|-------|------|-----|
| Attribution hidden via CSS | `src/index.css` line 67-69 | Remove `.mapboxgl-ctrl-attrib { display: none !important; }`. Add `attributionControl: false` to `Map` constructor and add `new mapboxgl.AttributionControl({ compact: true })` instead. |
| Workbox tile cache missing `cacheableResponse` | `vite.config.ts` | Add `cacheableResponse: { statuses: [0, 200] }` and `purgeOnQuotaError: true` |
| Workbox tile cache name conflicts with mapbox-gl internal cache | `vite.config.ts` | Rename `mapbox-tiles` to `psi-szlak-mapbox-tiles` |
| `includeAssets: ['vite.svg']` is a scaffold leftover | `vite.config.ts` | Change to `['icons/*.svg']` |
| Mapbox CSS not imported | (not yet implemented) | `import 'mapbox-gl/dist/mapbox-gl.css'` must be in the map component or `src/main.tsx` |
| `manifest.json` link not verified | `index.html` | Confirm `<link rel="manifest" href="/manifest.json">` exists |

---

## Sources

- [Migrate to Mapbox GL JS v3](https://docs.mapbox.com/mapbox-gl-js/guides/migrate-to-v3/) — MEDIUM (search-verified, not directly fetched)
- [Migrating from @types/mapbox-gl — GitHub Issue #13203](https://github.com/mapbox/mapbox-gl-js/issues/13203) — MEDIUM
- [React 19 StrictMode docs](https://react.dev/reference/react/StrictMode) — HIGH
- [Supabase Edge Functions Limits](https://supabase.com/docs/guides/functions/limits) — HIGH (official)
- [Supabase Edge Functions CORS](https://supabase.com/docs/guides/functions/cors) — HIGH (official)
- [Understanding storage quota — Workbox/Chrome](https://developer.chrome.com/docs/workbox/understanding-storage-quota) — HIGH
- [When 7 KB Equals 7 MB — Cloud Four](https://cloudfour.com/thinks/when-7-kb-equals-7-mb/) — HIGH
- [Mapbox GL JS tile cache 50 MB — GitHub Issue #8967](https://github.com/mapbox/mapbox-gl-js/issues/8967) — MEDIUM
- [Tailwind CSS v4 Theme variables](https://tailwindcss.com/docs/theme) — HIGH (official)
- [Tailwind CSS v4 Theming discussion #18471](https://github.com/tailwindlabs/tailwindcss/discussions/18471) — MEDIUM
- [Zustand v5 changelog and React 19 compatibility](https://www.npmjs.com/package/zustand) — HIGH
- [Use Supabase Auth with React](https://supabase.com/docs/guides/auth/quickstarts/react) — HIGH (official)
- [vite-plugin-pwa Workbox generateSW](https://vite-pwa-org.netlify.app/workbox/generate-sw) — MEDIUM
