import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'
import { useFiltersStore } from '../../stores/filters'
import type { SurfaceType } from '../../lib/types'

type LengthPref = 'short' | 'medium' | 'long' | null
type WaterPref = 'required' | 'any'

interface PreferencesStepProps {
  onNext: () => void
  onSkip: () => void
}

const lengthOptions: { label: string; value: LengthPref }[] = [
  { label: '< 5 km', value: 'short' },
  { label: '5–15 km', value: 'medium' },
  { label: '> 15 km', value: 'long' },
]

const waterOptions: { label: string; value: WaterPref }[] = [
  { label: 'Ważny', value: 'required' },
  { label: 'Obojętny', value: 'any' },
]

const surfaceOptions: { label: string; value: SurfaceType | null }[] = [
  { label: 'Ziemia', value: 'dirt' },
  { label: 'Żwir', value: 'gravel' },
  { label: 'Asfalt', value: 'asphalt' },
  { label: 'Mieszana', value: 'mixed' },
  { label: 'Obojętne', value: null },
]

function PillSelector<T>({
  options,
  selected,
  onSelect,
}: {
  options: { label: string; value: T }[]
  selected: T
  onSelect: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onSelect(opt.value)}
          className={[
            'px-4 py-2 rounded-full min-h-[48px] text-sm font-medium transition-colors border',
            selected === opt.value
              ? 'bg-accent text-bg-base border-accent'
              : 'bg-bg-surface text-text-secondary border-bg-elevated hover:border-accent/50',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function PreferencesStep({ onNext, onSkip }: PreferencesStepProps) {
  const [length, setLength] = useState<LengthPref>(null)
  const [water, setWater] = useState<WaterPref>('any')
  const [surface, setSurface] = useState<SurfaceType | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { session } = useAuthStore()
  const { setLength: setFilterLength, setWater: setFilterWater, setSurface: setFilterSurface } = useFiltersStore()

  async function handleNext() {
    setSaving(true)
    setSaveError(null)

    if (session) {
      const { error } = await supabase
        .from('users')
        .update({ walk_preferences: { length, water, surface } })
        .eq('id', session.user.id)

      if (error) {
        setSaving(false)
        setSaveError('Nie udało się zapisać preferencji. Spróbuj ponownie.')
        return
      }

      // Apply as default filters
      if (length) setFilterLength(length)
      setFilterWater(water)
      if (surface) setFilterSurface(surface)
    }

    setSaving(false)
    onNext()
  }

  return (
    <div className="flex flex-col px-6 pt-8 pb-10 min-h-[80vh]">
      <h2 className="text-2xl font-bold text-text-primary mb-2">
        Jakie trasy lubisz?
      </h2>
      <p className="text-text-secondary mb-8">
        Dobierzemy propozycje do Waszych preferencji.
      </p>

      <div className="flex flex-col gap-7 flex-1">
        <div>
          <p className="text-text-primary font-medium mb-3">Długość</p>
          <PillSelector
            options={lengthOptions}
            selected={length}
            onSelect={setLength}
          />
        </div>

        <div>
          <p className="text-text-primary font-medium mb-3">Dostęp do wody</p>
          <PillSelector
            options={waterOptions}
            selected={water}
            onSelect={setWater}
          />
        </div>

        <div>
          <p className="text-text-primary font-medium mb-3">Nawierzchnia</p>
          <PillSelector
            options={surfaceOptions}
            selected={surface}
            onSelect={setSurface}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {saveError && (
          <p className="text-error text-sm text-center">{saveError}</p>
        )}
        <button
          onClick={handleNext}
          disabled={saving}
          className="w-full bg-accent text-bg-base font-semibold rounded-lg py-3 min-h-[48px] hover:bg-accent/90 transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Zapisuję...' : 'Dalej'}
        </button>
        <button
          onClick={onSkip}
          className="text-text-muted text-sm py-2 hover:text-text-secondary transition-colors"
        >
          Pomiń
        </button>
      </div>
    </div>
  )
}
