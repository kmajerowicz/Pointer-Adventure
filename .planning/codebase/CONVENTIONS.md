# Coding Conventions

**Analysis Date:** 2026-03-10

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` — e.g., `AppLayout.tsx`, `BottomTabBar.tsx`
- Non-component TypeScript modules: camelCase `.ts` — e.g., `supabase.ts`, `types.ts`, `filters.ts`
- Hooks: `use`-prefixed camelCase `.ts` — e.g., `useGeolocation.ts`, `useTrails.ts`, `useAuth.ts`
- Stores: descriptive camelCase `.ts` — e.g., `viewport.ts`, `filters.ts`, `ui.ts`

**Functions / Components:**
- React components: PascalCase named functions — e.g., `export function AppLayout()`, `export function BottomTabBar()`
- Zustand stores: `use[Name]Store` convention — e.g., `useFiltersStore`, `useViewportStore`, `useUIStore`
- Event handlers / setters: `set[Field]` prefix — e.g., `setLength`, `setCenter`, `setViewMode`
- Toggle actions: `toggle[Feature]` — e.g., `toggleFilter`
- Reset actions: `resetAll`

**Variables:**
- camelCase throughout
- Boolean state: `is`/`has` prefix — e.g., `isFilterOpen`, `isActive`
- Inline type aliases: PascalCase — e.g., `LengthFilter`, `WaterFilter`, `ViewMode`

**Types / Interfaces:**
- Interfaces: PascalCase — e.g., `Route`, `Favorite`, `User`, `FiltersState`, `ViewportState`
- Type aliases: PascalCase — e.g., `SurfaceType`, `Difficulty`, `TrailColor`, `ViewMode`
- Extracted type aliases from interfaces via lookup: `export type SurfaceType = Route['surface_type']`
- All domain types centralized in `src/lib/types.ts`

## Code Style

**Formatting:**
- No Prettier config detected — formatting enforced implicitly through TypeScript strict mode and ESLint
- Single quotes for imports (observed throughout source)
- No semicolons style is not enforced (semicolons are absent in some files, present in others — follow existing file style)

**Linting:**
- ESLint 9 flat config — `eslint.config.js`
- Rules active: `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` recommended, `eslint-plugin-react-refresh` vite preset
- Target: `**/*.{ts,tsx}`, `ecmaVersion: 2020`, browser globals
- TypeScript strict mode: `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noFallthroughCasesInSwitch: true`

## Import Organization

**Order (observed):**
1. React and third-party framework imports (`react-router-dom`, `react`, etc.)
2. Third-party library imports (`lucide-react`, `zustand`, `@supabase/supabase-js`, etc.)
3. Internal imports — types from `../lib/types`
4. Local component/module imports

**Path Aliases:**
- No `@/` alias configured — uses relative paths (e.g., `'../lib/types'`, `'../ui/BottomTabBar'`)

**Import Style:**
- Named imports preferred: `import { create } from 'zustand'`
- Type-only imports use `import type`: `import type { SurfaceType, Difficulty } from '../lib/types'`
- Default exports used for `App` component only; all other exports are named

## Tailwind CSS Conventions

**Token Usage:**
- NEVER hardcode colors — always use design token classes: `bg-bg-base`, `text-accent`, `bg-bg-surface`, `text-text-secondary`, `text-text-muted`
- Design tokens defined in `src/index.css` under `@theme` block
- Use `@import "tailwindcss"` (not `@tailwind` directives)
- Dark-only design system — no light/dark mode conditionals

**Responsive / Touch:**
- Touch targets minimum 48px: `min-w-[3rem] min-h-[3rem]`
- Tab bar height via CSS variable: `h-[var(--spacing-tab-bar)]`

**Class Ordering:**
- Layout first (flex, grid), then sizing, then colors, then typography, then effects — observed in components

## React Patterns

**Component Style:**
- Named function exports (not arrow function default exports)
- Component props via inline destructuring when needed
- `as const` for static data arrays: `const tabs = [...] as const`

**Routing:**
- Routes centralized in `src/router.tsx` using `createBrowserRouter`
- Tabbed pages wrapped in `AppLayout` via nested routes with `<Outlet />`
- Standalone routes (`/invite`, `/auth`) at root level without layout wrapper

**State Management:**
- Zustand stores for all client-side state
- Store pattern: define interface, export `use[Name]Store = create<Interface>()`
- `defaults` object extracted for reuse in `resetAll`
- Selector pattern: destructure from store in components

## Error Handling

**Patterns:**
- Defensive guard check on init with `console.warn` for missing env vars (see `src/lib/supabase.ts`)
- Nullish coalescing fallback to empty string on missing config: `supabaseUrl ?? ''`
- TypeScript strict null checks enforce handling of nullable fields at compile time
- `null` used for optional/unset state (not `undefined`) in Zustand stores

## Logging

**Framework:** `console` (native browser)

**Patterns:**
- `console.warn` for configuration warnings (missing env vars)
- No structured logging library
- No debug/info logging in production code — only warning for misconfiguration

## Comments

**When to Comment:**
- Inline comments for non-obvious values: `// [lng, lat]`, `// Poland center`, `// using public/manifest.json`
- Section separator comments in CSS: `/* ── Psi Szlak Design Tokens ── */`
- No JSDoc observed in current codebase

**JSDoc/TSDoc:**
- Not used — TypeScript types serve as documentation

## Function Design

**Size:** Small, focused functions. Components under 35 lines typical.

**Parameters:** Zustand setter functions use single parameter matching the field name

**Return Values:** Components return JSX directly; stores return state + action objects

## Module Design

**Exports:**
- Named exports for all components, stores, hooks, and utilities
- Default export for `App` component only (`src/App.tsx`)
- Types re-exported as type aliases from `src/lib/types.ts` for convenience

**Barrel Files:**
- Not used — direct relative path imports throughout

## TypeScript Configuration

- Target: `ES2022`, module: `ESNext`, `moduleResolution: "bundler"`
- `verbatimModuleSyntax: true` — requires explicit `import type` for type-only imports
- `noEmit: true` — TypeScript used for checking only, Vite handles transpilation
- `strict: true` with additional strictness: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`

---

*Convention analysis: 2026-03-10*
