import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { Route } from '../lib/types'

// ─── Mock: useTrailsStore ────────────────────────────────────────────────────
let mockRoutes: Route[] = []

vi.mock('../stores/trails', () => ({
  useTrailsStore: vi.fn((selector: (state: { routes: Route[] }) => unknown) =>
    selector({ routes: mockRoutes }),
  ),
}))

// ─── Mock: useFiltersStore ───────────────────────────────────────────────────
interface FiltersStateMock {
  length: 'short' | 'medium' | 'long' | null
  surface: Route['surface_type'] | null
  water: 'required' | 'preferred' | 'any'
  difficulty: Route['difficulty'] | null
  distance: 10 | 30 | 50 | null
  marked: boolean | null
}

let mockFilters: FiltersStateMock = {
  length: null,
  surface: null,
  water: 'any',
  difficulty: null,
  distance: null,
  marked: null,
}

vi.mock('../stores/filters', () => ({
  useFiltersStore: vi.fn((selector: (state: FiltersStateMock) => unknown) =>
    selector(mockFilters),
  ),
}))

// ─── Mock: useGeolocation ────────────────────────────────────────────────────
type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; position: { coords: { latitude: number; longitude: number } } }
  | { status: 'error'; code: number; message: string }

let mockGeoState: GeoState = { status: 'idle' }

vi.mock('./useGeolocation', () => ({
  useGeolocation: vi.fn(() => ({ state: mockGeoState, locate: vi.fn() })),
}))

// ─── Import hook under test ──────────────────────────────────────────────────
import { useFilteredRoutes } from './useFilteredRoutes'

// ─── Route factory ───────────────────────────────────────────────────────────
let idCounter = 0
function makeRoute(overrides: Partial<Route> = {}): Route {
  idCounter++
  return {
    id: `route-${idCounter}`,
    source_id: `osm:${idCounter}`,
    name: `Route ${idCounter}`,
    description: null,
    geometry: { type: 'LineString', coordinates: [] },
    length_km: 10,
    surface_type: 'dirt',
    difficulty: 'easy',
    water_access: 'none',
    source: 'osm',
    water_type: null,
    dogs_allowed: true,
    trail_color: null,
    is_marked: true,
    center_lat: 52.2297,  // Warsaw
    center_lon: 21.0122,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  idCounter = 0
  mockRoutes = []
  mockFilters = { length: null, surface: null, water: 'any', difficulty: null, distance: null, marked: null }
  mockGeoState = { status: 'idle' }
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useFilteredRoutes', () => {
  test('1. No filters active — returns all routes unchanged', () => {
    const r1 = makeRoute()
    const r2 = makeRoute({ surface_type: 'asphalt' })
    mockRoutes = [r1, r2]

    const { result } = renderHook(() => useFilteredRoutes())
    expect(result.current).toHaveLength(2)
    expect(result.current).toContain(r1)
    expect(result.current).toContain(r2)
  })

  test('2. Length short — includes < 5km and null length, excludes >= 5km', () => {
    const short = makeRoute({ length_km: 3 })
    const medium = makeRoute({ length_km: 10 })
    const nullLen = makeRoute({ length_km: null })
    mockRoutes = [short, medium, nullLen]
    mockFilters = { ...mockFilters, length: 'short' }

    const { result } = renderHook(() => useFilteredRoutes())
    expect(result.current).toContain(short)
    expect(result.current).toContain(nullLen)
    expect(result.current).not.toContain(medium)
  })

  test('3. Length medium — includes 5-15km and null, excludes outside range', () => {
    const short = makeRoute({ length_km: 3 })
    const medium = makeRoute({ length_km: 10 })
    const long = makeRoute({ length_km: 20 })
    const exact5 = makeRoute({ length_km: 5 })
    const exact15 = makeRoute({ length_km: 15 })
    const nullLen = makeRoute({ length_km: null })
    mockRoutes = [short, medium, long, exact5, exact15, nullLen]
    mockFilters = { ...mockFilters, length: 'medium' }

    const { result } = renderHook(() => useFilteredRoutes())
    expect(result.current).toContain(medium)
    expect(result.current).toContain(exact5)
    expect(result.current).toContain(exact15)
    expect(result.current).toContain(nullLen)
    expect(result.current).not.toContain(short)
    expect(result.current).not.toContain(long)
  })

  test('4. Length long — includes > 15km and null, excludes <= 15km', () => {
    const medium = makeRoute({ length_km: 10 })
    const long = makeRoute({ length_km: 20 })
    const nullLen = makeRoute({ length_km: null })
    mockRoutes = [medium, long, nullLen]
    mockFilters = { ...mockFilters, length: 'long' }

    const { result } = renderHook(() => useFilteredRoutes())
    expect(result.current).toContain(long)
    expect(result.current).toContain(nullLen)
    expect(result.current).not.toContain(medium)
  })

  test('5. Surface dirt — only returns routes with surface_type === dirt', () => {
    const dirt = makeRoute({ surface_type: 'dirt' })
    const gravel = makeRoute({ surface_type: 'gravel' })
    const asphalt = makeRoute({ surface_type: 'asphalt' })
    mockRoutes = [dirt, gravel, asphalt]
    mockFilters = { ...mockFilters, surface: 'dirt' }

    const { result } = renderHook(() => useFilteredRoutes())
    expect(result.current).toHaveLength(1)
    expect(result.current).toContain(dirt)
  })

  test('6. Difficulty moderate — only returns routes with difficulty === moderate', () => {
    const easy = makeRoute({ difficulty: 'easy' })
    const moderate = makeRoute({ difficulty: 'moderate' })
    const hard = makeRoute({ difficulty: 'hard' })
    mockRoutes = [easy, moderate, hard]
    mockFilters = { ...mockFilters, difficulty: 'moderate' }

    const { result } = renderHook(() => useFilteredRoutes())
    expect(result.current).toHaveLength(1)
    expect(result.current).toContain(moderate)
  })

  test('7. Water required — excludes routes with water_access === none', () => {
    const noWater = makeRoute({ water_access: 'none' })
    const nearby = makeRoute({ water_access: 'nearby' })
    const onRoute = makeRoute({ water_access: 'on_route' })
    mockRoutes = [noWater, nearby, onRoute]
    mockFilters = { ...mockFilters, water: 'required' }

    const { result } = renderHook(() => useFilteredRoutes())
    expect(result.current).toHaveLength(2)
    expect(result.current).not.toContain(noWater)
    expect(result.current).toContain(nearby)
    expect(result.current).toContain(onRoute)
  })

  test('8. Water preferred — all routes present, water routes sorted to top (stable)', () => {
    const noWater1 = makeRoute({ water_access: 'none' })
    const noWater2 = makeRoute({ water_access: 'none' })
    const nearby = makeRoute({ water_access: 'nearby' })
    const onRoute = makeRoute({ water_access: 'on_route' })
    mockRoutes = [noWater1, nearby, noWater2, onRoute]
    mockFilters = { ...mockFilters, water: 'preferred' }

    const { result } = renderHook(() => useFilteredRoutes())
    expect(result.current).toHaveLength(4)
    // water routes should come first
    const waterFirst = [nearby, onRoute]
    const waterLast = [noWater1, noWater2]
    waterFirst.forEach((r) => {
      expect(result.current.indexOf(r)).toBeLessThan(2)
    })
    waterLast.forEach((r) => {
      expect(result.current.indexOf(r)).toBeGreaterThanOrEqual(2)
    })
  })

  test('9. Marked true — only returns routes with is_marked === true', () => {
    const marked = makeRoute({ is_marked: true })
    const unmarked = makeRoute({ is_marked: false })
    mockRoutes = [marked, unmarked]
    mockFilters = { ...mockFilters, marked: true }

    const { result } = renderHook(() => useFilteredRoutes())
    expect(result.current).toHaveLength(1)
    expect(result.current).toContain(marked)
  })

  test('10. Distance 10 — excludes routes > 10km from user GPS', () => {
    // User is in Warsaw (52.2297, 21.0122)
    // Route near Warsaw (within 10km)
    const nearby = makeRoute({ center_lat: 52.25, center_lon: 21.0 })
    // Route in Krakow (~250km away)
    const farAway = makeRoute({ center_lat: 50.0647, center_lon: 19.9450 })

    mockRoutes = [nearby, farAway]
    mockFilters = { ...mockFilters, distance: 10 }
    mockGeoState = {
      status: 'success',
      position: { coords: { latitude: 52.2297, longitude: 21.0122 } },
    }

    const { result } = renderHook(() => useFilteredRoutes())
    expect(result.current).toContain(nearby)
    expect(result.current).not.toContain(farAway)
  })

  test('11. Distance filter with no GPS — skips distance filter, returns all', () => {
    const nearby = makeRoute({ center_lat: 52.25, center_lon: 21.0 })
    const farAway = makeRoute({ center_lat: 50.0647, center_lon: 19.9450 })
    mockRoutes = [nearby, farAway]
    mockFilters = { ...mockFilters, distance: 10 }
    mockGeoState = { status: 'idle' }  // no GPS

    const { result } = renderHook(() => useFilteredRoutes())
    expect(result.current).toHaveLength(2)
    expect(result.current).toContain(nearby)
    expect(result.current).toContain(farAway)
  })

  test('12. Combined: length short + surface dirt — intersection (AND logic)', () => {
    const shortDirt = makeRoute({ length_km: 3, surface_type: 'dirt' })
    const shortGravel = makeRoute({ length_km: 3, surface_type: 'gravel' })
    const longDirt = makeRoute({ length_km: 20, surface_type: 'dirt' })
    mockRoutes = [shortDirt, shortGravel, longDirt]
    mockFilters = { ...mockFilters, length: 'short', surface: 'dirt' }

    const { result } = renderHook(() => useFilteredRoutes())
    expect(result.current).toHaveLength(1)
    expect(result.current).toContain(shortDirt)
  })
})
