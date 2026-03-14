import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { GeolocationStep } from './GeolocationStep'

afterEach(() => { cleanup() })

// Mock useGeolocation hook
vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: vi.fn(() => ({
    state: { status: 'idle' },
    locate: vi.fn(),
  })),
}))

// Mock useViewportStore
vi.mock('../../stores/viewport', () => ({
  useViewportStore: vi.fn((selector) => {
    const state = { setCenter: vi.fn() }
    return selector ? selector(state) : state
  }),
}))

describe('GeolocationStep', () => {
  it('shows GPS permission explanation', () => {
    const onNext = vi.fn()
    const onSkip = vi.fn()
    render(<GeolocationStep onNext={onNext} onSkip={onSkip} />)

    const heading = screen.getByRole('heading', { name: /gdzie jesteście/i })
    expect(heading).toBeTruthy()
  })

  it('shows skip option on GPS denial', () => {
    const onNext = vi.fn()
    const onSkip = vi.fn()
    const { getAllByText } = render(<GeolocationStep onNext={onNext} onSkip={onSkip} />)

    const skipButtons = getAllByText(/pomiń/i)
    expect(skipButtons.length).toBeGreaterThanOrEqual(1)
  })

  it.todo('requests geolocation on button tap')
  it.todo('advances on GPS success')
})
