import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth'
import { useUIStore } from '../../stores/ui'
import { WelcomeStep } from './WelcomeStep'
import { DogStep } from './DogStep'
import { PreferencesStep } from './PreferencesStep'
import { GeolocationStep } from './GeolocationStep'

export function OnboardingFlow() {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const setShowFilterTooltip = useUIStore((s) => s.setShowFilterTooltip)

  const totalSteps = 4

  function handleComplete() {
    setShowFilterTooltip(true)
    navigate('/')
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
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <DogStep onNext={() => setStep(3)} />
        )}
        {step === 3 && (
          <PreferencesStep
            onNext={() => setStep(4)}
            onSkip={() => setStep(4)}
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
