import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useTrailsStore } from '../stores/trails'
import { useFavoritesStore } from '../stores/favorites'
import { useFiltersStore } from '../stores/filters'
import { useViewportStore } from '../stores/viewport'
import { useActivityStore } from '../stores/activity'
import { useInvitesStore } from '../stores/invites'
import type { User as AppUser } from '../lib/types'

async function fetchProfile(userId: string): Promise<AppUser | null> {
  const { data } = await supabase.from('users').select('*').eq('id', userId).single()
  return data as AppUser | null
}

async function consumeInviteToken(token: string, userId: string): Promise<void> {
  try {
    await supabase.rpc('consume_invite', { p_token: token, p_user_id: userId })
  } catch {
    // Token already consumed or invalid — ignore silently
  } finally {
    sessionStorage.removeItem('pending_invite_token')
  }
}

export function useAuthInit() {
  const navigate = useNavigate()
  const { setSession, setProfile, setLoading, setInitialized, clear } = useAuthStore()
  const hasRedirected = useRef(false)

  useEffect(() => {
    let mounted = true

    // Initialize from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return

      setSession(session)

      if (session) {
        // Consume pending invite token if present
        const pendingToken = sessionStorage.getItem('pending_invite_token')
        if (pendingToken) {
          void consumeInviteToken(pendingToken, session.user.id)
        }

        fetchProfile(session.user.id).then((profile) => {
          if (!mounted) return
          setProfile(profile)
          setLoading(false)
          setInitialized()
        })
      } else {
        setLoading(false)
        setInitialized()
        // Redirect unauthenticated users to welcome (one-time)
        const path = window.location.pathname
        const skipPaths = ['/invite', '/auth', '/welcome']
        if (!skipPaths.includes(path) && !localStorage.getItem('psi_szlak_welcomed')) {
          navigate('/welcome')
        }
      }
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      setSession(session)

      if (event === 'SIGNED_IN' && session) {
        // Consume pending invite token after sign-in
        const pendingToken = sessionStorage.getItem('pending_invite_token')
        if (pendingToken) {
          void consumeInviteToken(pendingToken, session.user.id)
        }

        // Only redirect once per session — prevents redirect loops
        if (!hasRedirected.current) {
          hasRedirected.current = true
          fetchProfile(session.user.id).then((profile) => {
            if (!mounted) return
            setProfile(profile)
            if (!profile?.dog_name) {
              navigate('/onboarding')
            } else {
              navigate('/')
            }
          })
        }
      } else if (event === 'SIGNED_OUT') {
        clear()
        useTrailsStore.getState().reset()
        useFavoritesStore.getState().reset()
        useFiltersStore.getState().resetAll()
        useViewportStore.getState().setCenter([19.145, 51.919])
        useViewportStore.getState().setZoom(6)
        useViewportStore.getState().setBounds(null)
        useActivityStore.getState().reset()
        useInvitesStore.getState().reset()
        hasRedirected.current = false
        navigate('/auth')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { loading, initialized } = useAuthStore.getState()
  return { loading, initialized }
}
