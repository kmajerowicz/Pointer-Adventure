---
phase: 07
slug: pwa-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + jsdom |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run` + manual browser check of SW registration
- **Before `/gsd:verify-work`:** Full suite must be green + Lighthouse PWA score >= 90
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | PWA-02 | manual | Lighthouse audit | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | PWA-03 | unit | `npm run test -- --run src/hooks/useOnlineStatus.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | PWA-04 | unit | `npm run test -- --run src/components/ui/OfflineBanner.test.tsx` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | PWA-05 | unit | `npm run test -- --run src/features/map/LocationSearch.test.tsx` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | PWA-06 | manual | `cat public/manifest.json` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 1 | PWA-07 | manual | Lighthouse audit | ❌ W0 | ⬜ pending |
| 07-02-03 | 02 | 1 | PWA-01 | manual | DevTools install check | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useOnlineStatus.test.ts` — stubs for PWA-04 (online/offline event handling)
- [ ] `src/components/ui/OfflineBanner.test.tsx` — stubs for PWA-04 rendering
- [ ] `src/features/map/LocationSearch.test.tsx` — stubs for PWA-05 (disabled state when offline)

*Existing infrastructure covers framework install. Vitest + jsdom + @testing-library/react already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App installable on home screen | PWA-01 | Requires real browser + manifest parsing | Open in Chrome Android, check install prompt; iOS Safari Share > Add to Home Screen |
| App shell precached | PWA-02 | Cache API not available in jsdom | DevTools > Application > Cache Storage; verify app shell entries |
| PNG icons render correctly | PWA-06 | Visual verification needed | DevTools > Application > Manifest; check icon previews |
| Manifest fields correct | PWA-07 | Lighthouse audit required | Run Lighthouse PWA audit; verify standalone, theme_color, orientation |
| Mapbox tile quota safe | PWA-03 (partial) | Requires real network + DevTools | DevTools > Application > Storage; browse map, check quota usage |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
