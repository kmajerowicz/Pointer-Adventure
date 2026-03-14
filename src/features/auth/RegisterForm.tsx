import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MagicLinkSent } from './MagicLinkSent'

interface RegisterFormProps {
  invitationId: string
  token: string
}

export function RegisterForm({ invitationId, token }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  if (sent) {
    return <MagicLinkSent email={email} token={token} invitationId={invitationId} />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    setLoading(true)
    setError(null)

    // Store invite token in sessionStorage BEFORE the auth flow starts,
    // so useAuthInit's SIGNED_IN handler can always find it.
    if (token) {
      sessionStorage.setItem('pending_invite_token', token)
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
        data: { display_name: name.trim() },
      },
    })

    setLoading(false)

    if (otpError) {
      setError('Nie można wysłać emaila. Upewnij się, że adres jest poprawny i spróbuj ponownie.')
      return
    }

    // Token will be consumed after session is established (stored in MagicLinkSent → sessionStorage)
    setSent(true)
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-text-primary">Dołącz do Psi Szlak</h1>
        <p className="text-text-secondary text-sm">
          Wypełnij formularz, aby dołączyć do społeczności miłośników tras z psem.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="display-name" className="text-sm font-medium text-text-secondary">
            Twoje imię
          </label>
          <input
            id="display-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jak masz na imię?"
            required
            className="w-full h-12 px-4 rounded-xl bg-bg-surface border border-bg-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-text-secondary">
            Adres email
          </label>
          <input
            id="email"
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
          disabled={loading || !name.trim() || !email.trim()}
          className="w-full min-h-[48px] rounded-xl bg-accent text-bg-base font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Wysyłanie...' : 'Dołącz do Psi Szlak'}
        </button>
      </form>
    </div>
  )
}
