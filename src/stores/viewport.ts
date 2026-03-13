import { create } from 'zustand'

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

export const useViewportStore = create<ViewportState>((set) => ({
  center: [19.145, 51.919], // Poland center
  zoom: 6,
  bounds: null,
  requestedZoom: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setBounds: (bounds) => set({ bounds }),
  requestZoomOut: (zoom) => set({ requestedZoom: zoom }),
  clearRequestedZoom: () => set({ requestedZoom: null }),
}))
