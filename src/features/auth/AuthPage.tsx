import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MagicLinkSent } from './MagicLinkSent'

export function AuthPage() {
  const [searchParams] = useSearchParams()
  // from=invite is set when navigating from the invite flow; kept for future use
  // from=invite is set when navigating from the invite flow; available for future conditional behavior
  void searchParams.get('from')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  if (sent) {
    return <MagicLinkSent email={email} />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: window.location.origin + '/app',
      },
    })

    setLoading(false)

    if (otpError) {
      setError('Nie można wysłać emaila. Upewnij się, że adres jest poprawny i spróbuj ponownie.')
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="text-4xl">🐾</div>
          <h1 className="text-2xl font-semibold text-text-primary">Zaloguj się</h1>
          <p className="text-text-secondary text-sm">
            Dostęp tylko przez zaproszenie
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={loading || !email.trim()}
            className="w-full min-h-[48px] rounded-xl bg-accent text-bg-base font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Wysyłanie...' : 'Wyślij link logowania'}
          </button>
        </form>

        <Link
          to="/"
          className="block text-center text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Wróć na stronę główną
        </Link>
      </div>
    </div>
  )
}
