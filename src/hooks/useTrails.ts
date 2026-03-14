import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useViewportStore } from '../stores/viewport'
import { useTrailsStore } from '../stores/trails'
import { useAuthStore } from '../stores/auth'

export function useTrails() {
  const bounds = useViewportStore((s) => s.bounds)
  const session = useAuthStore((s) => s.session)
  const boundsRef = useRef(bounds)

  const appendRoutes = useTrailsStore((s) => s.appendRoutes)
  const setRoutes = useTrailsStore((s) => s.setRoutes)
  const setLoading = useTrailsStore((s) => s.setLoading)
  const setError = useTrailsStore((s) => s.setError)
  const setRetry = useTrailsStore((s) => s.setRetry)
  const setLastFetched = useTrailsStore((s) => s.setLastFetched)

  // Keep boundsRef in sync with latest bounds (avoid stale closure in debounce)
  boundsRef.current = bounds

  const fetchTrails = useCallback(
    async (b: NonNullable<typeof bounds>, replace = false) => {
      setLoading(true)
      setError(null)
      setRetry(null)

      const timeoutMs = 15_000
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      })

      try {
        const { data, error } = await Promise.race([
          supabase.functions.invoke('search-trails', {
            body: { north: b.north, south: b.south, east: b.east, west: b.west },
          }),
          timeoutPromise,
        ])
        if (error) throw error
        const routes = data?.routes ?? []
        if (replace) {
          setRoutes(routes)
        } else {
          appendRoutes(routes)
        }
        setLastFetched(new Date().toISOString())
      } catch {
        setError('Nie udało się pobrać tras')
        const currentBounds = boundsRef.current
        const retryFn = () => {
          if (currentBounds) {
            void fetchTrails(currentBounds, false)
          }
        }
        setRetry(retryFn)
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appendRoutes, setRoutes, setLoading, setError, setRetry, setLastFetched],
  )

  useEffect(() => {
    if (!bounds || !session) return

    const timer = setTimeout(() => {
      const latestBounds = boundsRef.current
      if (latestBounds) {
        void fetchTrails(latestBounds, false)
      }
    }, 400)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds, session])

  const forceRefresh = useCallback(() => {
    const latestBounds = boundsRef.current
    if (!latestBounds) return
    void fetchTrails(latestBounds, true)
  }, [fetchTrails])

  const loading = useTrailsStore((s) => s.loading)
  const error = useTrailsStore((s) => s.error)
  const retry = useTrailsStore((s) => s.retry)

  return { loading, error, retry, forceRefresh }
}
