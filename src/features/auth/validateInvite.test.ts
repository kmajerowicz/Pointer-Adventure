import { describe, it } from 'vitest'

describe('validate-invite logic', () => {
  it.todo('returns valid:true for unexpired, unused token')
  it.todo('returns reason:expired for expired token')
  it.todo('returns reason:used for already-used token')
  it.todo('returns reason:not_found for unknown token')
})
