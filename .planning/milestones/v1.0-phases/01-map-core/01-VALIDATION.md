---
phase: 1
slug: map-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/hooks/useGeolocation.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/hooks/useGeolocation.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | MAP-01 | manual/smoke | `npm run dev` → visual check | N/A | ⬜ pending |
| 1-01-02 | 01 | 1 | MAP-02 | unit (hook) | `npx vitest run src/hooks/useGeolocation.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | MAP-05 | unit (hook) | `npx vitest run src/hooks/useGeolocation.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | MAP-06 | manual/smoke | Chrome DevTools → WebGL contexts | N/A | ⬜ pending |
| 1-02-01 | 02 | 1 | MAP-03 | unit | `npx vitest run src/features/map/geocoding.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | MAP-04 | manual/smoke | Tab-switch visual check | N/A | ⬜ pending |
| 1-02-03 | 02 | 1 | MAP-07 | manual/smoke | Dev tools error simulation | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useGeolocation.test.ts` — stubs for MAP-02, MAP-05 (mock `navigator.geolocation`, assert state transitions)
- [ ] `src/features/map/geocoding.test.ts` — stubs for MAP-03 (mock `fetch`, assert feature array parsing)

*Existing vitest infrastructure covers framework install. Config may need `environment: 'happy-dom'` if component smoke tests are added.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Map renders at Poland coords on load | MAP-01 | mapboxgl.Map requires real WebGL2; jsdom has no WebGL | Open app → verify map visible, centered on Poland zoom 6 |
| moveend handler syncs Zustand | MAP-04 | Requires real Mapbox map instance for event firing | Switch tabs, return to Mapa → verify no black screen |
| map.remove() in cleanup | MAP-06 | WebGL context tracking needs real browser | Chrome DevTools → check WebGL context count after tab switches |
| MapErrorBoundary fallback | MAP-07 | Error boundary testing needs real rendering context | Inject bad token → verify fallback UI appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
