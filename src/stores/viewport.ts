import { create } from 'zustand'

const STORAGE_KEY = 'psi_szlak_viewport'
const DEFAULT_CENTER: [number, number] = [19.145, 51.919]
const DEFAULT_ZOOM = 6

function loadSaved(): { center: [number, number]; zoom: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { center?: [number, number]; zoom?: number }
      if (Array.isArray(parsed.center) && typeof parsed.zoom === 'number') {
        return { center: parsed.center as [number, number], zoom: parsed.zoom }
      }
    }
  } catch { /* ignore */ }
  return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null
function persistDebounced(center: [number, number], zoom: number) {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ center, zoom }))
    } catch { /* quota exceeded — ignore */ }
  }, 500)
}

interface ViewportState {
  center: [number, number] // [lng, lat]
  zoom: number
  bounds: {
    north: number
    south: number
    east: number
    west: number
  } | null
  requestedZoom: number | null
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setBounds: (bounds: ViewportState['bounds']) => void
  requestZoomOut: (zoom: number) => void
  clearRequestedZoom: () => void
}

const saved = loadSaved()

export const useViewportStore = create<ViewportState>((set, get) => ({
  center: saved.center,
  zoom: saved.zoom,
  bounds: null,
  requestedZoom: null,
  setCenter: (center) => {
    set({ center })
    persistDebounced(center, get().zoom)
  },
  setZoom: (zoom) => {
    set({ zoom })
    persistDebounced(get().center, zoom)
  },
  setBounds: (bounds) => set({ bounds }),
  requestZoomOut: (zoom) => set({ requestedZoom: zoom }),
  clearRequestedZoom: () => set({ requestedZoom: null }),
}))
