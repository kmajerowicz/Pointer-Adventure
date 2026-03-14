import { Outlet } from 'react-router-dom'
import { useAuthInit } from '../../hooks/useAuthInit'
import { useAuthStore } from '../../stores/auth'
import { OfflineBanner } from '../ui/OfflineBanner'
import { ToastRenderer } from '../ui/ToastRenderer'

export function AuthLayout() {
  useAuthInit()
  const initialized = useAuthStore((s) => s.initialized)

  if (!initialized) {
    return (
      <div className="fixed inset-0 bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-bg-elevated border-t-accent animate-spin"
            role="status"
            aria-label="Ładowanie..."
          />
          <p className="text-text-muted text-sm">Ładowanie...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <OfflineBanner />
      <ToastRenderer />
      <Outlet />
    </>
  )
}
