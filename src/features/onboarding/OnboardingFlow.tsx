import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth'
import { useUIStore } from '../../stores/ui'
import { WelcomeStep } from './WelcomeStep'
import { DogStep } from './DogStep'
import { PreferencesStep } from './PreferencesStep'
import { GeolocationStep } from './GeolocationStep'

const STEP_KEY = 'psi_szlak_onboarding_step'

function getInitialStep(hasDogName: boolean): number {
  try {
    const saved = sessionStorage.getItem(STEP_KEY)
    if (saved) {
      const n = Number(saved)
      if (n >= 1 && n <= 4) return n
    }
  } catch { /* ignore */ }
  // Skip DogStep if dog_name is already saved (partial completion)
  if (hasDogName) return 3
  return 1
}

export function OnboardingFlow() {
  const profile = useAuthStore((s) => s.profile)
  const [step, setStep] = useState(() => getInitialStep(Boolean(profile?.dog_name)))
  const navigate = useNavigate()
  const setShowFilterTooltip = useUIStore((s) => s.setShowFilterTooltip)

  const totalSteps = 4

  function goToStep(n: number) {
    setStep(n)
    try { sessionStorage.setItem(STEP_KEY, String(n)) } catch { /* ignore */ }
  }

  function handleComplete() {
    try { sessionStorage.removeItem(STEP_KEY) } catch { /* ignore */ }
    setShowFilterTooltip(true)
    navigate('/app')
  }

  return (
    <div className="fixed inset-0 bg-bg-base flex flex-col">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-12 pb-4 shrink-0">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={[
              'w-2 h-2 rounded-full transition-colors duration-300',
              i + 1 === step ? 'bg-accent' : i + 1 < step ? 'bg-accent/50' : 'bg-bg-elevated',
            ].join(' ')}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {step === 1 && (
          <WelcomeStep
            name={profile?.display_name ?? null}
            onNext={() => goToStep(2)}
          />
        )}
        {step === 2 && (
          <DogStep onNext={() => goToStep(3)} />
        )}
        {step === 3 && (
          <PreferencesStep
            onNext={() => goToStep(4)}
            onSkip={() => goToStep(4)}
          />
        )}
        {step === 4 && (
          <GeolocationStep
            onNext={handleComplete}
            onSkip={handleComplete}
          />
        )}
      </div>
    </div>
  )
}
