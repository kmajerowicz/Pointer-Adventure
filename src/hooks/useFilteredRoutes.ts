import { useMemo } from 'react'
import { useTrailsStore } from '../stores/trails'
import { useFiltersStore } from '../stores/filters'
import { useGeolocation } from './useGeolocation'
import { haversineKm } from '../lib/haversine'
import type { Route } from '../lib/types'

/**
 * Derives a filtered + sorted array of routes from the raw trails store and filter state.
 * All filtering is client-side — no Edge Function is called when filters change.
 *
 * Filter chain order: length → surface → difficulty → water(required) → marked → distance
 * Water 'preferred' sort applied after all filters (never mutates original array).
 */
export function useFilteredRoutes(): Route[] {
  const routes = useTrailsStore((s) => s.routes)
  const { length, surface, water, difficulty, distance, marked } = useFiltersStore((s) => s)
  const { state: geoState } = useGeolocation()

  const userLat = geoState.status === 'success' ? geoState.position.coords.latitude : null
  const userLon = geoState.status === 'success' ? geoState.position.coords.longitude : null

  return useMemo(() => {
    let result = routes

    // 1. Length filter
    if (length !== null) {
      result = result.filter((r) => {
        if (r.length_km === null) return true  // unknown length always included
        if (length === 'short') return r.length_km < 5
        if (length === 'medium') return r.length_km >= 5 && r.length_km <= 15
        if (length === 'long') return r.length_km > 15
        return true
      })
    }

    // 2. Surface filter
    if (surface !== null) {
      result = result.filter((r) => r.surface_type === surface)
    }

    // 3. Difficulty filter
    if (difficulty !== null) {
      result = result.filter((r) => r.difficulty === difficulty)
    }

    // 4. Water filter — required excludes none
    if (water === 'required') {
      result = result.filter((r) => r.water_access !== 'none')
    }

    // 5. Marked filter
    if (marked === true) {
      result = result.filter((r) => r.is_marked === true)
    }

    // 6. Distance filter — skip if GPS unavailable
    if (distance !== null && userLat !== null && userLon !== null) {
      result = result.filter((r) => {
        const dist = haversineKm(userLat, userLon, r.center_lat, r.center_lon)
        return dist <= distance
      })
    }

    // 7. Water 'preferred' sort — water routes to top, never mutate
    if (water === 'preferred') {
      result = [...result].sort((a, b) => {
        const aHasWater = a.water_access !== 'none' ? 0 : 1
        const bHasWater = b.water_access !== 'none' ? 0 : 1
        return aHasWater - bHasWater
      })
    }

    return result
  }, [routes, length, surface, water, difficulty, distance, marked, userLat, userLon])
}
