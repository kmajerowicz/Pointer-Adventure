import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useInvites } from '../../hooks/useInvites'

export function InviteGenerator() {
  const { invitations, loading, createInvite } = useInvites()
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  async function handleCreate() {
    const url = await createInvite()
    if (url) {
      try {
        if (navigator.share) {
          await navigator.share({ title: 'Zaproszenie do Psi Szlak', url })
        } else {
          await navigator.clipboard.writeText(url)
          setCopiedToken(url)
          setTimeout(() => setCopiedToken(null), 2000)
        }
      } catch {
        // User cancelled share or clipboard failed
      }
    }
  }

  async function handleCopy(token: string) {
    const url = `${window.location.origin}/invite?token=${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch {
      // Fallback -- do nothing
    }
  }

  return (
    <div className="bg-bg-surface rounded-xl overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">Zaproszenia</h3>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={loading}
          className="px-4 py-2 rounded-full bg-accent text-bg-base text-sm font-semibold min-h-[40px] active:bg-accent/80 transition-colors disabled:opacity-50"
        >
          Nowe zaproszenie
        </button>
      </div>

      {invitations.length === 0 ? (
        <div className="px-4 pb-4">
          <p className="text-sm text-text-secondary">
            Zapros znajomych do Psi Szlak
          </p>
        </div>
      ) : (
        <div className="divide-y divide-bg-elevated">
          {invitations.map((inv) => {
            const isUsed = inv.used_at !== null
            const isExpired = new Date(inv.expires_at) < new Date()
            const status = isUsed ? 'used' : isExpired ? 'expired' : 'pending'
            const statusLabel = isUsed
              ? 'Wykorzystane'
              : isExpired
                ? 'Wygaslo'
                : 'Oczekujace'
            const statusColor = isUsed
              ? 'text-success'
              : isExpired
                ? 'text-error'
                : 'text-warning'

            return (
              <div
                key={inv.id}
                className="flex items-center justify-between px-4 py-3 min-h-[48px]"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-mono text-text-secondary truncate block">
                    ...{inv.token.slice(-8)}
                  </span>
                  <span className={`text-xs ${statusColor}`}>
                    {statusLabel}
                    {isUsed && inv.used_at && (
                      <>
                        {' '}
                        &mdash;{' '}
                        {new Date(inv.used_at).toLocaleDateString('pl-PL', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </>
                    )}
                  </span>
                </div>
                {status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => void handleCopy(inv.token)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted active:text-accent transition-colors"
                    aria-label="Kopiuj link zaproszenia"
                  >
                    {copiedToken === inv.token ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
