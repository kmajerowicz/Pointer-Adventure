import { create } from 'zustand'

type ViewMode = 'map' | 'list'

export interface ToastMessage {
  id: number
  message: string
}

interface UIState {
  viewMode: ViewMode
  isFilterOpen: boolean
  showFilterTooltip: boolean
  showAuthGate: boolean
  toast: ToastMessage | null
  setViewMode: (mode: ViewMode) => void
  toggleFilter: () => void
  setFilterOpen: (open: boolean) => void
  setShowFilterTooltip: (show: boolean) => void
  setShowAuthGate: (show: boolean) => void
  showToast: (message: string) => void
  clearToast: () => void
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'map',
  isFilterOpen: false,
  showFilterTooltip: false,
  showAuthGate: false,
  toast: null,
  setViewMode: (viewMode) => set({ viewMode }),
  toggleFilter: () => set((s) => ({ isFilterOpen: !s.isFilterOpen })),
  setFilterOpen: (isFilterOpen) => set({ isFilterOpen }),
  setShowFilterTooltip: (showFilterTooltip) => set({ showFilterTooltip }),
  setShowAuthGate: (showAuthGate) => set({ showAuthGate }),
  showToast: (message) => set({ toast: { id: Date.now(), message } }),
  clearToast: () => set({ toast: null }),
}))
