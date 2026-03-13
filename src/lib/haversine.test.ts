import { describe, it, expect } from 'vitest'
import { haversineKm } from './haversine'

describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineKm(0, 0, 0, 0)).toBe(0)
  })

  it('returns ~292 km for Warsaw to Wroclaw', () => {
    // Warsaw: 52.2297, 21.0122 | Wroclaw: 51.1079, 17.0385
    const dist = haversineKm(52.2297, 21.0122, 51.1079, 17.0385)
    expect(dist).toBeGreaterThan(288)
    expect(dist).toBeLessThan(296)
  })

  it('returns same distance regardless of direction', () => {
    const d1 = haversineKm(52.2297, 21.0122, 51.1079, 17.0385)
    const d2 = haversineKm(51.1079, 17.0385, 52.2297, 21.0122)
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001)
  })
})
