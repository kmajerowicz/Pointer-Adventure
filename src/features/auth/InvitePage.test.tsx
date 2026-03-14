import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { InvitePage } from './InvitePage'

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

import { supabase } from '../../lib/supabase'

function renderWithRouter(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/invite${search}`]}>
      <InvitePage />
    </MemoryRouter>
  )
}

describe('InvitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Dostęp tylko przez zaproszenie" when no token param', () => {
    renderWithRouter()
    expect(screen.getByText('Dostęp tylko przez zaproszenie')).toBeTruthy()
  })

  it('shows loading spinner during token validation', () => {
    // Make the invoke never resolve so we stay in loading state
    const invokeMock = vi.mocked(supabase.functions.invoke)
    invokeMock.mockReturnValue(new Promise(() => {}))

    renderWithRouter('?token=test-token')
    expect(screen.getByText('Sprawdzanie zaproszenia...')).toBeTruthy()
  })

  it('shows Polish error for expired token', async () => {
    const invokeMock = vi.mocked(supabase.functions.invoke)
    invokeMock.mockResolvedValue({ data: { valid: false, reason: 'expired' }, error: null } as never)

    renderWithRouter('?token=expired-token')
    const heading = await screen.findByText('Zaproszenie wygasło')
    expect(heading).toBeTruthy()
    expect(screen.getByText(/Poproś znajomego o nowe zaproszenie/)).toBeTruthy()
  })

  it('shows Polish error for used token', async () => {
    const invokeMock = vi.mocked(supabase.functions.invoke)
    invokeMock.mockResolvedValue({ data: { valid: false, reason: 'used' }, error: null } as never)

    renderWithRouter('?token=used-token')
    const heading = await screen.findByText('Zaproszenie wygasło')
    expect(heading).toBeTruthy()
  })

  it('shows Polish error for not_found token', async () => {
    const invokeMock = vi.mocked(supabase.functions.invoke)
    invokeMock.mockResolvedValue({ data: { valid: false, reason: 'not_found' }, error: null } as never)

    renderWithRouter('?token=bad-token')
    const heading = await screen.findByText('Nieprawidłowy link zaproszenia')
    expect(heading).toBeTruthy()
  })

  it.todo('renders RegisterForm when token is valid')
})
