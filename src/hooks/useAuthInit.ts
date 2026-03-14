import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useTrailsStore } from '../stores/trails'
import { useFavoritesStore } from '../stores/favorites'
import { useFiltersStore } from '../stores/filters'
import { useViewportStore } from '../stores/viewport'
import { useActivityStore } from '../stores/activity'
import type { User as AppUser } from '../lib/types'

async function fetchProfile(userId: string): Promise<AppUser | null> {
  const { data } = await supabase.from('users').select('*').eq('id', userId).single()
  return data as AppUser | null
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
        fetchProfile(session.user.id).then((profile) => {
          if (!mounted) return
          setProfile(profile)
          setLoading(false)
          setInitialized()
        })
      } else {
        setLoading(false)
        setInitialized()
        // Redirect unauthenticated users to auth page within /app
        const path = window.location.pathname
        if (path.startsWith('/app') && path !== '/app/auth') {
          // Save intended destination so we can restore after login
          if (path !== '/app') {
            sessionStorage.setItem('psi_szlak_return_url', path)
          }
          navigate('/app/auth')
        }
      }
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      setSession(session)

      if (event === 'SIGNED_IN' && session) {
        // Only redirect once per session — prevents redirect loops
        if (!hasRedirected.current) {
          hasRedirected.current = true
          fetchProfile(session.user.id).then((profile) => {
            if (!mounted) return
            setProfile(profile)
            if (!profile?.dog_name) {
              navigate('/app/onboarding')
            } else {
              // Restore deep link destination if one was saved before auth redirect
              const returnUrl = sessionStorage.getItem('psi_szlak_return_url')
              sessionStorage.removeItem('psi_szlak_return_url')
              navigate(returnUrl ?? '/app')
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
        hasRedirected.current = false
        navigate('/app/auth')
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
