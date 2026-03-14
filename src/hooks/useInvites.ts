import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useInvitesStore } from '../stores/invites'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import type { Invitation } from '../lib/types'

export function useInvites() {
  const user = useAuthStore((s) => s.profile)
  const invitations = useInvitesStore((s) => s.invitations)
  const loading = useInvitesStore((s) => s.loading)
  const store = useInvitesStore()
  const showToast = useUIStore((s) => s.showToast)

  const loadInvites = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) {
      store.setInvitations(data as Invitation[])
    }
  }

  useEffect(() => {
    if (user?.id) {
      void loadInvites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const createInvite = async (): Promise<string | null> => {
    if (!user) return null

    store.setLoading(true)
    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert({ created_by: user.id })
        .select()
        .single()

      if (error || !data) throw error

      const invite = data as Invitation
      store.addInvitation(invite)
      return `${window.location.origin}/invite?token=${invite.token}`
    } catch {
      showToast('Nie udalo sie utworzyc zaproszenia')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  return {
    invitations,
    loading,
    createInvite,
    loadInvites,
  }
}
