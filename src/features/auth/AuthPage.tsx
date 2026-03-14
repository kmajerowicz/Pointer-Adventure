import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type AuthMode = 'login' | 'register'

export function AuthPage() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    if (mode === 'register' && !displayName.trim()) return
    if (mode === 'register' && password !== confirmPassword) {
      setError('Hasła nie są identyczne')
      return
    }

    setLoading(true)
    setError(null)

    if (mode === 'register') {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() },
        },
      })

      setLoading(false)

      if (signUpError) {
        if (signUpError.status === 429) {
          setError('Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.')
        } else if (signUpError.status === 422 || signUpError.message?.includes('already registered')) {
          setError('Konto z tym adresem już istnieje. Zaloguj się.')
        } else {
          setError(signUpError.message)
        }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      setLoading(false)

      if (signInError) {
        if (signInError.status === 429) {
          setError('Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.')
        } else {
          setError('Nieprawidłowy email lub hasło')
        }
      }
    }
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

          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="text-sm font-medium text-text-secondary">
              Hasło
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 znaków"
              required
              minLength={6}
              className="w-full h-12 px-4 rounded-xl bg-bg-surface border border-bg-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
            />
          </div>

          {isRegister && (
            <div className="space-y-1.5">
              <label htmlFor="auth-confirm-password" className="text-sm font-medium text-text-secondary">
                Powtórz hasło
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Powtórz hasło"
                required
                minLength={6}
                className="w-full h-12 px-4 rounded-xl bg-bg-surface border border-bg-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password || (isRegister && !displayName.trim())}
            className="w-full min-h-[48px] rounded-xl bg-accent text-bg-base font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Ładowanie...'
              : isRegister
                ? 'Załóż konto'
                : 'Zaloguj się'}
          </button>
        </form>

        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={() => {
              setMode(isRegister ? 'login' : 'register')
              setError(null)
              setPassword('')
              setConfirmPassword('')
            }}
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
