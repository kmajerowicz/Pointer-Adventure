import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrailsStore } from '../../stores/trails'
import { useViewportStore } from '../../stores/viewport'
import { useGeolocation } from '../../hooks/useGeolocation'
import { haversineKm } from '../../lib/haversine'
import { TrailCard } from './TrailCard'
import { EmptyTrailState } from './EmptyTrailState'

export function TrailList() {
  const navigate = useNavigate()
  const routes = useTrailsStore((s) => s.routes)

  // Geolocation — best origin when available
  const { state: geoState } = useGeolocation()

  // Viewport center as fallback origin (center is [lng, lat] — swap for haversine)
  const viewportCenter = useViewportStore((s) => s.center)
  const viewportLat = viewportCenter[1]
  const viewportLon = viewportCenter[0]

  // Determine origin: prefer GPS position, fall back to viewport center
  const originLat =
    geoState.status === 'success'
      ? geoState.position.coords.latitude
      : viewportLat

  const originLon =
    geoState.status === 'success'
      ? geoState.position.coords.longitude
      : viewportLon

  // Sort routes by nearest-first; use primitive deps to avoid re-sort on array ref changes
  const sortedRoutes = useMemo(() => {
    return [...routes]
      .map((route) => ({
        route,
        distanceKm: haversineKm(originLat, originLon, route.center_lat, route.center_lon),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes, originLat, originLon])

  if (routes.length === 0) {
    return <EmptyTrailState />
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-bg-elevated">
      {sortedRoutes.map(({ route, distanceKm }) => (
        <TrailCard
          key={route.id}
          route={route}
          distanceKm={distanceKm}
          onClick={() => navigate(`/trails/${route.id}`)}
        />
      ))}
    </div>
  )
}
