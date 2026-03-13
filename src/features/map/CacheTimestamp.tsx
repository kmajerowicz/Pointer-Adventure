import { useTrailsStore } from '../../stores/trails'

function getRelativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'Zaktualizowano: teraz'
  if (diffMinutes === 1) return 'Zaktualizowano: 1 min temu'
  if (diffMinutes < 60) return `Zaktualizowano: ${diffMinutes} min temu`
  if (diffHours === 1) return 'Zaktualizowano: 1 godz. temu'
  if (diffHours < 24) return `Zaktualizowano: ${diffHours} godz. temu`
  if (diffDays === 1) return 'Zaktualizowano: 1 dzien temu'
  return `Zaktualizowano: ${diffDays} dni temu`
}

interface CacheTimestampProps {
  forceRefresh: () => void
}

export function CacheTimestamp({ forceRefresh }: CacheTimestampProps) {
  const lastFetched = useTrailsStore((s) => s.lastFetched)

  if (!lastFetched) return null

  return (
    <div className="absolute bottom-6 left-3 z-10 flex items-center gap-1">
      <span className="text-text-muted text-xs">{getRelativeTime(lastFetched)}</span>
      <button
        onClick={forceRefresh}
        aria-label="Odswiez trasy"
        className="text-text-muted p-1 rounded hover:text-text-secondary transition-colors"
        style={{ minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Circular arrow refresh icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 2v6h-6" />
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M3 22v-6h6" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
      </button>
    </div>
  )
}
