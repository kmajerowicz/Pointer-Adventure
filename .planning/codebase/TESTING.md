# Testing Patterns

**Analysis Date:** 2026-03-10

## Test Framework

**Runner:**
- Vitest (planned/designated — not yet configured in `vite.config.ts`)
- The vitest skill is listed in `.agents/skills/vitest/` and mapped to Phase 7 (Testing) in `CLAUDE.md`
- No `vitest.config.ts` or `vitest` package in `package.json` — tests have NOT been written yet

**Assertion Library:**
- Vitest built-in (Jest-compatible `expect` API)

**Run Commands (to be configured):**
```bash
npx vitest              # Run all tests (once vitest is installed)
npx vitest --watch      # Watch mode
npx vitest --coverage   # Coverage report
```

## Setup Steps Required Before Writing Tests

Vitest is not yet installed. To add it:

```bash
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event
```

Then extend `vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
// ... existing plugins ...

export default defineConfig({
  plugins: [...],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/vite-env.d.ts', 'src/main.tsx'],
    },
  },
})
```

## Test File Organization

**Location (recommended per CLAUDE.md structure):**
- Co-located with source: `src/features/map/MapView.test.tsx` next to `MapView.tsx`
- OR in a top-level `src/__tests__/` directory for unit tests on utilities

**Naming:**
- Component tests: `[ComponentName].test.tsx`
- Hook tests: `[hookName].test.ts`
- Utility tests: `[filename].test.ts`
- Store tests: `[storeName].test.ts`

**Structure:**
```
src/
  features/
    map/
      MapView.tsx
      MapView.test.tsx      # co-located component test
  hooks/
    useGeolocation.ts
    useGeolocation.test.ts  # co-located hook test
  lib/
    haversine.ts
    haversine.test.ts       # co-located utility test
  stores/
    filters.ts
    filters.test.ts         # co-located store test
  test/
    setup.ts                # global test setup (mocks, etc.)
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFiltersStore } from '../stores/filters'

describe('useFiltersStore', () => {
  beforeEach(() => {
    useFiltersStore.getState().resetAll()
  })

  it('initializes with default values', () => {
    const { length, surface, water } = useFiltersStore.getState()
    expect(length).toBeNull()
    expect(surface).toBeNull()
    expect(water).toBe('any')
  })

  it('updates length filter', () => {
    act(() => {
      useFiltersStore.getState().setLength('short')
    })
    expect(useFiltersStore.getState().length).toBe('short')
  })
})
```

**Patterns:**
- `beforeEach` to reset Zustand store state between tests via `store.getState().resetAll()`
- `describe` blocks group related tests by feature/component
- `it` with descriptive behavior strings ("initializes with default values")

## Mocking

**Framework:** `vi` from vitest

**Patterns:**

Module mock for Supabase client:
```typescript
import { vi } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
    auth: {
      signInWithOtp: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}))
```

Mapbox GL mock (required for jsdom environment):
```typescript
vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      remove: vi.fn(),
      addLayer: vi.fn(),
      getSource: vi.fn(),
    })),
    NavigationControl: vi.fn(),
  },
}))
```

**What to Mock:**
- `src/lib/supabase.ts` Supabase client in all feature tests
- `mapbox-gl` in any component that creates a map instance
- Browser APIs: `navigator.geolocation`, `window.matchMedia`
- Environment variables via `import.meta.env`

**What NOT to Mock:**
- Zustand stores (test real store logic)
- Utility functions in `src/lib/` (pure functions, test directly)
- React Router (use `MemoryRouter` from `react-router-dom` instead)

## Fixtures and Factories

**Test Data (recommended pattern based on `src/lib/types.ts`):**
```typescript
// src/test/factories.ts

import type { Route, User, Favorite } from '../lib/types'

export function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'route-1',
    source_id: 'osm-123',
    name: 'Test Trail',
    description: null,
    geometry: { type: 'LineString', coordinates: [] },
    length_km: 5.2,
    surface_type: 'dirt',
    difficulty: 'easy',
    water_access: true,
    dogs_allowed: true,
    trail_color: 'red',
    is_marked: true,
    center_lat: 51.919,
    center_lon: 19.145,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    display_name: 'Test User',
    dog_name: 'Burek',
    avatar_url: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}
```

**Location:**
- `src/test/factories.ts` — shared test data factories
- `src/test/setup.ts` — global test setup (mock `window.matchMedia`, etc.)

## Coverage

**Requirements:** No coverage target enforced yet (testing phase not started)

**Recommended targets when Phase 7 begins:**
- Zustand stores: 100% (pure logic, easy to test)
- Utility functions (`src/lib/haversine.ts`, etc.): 100%
- Custom hooks: 80%+
- Components: 70%+

**View Coverage:**
```bash
npx vitest --coverage
# Opens HTML report in coverage/index.html
```

## Test Types

**Unit Tests:**
- Zustand stores: test initial state, each action, `resetAll`
- Utility functions: pure input/output tests (e.g., `haversine.ts` distance calculation)
- Type utilities: use `expectTypeOf` for complex type assertions

**Integration Tests:**
- Custom hooks with mocked Supabase: test data fetching, error states, loading states
- Component rendering with router context: verify navigation and conditional rendering

**E2E Tests:**
- Not configured — not in current scope for MVP phase

## Common Patterns

**Async Testing:**
```typescript
import { waitFor } from '@testing-library/react'

it('loads trails from supabase', async () => {
  const { result } = renderHook(() => useTrails())
  await waitFor(() => {
    expect(result.current.trails).toHaveLength(1)
  })
})
```

**Error Testing:**
```typescript
it('handles supabase error', async () => {
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } }),
  } as any)

  const { result } = renderHook(() => useTrails())
  await waitFor(() => {
    expect(result.current.error).toBeTruthy()
  })
})
```

**Zustand Store Reset Between Tests:**
```typescript
beforeEach(() => {
  // Reset each store to defaults
  useFiltersStore.getState().resetAll()
  useUIStore.setState({ viewMode: 'map', isFilterOpen: false })
})
```

## Priority Test Targets (Phase 7)

When tests are written, prioritize in this order:

1. `src/lib/haversine.ts` — pure utility, highest confidence value
2. `src/stores/filters.ts` — core filter logic
3. `src/stores/viewport.ts` — map state logic
4. `src/stores/ui.ts` — UI state logic
5. Custom hooks in `src/hooks/` — data fetching with Supabase mocks
6. `src/components/ui/BottomTabBar.tsx` — navigation rendering

---

*Testing analysis: 2026-03-10*
