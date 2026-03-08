import { create } from 'zustand'

type ViewMode = 'map' | 'list'

interface UIState {
  viewMode: ViewMode
  isFilterOpen: boolean
  setViewMode: (mode: ViewMode) => void
  toggleFilter: () => void
  setFilterOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'map',
  isFilterOpen: false,
  setViewMode: (viewMode) => set({ viewMode }),
  toggleFilter: () => set((s) => ({ isFilterOpen: !s.isFilterOpen })),
  setFilterOpen: (isFilterOpen) => set({ isFilterOpen }),
}))
