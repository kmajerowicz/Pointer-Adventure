import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useActivityStore } from '../stores/activity'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import type { ActivityHistoryEntry } from '../lib/types'

export function useActivity() {
  const user = useAuthStore((s) => s.profile)
  const walkedIds = useActivityStore((s) => s.walkedIds)
  const entries = useActivityStore((s) => s.entries)
  const store = useActivityStore()
  const showToast = useUIStore((s) => s.showToast)

  const loadActivity = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('activity_log')
      .select('route_id')
      .eq('user_id', user.id)
    if (!error && data) {
      store.setWalkedIds(data.map((d: { route_id: string }) => d.route_id))
    } else if (error) {
      console.error('Failed to load activity:', error)
    }
  }

  const loadActivityHistory = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('activity_log')
      .select('id, walked_at, created_at, user_id, route_id, route:routes(id, name, length_km)')
      .eq('user_id', user.id)
      .order('walked_at', { ascending: false })
    if (!error && data) {
      store.setEntries(data as unknown as ActivityHistoryEntry[])
    } else if (error) {
      console.error('Failed to load activity history:', error)
    }
  }

  useEffect(() => {
    if (user?.id) {
      void loadActivity()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const logWalk = async (routeId: string): Promise<void> => {
    if (!user) return

    const { data, error } = await supabase
      .from('activity_log')
      .insert({ user_id: user.id, route_id: routeId, walked_at: new Date().toISOString() })
      .select()
      .single()

    if (!error && data) {
      store.addWalkedId(routeId)
      store.appendEntry(data as ActivityHistoryEntry)
      showToast('Zapisano spacer!')
    } else {
      showToast('Nie udało się zapisać spaceru')
    }
  }

  return {
    walkedIds,
    entries: entries as ActivityHistoryEntry[],
    logWalk,
    loadActivity,
    loadActivityHistory,
  }
}
