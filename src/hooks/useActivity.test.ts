import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ActivityLogEntry } from '../lib/types'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// Mock auth store
let mockProfile: { id: string } | null = { id: 'user-1' }
vi.mock('../stores/auth', () => ({
  useAuthStore: vi.fn((selector: (state: { profile: typeof mockProfile }) => unknown) =>
    selector({ profile: mockProfile })
  ),
}))

// Mock activity store
const mockActivityStoreState = {
  walkedIds: new Set<string>(),
  entries: [] as ActivityLogEntry[],
  setWalkedIds: vi.fn(),
  addWalkedId: vi.fn(),
  appendEntry: vi.fn(),
  setEntries: vi.fn(),
}

vi.mock('../stores/activity', () => ({
  useActivityStore: vi.fn((selector?: (state: typeof mockActivityStoreState) => unknown) => {
    if (selector) return selector(mockActivityStoreState)
    return mockActivityStoreState
  }),
}))

// Mock UI store for toast
const mockShowToast = vi.fn()
vi.mock('../stores/ui', () => ({
  useUIStore: vi.fn((selector?: (state: { showToast: typeof mockShowToast }) => unknown) => {
    if (selector) return selector({ showToast: mockShowToast })
    return { showToast: mockShowToast }
  }),
}))

import { useActivity } from './useActivity'
import { supabase } from '../lib/supabase'

const mockFrom = supabase.from as ReturnType<typeof vi.fn>

/**
 * Full chainable supabase mock.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeFullChain(resolveWith: { data: unknown; error: unknown }): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {}
  for (const method of ['select', 'insert', 'eq', 'order']) {
    chain[method] = vi.fn().mockReturnValue(chain)
  }
  chain['single'] = vi.fn().mockResolvedValue(resolveWith)
  chain.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(onFulfilled, onRejected)
  chain.catch = (onRejected: (e: unknown) => unknown) =>
    Promise.resolve(resolveWith).catch(onRejected)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockProfile = { id: 'user-1' }
  mockActivityStoreState.walkedIds = new Set()
  mockActivityStoreState.entries = []
  mockActivityStoreState.setWalkedIds.mockReset()
  mockActivityStoreState.addWalkedId.mockReset()
  mockActivityStoreState.appendEntry.mockReset()
  mockActivityStoreState.setEntries.mockReset()
  mockShowToast.mockReset()

  // Default: loadActivity returns empty data
  mockFrom.mockReturnValue(makeFullChain({ data: [], error: null }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useActivity', () => {
  test('logWalk adds walkedId and appends entry on success', async () => {
    const newEntry: ActivityLogEntry = {
      id: 'entry-1',
      user_id: 'user-1',
      route_id: 'route-1',
      walked_at: '2026-01-01T10:00:00Z',
      created_at: '2026-01-01T10:00:00Z',
    }

    // First call: useEffect loadActivity, second: logWalk insert
    mockFrom.mockReturnValueOnce(makeFullChain({ data: [], error: null }))
    mockFrom.mockReturnValue(makeFullChain({ data: newEntry, error: null }))

    const { result } = renderHook(() => useActivity())

    await act(async () => {
      await result.current.logWalk('route-1')
    })

    expect(mockActivityStoreState.addWalkedId).toHaveBeenCalledWith('route-1')
    expect(mockActivityStoreState.appendEntry).toHaveBeenCalledWith(newEntry)
  })

  test('logWalk is no-op when user is null', async () => {
    mockProfile = null

    const { result } = renderHook(() => useActivity())

    await act(async () => {
      await result.current.logWalk('route-1')
    })

    expect(mockActivityStoreState.addWalkedId).not.toHaveBeenCalled()
    expect(mockActivityStoreState.appendEntry).not.toHaveBeenCalled()
  })

  test('loadActivityHistory populates entries from supabase join', async () => {
    const historyEntry = {
      id: 'entry-1',
      user_id: 'user-1',
      route_id: 'route-1',
      walked_at: '2026-01-01T10:00:00Z',
      created_at: '2026-01-01T10:00:00Z',
      route: { id: 'route-1', name: 'Test Trail', length_km: 5 },
    }

    // First call: useEffect loadActivity, second: loadActivityHistory
    mockFrom.mockReturnValueOnce(makeFullChain({ data: [], error: null }))
    mockFrom.mockReturnValue(makeFullChain({ data: [historyEntry], error: null }))

    const { result } = renderHook(() => useActivity())

    await act(async () => {
      await result.current.loadActivityHistory()
    })

    expect(mockActivityStoreState.setEntries).toHaveBeenCalledWith([historyEntry])
  })
})
