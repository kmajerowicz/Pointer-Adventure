import { describe, test, expect, beforeEach } from 'vitest'
import { useInvitesStore } from './invites'
import type { Invitation } from '../lib/types'

const makeInvite = (id: string): Invitation => ({
  id,
  token: `token-${id}`,
  created_by: 'user-1',
  used_by: null,
  used_at: null,
  expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
  created_at: new Date().toISOString(),
})

beforeEach(() => {
  useInvitesStore.setState({ invitations: [], loading: false })
})

describe('useInvitesStore', () => {
  test('addInvitation prepends to invitations array (newest first)', () => {
    const first = makeInvite('inv-1')
    const second = makeInvite('inv-2')

    useInvitesStore.getState().addInvitation(first)
    useInvitesStore.getState().addInvitation(second)

    const { invitations } = useInvitesStore.getState()
    expect(invitations[0]).toEqual(second)
    expect(invitations[1]).toEqual(first)
  })

  test('setInvitations replaces invitations array', () => {
    useInvitesStore.getState().addInvitation(makeInvite('inv-old'))
    const newInvites = [makeInvite('inv-new')]
    useInvitesStore.getState().setInvitations(newInvites)

    const { invitations } = useInvitesStore.getState()
    expect(invitations).toEqual(newInvites)
  })

  test('setLoading updates loading flag', () => {
    useInvitesStore.getState().setLoading(true)
    expect(useInvitesStore.getState().loading).toBe(true)

    useInvitesStore.getState().setLoading(false)
    expect(useInvitesStore.getState().loading).toBe(false)
  })
})
