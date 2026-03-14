import { useEffect } from 'react'
import { useUIStore } from '../../stores/ui'

export function ToastRenderer() {
  const toast = useUIStore((s) => s.toast)
  const clearToast = useUIStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => {
      clearToast()
    }, 3000)

    return () => clearTimeout(timer)
  }, [toast?.id, clearToast])

  if (!toast) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-elevated text-text-primary shadow-lg text-sm font-medium animate-slide-up"
      style={{ bottom: 'calc(var(--spacing-tab-bar) + 1rem)' }}
    >
      {toast.message}
    </div>
  )
}
