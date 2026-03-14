import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { DogStep } from './DogStep'

afterEach(() => { cleanup() })

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}))

// Mock useAuthStore
vi.mock('../../stores/auth', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      session: { user: { id: 'user-123' } },
      profile: { display_name: 'Kacper', dog_name: null },
      setProfile: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

describe('DogStep', () => {
  it('requires dog name before advancing', async () => {
    const onNext = vi.fn()
    render(<DogStep onNext={onNext} />)

    // Click Dalej without entering a name
    const button = screen.getByRole('button', { name: /dalej/i })
    fireEvent.click(button)

    // Should show error message
    expect(screen.getByText(/imię psa jest wymagane/i)).toBeTruthy()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('breed field is optional — breed input exists with optional placeholder', () => {
    const onNext = vi.fn()
    render(<DogStep onNext={onNext} />)

    // Breed field exists and indicates it's optional
    const breedInput = screen.getByPlaceholderText(/rasa \(opcjonalnie\)/i)
    expect(breedInput).toBeTruthy()
  })

  it.todo('saves dog_name to database on submit')
  it.todo('updates auth store profile locally')
})
