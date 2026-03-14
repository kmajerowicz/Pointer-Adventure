import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { RegisterForm } from './RegisterForm'

type ValidationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'valid'; invitationId: string }
  | { status: 'expired' }
  | { status: 'used' }
  | { status: 'not_found' }
  | { status: 'no_token' }

export function InvitePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [validation, setValidation] = useState<ValidationState>(
    token ? { status: 'loading' } : { status: 'no_token' }
  )

  useEffect(() => {
    if (!token) {
      setValidation({ status: 'no_token' })
      return
    }

    let cancelled = false

    const validate = async () => {
      setValidation({ status: 'loading' })
      try {
        const { data, error } = await supabase.functions.invoke('validate-invite', {
          body: { token },
        })

        if (cancelled) return

        if (error || !data) {
          setValidation({ status: 'not_found' })
          return
        }

        if (!data.valid) {
          const reason = data.reason as string | undefined
          if (reason === 'expired') {
            setValidation({ status: 'expired' })
          } else if (reason === 'used') {
            setValidation({ status: 'used' })
          } else {
            setValidation({ status: 'not_found' })
          }
          return
        }

        setValidation({ status: 'valid', invitationId: data.invitation_id as string })
      } catch {
        if (!cancelled) setValidation({ status: 'not_found' })
      }
    }

    void validate()
    return () => { cancelled = true }
  }, [token])

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {validation.status === 'loading' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary text-sm">Sprawdzanie zaproszenia...</p>
          </div>
        )}

        {validation.status === 'no_token' && (
          <div className="text-center space-y-4">
            <div className="text-4xl">🐾</div>
            <h1 className="text-xl font-semibold text-text-primary">
              Dostęp tylko przez zaproszenie
            </h1>
            <p className="text-text-secondary text-sm">
              Psi Szlak jest dostępny wyłącznie dla zaproszonych użytkowników.
              Poproś znajomego o link zaproszenia.
            </p>
            <Link
              to="/"
              className="inline-block mt-2 px-6 py-3 min-h-[48px] bg-bg-elevated text-text-primary text-sm font-medium rounded-lg hover:bg-bg-surface transition-colors"
            >
              Wróć na stronę główną
            </Link>
          </div>
        )}

        {(validation.status === 'expired' || validation.status === 'used') && (
          <div className="text-center space-y-4">
            <div className="text-4xl">⏰</div>
            <h1 className="text-xl font-semibold text-text-primary">
              Zaproszenie wygasło
            </h1>
            <p className="text-text-secondary text-sm">
              Poproś znajomego o nowe zaproszenie do Psi Szlak.
            </p>
            <Link
              to="/"
              className="inline-block mt-2 px-6 py-3 min-h-[48px] bg-bg-elevated text-text-primary text-sm font-medium rounded-lg hover:bg-bg-surface transition-colors"
            >
              Wróć na stronę główną
            </Link>
          </div>
        )}

        {validation.status === 'not_found' && (
          <div className="text-center space-y-4">
            <div className="text-4xl">❌</div>
            <h1 className="text-xl font-semibold text-text-primary">
              Nieprawidłowy link zaproszenia
            </h1>
            <p className="text-text-secondary text-sm">
              Sprawdź czy link jest poprawny lub poproś o nowe zaproszenie.
            </p>
            <Link
              to="/"
              className="inline-block mt-2 px-6 py-3 min-h-[48px] bg-bg-elevated text-text-primary text-sm font-medium rounded-lg hover:bg-bg-surface transition-colors"
            >
              Wróć na stronę główną
            </Link>
          </div>
        )}

        {validation.status === 'valid' && token && (
          <RegisterForm invitationId={validation.invitationId} token={token} />
        )}
      </div>
    </div>
  )
}
