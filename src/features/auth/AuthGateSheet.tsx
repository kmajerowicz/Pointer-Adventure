import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface AuthGateSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthGateSheet({ isOpen, onClose }: AuthGateSheetProps) {
  const navigate = useNavigate()
  const [isClosing, setIsClosing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      setIsClosing(false)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setMounted(false)
      onClose()
    }, 200)
  }

  const handleLogin = () => {
    navigate('/app/auth')
    handleClose()
  }

  if (!mounted && !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
          isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={`relative w-full bg-bg-surface rounded-t-2xl px-6 pt-6 pb-10 transition-transform duration-200 ease-out ${
          isOpen && !isClosing ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-bg-elevated" />

        <div className="flex flex-col items-center text-center gap-4">
          <div className="text-4xl mt-2">🐾</div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-text-primary">
              Zaloguj się, aby zapisać ulubione trasy
            </h2>
          </div>

          <button
            onClick={handleLogin}
            className="w-full min-h-[48px] rounded-xl bg-accent text-bg-base font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all mt-2"
          >
            Zaloguj się
          </button>

          <button
            type="button"
            onClick={() => { navigate('/app/auth?mode=register'); handleClose() }}
            className="text-sm text-accent hover:text-accent-hover transition-colors"
          >
            Nie masz konta? Załóż konto
          </button>
        </div>
      </div>
    </div>
  )
}
