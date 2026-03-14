import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 bg-accent px-4 py-2 text-sm font-medium text-center text-bg-base"
    >
      Tryb offline — wyswietlam zapisane trasy
    </div>
  )
}
