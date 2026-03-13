import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

// Mock viewport store
const mockBounds = { north: 51.0, south: 50.0, east: 20.0, west: 19.0 }
let currentBounds: typeof mockBounds | null = null
let boundsSubscribers: Array<(bounds: typeof mockBounds | null) => void> = []

vi.mock('../stores/viewport', () => ({
  useViewportStore: vi.fn((selector: (state: { bounds: typeof mockBounds | null }) => unknown) => {
    return selector({ bounds: currentBounds })
  }),
}))

// Mock trails store
const mockAppendRoutes = vi.fn()
const mockSetRoutes = vi.fn()
const mockSetLoading = vi.fn()
const mockSetError = vi.fn()
const mockSetRetry = vi.fn()
const mockSetLastFetched = vi.fn()

vi.mock('../stores/trails', () => ({
  useTrailsStore: vi.fn((selector?: (state: ReturnType<typeof getTrailsState>) => unknown) => {
    const state = getTrailsState()
    if (selector) return selector(state)
    return state
  }),
}))

function getTrailsState() {
  return {
    routes: [],
    loading: false,
    error: null,
    lastFetched: null,
    retry: null,
    appendRoutes: mockAppendRoutes,
    setRoutes: mockSetRoutes,
    setLoading: mockSetLoading,
    setError: mockSetError,
    setRetry: mockSetRetry,
    setLastFetched: mockSetLastFetched,
  }
}

import { useTrails } from './useTrails'
import { supabase } from '../lib/supabase'

const mockInvoke = supabase.functions.invoke as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.useFakeTimers()
  currentBounds = null
  mockAppendRoutes.mockClear()
  mockSetRoutes.mockClear()
  mockSetLoading.mockClear()
  mockSetError.mockClear()
  mockSetRetry.mockClear()
  mockSetLastFetched.mockClear()
  mockInvoke.mockClear()
  mockInvoke.mockResolvedValue({ data: { routes: [] }, error: null })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useTrails', () => {
  test('does not fetch when bounds is null', async () => {
    currentBounds = null
    renderHook(() => useTrails())

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(mockInvoke).not.toHaveBeenCalled()
  })

  test('debounces: setting bounds does NOT immediately call Edge Function; advancing 400ms triggers call', async () => {
    currentBounds = mockBounds

    const { rerender } = renderHook(() => useTrails())

    // Before debounce fires
    expect(mockInvoke).not.toHaveBeenCalled()

    // Advance less than 400ms
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(mockInvoke).not.toHaveBeenCalled()

    // Advance past 400ms
    await act(async () => {
      vi.advanceTimersByTime(200)
      await Promise.resolve()
    })

    expect(mockInvoke).toHaveBeenCalledWith('search-trails', {
      body: { north: mockBounds.north, south: mockBounds.south, east: mockBounds.east, west: mockBounds.west },
    })
  })

  test('calls appendRoutes with returned routes on successful fetch', async () => {
    const routes = [{ id: '1', source_id: 'osm:1', name: 'Trail A' }]
    mockInvoke.mockResolvedValue({ data: { routes }, error: null })
    currentBounds = mockBounds

    renderHook(() => useTrails())

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })

    expect(mockAppendRoutes).toHaveBeenCalledWith(routes)
  })

  test('sets loading=true before fetch and loading=false after', async () => {
    let resolveInvoke!: (val: unknown) => void
    mockInvoke.mockReturnValue(new Promise((res) => { resolveInvoke = res }))
    currentBounds = mockBounds

    renderHook(() => useTrails())

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(mockSetLoading).toHaveBeenCalledWith(true)

    await act(async () => {
      resolveInvoke({ data: { routes: [] }, error: null })
      await Promise.resolve()
    })

    expect(mockSetLoading).toHaveBeenCalledWith(false)
  })

  test('sets error and retry function on fetch failure', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'))
    currentBounds = mockBounds

    renderHook(() => useTrails())

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(mockSetError).toHaveBeenCalledWith('Nie udalo sie pobrac tras')
    expect(mockSetRetry).toHaveBeenCalledWith(expect.any(Function))
  })

  test('retry function re-invokes with same bounds', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'))
    currentBounds = mockBounds

    renderHook(() => useTrails())

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
      await Promise.resolve()
    })

    // Get the retry fn that was set — first call sets null, second call sets the function
    const retryFn = mockSetRetry.mock.calls.map((c: [unknown]) => c[0]).find((v: unknown) => typeof v === 'function') as (() => void) | undefined
    expect(retryFn).toBeDefined()
    expect(typeof retryFn).toBe('function')

    mockInvoke.mockClear()
    mockInvoke.mockResolvedValue({ data: { routes: [] }, error: null })

    await act(async () => {
      retryFn!()
      await Promise.resolve()
    })

    expect(mockInvoke).toHaveBeenCalledWith('search-trails', {
      body: { north: mockBounds.north, south: mockBounds.south, east: mockBounds.east, west: mockBounds.west },
    })
  })

  test('forceRefresh calls setRoutes (replace, not append) and bypasses debounce', async () => {
    const routes = [{ id: '2', source_id: 'osm:2', name: 'Trail B' }]
    mockInvoke.mockResolvedValue({ data: { routes }, error: null })
    currentBounds = mockBounds

    const { result } = renderHook(() => useTrails())

    await act(async () => {
      result.current.forceRefresh()
      await Promise.resolve()
    })

    expect(mockSetRoutes).toHaveBeenCalledWith(routes)
    expect(mockAppendRoutes).not.toHaveBeenCalled()
  })
})
