import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OnboardingFlow } from './OnboardingFlow'

afterEach(() => { cleanup() })

// Mock useAuthStore to avoid Supabase dependency
vi.mock('../../stores/auth', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { session: null, profile: { display_name: 'Kacper', dog_name: null } }
    return selector ? selector(state) : state
  }),
}))

// Mock useUIStore
vi.mock('../../stores/ui', () => ({
  useUIStore: vi.fn((selector) => {
    const state = { setShowFilterTooltip: vi.fn() }
    return selector ? selector(state) : state
  }),
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('OnboardingFlow', () => {
  it('renders 4 progress dots', () => {
    const { container } = render(
      <MemoryRouter>
        <OnboardingFlow />
      </MemoryRouter>
    )
    const dots = container.querySelectorAll('.w-2.h-2.rounded-full')
    expect(dots).toHaveLength(4)
  })

  it('starts at step 1 (WelcomeStep) — shows Witaj heading', () => {
    render(
      <MemoryRouter>
        <OnboardingFlow />
      </MemoryRouter>
    )
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings.length).toBeGreaterThanOrEqual(1)
    expect(headings[0].textContent).toMatch(/witaj/i)
  })

  it.todo('advances through all 4 steps')
  it.todo('sets showFilterTooltip on completion')
  it.todo('navigates to / after final step')
})
