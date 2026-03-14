import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useFavoritesStore } from '../stores/favorites'
import { useAuthStore } from '../stores/auth'
import type { Favorite } from '../lib/types'

export function useFavorites() {
  const user = useAuthStore((s) => s.profile)
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds)
  const favorites = useFavoritesStore((s) => s.favorites)
  const store = useFavoritesStore()

  const loadFavorites = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
    if (!error && data) {
      store.setFavorites(data as Favorite[])
    } else if (error) {
      console.error('Failed to load favorites:', error)
      store.setLoadError('Nie udało się załadować ulubionych')
    }
  }

  useEffect(() => {
    if (user?.id) {
      void loadFavorites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const toggleFavorite = async (routeId: string): Promise<void> => {
    if (!user) return

    const isFav = favoriteIds.has(routeId)

    // Optimistic update
    if (isFav) {
      store.removeFavoriteId(routeId)
      store.removeFavorite(routeId)
    } else {
      store.addFavoriteId(routeId)
    }

    try {
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('route_id', routeId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, route_id: routeId })
          .select()
          .single()
        if (error) throw error
        if (data) store.addFavorite(data as Favorite)
      }
    } catch {
      // Rollback
      if (isFav) {
        store.addFavoriteId(routeId)
      } else {
        store.removeFavoriteId(routeId)
        store.removeFavorite(routeId)
      }
    }
  }

  const updateNote = async (routeId: string, note: string | null): Promise<void> => {
    if (!user) return

    const prevNote = favorites.find((f) => f.route_id === routeId)?.note ?? null

    const { error } = await supabase
      .from('favorites')
      .update({ note })
      .eq('user_id', user.id)
      .eq('route_id', routeId)

    if (!error) {
      store.updateNote(routeId, note)
    } else {
      // Revert to previous note
      store.updateNote(routeId, prevNote)
    }
  }

  return {
    favoriteIds,
    favorites,
    toggleFavorite,
    updateNote,
    loadFavorites,
  }
}
