import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Invitation } from '../lib/types'

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

// Mock invites store
const mockInvitesStoreState = {
  invitations: [] as Invitation[],
  loading: false,
  setInvitations: vi.fn(),
  addInvitation: vi.fn(),
  setLoading: vi.fn(),
}

vi.mock('../stores/invites', () => ({
  useInvitesStore: vi.fn((selector?: (state: typeof mockInvitesStoreState) => unknown) => {
    if (selector) return selector(mockInvitesStoreState)
    return mockInvitesStoreState
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

import { useInvites } from './useInvites'
import { supabase } from '../lib/supabase'

const mockFrom = supabase.from as ReturnType<typeof vi.fn>

const makeInvitation = (): Invitation => ({
  id: 'inv-1',
  token: 'abc123',
  created_by: 'user-1',
  used_by: null,
  used_at: null,
  expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
  created_at: new Date().toISOString(),
})

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
  mockInvitesStoreState.invitations = []
  mockInvitesStoreState.loading = false
  mockInvitesStoreState.setInvitations.mockReset()
  mockInvitesStoreState.addInvitation.mockReset()
  mockInvitesStoreState.setLoading.mockReset()
  mockShowToast.mockReset()

  Object.defineProperty(window, 'location', {
    value: { origin: 'https://psiszlak.pl' },
    writable: true,
  })

  // Default: loadInvites succeeds with empty data
  mockFrom.mockReturnValue(makeFullChain({ data: [], error: null }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useInvites', () => {
  test('createInvite returns URL string on success', async () => {
    const invite = makeInvitation()

    // First: useEffect loadInvites, second: createInvite insert
    mockFrom.mockReturnValueOnce(makeFullChain({ data: [], error: null }))
    mockFrom.mockReturnValue(makeFullChain({ data: invite, error: null }))

    const { result } = renderHook(() => useInvites())

    let url: string | null = null
    await act(async () => {
      url = await result.current.createInvite()
    })

    expect(url).toBe('https://psiszlak.pl/invite?token=abc123')
    expect(mockInvitesStoreState.addInvitation).toHaveBeenCalledWith(invite)
  })

  test('createInvite returns null when user is null', async () => {
    mockProfile = null

    const { result } = renderHook(() => useInvites())

    let url: string | null = 'not-null'
    await act(async () => {
      url = await result.current.createInvite()
    })

    expect(url).toBeNull()
  })

  test('loadInvites populates invitations from supabase', async () => {
    const invites = [makeInvitation()]

    // First: useEffect call (empty), second: explicit loadInvites call
    mockFrom.mockReturnValueOnce(makeFullChain({ data: [], error: null }))
    mockFrom.mockReturnValue(makeFullChain({ data: invites, error: null }))

    const { result } = renderHook(() => useInvites())

    await act(async () => {
      await result.current.loadInvites()
    })

    expect(mockInvitesStoreState.setInvitations).toHaveBeenCalledWith(invites)
  })
})
