import { SlidersHorizontal } from 'lucide-react'
import { useActiveFilterCount } from '../../hooks/useActiveFilterCount'

interface FilterButtonProps {
  onPress: () => void
}

export function FilterButton({ onPress }: FilterButtonProps) {
  const count = useActiveFilterCount()

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={count > 0 ? `Filtry tras (${count} aktywne)` : 'Filtry tras'}
      className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-bg-surface text-text-primary shadow-lg flex items-center justify-center active:scale-95 transition-transform"
    >
      <SlidersHorizontal size={20} strokeWidth={1.75} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-bg-base text-[0.6rem] font-bold flex items-center justify-center"
        >
          {count}
        </span>
      )}
    </button>
  )
}
