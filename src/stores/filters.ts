import { create } from 'zustand'
import type { SurfaceType, Difficulty } from '../lib/types'

type LengthFilter = 'short' | 'medium' | 'long' | null
type WaterFilter = 'required' | 'preferred' | 'any'
type DistanceFilter = 10 | 30 | 50 | null
type MarkedFilter = boolean | null

interface FiltersState {
  length: LengthFilter
  surface: SurfaceType | null
  water: WaterFilter
  difficulty: Difficulty | null
  distance: DistanceFilter
  marked: MarkedFilter
  setLength: (v: LengthFilter) => void
  setSurface: (v: SurfaceType | null) => void
  setWater: (v: WaterFilter) => void
  setDifficulty: (v: Difficulty | null) => void
  setDistance: (v: DistanceFilter) => void
  setMarked: (v: MarkedFilter) => void
  resetAll: () => void
}

const defaults = {
  length: null as LengthFilter,
  surface: null as SurfaceType | null,
  water: 'any' as WaterFilter,
  difficulty: null as Difficulty | null,
  distance: null as DistanceFilter,
  marked: null as MarkedFilter,
}

export const useFiltersStore = create<FiltersState>((set) => ({
  ...defaults,
  setLength: (length) => set({ length }),
  setSurface: (surface) => set({ surface }),
  setWater: (water) => set({ water }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setDistance: (distance) => set({ distance }),
  setMarked: (marked) => set({ marked }),
  resetAll: () => set(defaults),
}))
