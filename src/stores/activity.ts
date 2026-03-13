import { create } from 'zustand'
import type { ActivityLogEntry } from '../lib/types'

interface ActivityState {
  walkedIds: Set<string>
  entries: ActivityLogEntry[]
  setWalkedIds: (ids: string[]) => void
  addWalkedId: (id: string) => void
  appendEntry: (entry: ActivityLogEntry) => void
  setEntries: (entries: ActivityLogEntry[]) => void
}

export const useActivityStore = create<ActivityState>((set) => ({
  walkedIds: new Set<string>(),
  entries: [],

  setWalkedIds: (ids) =>
    set({ walkedIds: new Set(ids) }),

  addWalkedId: (id) =>
    set((s) => ({ walkedIds: new Set([...s.walkedIds, id]) })),

  appendEntry: (entry) =>
    set((s) => ({ entries: [entry, ...s.entries] })),

  setEntries: (entries) =>
    set({ entries }),
}))
