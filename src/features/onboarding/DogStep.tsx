import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'

interface DogStepProps {
  onNext: () => void
}

export function DogStep({ onNext }: DogStepProps) {
  const [dogName, setDogName] = useState('')
  const [breed, setBreed] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { session, profile, setProfile } = useAuthStore()

  async function handleSubmit() {
    if (!dogName.trim()) {
      setError('Imię psa jest wymagane')
      return
    }

    if (!session) return

    setSaving(true)
    setError(null)

    const { error: dbError } = await supabase
      .from('users')
      .update({ dog_name: dogName.trim() })
      .eq('id', session.user.id)

    setSaving(false)

    if (dbError) {
      setError('Nie udało się zapisać. Spróbuj ponownie.')
      return
    }

    // Optimistic local update — prevents onboarding redirect loop on re-render
    if (profile) {
      setProfile({ ...profile, dog_name: dogName.trim() })
    }

    onNext()
  }

  return (
    <div className="flex flex-col px-6 pt-8 pb-10 min-h-[80vh]">
      <h2 className="text-2xl font-bold text-text-primary mb-2">
        Jak ma na imię Twój pies?
      </h2>
      <p className="text-text-secondary mb-8">
        Spersonalizujemy trasy dla Waszej pary.
      </p>

      <div className="flex flex-col gap-4 flex-1">
        <div>
          <input
            type="text"
            value={dogName}
            onChange={(e) => {
              setDogName(e.target.value)
              if (error) setError(null)
            }}
            placeholder="np. Burek"
            autoFocus
            className="w-full bg-bg-surface border border-bg-elevated rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none min-h-[48px] transition-colors"
          />
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </div>

        <input
          type="text"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          placeholder="Rasa (opcjonalnie)"
          className="w-full bg-bg-surface border border-bg-elevated rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none min-h-[48px] transition-colors"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-accent text-bg-base font-semibold rounded-lg py-3 min-h-[48px] hover:bg-accent/90 transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-8"
      >
        {saving ? 'Zapisuję...' : 'Dalej'}
      </button>
    </div>
  )
}
