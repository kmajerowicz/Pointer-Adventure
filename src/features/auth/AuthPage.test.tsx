import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthPage } from './AuthPage'

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
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

  it('shows login form by default', () => {
    renderAuthPage()
    expect(screen.getByRole('heading', { name: 'Zaloguj się' })).toBeTruthy()
    expect(screen.getByLabelText('Adres email')).toBeTruthy()
    expect(screen.getByLabelText('Hasło')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Zaloguj się/i })).toBeTruthy()
  })

  it('shows register form when mode=register', () => {
    renderAuthPage('?mode=register')
    expect(screen.getByRole('heading', { name: 'Załóż konto' })).toBeTruthy()
    expect(screen.getByLabelText('Twoje imię')).toBeTruthy()
    expect(screen.getByLabelText('Adres email')).toBeTruthy()
    expect(screen.getByLabelText('Hasło')).toBeTruthy()
    expect(screen.getByLabelText('Powtórz hasło')).toBeTruthy()
  })

  it('does not show confirm password in login mode', () => {
    renderAuthPage()
    expect(screen.queryByLabelText('Powtórz hasło')).toBeNull()
  })

  it('shows toggle to switch between login and register', () => {
    renderAuthPage()
    expect(screen.getByText('Nie masz konta? Załóż konto')).toBeTruthy()
  })

  it('toggles to register mode when clicking toggle', () => {
    renderAuthPage()
    fireEvent.click(screen.getByText('Nie masz konta? Załóż konto'))
    expect(screen.getByText('Masz konto? Zaloguj się')).toBeTruthy()
    expect(screen.getByLabelText('Twoje imię')).toBeTruthy()
    expect(screen.getByLabelText('Powtórz hasło')).toBeTruthy()
  })

  it('shows subtitle without invite-only messaging', () => {
    renderAuthPage()
    expect(screen.getByText('Zaloguj się lub załóż konto')).toBeTruthy()
    expect(screen.queryByText(/zaproszenie/i)).toBeNull()
  })
})
