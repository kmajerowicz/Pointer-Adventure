import { useEffect, useRef, useState } from 'react'
import { useFiltersStore } from '../../stores/filters'
import { useGeolocation } from '../../hooks/useGeolocation'
import {
  LENGTH_OPTIONS,
  SURFACE_LABELS,
  WATER_OPTIONS,
  DIFFICULTY_LABELS,
  DISTANCE_OPTIONS,
} from './filterLabels'
import type { SurfaceType, Difficulty } from '../../lib/types'

type LengthFilter = 'short' | 'medium' | 'long' | null
type WaterFilter = 'required' | 'preferred' | 'any'
type DistanceFilter = 10 | 30 | 50 | null
type MarkedFilter = boolean | null

interface DraftState {
  length: LengthFilter
  surface: SurfaceType | null
  water: WaterFilter
  difficulty: Difficulty | null
  distance: DistanceFilter
  marked: MarkedFilter
}

const DEFAULT_DRAFT: DraftState = {
  length: null,
  surface: null,
  water: 'any',
  difficulty: null,
  distance: null,
  marked: null,
}

// ── Internal PillGroup ──────────────────────────────────────────────────────

interface PillOption<T> {
  label: string
  value: T
}

interface PillGroupProps<T> {
  options: PillOption<T>[]
  selected: T | null
  onSelect: (value: T | null) => void
}

function PillGroup<T extends string | number>({
  options,
  selected,
  onSelect,
}: PillGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected === opt.value
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onSelect(isSelected ? null : opt.value)}
            className={[
              'px-4 py-2 rounded-full text-sm min-h-[2.75rem] border transition-colors',
              isSelected
                ? 'bg-accent text-bg-base border-accent font-medium'
                : 'bg-transparent text-text-secondary border-bg-elevated hover:border-accent/50',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Internal ToggleSwitch ───────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        'relative w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface',
        checked ? 'bg-accent' : 'bg-bg-elevated',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
  )
}

// ── FilterSection ───────────────────────────────────────────────────────────

interface FilterSectionProps {
  title: string
  sectionRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}

function FilterSection({ title, sectionRef, children }: FilterSectionProps) {
  return (
    <div ref={sectionRef} className="py-4">
      <h3 className="text-text-primary font-semibold text-sm mb-3">{title}</h3>
      {children}
    </div>
  )
}

// ── FilterPanel ─────────────────────────────────────────────────────────────

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  scrollToCategory?: string | null
}

export function FilterPanel({ isOpen, onClose, scrollToCategory }: FilterPanelProps) {
  const store = useFiltersStore()
  const { state: geoState } = useGeolocation()
  const gpsAvailable = geoState.status === 'success'

  // Draft state — local copy, committed to store only on "Zastosuj"
  const [draft, setDraft] = useState<DraftState>(DEFAULT_DRAFT)
  // Closing animation
  const [isClosing, setIsClosing] = useState(false)

  // Section refs for scroll-to-category
  const lengthRef = useRef<HTMLDivElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const waterRef = useRef<HTMLDivElement>(null)
  const difficultyRef = useRef<HTMLDivElement>(null)
  const distanceRef = useRef<HTMLDivElement>(null)
  const markedRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    length: lengthRef,
    surface: surfaceRef,
    water: waterRef,
    difficulty: difficultyRef,
    distance: distanceRef,
    marked: markedRef,
  }

  // Re-initialize draft from store whenever sheet opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      setDraft({
        length: store.length,
        surface: store.surface,
        water: store.water,
        difficulty: store.difficulty,
        distance: store.distance,
        marked: store.marked,
      })
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to category when scrollToCategory prop changes
  useEffect(() => {
    if (!isOpen || !scrollToCategory) return
    const ref = sectionRefs[scrollToCategory]
    if (ref?.current && scrollAreaRef.current) {
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [scrollToCategory, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen && !isClosing) return null

  function handleClose() {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  function handleApply() {
    store.setLength(draft.length)
    store.setSurface(draft.surface)
    store.setWater(draft.water)
    store.setDifficulty(draft.difficulty)
    store.setDistance(draft.distance)
    store.setMarked(draft.marked)
    onClose()
  }

  function handleResetDraft() {
    setDraft({ ...DEFAULT_DRAFT })
  }

  // Surface options from SURFACE_LABELS (exclude 'unknown' for usability)
  const surfaceOptions = (
    Object.entries(SURFACE_LABELS) as [SurfaceType, string][]
  )
    .filter(([key]) => key !== 'unknown')
    .map(([value, label]) => ({ label, value }))

  // Difficulty options from DIFFICULTY_LABELS (exclude 'unknown' for usability)
  const difficultyOptions = (
    Object.entries(DIFFICULTY_LABELS) as [Difficulty, string][]
  )
    .filter(([key]) => key !== 'unknown')
    .map(([value, label]) => ({ label, value }))

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-50 bg-bg-surface rounded-t-2xl max-h-[85vh] flex flex-col',
          isClosing
            ? 'animate-[sheet-down_200ms_ease-in_forwards]'
            : 'animate-[sheet-up_300ms_ease-out]',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Filtry tras"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-bg-elevated" />
        </div>

        {/* Header with reset link */}
        <div className="flex items-center justify-between px-5 py-2 shrink-0">
          <h2 className="text-text-primary font-bold text-base">Filtry</h2>
          <button
            type="button"
            onClick={handleResetDraft}
            className="text-accent text-sm font-medium hover:underline"
          >
            Wyczyść wszystko
          </button>
        </div>

        {/* Scrollable filter sections */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-5 pb-2">
          {/* Divider */}
          <div className="h-px bg-bg-elevated mb-2" />

          {/* 1. Długości */}
          <FilterSection title="Długości" sectionRef={lengthRef}>
            <PillGroup
              options={LENGTH_OPTIONS}
              selected={draft.length}
              onSelect={(v) => setDraft((d) => ({ ...d, length: v }))}
            />
          </FilterSection>
          <div className="h-px bg-bg-elevated" />

          {/* 2. Nawierzchnia */}
          <FilterSection title="Nawierzchnia" sectionRef={surfaceRef}>
            <PillGroup
              options={surfaceOptions}
              selected={draft.surface}
              onSelect={(v) => setDraft((d) => ({ ...d, surface: v }))}
            />
          </FilterSection>
          <div className="h-px bg-bg-elevated" />

          {/* 3. Dostęp do wody */}
          <FilterSection title="Dostęp do wody" sectionRef={waterRef}>
            <div className="flex flex-wrap gap-2">
              {WATER_OPTIONS.map((opt) => {
                const isSelected = draft.water === opt.value
                return (
                  <div key={opt.value} className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          water: isSelected ? 'any' : opt.value,
                        }))
                      }
                      className={[
                        'px-4 py-2 rounded-full text-sm min-h-[2.75rem] border transition-colors',
                        isSelected
                          ? 'bg-accent text-bg-base border-accent font-medium'
                          : 'bg-transparent text-text-secondary border-bg-elevated hover:border-accent/50',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                    {opt.value === 'preferred' && (
                      <span className="text-text-muted text-[0.65rem] px-1">
                        Trasy z wodą wyżej
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </FilterSection>
          <div className="h-px bg-bg-elevated" />

          {/* 4. Trudność */}
          <FilterSection title="Trudność" sectionRef={difficultyRef}>
            <PillGroup
              options={difficultyOptions}
              selected={draft.difficulty}
              onSelect={(v) => setDraft((d) => ({ ...d, difficulty: v }))}
            />
          </FilterSection>
          <div className="h-px bg-bg-elevated" />

          {/* 5. Odległość */}
          <FilterSection title="Odległość" sectionRef={distanceRef}>
            {!gpsAvailable && (
              <p className="text-text-muted text-xs mb-2">
                Wymaga lokalizacji
              </p>
            )}
            <PillGroup
              options={DISTANCE_OPTIONS}
              selected={draft.distance}
              onSelect={(v) => setDraft((d) => ({ ...d, distance: v }))}
            />
          </FilterSection>
          <div className="h-px bg-bg-elevated" />

          {/* 6. Szlak oznaczony */}
          <FilterSection title="Szlak oznaczony" sectionRef={markedRef}>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-sm">
                Pokazuj tylko oznaczone szlaki
              </span>
              <ToggleSwitch
                checked={draft.marked === true}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, marked: v ? true : null }))
                }
                label="Szlak oznaczony"
              />
            </div>
          </FilterSection>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 px-5 py-4 border-t border-bg-elevated">
          <button
            type="button"
            onClick={handleApply}
            className="w-full h-12 rounded-xl bg-accent text-bg-base font-semibold text-base active:scale-[0.98] transition-transform"
          >
            Zastosuj
          </button>
        </div>
      </div>
    </>
  )
}
