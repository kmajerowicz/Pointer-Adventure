---
phase: 07-pwa-hardening
plan: 01
subsystem: infra
tags: [pwa, workbox, service-worker, mapbox, supabase, icons, typescript]

# Dependency graph
requires:
  - phase: 00-scaffolding-fixes
    provides: initial Workbox runtimeCaching config with psi-szlak-mapbox-tiles CacheFirst entry
provides:
  - Workbox runtimeCaching with Mapbox CacheFirst limited to 50 entries (prevents opaque quota exhaustion)
  - Supabase NetworkFirst runtime cache (psi-szlak-supabase-trails, 10 entries, 3s timeout, 7-day TTL)
  - 192x192 and 512x512 PNG icons with paw print motif (dark bg + golden accent)
  - manifest.json updated to reference PNG icons with correct MIME type and purpose fields
  - index.html favicon and apple-touch-icon pointing to PNG (iOS Safari compatible)
  - BeforeInstallPromptEvent TypeScript declaration for downstream install prompt hook
affects: [07-pwa-hardening-02, 07-pwa-hardening-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Workbox opaque response safety: CacheFirst cache limited to 50 entries to prevent 500 * 7MB = 3.5GB quota attribution"
    - "Programmatic PNG generation via Node.js zlib for icon creation without canvas/sharp dependency"

key-files:
  created:
    - public/icons/icon-192.png
    - public/icons/icon-512.png
  modified:
    - vite.config.ts
    - public/manifest.json
    - index.html
    - src/vite-env.d.ts

key-decisions:
  - "Mapbox CacheFirst maxEntries reduced from 500 to 50 — opaque responses attribute full Cache Storage quota, 500 * ~7MB = 3.5GB theoretical attribution vs safe 50 * ~7MB = 350MB"
  - "Supabase NetworkFirst with 3s networkTimeoutSeconds — falls back to cache on slow connections while preferring fresh data on fast connections"
  - "PNG icons generated programmatically via Node.js zlib (raw PNG format) since canvas/sharp not installed — avoids adding heavy dev dependency for a one-time task"
  - "icon-512.png purpose set to 'maskable any' (both adaptive icon and standard) while icon-192.png uses 'any' only"
  - "BeforeInstallPromptEvent declared in vite-env.d.ts alongside ImportMetaEnv — keeps all global type augmentations in one file"

patterns-established:
  - "Workbox opaque cache safety: always set maxEntries <= 50 for CacheFirst on cross-origin opaque responses"
  - "PWA install prompt: use WindowEventMap augmentation in vite-env.d.ts for beforeinstallprompt typed event handling"

requirements-completed: [PWA-02, PWA-03, PWA-06, PWA-07]

# Metrics
duration: 2min
completed: 2026-03-14
---

# Phase 07 Plan 01: PWA Infrastructure Hardening Summary

**Workbox Mapbox tile cache reduced to 50-entry safe limit, Supabase NetworkFirst trail cache added, SVG icons replaced with PNG for iOS Safari compatibility, and BeforeInstallPromptEvent typed for install prompt hook**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T10:28:09Z
- **Completed:** 2026-03-14T10:30:29Z
- **Tasks:** 2
- **Files modified:** 6 (+ 2 files created, 2 files deleted)

## Accomplishments
- Fixed dangerous 500-entry Mapbox CacheFirst cache that could attribute 3.5GB of quota to opaque responses — reduced to safe 50 entries
- Added Supabase NetworkFirst runtime cache enabling offline trail data access with 3s network timeout fallback
- Replaced SVG icon placeholders with valid 192x192 and 512x512 PNG icons that iOS Safari will correctly use for home screen and splash screen
- Added BeforeInstallPromptEvent TypeScript declaration enabling typed install prompt handling for Plan 03

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Workbox caching — reduce Mapbox maxEntries, add Supabase NetworkFirst** - `562c105` (feat)
2. **Task 2: Replace SVG icons with PNG, update manifest and index.html, add TS type** - `4b40283` (feat)

**Plan metadata:** (to be committed as docs commit)

## Files Created/Modified
- `vite.config.ts` — Mapbox maxEntries 500→50, Supabase NetworkFirst cache entry added
- `public/icons/icon-192.png` — 192x192 PNG icon (dark #111318 bg, #C9A84C paw print)
- `public/icons/icon-512.png` — 512x512 PNG icon (dark #111318 bg, #C9A84C paw print)
- `public/manifest.json` — icons array updated to PNG with image/png MIME type and purpose fields
- `index.html` — favicon and apple-touch-icon updated to reference icon-192.png
- `src/vite-env.d.ts` — BeforeInstallPromptEvent and WindowEventMap type declarations added
- `public/icons/icon-192.svg` — deleted (was iOS-incompatible SVG placeholder)
- `public/icons/icon-512.svg` — deleted (was iOS-incompatible SVG placeholder)

## Decisions Made
- Mapbox CacheFirst maxEntries reduced from 500 to 50: opaque responses attribute their full potential size (up to ~7MB per tile) against Cache Storage quota. 500 entries × 7MB = 3.5GB theoretical quota attribution, which can cause CacheStorage.set() to throw QuotaExceededError and evict ALL caches. 50 entries = safe 350MB attribution.
- Supabase NetworkFirst with 3s timeout: trail API data benefits from freshness when online, but the 3-second fallback ensures offline or slow-network users still see cached results.
- PNG icons generated without canvas/sharp: used Node.js built-in zlib to write raw PNG binary (IHDR + IDAT + IEND chunks with CRC32) avoiding adding dev dependencies for a one-time operation.
- BeforeInstallPromptEvent placed in vite-env.d.ts: same file already augments global interfaces (ImportMetaEnv, ImportMeta), making it the natural home for additional browser API type declarations.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- canvas and sharp packages not installed in the project. Resolved by generating valid PNG binary directly using Node.js built-in zlib module (deflate compression + PNG chunk structure + CRC32), producing spec-compliant PNG files verified by the `file` command.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Plan 02 (offline UX) can now rely on Supabase NetworkFirst cache being in place
- Plan 03 (install prompt) has BeforeInstallPromptEvent TypeScript declaration available
- manifest.json now has correct PNG icons with maskable purpose for Plan 03 install flow
- No blockers for remaining phase plans

## Self-Check: PASSED

All artifacts verified:
- vite.config.ts — exists, maxEntries: 50, psi-szlak-supabase-trails present
- public/icons/icon-192.png — PNG image data, 192x192
- public/icons/icon-512.png — PNG image data, 512x512
- public/manifest.json — image/png MIME type present
- index.html — apple-touch-icon pointing to icon-192.png
- src/vite-env.d.ts — BeforeInstallPromptEvent declared
- .planning/phases/07-pwa-hardening/07-01-SUMMARY.md — created
- Commits 562c105, 4b40283 — confirmed in git log

---
*Phase: 07-pwa-hardening*
*Completed: 2026-03-14*
