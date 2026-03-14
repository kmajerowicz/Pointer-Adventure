import { useState } from 'react'
import { X, Share2 } from 'lucide-react'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'

export function InstallPrompt() {
  const { shouldShow, isIOS, promptInstall, dismiss } = useInstallPrompt()
  const [isClosing, setIsClosing] = useState(false)

  if (!shouldShow && !isClosing) return null

  function handleDismiss() {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      dismiss()
    }, 200)
  }

  return (
    <div
      className={[
        'fixed left-0 right-0 z-40 bg-bg-elevated rounded-t-xl shadow-xl px-4 py-4',
        isClosing
          ? 'animate-[sheet-down_200ms_ease-in_forwards]'
          : 'animate-[sheet-up_300ms_ease-out]',
      ].join(' ')}
      style={{ bottom: 'var(--spacing-tab-bar)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Zainstaluj aplikację"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Zamknij"
        className="absolute top-3 right-3 flex items-center justify-center size-8 rounded-full text-text-muted hover:text-text-primary transition-colors"
      >
        <X size={18} />
      </button>

      {/* Heading */}
      <h2 className="text-text-primary text-base font-semibold pr-8">
        Zainstaluj Psi Szlak
      </h2>

      {/* Subtitle */}
      <p className="text-text-secondary text-sm mt-1 mb-3">
        Dodaj do ekranu głównego, by mieć szybki dostęp do tras
      </p>

      {/* Android/Chrome path */}
      {!isIOS && (
        <button
          type="button"
          onClick={promptInstall}
          className="bg-accent text-bg-base font-medium rounded-lg px-4 py-3 min-h-[48px] w-full"
        >
          Zainstaluj
        </button>
      )}

      {/* iOS path */}
      {isIOS && (
        <p className="text-text-secondary text-sm flex items-center gap-1 flex-wrap">
          Kliknij{' '}
          <Share2 size={16} className="inline-block shrink-0 text-text-primary" />
          {' '}Udostępnij{' '}
          <span className="text-text-muted">&rarr;</span>{' '}
          Dodaj do ekranu głównego
        </p>
      )}
    </div>
  )
}
