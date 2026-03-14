import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RegisterForm } from './RegisterForm'

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
    },
  },
}))

function renderForm() {
  return render(
    <MemoryRouter>
      <RegisterForm invitationId="inv-123" token="tok-abc" />
    </MemoryRouter>
  )
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders name and email fields', () => {
    renderForm()
    expect(screen.getByLabelText('Twoje imię')).toBeTruthy()
    expect(screen.getByLabelText('Adres email')).toBeTruthy()
  })

  it('submit button is disabled when fields are empty', () => {
    renderForm()
    const button = screen.getByRole('button', { name: /Dołącz do Psi Szlak/i })
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it('submit button enabled when both fields filled', () => {
    renderForm()
    fireEvent.change(screen.getByLabelText('Twoje imię'), { target: { value: 'Jan' } })
    fireEvent.change(screen.getByLabelText('Adres email'), { target: { value: 'jan@test.pl' } })
    const button = screen.getByRole('button', { name: /Dołącz do Psi Szlak/i })
    expect((button as HTMLButtonElement).disabled).toBe(false)
  })

  it.todo('calls signInWithOtp on valid submission')
  it.todo('shows MagicLinkSent on successful OTP send')
  it.todo('shows Polish error on failed OTP send')
})
