import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
              Dostep tylko przez zaproszenie
            </h1>
            <p className="text-text-secondary text-sm">
              Psi Szlak jest dostepny wylacznie dla zaproszonych uzytkownikow.
              Popros znajomego o link zaproszenia.
            </p>
          </div>
        )}

        {(validation.status === 'expired' || validation.status === 'used') && (
          <div className="text-center space-y-4">
            <div className="text-4xl">⏰</div>
            <h1 className="text-xl font-semibold text-text-primary">
              Zaproszenie wygaslo
            </h1>
            <p className="text-text-secondary text-sm">
              Popros znajomego o nowe zaproszenie do Psi Szlak.
            </p>
          </div>
        )}

        {validation.status === 'not_found' && (
          <div className="text-center space-y-4">
            <div className="text-4xl">❌</div>
            <h1 className="text-xl font-semibold text-text-primary">
              Nieprawidlowy link zaproszenia
            </h1>
            <p className="text-text-secondary text-sm">
              Sprawdz czy link jest poprawny lub popros o nowe zaproszenie.
            </p>
          </div>
        )}

        {validation.status === 'valid' && token && (
          <RegisterForm invitationId={validation.invitationId} token={token} />
        )}
      </div>
    </div>
  )
}
