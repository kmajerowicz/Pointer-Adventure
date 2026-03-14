import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProfileView } from './ProfileView'
import type { ActivityHistoryEntry } from '../../lib/types'

// Mock stores and hooks
vi.mock('../../stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../../hooks/useActivity', () => ({
  useActivity: vi.fn(),
}))

vi.mock('./InviteGenerator', () => ({
  InviteGenerator: () => <div data-testid="invite-generator" />,
}))

import { useAuthStore } from '../../stores/auth'
import { useActivity } from '../../hooks/useActivity'

const mockUseAuthStore = vi.mocked(useAuthStore)
const mockUseActivity = vi.mocked(useActivity)

const defaultActivityReturn = {
  walkedIds: new Set<string>(),
  entries: [] as ActivityHistoryEntry[],
  logWalk: vi.fn(),
  loadActivity: vi.fn(),
  loadActivityHistory: vi.fn(),
}

function renderProfile() {
  return render(
    <MemoryRouter>
      <ProfileView />
    </MemoryRouter>
  )
}

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseActivity.mockReturnValue(defaultActivityReturn)
  })

  it('renders display name and dog name when profile exists', () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: null,
        user: null,
        profile: {
          id: 'user-1',
          display_name: 'Anna',
          dog_name: 'Burek',
          avatar_url: null,
          walk_preferences: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        loading: false,
        initialized: true,
        setSession: vi.fn(),
        setProfile: vi.fn(),
        setLoading: vi.fn(),
        setInitialized: vi.fn(),
        clear: vi.fn(),
      })
    )

    renderProfile()

    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(screen.getByText('Pies: Burek')).toBeInTheDocument()
  })

  it('renders avatar initial from display_name first character', () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: null,
        user: null,
        profile: {
          id: 'user-1',
          display_name: 'Zbigniew',
          dog_name: null,
          avatar_url: null,
          walk_preferences: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        loading: false,
        initialized: true,
        setSession: vi.fn(),
        setProfile: vi.fn(),
        setLoading: vi.fn(),
        setInitialized: vi.fn(),
        clear: vi.fn(),
      })
    )

    renderProfile()

    // Avatar should show the first character of the display name
    expect(screen.getByText('Z')).toBeInTheDocument()
  })

  it('renders login message when profile is null', () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: null,
        user: null,
        profile: null,
        loading: false,
        initialized: true,
        setSession: vi.fn(),
        setProfile: vi.fn(),
        setLoading: vi.fn(),
        setInitialized: vi.fn(),
        clear: vi.fn(),
      })
    )

    renderProfile()

    expect(screen.getAllByText(/Zaloguj sie/i).length).toBeGreaterThan(0)
  })

  it('renders activity history entries with route names and dates', () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: null,
        user: null,
        profile: {
          id: 'user-1',
          display_name: 'Anna',
          dog_name: null,
          avatar_url: null,
          walk_preferences: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        loading: false,
        initialized: true,
        setSession: vi.fn(),
        setProfile: vi.fn(),
        setLoading: vi.fn(),
        setInitialized: vi.fn(),
        clear: vi.fn(),
      })
    )

    const entries: ActivityHistoryEntry[] = [
      {
        id: 'entry-1',
        user_id: 'user-1',
        route_id: 'route-1',
        walked_at: '2024-06-15T10:00:00Z',
        created_at: '2024-06-15T10:00:00Z',
        route: { id: 'route-1', name: 'Szlak Tatrzanski', length_km: 12.5 },
      },
    ]

    mockUseActivity.mockReturnValue({
      ...defaultActivityReturn,
      entries,
    })

    renderProfile()

    expect(screen.getByText('Szlak Tatrzanski')).toBeInTheDocument()
    expect(screen.getByText('12.5 km')).toBeInTheDocument()
  })

  it('renders empty activity state message when no entries', () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: null,
        user: null,
        profile: {
          id: 'user-1',
          display_name: 'Anna',
          dog_name: null,
          avatar_url: null,
          walk_preferences: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        loading: false,
        initialized: true,
        setSession: vi.fn(),
        setProfile: vi.fn(),
        setLoading: vi.fn(),
        setInitialized: vi.fn(),
        clear: vi.fn(),
      })
    )

    mockUseActivity.mockReturnValue({
      ...defaultActivityReturn,
      entries: [],
    })

    renderProfile()

    expect(screen.getByText(/Nie masz jeszcze zadnych spacerow/i)).toBeInTheDocument()
  })
})
