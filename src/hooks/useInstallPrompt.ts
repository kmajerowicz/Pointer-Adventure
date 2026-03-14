import { useEffect, useState } from 'react'
import { useUIStore } from '../stores/ui'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  const trailViewCount = useUIStore((s) => s.trailViewCount)
  const installPromptDismissedAt = useUIStore((s) => s.installPromptDismissedAt)

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  useEffect(() => {
    function handleBeforeInstallPrompt(e: BeforeInstallPromptEvent) {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const cooldownExpired =
    installPromptDismissedAt === null ||
    Date.now() - installPromptDismissedAt > SEVEN_DAYS_MS

  const shouldShow =
    trailViewCount >= 3 &&
    (deferredPrompt !== null || isIOS) &&
    !isStandalone &&
    cooldownExpired

  async function promptInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  function dismiss() {
    useUIStore.getState().dismissInstallPrompt()
  }

  return { shouldShow, isIOS, promptInstall, dismiss }
}
