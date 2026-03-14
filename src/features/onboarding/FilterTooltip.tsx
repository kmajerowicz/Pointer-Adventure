import { useEffect } from 'react'
import { useUIStore } from '../../stores/ui'

export function FilterTooltip() {
  const showFilterTooltip = useUIStore((s) => s.showFilterTooltip)
  const setShowFilterTooltip = useUIStore((s) => s.setShowFilterTooltip)

  useEffect(() => {
    if (!showFilterTooltip) return

    const timer = setTimeout(() => {
      setShowFilterTooltip(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [showFilterTooltip, setShowFilterTooltip])

  if (!showFilterTooltip) return null

  return (
    <button
      onClick={() => setShowFilterTooltip(false)}
      aria-label="Zamknij podpowiedź"
      className="absolute right-4 z-40"
      style={{ bottom: 'calc(var(--spacing-tab-bar) + 4.5rem)' }}
    >
      <div className="bg-accent text-bg-base text-sm font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap relative">
        Filtruj trasy tutaj
        {/* Arrow pointing down */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-accent" />
      </div>
    </button>
  )
}
