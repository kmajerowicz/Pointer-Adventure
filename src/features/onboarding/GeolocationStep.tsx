import { MapPin } from 'lucide-react'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useViewportStore } from '../../stores/viewport'

interface GeolocationStepProps {
  onNext: () => void
  onSkip: () => void
}

export function GeolocationStep({ onNext, onSkip }: GeolocationStepProps) {
  const { state, locate } = useGeolocation()
  const setCenter = useViewportStore((s) => s.setCenter)

  function handleLocate() {
    locate()
  }

  // When geolocation succeeds, center map and proceed
  if (state.status === 'success') {
    const { latitude, longitude } = state.position.coords
    setCenter([longitude, latitude])
    onNext()
    return null
  }

  const isLoading = state.status === 'loading'
  const isDenied = state.status === 'error'

  return (
    <div className="flex flex-col items-center px-6 pt-8 pb-10 min-h-[80vh]">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-bg-surface flex items-center justify-center mb-6">
          <MapPin className="w-10 h-10 text-accent" />
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-3">
          Gdzie jesteście?
        </h2>
        <p className="text-text-secondary leading-relaxed max-w-xs mb-4">
          Włącz lokalizację, żeby znaleźć trasy w Twojej okolicy.
        </p>

        {isDenied && (
          <p className="text-text-muted text-sm mt-2">
            Możesz włączyć później w ustawieniach.
          </p>
        )}
      </div>

      <div className="w-full flex flex-col gap-3">
        <button
          onClick={handleLocate}
          disabled={isLoading}
          className="w-full bg-accent text-bg-base font-semibold rounded-lg py-3 min-h-[48px] hover:bg-accent/90 transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          {isLoading ? 'Szukam...' : 'Włącz lokalizację'}
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
