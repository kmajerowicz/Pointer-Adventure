import { X } from 'lucide-react'
import { useFiltersStore } from '../../stores/filters'
import {
  LENGTH_OPTIONS,
  SURFACE_LABELS,
  WATER_OPTIONS,
  DIFFICULTY_LABELS,
  DISTANCE_OPTIONS,
} from './filterLabels'

interface Chip {
  key: string
  label: string
  category: string
  remove: () => void
}

interface ActiveFilterChipsProps {
  onChipTap: (category: string) => void
}

export function ActiveFilterChips({ onChipTap }: ActiveFilterChipsProps) {
  const store = useFiltersStore()
  const chips: Chip[] = []

  if (store.length !== null) {
    const opt = LENGTH_OPTIONS.find((o) => o.value === store.length)
    chips.push({
      key: 'length',
      label: opt?.label ?? store.length,
      category: 'length',
      remove: () => store.setLength(null),
    })
  }

  if (store.surface !== null) {
    chips.push({
      key: 'surface',
      label: SURFACE_LABELS[store.surface],
      category: 'surface',
      remove: () => store.setSurface(null),
    })
  }

  if (store.water !== 'any') {
    const opt = WATER_OPTIONS.find((o) => o.value === store.water)
    chips.push({
      key: 'water',
      label: opt?.label ?? store.water,
      category: 'water',
      remove: () => store.setWater('any'),
    })
  }

  if (store.difficulty !== null) {
    chips.push({
      key: 'difficulty',
      label: DIFFICULTY_LABELS[store.difficulty],
      category: 'difficulty',
      remove: () => store.setDifficulty(null),
    })
  }

  if (store.distance !== null) {
    const opt = DISTANCE_OPTIONS.find((o) => o.value === store.distance)
    chips.push({
      key: 'distance',
      label: opt?.label ?? `${store.distance} km`,
      category: 'distance',
      remove: () => store.setDistance(null),
    })
  }

  if (store.marked !== null) {
    chips.push({
      key: 'marked',
      label: 'Oznaczony',
      category: 'marked',
      remove: () => store.setMarked(null),
    })
  }

  if (chips.length === 0) return null

  return (
    <div
      className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      aria-label="Aktywne filtry"
    >
      {chips.map((chip) => (
        <div
          key={chip.key}
          className="shrink-0 flex items-center bg-bg-elevated border border-bg-elevated rounded-full pl-3 pr-2 py-1.5 text-xs text-text-primary gap-1.5"
        >
          {/* Chip label — tapping opens filter panel at that category */}
          <button
            type="button"
            onClick={() => onChipTap(chip.category)}
            className="leading-none hover:text-accent transition-colors"
          >
            {chip.label}
          </button>
          {/* X remove button */}
          <button
            type="button"
            onClick={chip.remove}
            aria-label={`Usuń filtr ${chip.label}`}
            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-bg-base transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
