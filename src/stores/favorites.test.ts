import { describe, test, expect, beforeEach } from 'vitest'
import { useFavoritesStore } from './favorites'
import type { Favorite } from '../lib/types'

const makeFav = (routeId: string, note?: string | null): Favorite => ({
  id: `fav-${routeId}`,
  user_id: 'user-1',
  route_id: routeId,
  note: note ?? null,
  created_at: new Date().toISOString(),
})

beforeEach(() => {
  useFavoritesStore.setState({ favorites: [], favoriteIds: new Set() })
})

describe('useFavoritesStore', () => {
  test('setFavorites populates both favorites array and favoriteIds Set', () => {
    const favs = [makeFav('route-1'), makeFav('route-2')]
    useFavoritesStore.getState().setFavorites(favs)

    const state = useFavoritesStore.getState()
    expect(state.favorites).toEqual(favs)
    expect(state.favoriteIds.has('route-1')).toBe(true)
    expect(state.favoriteIds.has('route-2')).toBe(true)
  })

  test('addFavoriteId adds to Set without mutating original', () => {
    const originalSet = useFavoritesStore.getState().favoriteIds
    useFavoritesStore.getState().addFavoriteId('route-1')

    const newSet = useFavoritesStore.getState().favoriteIds
    expect(newSet.has('route-1')).toBe(true)
    expect(newSet).not.toBe(originalSet)
  })

  test('removeFavoriteId removes from Set without mutating original', () => {
    useFavoritesStore.getState().setFavorites([makeFav('route-1')])
    const originalSet = useFavoritesStore.getState().favoriteIds

    useFavoritesStore.getState().removeFavoriteId('route-1')

    const newSet = useFavoritesStore.getState().favoriteIds
    expect(newSet.has('route-1')).toBe(false)
    expect(newSet).not.toBe(originalSet)
  })

  test('updateNote updates matching favorite note field', () => {
    useFavoritesStore.getState().setFavorites([makeFav('route-1', 'old note'), makeFav('route-2')])
    useFavoritesStore.getState().updateNote('route-1', 'new note')

    const state = useFavoritesStore.getState()
    const updated = state.favorites.find(f => f.route_id === 'route-1')
    expect(updated?.note).toBe('new note')
    // Other favorites unchanged
    const other = state.favorites.find(f => f.route_id === 'route-2')
    expect(other?.note).toBe(null)
  })
})

