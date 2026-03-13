import { describe, test, expect, beforeEach } from 'vitest'
import { useActivityStore } from './activity'
import type { ActivityLogEntry } from '../lib/types'

const makeEntry = (routeId: string, id?: string): ActivityLogEntry => ({
  id: id ?? `entry-${routeId}`,
  user_id: 'user-1',
  route_id: routeId,
  walked_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
})

beforeEach(() => {
  useActivityStore.setState({ walkedIds: new Set(), entries: [] })
})

describe('useActivityStore', () => {
  test('setWalkedIds creates Set from string array', () => {
    useActivityStore.getState().setWalkedIds(['route-1', 'route-2'])

    const { walkedIds } = useActivityStore.getState()
    expect(walkedIds.has('route-1')).toBe(true)
    expect(walkedIds.has('route-2')).toBe(true)
    expect(walkedIds.size).toBe(2)
  })

  test('addWalkedId adds to walkedIds Set immutably', () => {
    const originalSet = useActivityStore.getState().walkedIds
    useActivityStore.getState().addWalkedId('route-1')

    const newSet = useActivityStore.getState().walkedIds
    expect(newSet.has('route-1')).toBe(true)
    expect(newSet).not.toBe(originalSet)
  })

  test('appendEntry prepends entry (newest first)', () => {
    const older = makeEntry('route-1', 'entry-1')
    const newer = makeEntry('route-2', 'entry-2')

    useActivityStore.getState().appendEntry(older)
    useActivityStore.getState().appendEntry(newer)

    const { entries } = useActivityStore.getState()
    expect(entries[0]).toEqual(newer)
    expect(entries[1]).toEqual(older)
  })
})
