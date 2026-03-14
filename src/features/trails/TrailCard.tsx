import { ChevronRight, Check, Droplet, Heart } from 'lucide-react'
import type { Route } from '../../lib/types'

interface TrailCardProps {
  route: Route
  distanceKm: number | null
  onClick: () => void
  isFavorited?: boolean
  isWalked?: boolean
  onFavoriteToggle?: (e: React.MouseEvent) => void
}

// Explicit class map — NEVER dynamic string interpolation (Tailwind v4 purges it)
const TRAIL_COLOR_BORDER: Record<NonNullable<Route['trail_color']>, string> = {
  red: 'border-l-trail-red',
  blue: 'border-l-trail-blue',
  yellow: 'border-l-trail-yellow',
  green: 'border-l-trail-green',
  // trail-black (#1A1A1A) is too dark for dark bg-bg-surface — use a visible gray-600 equivalent
  black: 'border-l-[#808080]',
}

const SURFACE_LABEL: Record<Route['surface_type'], string> = {
  dirt: 'Ziemia',
  gravel: 'Żwir',
  asphalt: 'Asfalt',
  mixed: 'Mieszana',
  unknown: 'Nieznana',
}

const DIFFICULTY_LABEL: Record<Route['difficulty'], string | null> = {
  easy: 'Łatwa',
  moderate: 'Średnia',
  hard: 'Trudna',
  unknown: null,
}

const DIFFICULTY_COLOR: Record<Route['difficulty'], string> = {
  easy: 'text-success',
  moderate: 'text-warning',
  hard: 'text-error',
  unknown: 'text-text-muted',
}

export function TrailCard({
  route,
  distanceKm,
  onClick,
  isFavorited = false,
  isWalked = false,
  onFavoriteToggle,
}: TrailCardProps) {
  const borderClass =
    route.trail_color ? TRAIL_COLOR_BORDER[route.trail_color] : 'border-l-transparent'

  const difficultyLabel = DIFFICULTY_LABEL[route.difficulty]

  return (
    // Use a div + role=button to avoid nesting <button> inside <button>
    // Heart action is a separate <button> that stops propagation
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className={`w-full flex items-stretch text-left bg-bg-surface active:bg-bg-elevated transition-colors border-l-4 ${borderClass} min-h-[72px] cursor-pointer`}
    >
      {/* Main content */}
      <div className="flex-1 px-4 py-3 flex flex-col justify-center gap-1 min-w-0">
        {/* Line 1: trail name + walked indicator + length */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-text-primary text-sm font-medium truncate">
            {route.name ?? 'Trasa bez nazwy'}
          </span>
          {isWalked && (
            <span title="Przeszedłem tę trasę" className="shrink-0">
              <Check size={14} className="text-success" />
            </span>
          )}
          {route.length_km != null && (
            <span className="text-text-secondary text-sm shrink-0">
              {route.length_km.toFixed(1)} km
            </span>
          )}
        </div>

        {/* Line 2: badges + distance */}
        <div className="flex items-center gap-1.5">
          {/* Surface badge */}
          <span className="text-xs bg-bg-elevated text-text-secondary rounded px-1.5 py-0.5 shrink-0">
            {SURFACE_LABEL[route.surface_type]}
          </span>

          {/* Water access icon */}
          {route.water_access === 'on_route' && (
            <Droplet
              size={14}
              className="text-blue-400 shrink-0"
              fill="currentColor"
              aria-label="Woda na trasie"
            />
          )}
          {route.water_access === 'nearby' && (
            <Droplet
              size={14}
              className="text-blue-400/50 shrink-0"
              aria-label="Woda w pobliżu"
            />
          )}

          {/* Difficulty badge */}
          {difficultyLabel && (
            <span
              className={`text-xs bg-bg-elevated rounded px-1.5 py-0.5 shrink-0 ${DIFFICULTY_COLOR[route.difficulty]}`}
            >
              {difficultyLabel}
            </span>
          )}

          {/* Distance — muted, right-aligned */}
          {distanceKm != null && (
            <span className="ml-auto text-xs text-text-muted shrink-0">
              {distanceKm < 1
                ? `${Math.round(distanceKm * 1000)} m`
                : `${distanceKm.toFixed(1)} km`}
            </span>
          )}
        </div>
      </div>

      {/* Heart or Chevron */}
      <div className="flex items-center pr-3 pl-1">
        {isFavorited ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFavoriteToggle?.(e) }}
            aria-label="Usuń z ulubionych"
            className="flex items-center justify-center size-12 text-accent"
          >
            <Heart size={18} fill="currentColor" />
          </button>
        ) : onFavoriteToggle ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFavoriteToggle?.(e) }}
            aria-label="Dodaj do ulubionych"
            className="flex items-center justify-center size-12 text-text-muted"
          >
            <Heart size={18} />
          </button>
        ) : (
          <ChevronRight size={16} className="text-text-muted" />
        )}
      </div>
    </div>
  )
}
