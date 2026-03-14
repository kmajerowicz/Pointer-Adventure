import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FavoritesList } from './FavoritesList'

// --- Mocks ---

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockUseFavorites = vi.fn()
vi.mock('../../hooks/useFavorites', () => ({
  useFavorites: () => mockUseFavorites(),
}))

const mockUseFilteredRoutes = vi.fn()
vi.mock('../../hooks/useFilteredRoutes', () => ({
  useFilteredRoutes: (sourceRoutes?: unknown[]) => mockUseFilteredRoutes(sourceRoutes),
}))

const mockUseTrailsStore = vi.fn()
vi.mock('../../stores/trails', () => ({
  useTrailsStore: (selector: (s: { routes: unknown[] }) => unknown) =>
    selector({ routes: mockUseTrailsStore() }),
}))

const mockUseActivityStore = vi.fn()
vi.mock('../../stores/activity', () => ({
  useActivityStore: (selector: (s: { walkedIds: Set<string> }) => unknown) =>
    selector({ walkedIds: mockUseActivityStore() }),
}))

const mockUseAuthStore = vi.fn()
vi.mock('../../stores/auth', () => ({
  useAuthStore: (selector: (s: { profile: unknown }) => unknown) =>
    selector({ profile: mockUseAuthStore() }),
}))

const mockUseViewportStore = vi.fn()
vi.mock('../../stores/viewport', () => ({
  useViewportStore: (selector: (s: { center: [number, number] }) => unknown) =>
    selector({ center: mockUseViewportStore() }),
}))

vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({ state: { status: 'idle' } }),
}))

// FilterButton and ActiveFilterChips have required props — stub them
vi.mock('../map/FilterButton', () => ({
  FilterButton: ({ onPress }: { onPress: () => void }) => (
    <button onClick={onPress} data-testid="filter-button">Filtry</button>
  ),
}))

vi.mock('../map/ActiveFilterChips', () => ({
  ActiveFilterChips: () => <div data-testid="active-filter-chips" />,
}))

// --- Test data ---

const mockRoute = {
  id: 'route-1',
  source_id: 'src-1',
  name: 'Szlak Testowy',
  description: null,
  geometry: { type: 'LineString', coordinates: [] },
  length_km: 5.0,
  surface_type: 'dirt' as const,
  difficulty: 'easy' as const,
  water_access: 'none' as const,
  source: null,
  water_type: null,
  dogs_allowed: true,
  trail_color: null,
  is_marked: false,
  center_lat: 50.0,
  center_lon: 20.0,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
}

// --- Tests ---

describe('FavoritesList', () => {
  beforeEach(() => {
    mockUseViewportStore.mockReturnValue([19.145, 51.919])
    mockUseActivityStore.mockReturnValue(new Set<string>())
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set<string>(),
      favorites: [],
      toggleFavorite: vi.fn(),
    })
    mockUseTrailsStore.mockReturnValue([])
    mockUseFilteredRoutes.mockReturnValue([])
  })

  it('renders empty state with dog name when no favorites exist', () => {
    mockUseAuthStore.mockReturnValue({ id: 'u1', dog_name: 'Reksio', display_name: null, avatar_url: null, walk_preferences: null, created_at: '' })
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set<string>(),
      favorites: [],
      toggleFavorite: vi.fn(),
    })

    render(<FavoritesList />)

    expect(screen.getByText('Brak ulubionych tras')).toBeDefined()
    expect(screen.getByText(/Reksio/)).toBeDefined()
  })

  it('renders trail cards when favorites exist', () => {
    mockUseAuthStore.mockReturnValue({ id: 'u1', dog_name: 'Burek', display_name: null, avatar_url: null, walk_preferences: null, created_at: '' })
    mockUseTrailsStore.mockReturnValue([mockRoute])
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(['route-1']),
      favorites: [{ id: 'f1', user_id: 'u1', route_id: 'route-1', note: null, created_at: '' }],
      toggleFavorite: vi.fn(),
    })
    mockUseFilteredRoutes.mockReturnValue([mockRoute])

    render(<FavoritesList />)

    expect(screen.getByText('Szlak Testowy')).toBeDefined()
  })

  it('renders "Brak tras pasujacych do filtrow" when favorites exist but filters yield 0', () => {
    mockUseAuthStore.mockReturnValue({ id: 'u1', dog_name: 'Pucia', display_name: null, avatar_url: null, walk_preferences: null, created_at: '' })
    mockUseTrailsStore.mockReturnValue([mockRoute])
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(['route-1']),
      favorites: [{ id: 'f1', user_id: 'u1', route_id: 'route-1', note: null, created_at: '' }],
      toggleFavorite: vi.fn(),
    })
    // Filters yield nothing even though favorites exist
    mockUseFilteredRoutes.mockReturnValue([])

    render(<FavoritesList />)

    expect(screen.getByText(/Brak tras pasujacych do filtrow/)).toBeDefined()
  })
})
