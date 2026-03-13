import { expectTypeOf, test, describe } from 'vitest'
import type { Route, Invitation } from './types'

describe('Route type shape', () => {
  test('water_access is a 3-state text enum, not boolean', () => {
    expectTypeOf<Route['water_access']>().toEqualTypeOf<'none' | 'nearby' | 'on_route'>()
  })

  test('source field exists and is osm | pttk | null', () => {
    expectTypeOf<Route['source']>().toEqualTypeOf<'osm' | 'pttk' | null>()
  })

  test('water_type field exists and is river | lake | stream | null', () => {
    expectTypeOf<Route['water_type']>().toEqualTypeOf<'river' | 'lake' | 'stream' | null>()
  })
})

describe('Invitation type shape', () => {
  test('used_at field exists and is string | null', () => {
    expectTypeOf<Invitation['used_at']>().toEqualTypeOf<string | null>()
  })
})
