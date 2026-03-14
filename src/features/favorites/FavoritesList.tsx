import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useFavorites } from '../../hooks/useFavorites'
import { useTrailsStore } from '../../stores/trails'
import { useActivityStore } from '../../stores/activity'
import { useFilteredRoutes } from '../../hooks/useFilteredRoutes'
import { useAuthStore } from '../../stores/auth'
import { useViewportStore } from '../../stores/viewport'
import { useGeolocation } from '../../hooks/useGeolocation'
import { haversineKm } from '../../lib/haversine'
import { TrailCard } from '../trails/TrailCard'
import { FilterButton } from '../map/FilterButton'
import { ActiveFilterChips } from '../map/ActiveFilterChips'
import { FilterPanel } from '../map/FilterPanel'

export function FavoritesList() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const dogName = profile?.dog_name ?? 'swojego psa'

  const { favoriteIds, favorites, toggleFavorite } = useFavorites()
  const walkedIds = useActivityStore((s) => s.walkedIds)
  const allRoutes = useTrailsStore((s) => s.routes)

  // Filter panel state (local — same pattern as MapView)
  const [filterOpen, setFilterOpen] = useState(false)
  const [scrollToCategory, setScrollToCategory] = useState<string | null>(null)

  // Filter to only favorited routes
  const favoriteRoutes = useMemo(
    () => allRoutes.filter((r) => favoriteIds.has(r.id)),
    [allRoutes, favoriteIds]
  )

  // Apply user's active filters to favorited routes
  const filteredRoutes = useFilteredRoutes(favoriteRoutes)

  // Distance computation — same origin logic as TrailList
  const { state: geoState } = useGeolocation()
  const viewportCenter = useViewportStore((s) => s.center)
  const viewportLat = viewportCenter[1]
  const viewportLon = viewportCenter[0]

  const originLat =
    geoState.status === 'success' ? geoState.position.coords.latitude : viewportLat
  const originLon =
    geoState.status === 'success' ? geoState.position.coords.longitude : viewportLon

  // Sort by distance
  const sortedRoutes = useMemo(() => {
    return [...filteredRoutes]
      .map((route) => ({
        route,
        distanceKm: haversineKm(originLat, originLon, route.center_lat, route.center_lon),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRoutes, originLat, originLon])

  return (
    <div className="flex flex-col h-full">
      {/* Filter controls bar */}
      <div className="shrink-0 px-4 pt-3 pb-2 flex items-center gap-2">
        <FilterButton onPress={() => setFilterOpen(true)} />
        <ActiveFilterChips onChipTap={(category) => { setScrollToCategory(category); setFilterOpen(true) }} />
      </div>

      {/* Trail list or empty state */}
      {favoriteRoutes.length === 0 ? (
        /* Empty favorites state */
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <Heart size={48} className="text-text-muted" />
          <h2 className="text-lg font-semibold text-text-primary">Brak ulubionych tras</h2>
          <p className="text-sm text-text-secondary">
            Nie masz jeszcze ulubionych tras. Znajdź coś dla {dogName}!
          </p>
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="mt-2 px-6 py-3 rounded-full bg-accent text-bg-base font-semibold text-sm min-h-[48px] active:bg-accent/80 transition-colors"
          >
            Przeglądaj trasy
          </button>
        </div>
      ) : filteredRoutes.length === 0 ? (
        /* Favorites exist but filters yield 0 results */
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <h2 className="text-base font-semibold text-text-primary">
            Brak tras pasujących do filtrów
          </h2>
          <p className="text-sm text-text-secondary">
            Spróbuj zmienić lub wyczyść filtry.
          </p>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="mt-2 px-6 py-3 rounded-full bg-bg-elevated text-text-primary text-sm font-medium min-h-[48px] active:bg-bg-surface transition-colors"
          >
            Zmień filtry
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-bg-elevated">
          {sortedRoutes.map(({ route, distanceKm }) => {
            const notePreview = favorites.find((f) => f.route_id === route.id)?.note
            return (
              <div key={route.id}>
                <TrailCard
                  route={route}
                  distanceKm={distanceKm}
                  onClick={() => navigate(`/app/trails/${route.id}`)}
                  isFavorited={true}
                  isWalked={walkedIds.has(route.id)}
                  onFavoriteToggle={() => toggleFavorite(route.id)}
                />
                {notePreview && (
                  <p className="text-xs text-text-muted px-4 pb-1 truncate">{notePreview}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Filter panel */}
      <FilterPanel
        isOpen={filterOpen}
        onClose={() => { setFilterOpen(false); setScrollToCategory(null) }}
        scrollToCategory={scrollToCategory}
      />
    </div>
  )
}
