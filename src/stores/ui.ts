import { create } from 'zustand'

type ViewMode = 'map' | 'list'

interface UIState {
  viewMode: ViewMode
  isFilterOpen: boolean
  showFilterTooltip: boolean
  showAuthGate: boolean
  setViewMode: (mode: ViewMode) => void
  toggleFilter: () => void
  setFilterOpen: (open: boolean) => void
  setShowFilterTooltip: (show: boolean) => void
  setShowAuthGate: (show: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'map',
  isFilterOpen: false,
  showFilterTooltip: false,
  showAuthGate: false,
  setViewMode: (viewMode) => set({ viewMode }),
  toggleFilter: () => set((s) => ({ isFilterOpen: !s.isFilterOpen })),
  setFilterOpen: (isFilterOpen) => set({ isFilterOpen }),
  setShowFilterTooltip: (showFilterTooltip) => set({ showFilterTooltip }),
  setShowAuthGate: (showAuthGate) => set({ showAuthGate }),
}))
