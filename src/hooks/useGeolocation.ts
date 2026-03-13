import { useState, useCallback } from 'react'

export type GeolocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; position: GeolocationPosition }
  | { status: 'error'; code: number; message: string }

export function useGeolocation(): { state: GeolocationState; locate: () => void } {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' })

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'error', code: 0, message: 'Brak obslugi geolokalizacji' })
      return
    }

    setState({ status: 'loading' })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({ status: 'success', position })
      },
      (error) => {
        setState({ status: 'error', code: error.code, message: error.message })
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  return { state, locate }
}
