import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Droplet, MapPin } from 'lucide-react'
import { useTrailsStore } from '../../stores/trails'
import { useViewportStore } from '../../stores/viewport'
import { useGeolocation } from '../../hooks/useGeolocation'
import { haversineKm } from '../../lib/haversine'
import type { Route } from '../../lib/types'
import { TrailDetailMap } from './TrailDetailMap'

// --- Label maps (same as TrailCard) ---

const SURFACE_LABEL: Record<Route['surface_type'], string> = {
  dirt: 'Ziemia',
  gravel: 'Zwir',
  asphalt: 'Asfalt',
  mixed: 'Mieszana',
  unknown: 'Nieznana',
}

const DIFFICULTY_LABEL: Record<Route['difficulty'], string | null> = {
  easy: 'Latwa',
  moderate: 'Srednia',
  hard: 'Trudna',
  unknown: null,
}

const DIFFICULTY_COLOR: Record<Route['difficulty'], string> = {
  easy: 'text-success',
  moderate: 'text-warning',
  hard: 'text-error',
  unknown: 'text-text-muted',
}

const WATER_ACCESS_LABEL: Record<Route['water_access'], string> = {
  none: 'Brak wody',
  nearby: 'Woda w pobliżu',
  on_route: 'Woda na trasie',
}

// Explicit class map — no dynamic string interpolation (Tailwind v4 purges dynamic classes)
const TRAIL_COLOR_BORDER: Record<NonNullable<Route['trail_color']>, string> = {
  red: 'bg-trail-red',
  blue: 'bg-trail-blue',
  yellow: 'bg-trail-yellow',
  green: 'bg-trail-green',
  black: 'bg-[#808080]',
}

const TRAIL_COLOR_LABEL: Record<NonNullable<Route['trail_color']>, string> = {
  red: 'Czerwony',
  blue: 'Niebieski',
  yellow: 'Zolty',
  green: 'Zielony',
  black: 'Czarny',
}

// --- Sub-components ---

function AttributeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-bg-elevated last:border-b-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm text-text-primary font-medium text-right">{children}</span>
    </div>
  )
}

// --- Not found state ---

function TrailNotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-bg-base gap-4 px-8 text-center">
      <MapPin size={40} className="text-text-muted" />
      <h1 className="text-xl font-semibold text-text-primary">Trasa niedostepna</h1>
      <p className="text-sm text-text-secondary">
        Nie znaleziono trasy o podanym identyfikatorze.
      </p>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-full bg-bg-elevated text-text-primary text-sm font-medium min-h-[48px] active:bg-bg-surface transition-colors"
      >
        <ArrowLeft size={16} />
        Wroc do mapy
      </button>
    </div>
  )
}

// --- Main component ---

export function TrailDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const route = useTrailsStore((s) => s.routes.find((r) => r.id === id))

  // Distance computation — same origin logic as TrailList
  const { state: geoState } = useGeolocation()
  const viewportCenter = useViewportStore((s) => s.center)
  const viewportLat = viewportCenter[1]
  const viewportLon = viewportCenter[0]

  const originLat =
    geoState.status === 'success' ? geoState.position.coords.latitude : viewportLat
  const originLon =
    geoState.status === 'success' ? geoState.position.coords.longitude : viewportLon

  if (!route) {
    return <TrailNotFound />
  }

  const distanceKm = haversineKm(originLat, originLon, route.center_lat, route.center_lon)

  const difficultyLabel = DIFFICULTY_LABEL[route.difficulty]

  return (
    <div className="flex flex-col h-screen bg-bg-base overflow-hidden">
      {/* Map hero ~40vh */}
      <div className="relative" style={{ height: '40vh', minHeight: '200px' }}>
        <TrailDetailMap route={route} />

        {/* Back button overlay */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Wroc"
          className="absolute top-4 left-4 z-10 flex items-center justify-center size-11 rounded-full bg-bg-elevated/80 text-text-primary backdrop-blur-sm active:bg-bg-elevated transition-colors shadow-md"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Info section ~60vh — scrollable */}
      <div className="flex-1 overflow-y-auto bg-bg-base">
        <div className="px-4 pt-5 pb-4">
          {/* Trail name */}
          <h1 className="text-xl font-semibold text-text-primary mb-4 leading-tight">
            {route.name ?? 'Trasa bez nazwy'}
          </h1>

          {/* Attributes list */}
          <div className="bg-bg-surface rounded-xl px-4 mb-4">
            {/* Length */}
            {route.length_km != null && (
              <AttributeRow label="Dlugos">
                {route.length_km.toFixed(1)} km
              </AttributeRow>
            )}

            {/* Surface */}
            <AttributeRow label="Nawierzchnia">
              <span className="bg-bg-elevated text-text-secondary text-xs px-2 py-1 rounded">
                {SURFACE_LABEL[route.surface_type]}
              </span>
            </AttributeRow>

            {/* Difficulty */}
            {difficultyLabel && (
              <AttributeRow label="Trudnosc">
                <span className={`text-xs bg-bg-elevated px-2 py-1 rounded ${DIFFICULTY_COLOR[route.difficulty]}`}>
                  {difficultyLabel}
                </span>
              </AttributeRow>
            )}

            {/* Water access */}
            <AttributeRow label="Woda">
              <span className="flex items-center gap-1.5">
                {route.water_access !== 'none' && (
                  <Droplet
                    size={14}
                    className={route.water_access === 'on_route' ? 'text-blue-400' : 'text-blue-400/50'}
                    fill={route.water_access === 'on_route' ? 'currentColor' : 'none'}
                  />
                )}
                {WATER_ACCESS_LABEL[route.water_access]}
              </span>
            </AttributeRow>

            {/* PTTK color indicator */}
            {route.trail_color && (
              <AttributeRow label="Kolor szlaku PTTK">
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block size-3 rounded-full ${TRAIL_COLOR_BORDER[route.trail_color]}`}
                  />
                  {TRAIL_COLOR_LABEL[route.trail_color]}
                </span>
              </AttributeRow>
            )}

            {/* Marked */}
            {route.is_marked && (
              <AttributeRow label="Oznakowanie">
                <span className="text-xs bg-bg-elevated text-text-secondary px-2 py-1 rounded">
                  Znakowany
                </span>
              </AttributeRow>
            )}

            {/* Distance from user */}
            <AttributeRow label="Odleglosc od Ciebie">
              {distanceKm < 1
                ? `${Math.round(distanceKm * 1000)} m`
                : `${distanceKm.toFixed(1)} km`}
            </AttributeRow>
          </div>

          {/* Description */}
          {route.description && (
            <div className="bg-bg-surface rounded-xl px-4 py-4">
              <p className="text-sm text-text-secondary leading-relaxed">{route.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
