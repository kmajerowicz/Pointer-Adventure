---
phase: 07-pwa-hardening
plan: "03"
subsystem: pwa-install
tags: [pwa, install-prompt, ios, android, zustand, hooks]
dependency_graph:
  requires: [07-02]
  provides: [install-prompt-flow]
  affects: [src/stores/ui.ts, src/hooks/useInstallPrompt.ts, src/components/ui/InstallPrompt.tsx, src/components/layout/AppLayout.tsx, src/features/trails/TrailDetail.tsx]
tech_stack:
  added: []
  patterns: [beforeinstallprompt deferral, iOS detection, standalone detection, localStorage cooldown, Zustand view-count tracking]
key_files:
  created:
    - src/hooks/useInstallPrompt.ts
    - src/components/ui/InstallPrompt.tsx
  modified:
    - src/stores/ui.ts
    - src/components/layout/AppLayout.tsx
    - src/features/trails/TrailDetail.tsx
decisions:
  - "trailViewCount lives in UIStore (not localStorage) — intentionally resets on page reload to avoid surfacing prompt to first-time visitors on cold start"
  - "installPromptDismissedAt initialized from localStorage in Zustand store IIFE — avoids hydration flicker and keeps store self-contained"
  - "InstallPrompt positioned via CSS bottom: var(--spacing-tab-bar) not Tailwind bottom-[4.5rem] — stays in sync with token if tab bar height changes"
metrics:
  duration: "2m"
  completed: "2026-03-14"
  tasks_completed: 2
  files_modified: 5
---

# Phase 7 Plan 03: Custom PWA Install Prompt Summary

Custom install prompt bottom sheet that appears after the user browses 3+ trail detail pages, with native Android beforeinstallprompt flow and iOS Share-icon manual instructions.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Extend ui.ts store and create useInstallPrompt hook | 1e78310 | src/stores/ui.ts, src/hooks/useInstallPrompt.ts |
| 2 | Create InstallPrompt component, wire AppLayout, increment in TrailDetail | e1d0f9e | src/components/ui/InstallPrompt.tsx, src/components/layout/AppLayout.tsx, src/features/trails/TrailDetail.tsx |

## What Was Built

**UIStore extensions (`src/stores/ui.ts`):**
- `trailViewCount: number` — starts at 0, incremented by TrailDetail on each mount
- `installPromptDismissedAt: number | null` — initialized from localStorage on store creation for persistence across reloads
- `incrementTrailViewCount()` — increments counter by 1
- `dismissInstallPrompt()` — sets timestamp + persists to localStorage for 7-day cooldown

**`src/hooks/useInstallPrompt.ts`:**
- Listens for `beforeinstallprompt` event and defers it
- Detects iOS Safari via `/iphone|ipad|ipod/i` regex
- Detects standalone mode via `window.matchMedia('(display-mode: standalone)')`
- Computes `shouldShow`: requires trailViewCount >= 3, prompt available OR iOS, not standalone, cooldown not active
- Exposes `promptInstall()` (async, calls deferred prompt) and `dismiss()`

**`src/components/ui/InstallPrompt.tsx`:**
- Bottom sheet fixed above tab bar using `bottom: var(--spacing-tab-bar)`, z-40
- Slide-up/slide-down animation using existing sheet-up/sheet-down keyframes
- Close button (X) triggers isClosing animation + dismiss
- Android path: "Zainstaluj" CTA button (accent, min-h-[48px]) calls promptInstall
- iOS path: inline instruction with Share2 icon from lucide-react, no CTA button
- Returns null when shouldShow is false and not closing

**AppLayout:** `<InstallPrompt />` mounted between `</main>` and `<BottomTabBar />`

**TrailDetail:** `useEffect(() => { useUIStore.getState().incrementTrailViewCount() }, [])` on mount

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- Build: `npm run build` passes, TypeScript strict mode, no errors
- trailViewCount increments on each TrailDetail mount
- shouldShow requires >= 3 views, active prompt or iOS, not standalone, cooldown expired
- Dismiss persists timestamp to localStorage preventing re-show for 7 days
- Standalone mode detection prevents showing to already-installed users

## Self-Check: PASSED

All 5 files present. Both task commits verified (1e78310, e1d0f9e).
