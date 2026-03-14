import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Favorite } from '../lib/types'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// Mock auth store
let mockProfile: { id: string } | null = { id: 'user-1' }
vi.mock('../stores/auth', () => ({
  useAuthStore: vi.fn((selector: (state: { profile: typeof mockProfile }) => unknown) =>
    selector({ profile: mockProfile })
  ),
}))

// Mock favorites store state
const mockStoreState = {
  favoriteIds: new Set<string>(),
  favorites: [] as Favorite[],
  setFavorites: vi.fn(),
  addFavoriteId: vi.fn(),
  removeFavoriteId: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  updateNote: vi.fn(),
}

vi.mock('../stores/favorites', () => ({
  useFavoritesStore: vi.fn((selector?: (state: typeof mockStoreState) => unknown) => {
    if (selector) return selector(mockStoreState)
    return mockStoreState
  }),
}))

import { useFavorites } from './useFavorites'
import { supabase } from '../lib/supabase'

const mockFrom = supabase.from as ReturnType<typeof vi.fn>

/**
 * Full chainable supabase mock that supports all query builder methods.
 * Resolves with resolveWith when awaited directly OR via .single().
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeFullChain(resolveWith: { data: unknown; error: unknown }): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {}
  for (const method of ['select', 'insert', 'delete', 'update', 'eq', 'order']) {
    chain[method] = vi.fn().mockReturnValue(chain)
  }
  chain['single'] = vi.fn().mockResolvedValue(resolveWith)
  // Make chain itself a thenable so `await chain` resolves
  chain.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(onFulfilled, onRejected)
  chain.catch = (onRejected: (e: unknown) => unknown) =>
    Promise.resolve(resolveWith).catch(onRejected)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockProfile = { id: 'user-1' }
  mockStoreState.favoriteIds = new Set()
  mockStoreState.favorites = []
  mockStoreState.setFavorites.mockReset()
  mockStoreState.addFavoriteId.mockReset()
  mockStoreState.removeFavoriteId.mockReset()
  mockStoreState.addFavorite.mockReset()
  mockStoreState.removeFavorite.mockReset()
  mockStoreState.updateNote.mockReset()

  // Default: all calls succeed with empty data
  mockFrom.mockReturnValue(makeFullChain({ data: [], error: null }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useFavorites', () => {
  test('toggleFavorite on unfavorited trail adds to favoriteIds immediately (optimistic)', async () => {
    mockStoreState.favoriteIds = new Set()

    const insertResult = makeFullChain({
      data: { id: 'fav-1', user_id: 'user-1', route_id: 'route-1', note: null, created_at: '2026-01-01' },
      error: null,
    })
    // First call (useEffect loadFavorites), then second call (insert)
    mockFrom.mockReturnValueOnce(makeFullChain({ data: [], error: null }))
    mockFrom.mockReturnValue(insertResult)

    const { result } = renderHook(() => useFavorites())

    await act(async () => {
      result.current.toggleFavorite('route-1')
    })

    expect(mockStoreState.addFavoriteId).toHaveBeenCalledWith('route-1')
  })

  test('toggleFavorite on favorited trail removes from favoriteIds immediately (optimistic)', async () => {
    mockStoreState.favoriteIds = new Set(['route-1'])

    mockFrom.mockReturnValueOnce(makeFullChain({ data: [], error: null })) // loadFavorites
    mockFrom.mockReturnValue(makeFullChain({ data: null, error: null })) // delete

    const { result } = renderHook(() => useFavorites())

    await act(async () => {
      await result.current.toggleFavorite('route-1')
    })

    expect(mockStoreState.removeFavoriteId).toHaveBeenCalledWith('route-1')
    expect(mockStoreState.removeFavorite).toHaveBeenCalledWith('route-1')
  })

  test('toggleFavorite rolls back on server error', async () => {
    mockStoreState.favoriteIds = new Set()

    mockFrom.mockReturnValueOnce(makeFullChain({ data: [], error: null })) // loadFavorites
    mockFrom.mockReturnValue(makeFullChain({ data: null, error: { message: 'DB error' } })) // insert

    const { result } = renderHook(() => useFavorites())

    await act(async () => {
      await result.current.toggleFavorite('route-1')
    })

    expect(mockStoreState.addFavoriteId).toHaveBeenCalledWith('route-1')
    expect(mockStoreState.removeFavoriteId).toHaveBeenCalledWith('route-1')
    expect(mockStoreState.removeFavorite).toHaveBeenCalledWith('route-1')
  })

  test('updateNote updates store after successful server call', async () => {
    mockFrom.mockReturnValueOnce(makeFullChain({ data: [], error: null })) // loadFavorites
    mockFrom.mockReturnValue(makeFullChain({ data: null, error: null })) // update

    const { result } = renderHook(() => useFavorites())

    await act(async () => {
      await result.current.updateNote('route-1', 'Great trail!')
    })

    expect(mockStoreState.updateNote).toHaveBeenCalledWith('route-1', 'Great trail!')
  })

  test('all mutations are no-ops when user is null', async () => {
    mockProfile = null

    const { result } = renderHook(() => useFavorites())

    await act(async () => {
      await result.current.toggleFavorite('route-1')
    })

    expect(mockStoreState.addFavoriteId).not.toHaveBeenCalled()
    expect(mockStoreState.removeFavoriteId).not.toHaveBeenCalled()
  })
})
