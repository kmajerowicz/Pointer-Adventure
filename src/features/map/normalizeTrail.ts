import type { Route, TrailColor, SurfaceType, Difficulty } from '../../lib/types'

export interface OverpassGeomNode {
  lat: number
  lon: number
}

export interface OverpassMember {
  type: string
  ref: number
  role: string
  geometry?: OverpassGeomNode[]
}

export interface OverpassElement {
  type: 'way' | 'relation' | 'node'
  id: number
  tags?: Record<string, string>
  geometry?: OverpassGeomNode[]
  members?: OverpassMember[]
}

const VALID_COLORS: TrailColor[] = ['red', 'blue', 'yellow', 'green', 'black']

/**
 * Extract trail color from OSM tags.
 * Checks osmc:symbol first (format: waycolor:bgcolor:foreground),
 * falls back to colour tag.
 */
export function extractTrailColor(tags: Record<string, string>): TrailColor | null {
  const osmcSymbol = tags['osmc:symbol']
  if (osmcSymbol) {
    const wayColor = osmcSymbol.split(':')[0].toLowerCase()
    if (VALID_COLORS.includes(wayColor as TrailColor)) {
      return wayColor as TrailColor
    }
  }

  const colour = tags['colour']
  if (colour) {
    const normalized = colour.toLowerCase()
    if (VALID_COLORS.includes(normalized as TrailColor)) {
      return normalized as TrailColor
    }
  }

  return null
}

/**
 * Determine if trail is a PTTK-managed route.
 * Checks operator tag (case-insensitive 'pttk') or network in rwn/lwn/nwn.
 */
export function isPTTK(tags: Record<string, string>): boolean {
  const operator = tags['operator'] ?? ''
  if (operator.toLowerCase().includes('pttk')) return true

  const network = tags['network'] ?? ''
  if (['rwn', 'lwn', 'nwn'].includes(network)) return true

  return false
}

/**
 * Map OSM surface values to our SurfaceType enum.
 */
export function normalizeSurface(surface: string | undefined): SurfaceType {
  switch (surface) {
    case 'ground':
    case 'earth':
    case 'sand':
    case 'dirt':
      return 'dirt'
    case 'gravel':
    case 'fine_gravel':
      return 'gravel'
    case 'asphalt':
    case 'paved':
    case 'concrete':
      return 'asphalt'
    case 'compacted':
    case 'pebblestone':
      return 'mixed'
    default:
      return 'unknown'
  }
}

/**
 * Map OSM sac_scale values to our Difficulty enum.
 */
export function normalizeDifficulty(sacScale: string | undefined): Difficulty {
  switch (sacScale) {
    case 'hiking':
      return 'easy'
    case 'mountain_hiking':
      return 'moderate'
    case 'demanding_mountain_hiking':
    case 'alpine_hiking':
    case 'difficult_alpine_hiking':
    case 'demanding_alpine_hiking':
      return 'hard'
    default:
      return 'unknown'
  }
}

/**
 * Convert an Overpass element to a Partial<Route>.
 * Returns null if no geometry can be extracted.
 */
export function normalizeElement(el: OverpassElement): Partial<Route> | null {
  const tags = el.tags ?? {}
  let coordinates: [number, number][][] = []

  if (el.type === 'way' && el.geometry && el.geometry.length > 0) {
    const line: [number, number][] = el.geometry.map((n) => [n.lon, n.lat])
    coordinates = [line]
  } else if (el.type === 'relation' && el.members) {
    for (const member of el.members) {
      if (member.type === 'way' && member.geometry && member.geometry.length > 0) {
        const line: [number, number][] = member.geometry.map((n) => [n.lon, n.lat])
        coordinates.push(line)
      }
    }
  }

  if (coordinates.length === 0) return null

  // Flatten all coordinates to compute center
  const allPoints = coordinates.flat()
  const centerLat = allPoints.reduce((sum, c) => sum + c[1], 0) / allPoints.length
  const centerLon = allPoints.reduce((sum, c) => sum + c[0], 0) / allPoints.length

  const geometry =
    coordinates.length === 1
      ? { type: 'LineString' as const, coordinates: coordinates[0] }
      : { type: 'MultiLineString' as const, coordinates }

  const pttk = isPTTK(tags)
  const trailColor = extractTrailColor(tags)

  // Compute length_km for LineString (rough approximation)
  let length_km: number | null = null
  if (coordinates.length === 1) {
    const pts = coordinates[0]
    let dist = 0
    for (let i = 1; i < pts.length; i++) {
      const dLat = (pts[i][1] - pts[i - 1][1]) * (Math.PI / 180)
      const dLon = (pts[i][0] - pts[i - 1][0]) * (Math.PI / 180)
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(pts[i - 1][1] * (Math.PI / 180)) *
          Math.cos(pts[i][1] * (Math.PI / 180)) *
          Math.sin(dLon / 2) ** 2
      dist += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }
    length_km = Math.round(dist * 10) / 10
  }

  return {
    source_id: `osm:${el.type}:${el.id}`,
    name: tags['name'] ?? null,
    description: tags['description'] ?? null,
    geometry,
    length_km,
    surface_type: normalizeSurface(tags['surface']),
    difficulty: normalizeDifficulty(tags['sac_scale']),
    water_access: 'none',
    source: pttk ? 'pttk' : 'osm',
    water_type: null,
    dogs_allowed: tags['dogs'] === 'yes' ? true : tags['dogs'] === 'no' ? false : null,
    trail_color: trailColor,
    is_marked: pttk || trailColor !== null,
    center_lat: centerLat,
    center_lon: centerLon,
  }
}

/**
 * Produce a stable hash for a bounding box.
 * Rounds to 2 decimal places, returns 'south,west,north,east'.
 */
export function bboxHash(
  north: number,
  south: number,
  east: number,
  west: number,
): string {
  const r = (v: number) => Math.round(v * 100) / 100
  return `${r(south)},${r(west)},${r(north)},${r(east)}`
}

/**
 * Build the Overpass QL query for a bounding box.
 * Bbox order for Overpass: south,west,north,east (lat/lon).
 */
export function buildOverpassQuery(bbox: {
  north: number
  south: number
  east: number
  west: number
}): string {
  const { north, south, east, west } = bbox
  const b = `${south},${west},${north},${east}`

  return `[out:json][timeout:25];
(
  relation["type"="route"]["route"="hiking"](${b});
  relation["type"="route"]["route"="foot"](${b});
  way["highway"~"^(footway|path|track)$"][highway!=primary][highway!=secondary][highway!=tertiary][highway!=residential][highway!=service][dogs!=no](${b});
  relation["leisure"="nature_reserve"](${b});
);
out geom;`
}
