# Codebase Structure

**Analysis Date:** 2026-03-10

## Directory Layout

```
pointer-adventure/            # Project root (app name: psi-szlak)
├── src/                      # All application source code
│   ├── main.tsx              # React app mount point
│   ├── App.tsx               # RouterProvider wrapper
│   ├── router.tsx            # All route definitions
│   ├── index.css             # Tailwind 4 import + @theme design tokens
│   ├── vite-env.d.ts         # Vite env var type declarations
│   ├── components/           # Shared, non-feature-specific UI
│   │   ├── layout/           # App shell components
│   │   │   └── AppLayout.tsx # Persistent tab layout with <Outlet />
│   │   └── ui/               # Reusable primitives
│   │       └── BottomTabBar.tsx
│   ├── features/             # Feature vertical slices
│   │   ├── auth/             # Magic link, InviteGate, RegisterForm
│   │   ├── favorites/        # FavoritesList, FavoriteNote
│   │   ├── map/              # MapView, MapControls, LocationSearch
│   │   ├── onboarding/       # WelcomeScreen, DogNameStep, GeolocationStep
│   │   ├── profile/          # ProfileView, InviteGenerator, ActivityHistory
│   │   └── trails/           # TrailList, TrailCard, TrailDetail, filter UI
│   ├── hooks/                # Shared custom React hooks
│   ├── lib/                  # Singletons, types, pure utilities
│   │   ├── supabase.ts       # Supabase client singleton
│   │   ├── types.ts          # All domain types and interfaces
│   │   └── haversine.ts      # (planned) distance calculation utility
│   └── stores/               # Zustand global state stores
│       ├── filters.ts        # Trail filter values
│       ├── ui.ts             # viewMode, isFilterOpen
│       └── viewport.ts       # Map center, zoom, bounds
├── supabase/                 # Supabase project config and backend code
│   ├── config.toml           # Supabase CLI project config
│   ├── migrations/           # SQL schema files (run in order)
│   │   └── 20260308210000_initial_schema.sql
│   └── functions/            # Deno Edge Functions
│       └── search-trails/    # Trail fetch + cache Edge Function
├── public/                   # Static assets served as-is
│   ├── manifest.json         # PWA web app manifest
│   └── icons/                # PWA icons
├── docs/                     # Project documentation (not shipped)
│   ├── PRD.md                # Product Requirements Document (source of truth)
│   └── IMPLEMENTATION_PLAN.md # Phased build plan
├── .agents/                  # Agent skill files (not shipped)
│   └── skills/               # Per-task skill reference documents
├── .planning/                # GSD planning artifacts (not shipped)
│   └── codebase/             # Codebase analysis documents
├── dist/                     # Production build output (git-ignored)
├── index.html                # Vite HTML entry point
├── vite.config.ts            # Vite + PWA + Tailwind build config
├── tsconfig.json             # TypeScript project references root
├── tsconfig.app.json         # App source TS config (strict mode)
├── tsconfig.node.json        # Vite config TS config
├── eslint.config.js          # ESLint flat config
├── package.json              # Dependencies and scripts
├── CLAUDE.md                 # Claude agent instructions (conventions, stack rules)
└── .env.example              # Required env vars template
```

## Directory Purposes

**`src/components/`:**
- Purpose: Shared UI components not tied to any single feature
- Contains: Layout shells (`layout/`) and reusable presentational primitives (`ui/`)
- Key files: `src/components/layout/AppLayout.tsx`, `src/components/ui/BottomTabBar.tsx`
- Rule: Components here must be feature-agnostic. If it's only used in one feature, it lives inside that feature folder.

**`src/features/`:**
- Purpose: Self-contained vertical slices, one per product area
- Contains: Page-level components, sub-components, and feature-specific logic
- Current features: `auth/`, `favorites/`, `map/`, `onboarding/`, `profile/`, `trails/`
- Rule: Each feature owns its components. Cross-feature communication happens via stores or hooks, never by importing between feature folders.

**`src/hooks/`:**
- Purpose: Shared custom hooks used by two or more features
- Contains (planned): `useGeolocation.ts`, `useTrails.ts`, `useMapBounds.ts`, `useAuth.ts`, `useFavorites.ts`, `useActivityLog.ts`
- Rule: Hooks that are only used inside one feature live inside that feature's folder, not here.

**`src/lib/`:**
- Purpose: Singleton clients, shared domain types, and pure utility functions
- Key files:
  - `src/lib/supabase.ts` — the single Supabase client instance, imported everywhere
  - `src/lib/types.ts` — all TypeScript interfaces and union types for domain models
  - `src/lib/haversine.ts` — (planned) pure distance calculation function
- Rule: No React or UI code here. Only framework-agnostic utilities and client setup.

**`src/stores/`:**
- Purpose: Zustand stores for global client state
- Key files:
  - `src/stores/viewport.ts` — exports `useViewportStore`
  - `src/stores/filters.ts` — exports `useFiltersStore`
  - `src/stores/ui.ts` — exports `useUIStore`
- Rule: Stores hold only ephemeral client state (UI, map position, active filters). Server data (trails, favorites) is held in hook-local state.

**`supabase/migrations/`:**
- Purpose: Ordered SQL migration files applied to the Supabase PostgreSQL instance
- Key files: `20260308210000_initial_schema.sql` — defines all 6 tables with RLS
- Rule: Never edit existing migration files. Add new numbered files for schema changes.

**`supabase/functions/`:**
- Purpose: Deno-based Edge Functions deployed to Supabase
- Key: `search-trails/` — the only server-side business logic: receives bbox, checks cache, fetches Overpass API, upserts trails
- Rule: Edge Functions run with service-role privileges for DB writes. All RLS bypass must be intentional and documented.

**`public/`:**
- Purpose: Static assets copied verbatim to build output
- Contains: `manifest.json` (PWA), app icons
- Note: Vite's `VitePWA` plugin is configured with `manifest: false` — uses this file directly

**`.agents/skills/`:**
- Purpose: Agent skill reference documents for Claude instances
- Generated: No
- Committed: Yes (part of project)

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React app bootstrap — creates root, renders `<App />`
- `index.html`: Vite HTML shell — contains `<div id="root">`
- `src/router.tsx`: All route definitions — import this to understand page structure

**Configuration:**
- `vite.config.ts`: Build config, PWA settings, Workbox cache rules
- `src/index.css`: Design tokens via `@theme {}`, Tailwind import, base styles
- `tsconfig.app.json`: TypeScript settings including strict mode and path aliases
- `supabase/config.toml`: Supabase project and local dev config
- `CLAUDE.md`: Convention rules, design system tokens, stack rules — read before any task

**Core Logic:**
- `src/lib/supabase.ts`: Supabase client — import `supabase` from here everywhere
- `src/lib/types.ts`: All domain types — `Route`, `Favorite`, `User`, `Invitation`, etc.
- `supabase/migrations/20260308210000_initial_schema.sql`: Full DB schema with RLS policies
- `supabase/functions/search-trails/`: Trail discovery and caching Edge Function

**State:**
- `src/stores/viewport.ts`: Map position state
- `src/stores/filters.ts`: Trail filter state
- `src/stores/ui.ts`: View mode and panel state

**Testing:**
- Not yet present. Vitest is the planned framework (see `.agents/skills/vitest/`)

## Naming Conventions

**Files:**
- React components: PascalCase — `AppLayout.tsx`, `BottomTabBar.tsx`, `TrailCard.tsx`
- Hooks: camelCase with `use` prefix — `useTrails.ts`, `useGeolocation.ts`
- Stores: camelCase noun — `filters.ts`, `viewport.ts`, `ui.ts`
- Utilities/lib: camelCase — `supabase.ts`, `haversine.ts`, `types.ts`
- SQL migrations: `YYYYMMDDHHMMSS_snake_case_description.sql`

**Directories:**
- Feature folders: lowercase, single-word or hyphenated — `map/`, `trails/`, `auth/`, `onboarding/`
- Component groupings: lowercase — `ui/`, `layout/`

**Exports:**
- Named exports for all components: `export function AppLayout()`
- Named exports for stores: `export const useFiltersStore = create<...>(...)`
- Default export only for `App.tsx` (React Router convention)

## Where to Add New Code

**New Feature (e.g., notifications):**
- Create folder: `src/features/notifications/`
- Primary components: `src/features/notifications/NotificationsList.tsx`
- Register route in: `src/router.tsx`
- Add tab (if needed): `src/components/ui/BottomTabBar.tsx`

**New Shared Component (used by 2+ features):**
- Implementation: `src/components/ui/ComponentName.tsx`
- If it's a layout shell: `src/components/layout/ComponentName.tsx`

**New Custom Hook (used by 2+ features):**
- Implementation: `src/hooks/useHookName.ts`
- If only used in one feature: `src/features/{feature}/useHookName.ts`

**New Domain Type:**
- Add to: `src/lib/types.ts` — all types centralized here

**New Zustand Store:**
- Create: `src/stores/storeName.ts`
- Export as: `export const useStoreName = create<StoreInterface>(...)`

**New Utility Function:**
- Add to: `src/lib/` as a new file or append to an existing lib file
- Keep it pure (no React, no side effects)

**New DB Table or RLS Change:**
- Add a new migration file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- Never modify existing migration files

**New Edge Function:**
- Create directory: `supabase/functions/function-name/`
- Add `index.ts` (Deno entry point)

**New Environment Variable:**
- Document in `.env.example`
- Declare type in `src/vite-env.d.ts` under `ImportMetaEnv`

## Special Directories

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes (by `npm run build`)
- Committed: No (git-ignored)

**`.planning/`:**
- Purpose: GSD planning documents (phases, codebase analysis)
- Generated: Yes (by GSD commands)
- Committed: Yes

**`.agents/`:**
- Purpose: Skill files read by Claude agents before specific task types
- Generated: No (manually maintained)
- Committed: Yes

**`supabase/.temp/`:**
- Purpose: Supabase CLI temporary files (project ref, version cache)
- Generated: Yes (by Supabase CLI)
- Committed: No (git-ignored via `supabase/.gitignore`)

---

*Structure analysis: 2026-03-10*
