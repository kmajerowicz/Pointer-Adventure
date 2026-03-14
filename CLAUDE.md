# Psi Szlak — CLAUDE.md

## Project Definition
- **App:** "Psi Szlak" — PWA trail discovery app for dog owners in Poland
- **Stack:** React + Vite + TypeScript + Tailwind CSS 4 + React Router v6
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Maps:** Mapbox GL JS (Outdoors style, Geocoding API)
- **State:** Zustand (client state) + Supabase hooks (server state)
- **Hosting:** Vercel
- **PRD:** `docs/PRD.md` — source of truth for all features
- **Implementation Plan:** `docs/IMPLEMENTATION_PLAN.md` — phased build plan with skill mappings and acceptance criteria

## Commands
- `npm run dev` — Start dev server
- `npm run build` — TypeScript check + Vite build
- `npm run lint` — ESLint
- `npm run preview` — Preview production build

## Tech Stack Rules

### TypeScript
- Strict mode enabled
- Feature-based folder structure: `src/features/*`
- Components: PascalCase filenames
- Hooks: `use` prefix, in `src/hooks/`
- Types: centralized in `src/lib/types.ts`

### Tailwind CSS 4
- **Use `@theme` in CSS** (not tailwind.config.ts)
- **Use `@import "tailwindcss"`** (not @tailwind directives)
- Design tokens defined in `src/index.css`
- Never hardcode colors — use token classes (`bg-bg-base`, `text-accent`, etc.)
- Dark mode is the only mode (no light theme)

### React Router v6
- Routes defined in `src/router.tsx`
- `AppLayout` wraps tabbed pages (/, /trails, /favorites, /profile)
- Standalone routes: /auth

### Supabase
- Client: `src/lib/supabase.ts`
- Schema: `supabase/migrations/`
- Edge Functions: `supabase/functions/`
- RLS enabled on ALL tables
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Zustand Stores
- `src/stores/viewport.ts` — map center, zoom, bounds
- `src/stores/filters.ts` — trail filter state
- `src/stores/ui.ts` — view mode, filter panel open

### Mapbox
- Env var: `VITE_MAPBOX_TOKEN`
- Style: `mapbox://styles/mapbox/outdoors-v12`
- Default center: Poland [19.145, 51.919], zoom 6

## Design System
- **Background:** `bg-bg-base` (#111318), `bg-bg-surface` (#1C1F26), `bg-bg-elevated` (#252930)
- **Accent:** `text-accent` / `bg-accent` (#C9A84C)
- **Text:** `text-text-primary` (#F5F5F5), `text-text-secondary` (#A0A0A0), `text-text-muted` (#666)
- **Font:** Inter (sans-serif)
- **Touch targets:** min 48px
- **Tab bar height:** `var(--spacing-tab-bar)` (4.5rem)
- **Trail colors:** `trail-red`, `trail-blue`, `trail-yellow`, `trail-green`, `trail-black`

## MANDATORY Skill Mappings

**BEFORE starting any task, read the matching skill files:**

| Task Type | Skills Required |
|-----------|-----------------|
| UI Components | `.agents/skills/frontend-design/SKILL.md` + `.agents/skills/shadcn-ui/SKILL.md` |
| Layout & responsiveness | `.agents/skills/responsive-design/SKILL.md` |
| Tailwind config & tokens | `.agents/skills/tailwind-design-system/SKILL.md` |
| React patterns & perf | `.agents/skills/vercel-react-best-practices/SKILL.md` |
| Supabase (DB, Auth, RLS) | `.agents/skills/supabase-postgres-best-practices/SKILL.md` |
| Testing | `.agents/skills/vitest/SKILL.md` |
| Landing/marketing | `.agents/skills/web-design-guidelines/SKILL.md` |

### Skill Combos Per Phase
```
Phase 0 (Scaffolding):     tailwind-design-system + vercel-react-best-practices + supabase-postgres-best-practices
Phase 1 (Map):             frontend-design + responsive-design + tailwind-design-system + vercel-react-best-practices
Phase 2 (Trail Pipeline):  supabase-postgres-best-practices + vercel-react-best-practices + frontend-design
Phase 3 (Browsing/Filter): frontend-design + responsive-design + tailwind-design-system + vercel-react-best-practices + web-design-guidelines
Phase 4 (Auth/Onboarding): supabase-postgres-best-practices + frontend-design + responsive-design + tailwind-design-system + vercel-react-best-practices
Phase 5 (Favorites):       frontend-design + shadcn-ui + vercel-react-best-practices + supabase-postgres-best-practices
Phase 6 (PWA/Polish):      frontend-design + web-design-guidelines + responsive-design + vercel-react-best-practices
Phase 7 (Testing):         vitest + supabase-postgres-best-practices + vercel-react-best-practices
```

## Project Structure
```
pointer-adventure/
  docs/PRD.md
  CLAUDE.md
  .agents/skills/           (8 skills)
  supabase/
    migrations/             (SQL schema + RLS)
    functions/search-trails/ (Edge Function)
  src/
    main.tsx, App.tsx, router.tsx
    index.css               (Tailwind + tokens)
    vite-env.d.ts           (env var types)
    components/ui/          (BottomTabBar, Button, Card, Toast)
    components/layout/      (AppLayout)
    features/
      map/                  (MapView, MapControls, LocationSearch)
      trails/               (TrailList, TrailCard, TrailDetail, filters)
      favorites/            (FavoritesList, FavoriteNote)
      auth/                 (MagicLink, InviteGate, RegisterForm)
      onboarding/           (WelcomeScreen, DogNameStep, GeolocationStep)
      profile/              (ProfileView, InviteGenerator, ActivityHistory)
    hooks/                  (useGeolocation, useTrails, useMapBounds, useAuth, useFavorites, useActivityLog)
    lib/                    (supabase.ts, haversine.ts, types.ts)
    stores/                 (Zustand: filters, viewport, ui)
  public/manifest.json, icons/
  vite.config.ts
```

## UX Principles
- PWA-first (mobile is primary device)
- Touch targets >= 48px
- Every action gets feedback (toast, animation)
- No empty states without guidance
- Polish language UI
- Open registration (magic link auth)
