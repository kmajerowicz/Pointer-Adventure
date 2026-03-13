# Phase 7: PWA Hardening - Research

**Researched:** 2026-03-14
**Domain:** Progressive Web App — service worker caching, offline UX, installability, manifest icons
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Offline banner:** Persistent top bar fixed at very top; text "Tryb offline — wyświetlam zapisane trasy"; bg-accent (#C9A84C) with dark text; disappears on `online` event; no dismiss button
- **Trail caching:** NetworkFirst strategy on Supabase API calls; max 10 entries LRU; cache triggered on TrailDetail view
- **App icons:** PNG 192x192 and 512x512; golden accent (#C9A84C) on dark background (#111318); square PNGs only; no Apple splash screen
- **Install prompt:** Custom bottom-sheet banner shown after user browses 2-3 trails; dismissible with ×; uses `beforeinstallprompt` on Android/Chrome; iOS-specific manual instructions ("Kliknij Udostępnij → Dodaj do ekranu głównego" with share icon)
- **Manifest:** `display: standalone`, `theme_color: #111318`, `orientation: portrait-primary` — already set; update icon entries to PNG
- **Geocoding search disabled offline** with grayed-out state

### Claude's Discretion
- Offline map behavior (cached tiles rendering vs. fallback, whether to auto-switch to list view)
- Offline badge indicator on cached TrailCards
- Mapbox tile cache size tuning (maxEntries) for quota safety
- Icon design/motif
- Install prompt re-prompt timing after dismiss
- Loading skeleton design for offline transitions

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PWA-01 | App installable on Android and iOS home screen with proper icon, name, and splash | Manifest PNG icons + `beforeinstallprompt` + iOS Safari detection patterns |
| PWA-02 | Service worker precaches app shell and bundles | VitePWA generateSW with globPatterns — already configured; verify 4 MiB file limit |
| PWA-03 | Last 10 viewed trail details cached via NetworkFirst strategy for offline access | Workbox runtimeCaching NetworkFirst + ExpirationPlugin maxEntries: 10 on Supabase URL |
| PWA-04 | Persistent top banner when offline; disappears on reconnect | `useOnlineStatus` hook pattern + React component in AppLayout |
| PWA-05 | Geocoding search disabled in offline mode with grayed-out state | `disabled` prop + `opacity-50 pointer-events-none` on LocationSearch when offline |
| PWA-06 | PNG icons (192x192, 512x512) replace SVG placeholders for iOS compatibility | iOS Safari rejects SVG manifest icons; must use PNG with correct MIME type |
| PWA-07 | Manifest: `display: standalone`, theme color `#111318`, portrait orientation | Already set in public/manifest.json — only icons array update needed |
</phase_requirements>

## Summary

Phase 7 hardens the existing PWA shell (already scaffolded with VitePWA + Workbox in Phase 0) into a production-ready installable app. The configuration baseline is solid: `vite-plugin-pwa@1.2.0` with `workbox-precaching@7.4.0` is already wired in `vite.config.ts`, `manifest.json` has correct `display`, `theme_color`, and `orientation`. The two main gaps are: (1) SVG icons in the manifest that iOS Safari ignores, and (2) missing runtime caching for Supabase trail data, offline UI states, and the install prompt flow.

The critical technical risks in this phase are all known and solvable. Opaque response quota inflation (approximately 7 MB per Mapbox tile in Chrome's accounting) is already mitigated by `purgeOnQuotaError: true` set in Phase 0, but the `maxEntries: 500` for Mapbox tiles is dangerously high — at 7 MB opaque penalty per entry that could exhaust 3.5 GB of quota attribution. Reducing `maxEntries` to 50–100 is the safe range. The NetworkFirst Supabase cache must use `cacheableResponse: { statuses: [0, 200] }` to cache opaque responses from cross-origin Supabase calls.

iOS installability is fully manual (no `beforeinstallprompt` equivalent), requiring a UA-sniffed instruction bottom sheet. Android/Chrome uses the deferred `beforeinstallprompt` event — the pattern is to save the event, show a custom UI, then call `prompt()` when the user taps the banner button.

**Primary recommendation:** Wire three things in `vite.config.ts`: add the Supabase NetworkFirst runtime cache, reduce Mapbox maxEntries to 50, keep `purgeOnQuotaError: true`. Everything else (offline banner, install prompt, icon swap) is pure React/UI work.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-plugin-pwa | ^1.2.0 (installed) | Workbox generateSW, precaching, runtime caching via Vite plugin | Already integrated in project; the standard Vite PWA solution |
| workbox-precaching | ^7.4.0 (installed) | App shell precache in service worker | Bundled strategy from vite-plugin-pwa generateSW mode |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.577.0 (installed) | Share icon for iOS install instructions | Already in project; use `Share2` icon for iOS prompt |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| generateSW (current) | injectManifest | injectManifest gives more control but requires manual SW authoring; generateSW is correct for this phase |
| navigator.onLine | fetch-based ping | Ping catches captive portals; overkill for this use case — onLine is sufficient |

**No new installations required.** All dependencies are already present.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   ├── useOnlineStatus.ts     # NEW — navigator.onLine + event listeners
│   └── useInstallPrompt.ts    # NEW — beforeinstallprompt deferral + iOS detection
├── components/
│   └── ui/
│       ├── OfflineBanner.tsx  # NEW — fixed top bar, shown when offline
│       └── InstallPrompt.tsx  # NEW — bottom sheet above tab bar
├── stores/
│   └── ui.ts                  # EXTEND — add installPromptDismissed, trailViewCount
public/
└── icons/
    ├── icon-192.png           # REPLACE icon-192.svg
    └── icon-512.png           # REPLACE icon-512.svg
```

### Pattern 1: useOnlineStatus Hook
**What:** Thin hook wrapping `navigator.onLine` with window event listeners for `online`/`offline`.
**When to use:** Mount in AppLayout — all tabbed pages and the offline banner subscribe to this.
**Example:**
```typescript
// Pattern from MDN Navigator.onLine docs
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### Pattern 2: useInstallPrompt Hook
**What:** Captures and defers `beforeinstallprompt`; detects iOS Safari; tracks trail view count from Zustand.
**When to use:** Mount once in AppLayout.
**Example:**
```typescript
// Source: web.dev/learn/pwa/installation-prompt
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detect iOS Safari
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsIOS(ios)
    setIsStandalone(standalone)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return { deferredPrompt, isIOS, isStandalone, promptInstall }
}
```
Note: `BeforeInstallPromptEvent` is not in standard TypeScript lib — declare it in `src/vite-env.d.ts`.

### Pattern 3: Workbox NetworkFirst for Supabase API
**What:** Add runtimeCaching entry for Supabase project URL, NetworkFirst strategy, max 10 entries.
**When to use:** Any Supabase REST/PostgREST call goes through `https://<project>.supabase.co`.
**Example:**
```typescript
// Source: vite-pwa-org.netlify.app/workbox/generate-sw
{
  urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'psi-szlak-supabase-trails',
    expiration: {
      maxEntries: 10,
      maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      purgeOnQuotaError: true,
    },
    cacheableResponse: { statuses: [0, 200] },
    networkTimeoutSeconds: 3, // fall back to cache after 3s
  },
}
```

### Pattern 4: Offline-Disabled LocationSearch
**What:** Pass `isOnline` boolean as prop to LocationSearch; render with grayed-out visual and `disabled` attribute.
**When to use:** LocationSearch already accepts props — add `disabled?: boolean`.
**Example:**
```typescript
// Extend LocationSearch props
interface LocationSearchProps {
  mapRef: RefObject<mapboxgl.Map | null>
  searchHighlighted?: boolean
  disabled?: boolean   // NEW
}

// In the input element:
<input
  disabled={disabled}
  className={[
    'flex-1 bg-transparent text-sm outline-none min-w-0',
    disabled
      ? 'text-text-muted placeholder:text-text-muted opacity-50 cursor-not-allowed'
      : 'text-text-primary placeholder:text-text-muted',
  ].join(' ')}
/>
```

### Pattern 5: Offline Banner in AppLayout
**What:** Fixed top bar (not `position: sticky` — must be `position: fixed` with `top: 0 z-50`) renders when offline.
**When to use:** Mount in AppLayout above `<main>`, push main down with conditional padding-top.
**Example:**
```tsx
// OfflineBanner.tsx
export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-accent px-4 py-2 text-center">
      <span className="text-sm font-medium text-bg-base">
        Tryb offline — wyświetlam zapisane trasy
      </span>
    </div>
  )
}

// AppLayout — add top padding when banner shows
<div className={`flex flex-col h-full bg-bg-base ${!isOnline ? 'pt-9' : ''}`}>
```

### Pattern 6: Install Prompt Bottom Sheet
**What:** Bottom sheet above tab bar using the established FilterPanel sliding pattern from `src/features/map/FilterPanel.tsx`.
**When to use:** Show when `trailViewCount >= 3` AND (deferredPrompt exists OR isIOS) AND NOT dismissed AND NOT standalone.
**Key detail:** `beforeinstallprompt` can only be called once with `prompt()`. After user dismisses natively, the event must fire again before re-prompting. Store dismiss timestamp; re-show after 7 days.

### Pattern 7: Mapbox Tile Cache Tuning
**What:** Reduce `maxEntries` from 500 to 50 in the existing Mapbox CacheFirst config to avoid opaque response quota explosion.
**Why:** Chrome accounts each opaque response as approximately 7 MB against quota. At 500 entries that is a theoretical 3.5 GB quota attribution. At 50 entries it is 350 MB — safe for most devices.
**Existing config to modify in vite.config.ts:**
```typescript
// Change maxEntries: 500 → maxEntries: 50
expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7, purgeOnQuotaError: true }
```

### Anti-Patterns to Avoid
- **SVG icons in manifest:** iOS Safari does not support SVG in the `icons` array. Must use PNG with `"type": "image/png"`.
- **Calling `prompt()` more than once on the same event:** The deferred event is consumed after the first `prompt()` call. Set it to null afterwards.
- **Not adding `networkTimeoutSeconds` to NetworkFirst:** Without a timeout, a slow network will wait indefinitely before falling back to cache. 3 seconds is the standard.
- **Caching all Supabase URL paths:** The pattern `supabase.co/.*` will attempt to cache auth calls, storage, and realtime alongside trail API calls. This is acceptable here (small user set, purgeOnQuotaError is on) but the cacheName makes it clear it is for trails.
- **Showing offline banner inside AppLayout only:** TrailDetail is a standalone route (not inside AppLayout). If offline banner is needed there too, mount it in router root or `App.tsx`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker caching strategy | Custom SW fetch handler | Workbox NetworkFirst via vite-plugin-pwa runtimeCaching | Workbox handles cache versioning, quota errors, network timeouts, LRU eviction |
| Cache size management | Manual cache.delete() loop | ExpirationPlugin with maxEntries | ExpirationPlugin handles LRU eviction atomically; race conditions in manual code |
| App precaching | Manually list assets in SW | VitePWA globPatterns | Build hashes change on every build; manual lists go stale instantly |

**Key insight:** The vite-plugin-pwa generateSW mode is the correct abstraction for this project's complexity level. Custom service worker code (`injectManifest`) would add 50+ lines of boilerplate for zero benefit.

## Common Pitfalls

### Pitfall 1: SVG Icons Not Rendering on iOS
**What goes wrong:** App appears to install (iOS doesn't refuse the add-to-home-screen) but displays a blank white square icon instead of the app icon.
**Why it happens:** iOS Safari ignores SVG in the manifest `icons` array. It only uses PNG or JPEG for the home screen icon. It also checks for `<link rel="apple-touch-icon">` in the HTML head as a fallback.
**How to avoid:** Replace SVGs with PNGs (192x192, 512x512). Add `<link rel="apple-touch-icon" href="/icons/icon-192.png">` in `index.html`.
**Warning signs:** Lighthouse PWA audit reports "Icons do not have a correct MIME type" or blank icon on device.

### Pitfall 2: Opaque Response Quota Exhaustion
**What goes wrong:** PWA stops working on device after heavy map use; service worker throws QuotaExceededError silently.
**Why it happens:** Mapbox tiles are served from `api.mapbox.com` without CORS headers readable by the SW, so Chrome classifies responses as opaque. Each opaque response is counted as approximately 7 MB towards storage quota regardless of actual size.
**How to avoid:** Keep `maxEntries` for Mapbox tiles at 50 or fewer. Keep `purgeOnQuotaError: true`. The existing Phase 0 config has `purgeOnQuotaError` set; the only change needed is `maxEntries: 500 → 50`.
**Warning signs:** In Chrome DevTools Application > Storage, quota usage spikes disproportionately relative to network activity.

### Pitfall 3: beforeinstallprompt Not Firing
**What goes wrong:** Custom install banner never appears on Android even though manifest and SW are configured.
**Why it happens:** Chrome only fires `beforeinstallprompt` when: (1) served over HTTPS, (2) SW is registered and active, (3) manifest meets minimum criteria (name, icons, start_url, display standalone), and (4) user hasn't already installed the app. During `vite dev`, it fires only on localhost. If the manifest still references SVG icons, Chrome may not consider it installable.
**How to avoid:** Test on production build (`npm run build && npm run preview`) or deployed Vercel URL. Confirm manifest validates in Lighthouse.
**Warning signs:** No `beforeinstallprompt` event in DevTools console listener.

### Pitfall 4: iOS "Add to Home Screen" Appearing but App Opens in Safari
**What goes wrong:** User adds the app to home screen but it opens in Safari browser mode instead of standalone.
**Why it happens:** `display: "standalone"` in manifest is required but iOS also requires the page to be served with a service worker active. If SW registration fails silently, iOS falls back to browser mode.
**How to avoid:** Ensure SW registration succeeds (VitePWA handles this). Test on real iOS device, not simulator. Verify `display: standalone` in manifest.

### Pitfall 5: Offline Banner Layout Shift on TrailDetail Page
**What goes wrong:** The fixed offline banner overlaps the TrailDetail back button (which is also `absolute top-4 left-4`).
**Why it happens:** TrailDetail uses `h-screen` layout with an absolutely positioned back button at `top-4`. A fixed banner at `top: 0` will overlap it.
**How to avoid:** Pass `isOnline` to TrailDetail and conditionally add top padding/margin to its layout container when the banner is visible. OR mount the banner in the router root (`App.tsx`) so it exists in every route and adjust TrailDetail's top-positioned elements accordingly.

### Pitfall 6: NetworkFirst Falls Back Before SW Is Active
**What goes wrong:** On first load, the service worker is not yet controlling the page (it controls on the second load with `autoUpdate`). Runtime caching does not apply to the first load.
**Why it happens:** `registerType: 'autoUpdate'` means the SW takes control only after the next page load. This is correct behavior and acceptable — offline support only applies after the first visit.
**How to avoid:** No action needed. Document this as a known limitation: users must visit once online before offline mode works.

## Code Examples

Verified patterns from official sources:

### Workbox runtimeCaching Entry (vite.config.ts)
```typescript
// Source: vite-pwa-org.netlify.app/workbox/generate-sw
// Add inside workbox.runtimeCaching array:
{
  urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'psi-szlak-supabase-trails',
    expiration: {
      maxEntries: 10,
      maxAgeSeconds: 60 * 60 * 24 * 7,
      purgeOnQuotaError: true,
    },
    cacheableResponse: { statuses: [0, 200] },
    networkTimeoutSeconds: 3,
  },
},
```

### BeforeInstallPromptEvent TypeScript Declaration
```typescript
// Add to src/vite-env.d.ts
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent
}
```

### manifest.json Icons After PNG Swap
```json
{
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```
Note: `purpose: "maskable any"` on the 512 allows Android Adaptive Icons to use it. The 192 icon keeps `purpose: "any"`.

### iOS Safari Detection
```typescript
// Source: MDN + web.dev/learn/pwa/installation-prompt pattern
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
// Show iOS instructions if: iOS AND not already installed AND not dismissed
const shouldShowIOSInstructions = isIOS && !isInStandaloneMode
```

### apple-touch-icon in index.html
```html
<!-- Add to <head> in index.html — iOS Safari home screen icon fallback -->
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

### Extend ui.ts Zustand Store
```typescript
// Extend UIState to track install prompt state
interface UIState {
  viewMode: ViewMode
  isFilterOpen: boolean
  trailViewCount: number          // NEW — increment on TrailDetail mount
  installPromptDismissedAt: number | null  // NEW — timestamp, null = never dismissed
  setViewMode: (mode: ViewMode) => void
  toggleFilter: () => void
  setFilterOpen: (open: boolean) => void
  incrementTrailViewCount: () => void     // NEW
  dismissInstallPrompt: () => void        // NEW — sets timestamp
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@tailwind directives` in manifest icon config | VitePWA 1.x `manifest: false` + external `public/manifest.json` | vite-plugin-pwa v1 | Project already uses external manifest correctly |
| SVG icons accepted by all browsers | PNG required for iOS Safari PWA icons | iOS 16+ | Must replace SVGs with PNGs for home screen icon |
| `beforeinstallprompt` firing on iOS | Never fires on iOS; must use manual UA detection | Apple never adopted it | iOS requires custom instruction UI |
| Workbox 6 `expiration` at runtimeCaching root | Workbox 7 `expiration` inside `options` | Workbox 7 / vite-plugin-pwa v0.17+ | Phase 0 already correctly uses `options.expiration` |

**Deprecated/outdated:**
- SVG manifest icons: technically valid per spec but iOS Safari ignores them — treat as deprecated for this project
- `maxAgeSeconds` without `maxEntries`: quota can grow unboundedly — always pair with maxEntries for tile caches

## Open Questions

1. **Offline map tile rendering behavior**
   - What we know: Mapbox GL JS has its own 50 MB internal tile cache (separate from SW cache). Workbox CacheFirst caches `api.mapbox.com` responses. When offline, previously viewed map areas should render from the internal Mapbox cache or the SW cache.
   - What's unclear: Whether the Mapbox internal 50 MB cache persists across sessions (it uses Cache API). If it does, reducing SW maxEntries to 50 is safe because Mapbox's own cache holds more recent tiles.
   - Recommendation: Accept that map tiles render for previously explored areas, show degraded state gracefully for unseen areas. No need to add explicit offline map logic beyond what Workbox already provides.

2. **Cached TrailCard offline badge (Claude's Discretion)**
   - What we know: Workbox NetworkFirst caches up to 10 trail API responses. There is no built-in way to know which trail IDs are currently in the cache from React code without querying the Cache API directly.
   - What's unclear: Whether the complexity of reading the SW cache from React is worth the UX benefit of an offline badge.
   - Recommendation: Skip the offline badge for this phase. It requires `caches.open('psi-szlak-supabase-trails').then(c => c.keys())` — adds significant complexity for a minor UX hint. The offline banner already communicates the state.

3. **Install prompt re-show after dismiss (Claude's Discretion)**
   - What we know: After user dismisses the custom banner, `beforeinstallprompt` may not fire again for some time (browser-controlled). The dismissed timestamp can be persisted in `localStorage` or Zustand.
   - Recommendation: Store `installPromptDismissedAt` in `localStorage` (not just Zustand memory — survives refresh). Re-show after 7 days by comparing timestamp on mount.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- --run src/hooks/useOnlineStatus.test.ts` |
| Full suite command | `npm run test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PWA-01 | App installable (manifest + icons) | manual | Lighthouse CLI audit | ❌ Wave 0 |
| PWA-02 | App shell precached | manual | Chrome DevTools Application panel | ❌ Wave 0 |
| PWA-03 | NetworkFirst caches last 10 trails | unit | `npm run test -- --run src/hooks/useOnlineStatus.test.ts` | ❌ Wave 0 |
| PWA-04 | Offline banner appears when offline | unit | `npm run test -- --run src/components/ui/OfflineBanner.test.tsx` | ❌ Wave 0 |
| PWA-05 | Search disabled when offline | unit | `npm run test -- --run src/features/map/LocationSearch.test.tsx` | ❌ Wave 0 |
| PWA-06 | PNG icons in manifest | manual | `cat public/manifest.json` + browser check | ❌ Wave 0 |
| PWA-07 | Manifest fields correct | manual | Lighthouse audit + `cat public/manifest.json` | ❌ Wave 0 |

**Notes on manual tests:** PWA-01, PWA-02, PWA-06, PWA-07 cannot be unit tested — they require a real browser with SW context. Vitest/jsdom does not implement the Cache API or SW registration. Validation for these requirements is done via Lighthouse audit and DevTools inspection as part of the phase gate.

### Sampling Rate
- **Per task commit:** `npm run test -- --run` (existing unit tests must stay green)
- **Per wave merge:** `npm run test -- --run` + manual browser check of SW registration in DevTools
- **Phase gate:** Full suite green + Lighthouse PWA score ≥ 90 before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useOnlineStatus.test.ts` — covers PWA-04 (banner appears/disappears on online/offline events)
- [ ] `src/components/ui/OfflineBanner.test.tsx` — covers PWA-04 rendering
- [ ] `src/features/map/LocationSearch.test.tsx` — covers PWA-05 (disabled prop + visual state)

*(Existing test infrastructure: Vitest + jsdom + @testing-library/react already installed and configured. No framework install needed.)*

## Sources

### Primary (HIGH confidence)
- vite-pwa-org.netlify.app/workbox/generate-sw — runtimeCaching configuration syntax verified
- developer.chrome.com/docs/workbox/understanding-storage-quota — opaque response 7 MB penalty verified
- web.dev/learn/pwa/installation-prompt — beforeinstallprompt event flow and iOS instructions verified
- MDN Navigator.onLine — online/offline event API verified

### Secondary (MEDIUM confidence)
- github.com/vite-pwa/vite-plugin-pwa issue #626 — runtimeCaching API request patterns, multiple developer confirmations
- MDN Making PWAs installable — iOS 16.4+ installation via Share sheet, multi-source confirmed

### Tertiary (LOW confidence)
- mapbox/mapbox-gl-js issue #8967 — 50 MB internal tile cache; GitHub issue discussion, not official docs. Treat as likely-accurate but unverified.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; verified versions in package.json
- Architecture: HIGH — Workbox API verified via official Chrome docs; hook patterns verified via MDN
- Pitfalls: HIGH — opaque response quota issue documented in Chrome for Developers; iOS SVG icon issue documented across multiple sources
- Mapbox tile cache behavior offline: LOW — relies on GitHub issue discussion, not official Mapbox docs

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (Workbox and vite-plugin-pwa stable; iOS Safari PWA behavior changes infrequently)
