import { create } from 'zustand'
import type { Invitation } from '../lib/types'

interface InvitesState {
  invitations: Invitation[]
  loading: boolean
  setInvitations: (invites: Invitation[]) => void
  addInvitation: (invite: Invitation) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useInvitesStore = create<InvitesState>((set) => ({
  invitations: [],
  loading: false,

  setInvitations: (invitations) =>
    set({ invitations }),

  addInvitation: (invite) =>
    set((s) => ({ invitations: [invite, ...s.invitations] })),

  setLoading: (loading) =>
    set({ loading }),

  reset: () => set({ invitations: [], loading: false }),
}))
