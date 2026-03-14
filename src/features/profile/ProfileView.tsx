import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth'
import { useActivity } from '../../hooks/useActivity'
import { InviteGenerator } from './InviteGenerator'
import type { ActivityHistoryEntry } from '../../lib/types'

export function ProfileView() {
  const profile = useAuthStore((s) => s.profile)
  const { entries, loadActivityHistory } = useActivity()
  const navigate = useNavigate()

  useEffect(() => {
    void loadActivityHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-text-secondary mb-4">
            Zaloguj się, aby zobaczyć swój profil
          </p>
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="px-6 py-3 rounded-full bg-accent text-bg-base font-semibold min-h-[48px] active:bg-accent/80 transition-colors"
          >
            Zaloguj się
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 pt-6 pb-8 flex flex-col gap-4">
        <h1 className="text-xl font-bold text-text-primary">Profil</h1>

        {/* User info card */}
        <div className="bg-bg-surface rounded-xl p-4 flex items-center gap-4">
          <div className="size-16 rounded-full bg-accent/20 flex items-center justify-center text-accent text-2xl font-bold shrink-0">
            {profile.display_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-text-primary truncate">
              {profile.display_name ?? 'Użytkownik'}
            </h2>
            {profile.dog_name && (
              <p className="text-sm text-text-secondary truncate">
                Pies: {profile.dog_name}
              </p>
            )}
          </div>
        </div>

        {/* Activity history card */}
        <div className="bg-bg-surface rounded-xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-base font-semibold text-text-primary">Historia spacerów</h3>
          </div>
          {entries.length === 0 ? (
            <div className="px-4 pb-4">
              <p className="text-sm text-text-secondary">
                Nie masz jeszcze żadnych spacerów. Wybierz trasę i kliknij &quot;Przeszedłem!&quot;
              </p>
            </div>
          ) : (
            <div className="divide-y divide-bg-elevated">
              {entries.map((entry) => {
                const historyEntry = entry as ActivityHistoryEntry
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => navigate(`/trails/${entry.route_id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-bg-elevated transition-colors min-h-[48px]"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-text-primary truncate block">
                        {historyEntry.route?.name ?? 'Trasa bez nazwy'}
                      </span>
                      {historyEntry.route?.length_km != null && (
                        <span className="text-xs text-text-muted">
                          {historyEntry.route.length_km.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted shrink-0 ml-2">
                      {new Date(entry.walked_at).toLocaleDateString('pl-PL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Invite generator */}
        <InviteGenerator />
      </div>
    </div>
  )
}
