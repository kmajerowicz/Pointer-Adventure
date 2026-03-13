import { create } from 'zustand'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import type { User as AppUser } from '../lib/types'

interface AuthState {
  session: Session | null
  user: SupabaseUser | null
  profile: AppUser | null
  loading: boolean
  initialized: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: AppUser | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: () => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: () => set({ initialized: true }),
  clear: () => set({ session: null, user: null, profile: null }),
}))
