import { create } from 'zustand'
import type { Route } from '../lib/types'

interface TrailsState {
  routes: Route[]
  loading: boolean
  error: string | null
  lastFetched: string | null
  retry: (() => void) | null
  setRoutes: (routes: Route[]) => void
  appendRoutes: (routes: Route[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setLastFetched: (ts: string | null) => void
  setRetry: (fn: (() => void) | null) => void
}

export const useTrailsStore = create<TrailsState>((set) => ({
  routes: [],
  loading: false,
  error: null,
  lastFetched: null,
  retry: null,
  setRoutes: (routes) => set({ routes }),
  appendRoutes: (newRoutes) =>
    set((state) => {
      const existingIds = new Set(state.routes.map((r) => r.id || r.source_id))
      const deduped = newRoutes.filter((r) => !existingIds.has(r.id || r.source_id))
      return { routes: [...state.routes, ...deduped] }
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setLastFetched: (lastFetched) => set({ lastFetched }),
  setRetry: (retry) => set({ retry }),
}))
