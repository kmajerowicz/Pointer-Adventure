import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthPage } from './AuthPage'

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
    },
  },
}))

function renderAuthPage(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/auth${search}`]}>
      <AuthPage />
    </MemoryRouter>
  )
}

describe('AuthPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows email login form for returning users', () => {
    renderAuthPage()
    expect(screen.getByText('Zaloguj się')).toBeTruthy()
    expect(screen.getByLabelText('Adres email')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Wyślij link logowania/i })).toBeTruthy()
  })

  it('shows "Dostęp tylko przez zaproszenie" subtitle', () => {
    renderAuthPage()
    expect(screen.getByText('Dostęp tylko przez zaproszenie')).toBeTruthy()
  })

  it.todo('shows invite-only gate when no from=invite param')
  it.todo('calls signInWithOtp with shouldCreateUser:false')
})
