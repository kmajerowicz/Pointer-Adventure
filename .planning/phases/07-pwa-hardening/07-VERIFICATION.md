---
phase: 07-pwa-hardening
verified: 2026-03-14T12:00:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 7: PWA Hardening Verification Report

**Phase Goal:** The app installs correctly on Android and iOS, works offline with the last 10 viewed trails, and never silently fails due to service worker storage issues
**Verified:** 2026-03-14
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Mapbox tile cache limited to 50 entries to prevent opaque response quota exhaustion | VERIFIED | `vite.config.ts` line 23: `maxEntries: 50`; confirmed in generated `dist/sw.js`: `maxEntries:50` |
| 2  | Supabase trail API calls cached via NetworkFirst with 10-entry LRU and 3s network timeout | VERIFIED | `vite.config.ts` lines 28-41; `dist/sw.js` confirms `NetworkFirst`, `psi-szlak-supabase-trails`, `networkTimeoutSeconds:3`, `maxEntries:10` |
| 3  | manifest.json references PNG icons with correct MIME type image/png | VERIFIED | `public/manifest.json`: both icon entries have `"type": "image/png"` |
| 4  | index.html has apple-touch-icon link pointing to PNG | VERIFIED | `index.html` line 10: `<link rel="apple-touch-icon" href="/icons/icon-192.png" />` |
| 5  | BeforeInstallPromptEvent type declared for downstream install prompt hook | VERIFIED | `src/vite-env.d.ts` lines 13-21: full interface + WindowEventMap augmentation |
| 6  | When navigator.onLine is false, a persistent amber banner appears at the top of the screen with Polish offline text | VERIFIED | `src/components/ui/OfflineBanner.tsx`: fixed top z-50 amber `bg-accent` banner with text "Tryb offline — wyswietlam zapisane trasy", returns null when online |
| 7  | When navigator.onLine returns to true, the banner disappears automatically with no user action | VERIFIED | `useOnlineStatus` hook updates state via `window online` event; OfflineBanner re-renders and returns null when `isOnline === true` |
| 8  | When offline, the geocoding search bar is visually grayed out and input is disabled | VERIFIED | `LocationSearch.tsx` line 126: outer div gets `opacity-50 pointer-events-none` when disabled; input gets `disabled={disabled}` at line 157 |
| 9  | The offline banner appears on both tabbed pages (AppLayout) and standalone routes (TrailDetail) | VERIFIED | `AuthLayout.tsx` line 27: `<OfflineBanner />` renders before `<Outlet />`, covering all routes including TrailDetail |
| 10 | After browsing 3+ trails, a custom install banner appears as a bottom sheet above the tab bar | VERIFIED | `useInstallPrompt.ts`: `shouldShow = trailViewCount >= 3 && ...`; `TrailDetail.tsx` line 127: `incrementTrailViewCount()` on mount |
| 11 | On Android/Chrome the banner triggers the native beforeinstallprompt flow when user taps install | VERIFIED | `InstallPrompt.tsx` lines 53-61: Android path calls `promptInstall()` which calls `deferredPrompt.prompt()` |
| 12 | On iOS Safari the banner shows manual instructions with share icon | VERIFIED | `InstallPrompt.tsx` lines 64-72: iOS path renders Share2 icon with "Kliknij Udostepnij -> Dodaj do ekranu glownego" instruction |
| 13 | User can dismiss the banner with x button and it does not re-appear for 7 days | VERIFIED | `ui.ts` `dismissInstallPrompt()` persists timestamp to localStorage; `useInstallPrompt.ts` computes `cooldownExpired` with 7-day check |

**Score:** 13/13 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vite.config.ts` | Workbox runtimeCaching with Mapbox (50 entries) and Supabase NetworkFirst (10 entries) | VERIFIED | Contains `psi-szlak-supabase-trails`, `maxEntries: 50`, `networkTimeoutSeconds: 3` |
| `public/manifest.json` | PWA manifest with PNG icon entries | VERIFIED | Both icons have `"type": "image/png"` and correct `purpose` fields |
| `public/icons/icon-192.png` | 192x192 app icon (PNG) | VERIFIED | `file` command: "PNG image data, 192 x 192, 8-bit/color RGB, non-interlaced" |
| `public/icons/icon-512.png` | 512x512 app icon (PNG) | VERIFIED | `file` command: "PNG image data, 512 x 512, 8-bit/color RGB, non-interlaced" |
| `index.html` | apple-touch-icon link to PNG | VERIFIED | Line 10: `<link rel="apple-touch-icon" href="/icons/icon-192.png" />` |
| `src/vite-env.d.ts` | BeforeInstallPromptEvent TypeScript declaration | VERIFIED | Lines 13-21: full interface + `WindowEventMap` augmentation |
| `src/hooks/useOnlineStatus.ts` | Boolean hook wrapping navigator.onLine with event listeners | VERIFIED | 19 lines, exports `useOnlineStatus`, wires `online`/`offline` window events |
| `src/components/ui/OfflineBanner.tsx` | Fixed top banner shown when offline | VERIFIED | Uses `useOnlineStatus()`, fixed top z-50, amber accent bg, Polish text |
| `src/features/map/LocationSearch.tsx` | Search bar with disabled prop for offline mode | VERIFIED | `disabled?: boolean` prop added, outer div gets `opacity-50 pointer-events-none`, input gets `disabled={disabled}` |
| `src/components/layout/AuthLayout.tsx` | Layout with OfflineBanner mounted for all routes | VERIFIED | Imports and renders `<OfflineBanner />` before `<Outlet />` |
| `src/components/layout/AppLayout.tsx` | Layout with offline-aware padding and InstallPrompt | VERIFIED | Adds `pt-9` when offline, mounts `<InstallPrompt />` between main and BottomTabBar |
| `src/stores/ui.ts` | trailViewCount and installPromptDismissedAt state | VERIFIED | Both fields present; `dismissInstallPrompt` persists to localStorage; initialized from localStorage on store creation |
| `src/hooks/useInstallPrompt.ts` | Hook managing beforeinstallprompt deferral, iOS detection, show conditions | VERIFIED | Defers prompt, detects iOS/standalone, computes `shouldShow` with all conditions |
| `src/components/ui/InstallPrompt.tsx` | Bottom sheet install banner with Android and iOS paths | VERIFIED | Slide-up animation, close button, Android CTA calls `promptInstall()`, iOS shows Share2 instructions |
| `src/features/trails/TrailDetail.tsx` | incrementTrailViewCount call on mount | VERIFIED | Lines 126-128: `useEffect(() => { useUIStore.getState().incrementTrailViewCount() }, [])` |

SVG icons confirmed removed: only `icon-192.png` and `icon-512.png` exist in `public/icons/`.

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `public/manifest.json` | `public/icons/icon-192.png` | icons array src path | WIRED | `"src": "/icons/icon-192.png"` present |
| `index.html` | `public/icons/icon-192.png` | apple-touch-icon link | WIRED | `<link rel="apple-touch-icon" href="/icons/icon-192.png" />` |
| `src/components/ui/OfflineBanner.tsx` | `src/hooks/useOnlineStatus.ts` | useOnlineStatus() hook call | WIRED | Line 1: import; line 4: `const isOnline = useOnlineStatus()` |
| `src/components/layout/AuthLayout.tsx` | `src/components/ui/OfflineBanner.tsx` | OfflineBanner rendered at top of layout | WIRED | Line 4: import; line 27: `<OfflineBanner />` before Outlet |
| `src/features/map/MapView.tsx` | `src/hooks/useOnlineStatus.ts` | useOnlineStatus() to pass disabled to LocationSearch | WIRED | Line 17: import; line 44: `const isOnline = useOnlineStatus()`; line 154: `disabled={!isOnline}` |
| `src/components/ui/InstallPrompt.tsx` | `src/hooks/useInstallPrompt.ts` | useInstallPrompt() hook call | WIRED | Line 3: import; line 6: `const { shouldShow, isIOS, promptInstall, dismiss } = useInstallPrompt()` |
| `src/hooks/useInstallPrompt.ts` | `src/stores/ui.ts` | reads trailViewCount and installPromptDismissedAt | WIRED | Line 2: import; lines 9-10: subscribed via `useUIStore((s) => ...)` |
| `src/components/layout/AppLayout.tsx` | `src/components/ui/InstallPrompt.tsx` | InstallPrompt rendered before BottomTabBar | WIRED | Line 4: import; line 16: `<InstallPrompt />` between `</main>` and `<BottomTabBar />` |
| `src/features/trails/TrailDetail.tsx` | `src/stores/ui.ts` | incrementTrailViewCount call on mount | WIRED | Line 10: import `useUIStore`; lines 126-128: useEffect calls `incrementTrailViewCount()` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PWA-01 | 07-03 | App installable on Android and iOS home screen with proper icon, name, and splash | SATISFIED | InstallPrompt component, manifest.json with PNG icons, display:standalone, theme_color matching design tokens |
| PWA-02 | 07-01 | Service worker precaches app shell and bundles | SATISFIED | `dist/sw.js` precaches 8 entries including index.html, JS bundle, CSS bundle, PNG icons |
| PWA-03 | 07-01 | Last 10 viewed trail details cached via NetworkFirst strategy for offline access | SATISFIED | Supabase NetworkFirst cache with `maxEntries: 10` — Supabase API responses (trail data) cached; note: the 10-entry limit covers API responses, not pre-fetched detail HTML pages. Trail data for viewed trails is served from the Supabase cache when offline. |
| PWA-04 | 07-02 | Persistent top banner "Tryb offline — wyswietlam zapisane trasy" when navigator.onLine === false | SATISFIED | OfflineBanner in AuthLayout with exact Polish text, fixed top position, auto-hides on reconnect |
| PWA-05 | 07-02 | Geocoding search disabled in offline mode with grayed-out state | SATISFIED | LocationSearch `disabled` prop; outer div `opacity-50 pointer-events-none`; input `disabled={true}`; placeholder changes to offline message |
| PWA-06 | 07-01 | PNG icons (192x192, 512x512) replace SVG placeholders for iOS compatibility | SATISFIED | Valid PNG files verified by `file` command; SVG files deleted; manifest and index.html updated |
| PWA-07 | 07-01 | Manifest: display:standalone, theme color #111318, portrait orientation | SATISFIED | manifest.json: `"display": "standalone"`, `"theme_color": "#111318"`, `"orientation": "portrait-primary"` |

All 7 PWA requirements covered. No orphaned requirements.

---

## Anti-Patterns Found

No blockers or warnings found.

- No TODO/FIXME/PLACEHOLDER comments in phase files.
- `return null` instances in `OfflineBanner` and `InstallPrompt` are legitimate conditional renders (not stubs) — they have substantive render paths.
- Build completes with 0 TypeScript errors.

---

## Human Verification Required

### 1. Install Prompt — Android Chrome

**Test:** Open the app in Chrome on Android, visit 3 trail detail pages, then check if the install banner appears.
**Expected:** Bottom sheet with "Zainstaluj Psi Szlak" heading and "Zainstaluj" button slides up. Tapping installs the app via native dialog.
**Why human:** `beforeinstallprompt` only fires in a real browser on an installable origin; cannot be triggered in automated tests.

### 2. Install Prompt — iOS Safari

**Test:** Open the app in Safari on iPhone, visit 3 trail detail pages.
**Expected:** Bottom sheet appears with Share2 icon and instruction "Kliknij Udostepnij -> Dodaj do ekranu glownego". No "Zainstaluj" button visible.
**Why human:** iOS Safari has no `beforeinstallprompt` event and requires physical device testing.

### 3. Offline Banner — Real Network Toggle

**Test:** Load the app, then put the device in airplane mode.
**Expected:** Amber banner "Tryb offline — wyswietlam zapisane trasy" appears at the very top of every screen, including TrailDetail. Re-enabling network dismisses it automatically.
**Why human:** navigator.onLine behavior and `online`/`offline` events require real network state changes.

### 4. Offline Trail Browsing

**Test:** Browse 3-5 trail detail pages while online, then go offline and return to the map page.
**Expected:** Previously viewed trail data loads from cache. Supabase requests hit the `psi-szlak-supabase-trails` NetworkFirst cache.
**Why human:** Requires verifying service worker cache population and retrieval in an actual browser devtools Network panel.

### 5. 7-Day Dismiss Cooldown

**Test:** Dismiss the install prompt, then check localStorage `installPromptDismissedAt`. Reload the page.
**Expected:** Prompt does not reappear after reload. After clearing localStorage, the prompt reappears on the next session with 3+ trail views.
**Why human:** Requires verifying localStorage persistence and cooldown logic across page reloads.

---

## Gaps Summary

No gaps. All 13 observable truths verified, all 15 artifacts exist and are substantive and wired, all 9 key links confirmed, all 7 PWA requirements satisfied, build succeeds with 0 TypeScript errors.

The phase goal is achieved: the app has proper PWA infrastructure for Android and iOS install, service worker caching prevents opaque response quota exhaustion, Supabase responses are cached NetworkFirst for offline use, and users receive clear offline feedback throughout the app.

---

_Verified: 2026-03-14_
_Verifier: Claude (gsd-verifier)_
