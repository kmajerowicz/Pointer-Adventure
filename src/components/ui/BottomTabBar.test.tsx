import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BottomTabBar } from './BottomTabBar'
import { useAuthStore } from '../../stores/auth'

// Mock auth store
vi.mock('../../stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

// Mock AuthGateSheet to simplify testing
vi.mock('../../features/auth/AuthGateSheet', () => ({
  AuthGateSheet: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="auth-gate-sheet">AuthGateSheet</div> : null,
}))

function renderTabBar() {
  return render(
    <MemoryRouter>
      <BottomTabBar />
    </MemoryRouter>
  )
}

describe('BottomTabBar auth interception', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('navigates normally for Mapa and Trasy tabs', () => {
    vi.mocked(useAuthStore).mockReturnValue({ session: null } as never)
    renderTabBar()

    // Mapa and Trasy should be NavLinks (anchor elements)
    const links = screen.getAllByRole('link')
    const labels = links.map((l) => l.textContent)
    expect(labels.some((t) => t?.includes('Mapa'))).toBe(true)
    expect(labels.some((t) => t?.includes('Trasy'))).toBe(true)
  })

  it('shows AuthGateSheet when tapping Ulubione while unauthenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({ session: null } as never)
    renderTabBar()

    const ulubioneBtn = screen.getByRole('button', { name: /Ulubione/i })
    fireEvent.click(ulubioneBtn)

    expect(screen.getByTestId('auth-gate-sheet')).toBeTruthy()
  })

  it('shows AuthGateSheet when tapping Profil while unauthenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({ session: null } as never)
    renderTabBar()

    const profilBtn = screen.getByRole('button', { name: /Profil/i })
    fireEvent.click(profilBtn)

    expect(screen.getByTestId('auth-gate-sheet')).toBeTruthy()
  })

  it('navigates normally when authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({ session: { user: { id: '123' } } } as never)
    renderTabBar()

    // When authenticated, all tabs should be NavLinks
    const links = screen.getAllByRole('link')
    const labels = links.map((l) => l.textContent)
    expect(labels.some((t) => t?.includes('Ulubione'))).toBe(true)
    expect(labels.some((t) => t?.includes('Profil'))).toBe(true)

    // No buttons for protected tabs
    const buttons = screen.queryAllByRole('button')
    expect(buttons.length).toBe(0)
  })
})
