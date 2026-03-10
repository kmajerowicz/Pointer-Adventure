# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript ~5.9.3 - All application source code in `src/`

**Secondary:**
- SQL - Supabase migrations in `supabase/migrations/`
- HTML - Single entry point `index.html`
- CSS - Tailwind 4 tokens and base styles in `src/index.css`

## Runtime

**Environment:**
- Node.js v24.13.0 (detected from running environment)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (lockfileVersion 3)

## Frameworks

**Core:**
- React 19.2.0 - UI rendering (`src/main.tsx`, `src/App.tsx`)
- React Router DOM 7.13.1 - Client-side routing (`src/router.tsx`)
- Tailwind CSS 4.2.1 - Utility-first styling (configured via `@tailwindcss/vite` plugin, tokens in `src/index.css`)

**State Management:**
- Zustand 5.0.11 - Client-side global state (`src/stores/filters.ts`, `src/stores/viewport.ts`, `src/stores/ui.ts`)

**Build/Dev:**
- Vite 7.3.1 - Dev server and production bundler (`vite.config.ts`)
- vite-plugin-pwa 1.2.0 - Service worker and PWA manifest injection (`vite.config.ts`)
- workbox-precaching 7.4.0 - Precache manifest for service worker

**Testing:**
- Not yet configured (no test runner found in devDependencies)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.98.0 - Backend client for DB, Auth, Edge Functions (`src/lib/supabase.ts`)
- `mapbox-gl` ^3.19.1 - Interactive maps, Outdoors style, Geocoding API
- `react-router-dom` ^7.13.1 - SPA routing with nested layout support
- `zustand` ^5.0.11 - Lightweight global state without Context boilerplate

**UI:**
- `lucide-react` ^0.577.0 - Icon library
- `@types/geojson` ^7946.0.16 - GeoJSON type definitions for route geometry

**Infrastructure:**
- `vite-plugin-pwa` ^1.2.0 - PWA service worker with Workbox
- `workbox-precaching` ^7.4.0 - Asset precaching strategy

## TypeScript Configuration

**Strictness:** Strict mode enabled with additional checks:
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedSideEffectImports: true`
- `erasableSyntaxOnly: true`

**Target:** ES2022, module resolution: `bundler`

**Config files:**
- `tsconfig.json` - Root references file
- `tsconfig.app.json` - App source config (includes `src/`)
- `tsconfig.node.json` - Node/config tools config

## Configuration

**Environment:**
- Variables declared in `src/vite-env.d.ts` as typed `ImportMetaEnv`
- Three required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`
- Example file: `.env.example`
- `.env` and `.env.local` present (contents not read)

**Build:**
- `vite.config.ts` - Vite + Tailwind CSS + PWA plugin config
- PWA manifest loaded from `public/manifest.json` (not auto-generated)
- Mapbox tiles cached via Workbox `CacheFirst` strategy (7-day TTL, 500 entries max)

**Linting:**
- `eslint.config.js` - ESLint 9 flat config
- Plugins: `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

## Platform Requirements

**Development:**
- Node.js (v24.x detected)
- npm

**Production:**
- Deployed to Vercel (project: `pointer-adventure`, org linked via `.vercel/project.json`)
- PWA (installable, standalone display, portrait orientation)
- Service worker handles offline asset caching and Mapbox tile caching

---

*Stack analysis: 2026-03-10*
