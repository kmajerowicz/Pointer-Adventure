import { useState, useEffect, useRef, type RefObject } from 'react'
import { type Map as MapboxMap } from 'mapbox-gl'
import { LocateFixed } from 'lucide-react'
import { useGeolocation } from '../../hooks/useGeolocation'

interface MapControlsProps {
  mapRef: RefObject<MapboxMap | null>
  onGpsDenied?: () => void
}

interface ToastState {
  message: string
  visible: boolean
}

export function MapControls({ mapRef, onGpsDenied }: MapControlsProps) {
  const { state, locate } = useGeolocation()
  const [toast, setToast] = useState<ToastState | null>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string) => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    setToast({ message, visible: true })
    dismissTimerRef.current = setTimeout(() => {
      setToast(null)
    }, 5000)
  }

  useEffect(() => {
    if (state.status === 'success') {
      const { latitude, longitude } = state.position.coords
      const map = mapRef.current
      if (map) {
        const doFly = () =>
          map.flyTo({ center: [longitude, latitude], zoom: 12, duration: 1500, essential: true })
        if (map.loaded()) {
          doFly()
        } else {
          map.once('load', doFly)
        }
      }
    } else if (state.status === 'error') {
      if (state.code === 1) {
        showToast('Brak dostępu do lokalizacji. Włącz usługę lokalizacji w ustawieniach przeglądarki i spróbuj ponownie.')
        onGpsDenied?.()
      } else if (state.code === 2 || state.code === 3) {
        showToast('Nie udało się znaleźć lokalizacji')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [])

  const isLoading = state.status === 'loading'

  return (
    <>
      {/* Geolocation button — floating bottom-right above tab bar */}
      <button
        onClick={locate}
        aria-label="Znajdź moją lokalizację"
        className={[
          'absolute bottom-4 right-4',
          'w-12 h-12 rounded-full',
          'bg-bg-surface text-text-primary',
          'shadow-lg flex items-center justify-center',
          'active:scale-95 transition-transform',
          isLoading ? 'animate-pulse' : '',
        ].join(' ')}
      >
        <LocateFixed size={22} strokeWidth={1.75} />
      </button>

      {/* Inline toast — shown on GPS denial or timeout */}
      {toast && toast.visible && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(var(--spacing-tab-bar)+5rem)] left-1/2 -translate-x-1/2 z-50 bg-bg-elevated text-text-primary text-sm px-4 py-2 rounded-lg shadow-lg animate-[fade-in_200ms]"
        >
          {toast.message}
        </div>
      )}
    </>
  )
}
