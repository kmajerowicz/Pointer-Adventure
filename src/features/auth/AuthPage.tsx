import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MagicLinkSent } from './MagicLinkSent'

type AuthMode = 'login' | 'register'

export function AuthPage() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  )
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  if (sent) {
    return <MagicLinkSent email={email} shouldCreateUser={mode === 'register'} />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    if (mode === 'register' && !displayName.trim()) return

    setLoading(true)
    setError(null)

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: mode === 'register',
        emailRedirectTo: window.location.origin + '/app',
        ...(mode === 'register' && {
          data: { display_name: displayName.trim() },
        }),
      },
    })

    setLoading(false)

    if (otpError) {
      const isSignupBlocked = mode === 'login' && otpError.status === 422
      const isRateLimited = otpError.status === 429
      setError(
        isRateLimited
          ? 'Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.'
          : isSignupBlocked
            ? 'Nie znaleziono konta z tym adresem. Może chcesz założyć konto?'
            : `Nie można wysłać emaila. Upewnij się, że adres jest poprawny i spróbuj ponownie. (${otpError.message})`
      )
      return
    }

    setSent(true)
  }

  const isRegister = mode === 'register'

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="text-4xl">🐾</div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {isRegister ? 'Załóż konto' : 'Zaloguj się'}
          </h1>
          <p className="text-text-secondary text-sm">
            Zaloguj się lub załóż konto
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label htmlFor="auth-name" className="text-sm font-medium text-text-secondary">
                Twoje imię
              </label>
              <input
                id="auth-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jan"
                required
                className="w-full h-12 px-4 rounded-xl bg-bg-surface border border-bg-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="text-sm font-medium text-text-secondary">
              Adres email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twoj@email.pl"
              required
              className="w-full h-12 px-4 rounded-xl bg-bg-surface border border-bg-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || (isRegister && !displayName.trim())}
            className="w-full min-h-[48px] rounded-xl bg-accent text-bg-base font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Wysyłanie...'
              : isRegister
                ? 'Załóż konto'
                : 'Wyślij link logowania'}
          </button>
        </form>

        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={() => setMode(isRegister ? 'login' : 'register')}
            className="text-sm text-accent hover:text-accent-hover transition-colors"
          >
            {isRegister ? 'Masz konto? Zaloguj się' : 'Nie masz konta? Załóż konto'}
          </button>

          <Link
            to="/"
            className="block text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Wróć na stronę główną
          </Link>
        </div>
      </div>
    </div>
  )
}
