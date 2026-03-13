# Phase 0: Scaffolding Fixes - Research

**Researched:** 2026-03-13
**Domain:** Supabase PostgreSQL migrations, Mapbox GL JS attribution, Workbox PWA caching, Git tracking, TypeScript types
**Confidence:** HIGH

## Summary

Phase 0 is a pure defect-correction phase — seven concrete bugs exist in the scaffolding before any feature code can be safely written. Each defect has a specific, verified fix. No architectural decisions are required; every change is deterministic.

The most consequential fix is `water_access`: it is currently a `boolean` in the migration SQL but `boolean | null` in TypeScript. The filter system, the Edge Function normalizer, and the UI all depend on a 3-state text enum (`none`/`nearby`/`on_route`). This must be a new migration (not editing the original) because Supabase applies migrations sequentially. The second most consequential fix is the Workbox tile cache, where missing `cacheableResponse` and `purgeOnQuotaError` options can silently exhaust the user's storage quota with opaque tile responses.

The remaining fixes are straightforward single-file edits: remove one CSS rule for attribution, update `vite.config.ts` for the Workbox cache, remove `dist/` from git tracking, and update `types.ts` and `docs/PRD.md` to reflect the correct column names and enum values.

**Primary recommendation:** Write a single new migration for all schema changes (FOUN-01 + FOUN-02), then fix each of the five remaining defects as independent file edits with no ordering dependencies between them.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUN-01 | `water_access` changed from `boolean` to `text` with CHECK constraint (`none`/`nearby`/`on_route`) | New migration: ALTER TABLE DROP + ADD COLUMN with CHECK; TypeScript type updated accordingly |
| FOUN-02 | Add `routes.source` (`osm`/`pttk`), `routes.water_type` (`river`/`lake`/`stream`/null), `invitations.used_at` columns | Same migration as FOUN-01; three ALTER TABLE ADD COLUMN statements |
| FOUN-03 | Mapbox attribution CSS override removed; compact attribution used instead | Remove `.mapboxgl-ctrl-attrib { display: none }` from `src/index.css`; Mapbox `compact: true` goes on the Map instance in the map feature component |
| FOUN-04 | Workbox config: `cacheableResponse: { statuses: [0, 200] }`, `purgeOnQuotaError: true`, cache name `psi-szlak-mapbox-tiles` | Edit `vite.config.ts` `runtimeCaching` entry; no new packages needed |
| FOUN-05 | `dist/` removed from git tracking | `git rm -r --cached dist/` then verify `.gitignore` already has `dist` entry (it does) |
| FOUN-06 | PRD updated: `difficulty` uses `moderate` not `medium`; `geojson` column renamed `geometry` | Edit `docs/PRD.md` section 4 schema block; text-only change |
| FOUN-07 | `types.ts` updated: `water_access` → `'none' \| 'nearby' \| 'on_route'`, add `source` and `water_type` fields | Edit `src/lib/types.ts` Route interface |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase migrations (SQL files) | — | Schema evolution | Sequential numbered migrations are the Supabase-standard pattern for schema changes |
| mapbox-gl | ^3.19.1 (already installed) | Map rendering + AttributionControl | Built-in `compact: true` option on AttributionControl replaces CSS hacks |
| vite-plugin-pwa / Workbox | ^1.2.0 / 7.x (already installed) | PWA + service worker | `runtimeCaching` options in `vite.config.ts` |
| TypeScript strict mode | ~5.9.3 (already configured) | Type safety | Already enabled; updating `types.ts` is sufficient |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 3.x (not yet installed) | Unit tests for type guards / schema validators | Required for Nyquist validation gate |

**Installation (vitest only — everything else is already installed):**
```bash
npm install --save-dev vitest @vitest/coverage-v8
```

---

## Architecture Patterns

### Pattern 1: Supabase Schema Migration (new file, not edit)

**What:** Add a new numbered migration file; never edit an already-applied migration.
**When to use:** Any time the live schema needs to change after the initial migration has been applied.

```sql
-- supabase/migrations/20260313000000_fix_water_access_add_columns.sql

-- FOUN-01: water_access boolean → text enum
ALTER TABLE public.routes
  DROP COLUMN IF EXISTS water_access;

ALTER TABLE public.routes
  ADD COLUMN water_access text NOT NULL DEFAULT 'none'
    CHECK (water_access IN ('none', 'nearby', 'on_route'));

-- FOUN-02a: routes.source
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS source text
    CHECK (source IN ('osm', 'pttk'));

-- FOUN-02b: routes.water_type
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS water_type text
    CHECK (water_type IN ('river', 'lake', 'stream'));

-- FOUN-02c: invitations.used_at
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS used_at timestamptz;
```

**Key decision from STATE.md:** The boolean → text migration is a hard blocker for the entire trail pipeline. All future filter SQL must query `water_access` as a text column.

### Pattern 2: Mapbox Compact Attribution (ToS-compliant)

**What:** Pass `AttributionControl` with `compact: true` to the map constructor instead of hiding attribution via CSS.
**Why:** Hiding attribution via `display: none` violates Mapbox ToS. The `compact` option renders a small `©` icon that expands on tap — legally compliant and compact on mobile.

```typescript
// When the MapView component is built in Phase 1, create the map like:
import mapboxgl from 'mapbox-gl';

const map = new mapboxgl.Map({
  container: containerRef.current,
  style: 'mapbox://styles/mapbox/outdoors-v12',
  center: [19.145, 51.919],
  zoom: 6,
  attributionControl: false,   // disable default, add compact version
});

map.addControl(
  new mapboxgl.AttributionControl({ compact: true }),
  'bottom-right'
);
```

For Phase 0: simply delete the CSS rule (lines 65-68 of `src/index.css`). The `compact: true` option is added when the MapView is built in Phase 1. Phase 0 only removes the ToS-violating override.

### Pattern 3: Workbox Opaque Response Caching

**What:** Mapbox tile requests from CDNs return opaque responses (status 0) that count at 7 MB each toward browser storage quota. Without `cacheableResponse: { statuses: [0, 200] }` the tiles are not cached at all. Without `purgeOnQuotaError: true` a quota error silently breaks the entire cache.

```typescript
// vite.config.ts — corrected runtimeCaching entry
{
  urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'psi-szlak-mapbox-tiles',          // FOUN-04: renamed
    expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
    cacheableResponse: { statuses: [0, 200] },    // FOUN-04: accept opaque responses
    purgeOnQuotaError: true,                       // FOUN-04: prevent quota exhaustion
  },
},
```

### Pattern 4: Removing git-tracked build artifacts

**What:** `dist/` is already in `.gitignore` (verified at line with `dist` entry) but may have been committed before the `.gitignore` entry was added. Use `git rm --cached` to untrack without deleting the files.

```bash
git rm -r --cached dist/
git commit -m "chore: untrack dist/ build artifacts"
```

**Why `--cached`:** Removes from git index only; the files stay on disk for local `npm run preview`.

### Anti-Patterns to Avoid

- **Editing the original migration file:** Supabase has already applied `20260308210000_initial_schema.sql`. Editing it will cause a checksum mismatch on remote. Always create a new migration.
- **Using `ADD COLUMN ... NOT NULL` without a DEFAULT:** Postgres will reject this on a table with existing rows. Always supply `DEFAULT` when adding NOT NULL columns (the migration example above uses `DEFAULT 'none'`).
- **Removing both the CSS override AND not adding `compact: true` yet:** Phase 0 only removes the illegal override. The attribution will appear in its default verbose style until Phase 1 adds the map component. This is acceptable and correct — the map component does not exist yet.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Opaque response caching | Custom fetch interceptor | Workbox `cacheableResponse + purgeOnQuotaError` | Edge cases around quota errors and cache eviction are numerous |
| Schema migrations | Editing existing SQL files | New numbered migration file | Supabase validates migration checksums; edits to applied migrations break `supabase db push` |
| Attribution compliance | Custom attribution div | `mapboxgl.AttributionControl({ compact: true })` | Built-in option, tested across all Mapbox styles |

---

## Common Pitfalls

### Pitfall 1: ADD COLUMN NOT NULL without DEFAULT
**What goes wrong:** `ALTER TABLE routes ADD COLUMN water_access text NOT NULL` fails on a non-empty table.
**Why it happens:** Postgres cannot backfill existing rows with a value it doesn't have.
**How to avoid:** Always write `ADD COLUMN ... NOT NULL DEFAULT 'none'` for enum columns, or add as nullable and backfill first, then add NOT NULL.
**Warning signs:** Migration fails with "column ... contains null values" or "not-null constraint violated".

### Pitfall 2: Migration timestamp collision
**What goes wrong:** Two migration files with the same timestamp prefix are processed in undefined order.
**Why it happens:** Copy-paste from existing migration filename.
**How to avoid:** Use the current UTC datetime: `20260313000000_fix_water_access_add_columns.sql`.

### Pitfall 3: `IF NOT EXISTS` vs DROP/ADD for column type change
**What goes wrong:** `ALTER TABLE ... ALTER COLUMN water_access TYPE text` may fail if existing data doesn't cast cleanly from boolean.
**Why it happens:** PostgreSQL cannot auto-cast `boolean` to `text` with a CHECK constraint in one step.
**How to avoid:** Use DROP COLUMN + ADD COLUMN (data loss is acceptable here since the table is empty — no feature code has been run against it yet). Verify in PRD/STATE context: the app has no production data.

### Pitfall 4: Workbox cache name collision with Mapbox internals
**What goes wrong:** Cache named `mapbox-tiles` may shadow Mapbox GL JS's own internal tile cache (up to 50 MB) causing unexpected eviction behaviour.
**Why it happens:** Mapbox GL JS uses the Cache API internally.
**How to avoid:** Use the namespaced `psi-szlak-mapbox-tiles` cache name (already specified in FOUN-04 requirement).

### Pitfall 5: `dist/` not actually tracked
**What goes wrong:** Running `git rm -r --cached dist/` when `dist/` is not tracked produces an error.
**Why it happens:** The `.gitignore` already has `dist` so it may never have been committed.
**How to avoid:** Run `git ls-files dist/` first. If empty, no `git rm` needed — just verify `.gitignore` is in place. Research confirms `dist/` is NOT currently tracked (verified: `git ls-files dist/` returned empty). The `.gitignore` already contains `dist`. FOUN-05 is: **verify** `.gitignore` is correct + confirm `dist/` does not appear in `git status` as tracked.

### Pitfall 6: PRD uses `medium` (not `moderate`) for difficulty
**What goes wrong:** Future Edge Function normalizer reads PRD as spec and emits `medium` instead of `moderate`.
**Why it happens:** PRD section 4 schema block has `difficulty: easy/medium/hard` but the actual SQL migration (and REQUIREMENTS.md) use `moderate`.
**How to avoid:** FOUN-06 updates PRD to use `moderate` everywhere to match the migration CHECK constraint and TypeScript type.

---

## Code Examples

### Verified: Current state of files with defects

**`src/index.css` lines 65-68 (DELETE THESE):**
```css
/* ── Mapbox overrides ── */
.mapboxgl-ctrl-attrib {
  display: none !important;
}
```

**`vite.config.ts` runtimeCaching (REPLACE WITH):**
```typescript
{
  urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'psi-szlak-mapbox-tiles',
    expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
    cacheableResponse: { statuses: [0, 200] },
    purgeOnQuotaError: true,
  },
},
```

**`src/lib/types.ts` Route interface (CURRENT vs CORRECT):**
```typescript
// CURRENT (wrong):
water_access: boolean | null

// CORRECT (after FOUN-07):
water_access: 'none' | 'nearby' | 'on_route'
source: 'osm' | 'pttk' | null
water_type: 'river' | 'lake' | 'stream' | null
```

**`docs/PRD.md` section 4 schema block (CURRENT vs CORRECT):**
```
// CURRENT (wrong):
difficulty      text        -- easy / medium / hard / null
geojson         jsonb       -- przebieg trasy

// CORRECT (after FOUN-06):
difficulty      text        -- easy / moderate / hard / null
geometry        jsonb       -- przebieg trasy
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | Tailwind v4 | Already correct in project |
| `tailwind.config.ts` | `@theme` in CSS | Tailwind v4 | Already correct in project |
| `forwardRef` in React | Ref as regular prop | React 19 | Already using React 19 |
| Mapbox `display:none` attribution | `AttributionControl({ compact: true })` | Mapbox ToS enforcement | This phase fixes it |
| Workbox without `cacheableResponse` | `cacheableResponse: { statuses: [0, 200] }` | Workbox best practice | This phase fixes it |

**Deprecated/outdated in this project:**
- `water_access: boolean` in schema: replaced by text enum
- `mapbox-tiles` cache name: renamed to namespaced `psi-szlak-mapbox-tiles`
- `.mapboxgl-ctrl-attrib { display: none }` CSS: removed entirely

---

## Open Questions

1. **Is `dist/` actually tracked in git?**
   - What we know: `git ls-files dist/` returned empty output, indicating it is NOT tracked. `.gitignore` already has `dist` on line 8.
   - What's unclear: Whether it was ever committed and later removed, or never tracked.
   - Recommendation: FOUN-05 task should run `git status` to confirm, then if `dist/` appears untracked (not staged, not modified), the fix is "no-op — already correct". If it appears as tracked, run `git rm -r --cached dist/`.
   - **Current assessment:** FOUN-05 is likely already resolved. The task should verify and document rather than assume a fix is needed.

2. **Should the migration DROP COLUMN or ALTER COLUMN TYPE for `water_access`?**
   - What we know: The table has no production data (project is at 0% progress, no users).
   - What's unclear: Nothing — DROP + ADD is safe and cleaner for a boolean-to-text change.
   - Recommendation: Use DROP COLUMN + ADD COLUMN. Document this assumption in the migration file comment.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.x |
| Config file | `vitest.config.ts` — Wave 0 gap (does not exist) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUN-01 | `water_access` is text enum in TypeScript Route type | unit | `npx vitest run src/lib/types.test.ts -t "water_access"` | ❌ Wave 0 |
| FOUN-02 | `source`, `water_type`, `invitations.used_at` fields present in Route/Invitation types | unit | `npx vitest run src/lib/types.test.ts -t "Route fields"` | ❌ Wave 0 |
| FOUN-03 | No `.mapboxgl-ctrl-attrib { display: none }` in CSS | manual / grep | `grep -r "mapboxgl-ctrl-attrib" src/` returns empty | N/A |
| FOUN-04 | Workbox config has correct cache name, cacheableResponse, purgeOnQuotaError | unit | `npx vitest run vite.config.test.ts` | ❌ Wave 0 |
| FOUN-05 | `dist/` not in git tracking | manual | `git ls-files dist/` returns empty | N/A |
| FOUN-06 | PRD uses `moderate` and `geometry` | manual / grep | `grep "medium\|geojson" docs/PRD.md` returns empty | N/A |
| FOUN-07 | `types.ts` Route has correct water_access, source, water_type types | unit | `npx vitest run src/lib/types.test.ts` | ❌ Wave 0 |

> Note: FOUN-03, FOUN-05, FOUN-06 are purely textual/config checks. The most reliable validation is a grep or git command, not a test. The unit tests for FOUN-01, FOUN-02, FOUN-07 use TypeScript's `expectTypeOf` to assert the interface shape — this catches type regressions at CI time.

### Sampling Rate
- **Per task commit:** `grep -r "mapboxgl-ctrl-attrib" src/ && git ls-files dist/` (fast structural checks)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual verification checklist before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/types.test.ts` — covers FOUN-01, FOUN-02, FOUN-07 (TypeScript type shape assertions)
- [ ] `vitest.config.ts` — minimal config pointing at `src/**/*.test.ts`
- [ ] Framework install: `npm install --save-dev vitest @vitest/coverage-v8`

*(FOUN-03, FOUN-05, FOUN-06 do not require test files — they are verified by grep/git commands in the task acceptance criteria.)*

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `supabase/migrations/20260308210000_initial_schema.sql` — confirms `water_access boolean`, missing `source`/`water_type`/`used_at` columns
- Direct inspection of `src/lib/types.ts` — confirms `water_access: boolean | null`, missing `source`/`water_type`
- Direct inspection of `src/index.css` — confirms `.mapboxgl-ctrl-attrib { display: none !important }` at lines 65-68
- Direct inspection of `vite.config.ts` — confirms missing `cacheableResponse`/`purgeOnQuotaError`, wrong cache name `mapbox-tiles`
- Direct inspection of `docs/PRD.md` — confirms `medium` (not `moderate`) and `geojson` (not `geometry`) in section 4
- `git ls-files dist/` — confirms `dist/` is NOT currently tracked
- `.gitignore` — confirms `dist` is already excluded

### Secondary (MEDIUM confidence)
- Mapbox GL JS documentation: `AttributionControl({ compact: true })` is the ToS-compliant mobile-friendly alternative to hiding attribution — https://docs.mapbox.com/mapbox-gl-js/api/markers/#attributioncontrol
- Workbox documentation: `cacheableResponse` and `purgeOnQuotaError` are required for opaque response caching — https://developer.chrome.com/docs/workbox/caching-strategies-overview/

### Tertiary (LOW confidence)
- None — all findings verified directly from source files

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed and pinned in package.json; versions confirmed
- Architecture: HIGH — all fixes verified against actual source files; no speculation
- Pitfalls: HIGH for migration pitfalls (standard PostgreSQL behaviour); MEDIUM for dist/ tracking (already resolved per git evidence)

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable domain — Supabase migrations, Workbox, and Mapbox APIs are unlikely to change the patterns covered here within 30 days)
