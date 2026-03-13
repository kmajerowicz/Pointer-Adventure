import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGeolocation } from './useGeolocation'

type GeoSuccessCallback = (position: GeolocationPosition) => void
type GeoErrorCallback = (error: GeolocationPositionError) => void

let capturedSuccess: GeoSuccessCallback | null = null
let capturedError: GeoErrorCallback | null = null

const mockGetCurrentPosition = vi.fn((
  success: GeoSuccessCallback,
  error: GeoErrorCallback,
) => {
  capturedSuccess = success
  capturedError = error
})

const mockGeolocation = {
  getCurrentPosition: mockGetCurrentPosition,
}

beforeEach(() => {
  capturedSuccess = null
  capturedError = null
  mockGetCurrentPosition.mockClear()
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    value: mockGeolocation,
    configurable: true,
    writable: true,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useGeolocation', () => {
  test('initial state is { status: idle }', () => {
    const { result } = renderHook(() => useGeolocation())
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  test('calling locate() sets status to loading', () => {
    const { result } = renderHook(() => useGeolocation())
    act(() => {
      result.current.locate()
    })
    expect(result.current.state.status).toBe('loading')
  })

  test('successful geolocation sets status to success with position coords', () => {
    const mockPosition = {
      coords: {
        latitude: 50.061,
        longitude: 19.937,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    } as unknown as GeolocationPosition

    const { result } = renderHook(() => useGeolocation())
    act(() => {
      result.current.locate()
    })
    act(() => {
      capturedSuccess!(mockPosition)
    })
    expect(result.current.state).toEqual({ status: 'success', position: mockPosition })
  })

  test('permission denied (code 1) sets status to error with code 1', () => {
    const mockError = {
      code: 1,
      message: 'User denied Geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError

    const { result } = renderHook(() => useGeolocation())
    act(() => {
      result.current.locate()
    })
    act(() => {
      capturedError!(mockError)
    })
    expect(result.current.state.status).toBe('error')
    if (result.current.state.status === 'error') {
      expect(result.current.state.code).toBe(1)
    }
  })

  test('timeout (code 3) sets status to error with code 3', () => {
    const mockError = {
      code: 3,
      message: 'Timeout',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError

    const { result } = renderHook(() => useGeolocation())
    act(() => {
      result.current.locate()
    })
    act(() => {
      capturedError!(mockError)
    })
    expect(result.current.state.status).toBe('error')
    if (result.current.state.status === 'error') {
      expect(result.current.state.code).toBe(3)
    }
  })

  test('missing navigator.geolocation sets status to error with code 0', () => {
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    const { result } = renderHook(() => useGeolocation())
    act(() => {
      result.current.locate()
    })
    expect(result.current.state.status).toBe('error')
    if (result.current.state.status === 'error') {
      expect(result.current.state.code).toBe(0)
    }
  })
})
