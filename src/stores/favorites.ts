import { create } from 'zustand'
import type { Favorite } from '../lib/types'

interface FavoritesState {
  favoriteIds: Set<string>
  favorites: Favorite[]
  setFavorites: (favs: Favorite[]) => void
  addFavoriteId: (id: string) => void
  removeFavoriteId: (id: string) => void
  addFavorite: (fav: Favorite) => void
  removeFavorite: (routeId: string) => void
  updateNote: (routeId: string, note: string | null) => void
}

export const useFavoritesStore = create<FavoritesState>((set) => ({
  favoriteIds: new Set<string>(),
  favorites: [],

  setFavorites: (favs) =>
    set({
      favorites: favs,
      favoriteIds: new Set(favs.map((f) => f.route_id)),
    }),

  addFavoriteId: (id) =>
    set((s) => ({ favoriteIds: new Set([...s.favoriteIds, id]) })),

  removeFavoriteId: (id) =>
    set((s) => {
      const next = new Set(s.favoriteIds)
      next.delete(id)
      return { favoriteIds: next }
    }),

  addFavorite: (fav) =>
    set((s) => ({ favorites: [...s.favorites, fav] })),

  removeFavorite: (routeId) =>
    set((s) => ({ favorites: s.favorites.filter((f) => f.route_id !== routeId) })),

  updateNote: (routeId, note) =>
    set((s) => ({
      favorites: s.favorites.map((f) =>
        f.route_id === routeId ? { ...f, note } : f
      ),
    })),
}))
