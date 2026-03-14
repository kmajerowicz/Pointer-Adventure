import type { SurfaceType, Difficulty } from '../../lib/types'

/** Polish surface type labels for filter UI */
export const SURFACE_LABELS: Record<SurfaceType, string> = {
  dirt: 'Ziemia',
  gravel: 'Żwir',
  asphalt: 'Asfalt',
  mixed: 'Mieszana',
  unknown: 'Nieznana',
}

/** Polish difficulty labels for filter UI */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Łatwa',
  moderate: 'Średnia',
  hard: 'Trudna',
  unknown: 'Nieznana',
}

/** Length filter options (pill group) */
export const LENGTH_OPTIONS = [
  { label: '< 5 km', value: 'short' as const },
  { label: '5–15 km', value: 'medium' as const },
  { label: '> 15 km', value: 'long' as const },
] satisfies { label: string; value: 'short' | 'medium' | 'long' }[]

/** Distance filter options (pill group) */
export const DISTANCE_OPTIONS = [
  { label: '< 10 km', value: 10 as const },
  { label: '< 30 km', value: 30 as const },
  { label: '< 50 km', value: 50 as const },
] satisfies { label: string; value: 10 | 30 | 50 }[]

/** Water access filter options (pill group) */
export const WATER_OPTIONS = [
  { label: 'Wymagana', value: 'required' as const },
  { label: 'Mile widziana', value: 'preferred' as const },
  { label: 'Obojętne', value: 'any' as const },
] satisfies { label: string; value: 'required' | 'preferred' | 'any' }[]
