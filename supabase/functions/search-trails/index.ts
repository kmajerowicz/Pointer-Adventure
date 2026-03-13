import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// ---------------------------------------------------------------------------
// Types (inlined — Deno cannot import from src/)
// ---------------------------------------------------------------------------

type SurfaceType = 'dirt' | 'gravel' | 'asphalt' | 'mixed' | 'unknown'
type Difficulty = 'easy' | 'moderate' | 'hard' | 'unknown'
type TrailColor = 'red' | 'blue' | 'yellow' | 'green' | 'black'
type WaterAccess = 'none' | 'nearby' | 'on_route'

interface OverpassGeomNode {
  lat: number
  lon: number
}

interface OverpassMember {
  type: string
  ref: number
  role: string
  geometry?: OverpassGeomNode[]
}

interface OverpassElement {
  type: 'way' | 'relation' | 'node'
  id: number
  tags?: Record<string, string>
  geometry?: OverpassGeomNode[]
  members?: OverpassMember[]
}

interface OverpassResponse {
  elements: OverpassElement[]
}

interface Bbox {
  north: number
  south: number
  east: number
  west: number
}

interface NormalizedRoute {
  source_id: string
  name: string | null
  description: string | null
  geometry: object
  length_km: number | null
  surface_type: SurfaceType
  difficulty: Difficulty
  water_access: WaterAccess
  source: 'osm' | 'pttk' | null
  water_type: null
  dogs_allowed: boolean | null
  trail_color: TrailColor | null
  is_marked: boolean
  center_lat: number
  center_lon: number
}

// ---------------------------------------------------------------------------
// Helpers (inlined from normalizeTrail.ts)
// ---------------------------------------------------------------------------

const VALID_COLORS: TrailColor[] = ['red', 'blue', 'yellow', 'green', 'black']

function extractTrailColor(tags: Record<string, string>): TrailColor | null {
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

function isPTTK(tags: Record<string, string>): boolean {
  const operator = tags['operator'] ?? ''
  if (operator.toLowerCase().includes('pttk')) return true
  const network = tags['network'] ?? ''
  if (['rwn', 'lwn', 'nwn'].includes(network)) return true
  return false
}

function normalizeSurface(surface: string | undefined): SurfaceType {
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

function normalizeDifficulty(sacScale: string | undefined): Difficulty {
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

function normalizeElement(el: OverpassElement): NormalizedRoute | null {
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

  const allPoints = coordinates.flat()
  const centerLat = allPoints.reduce((sum, c) => sum + c[1], 0) / allPoints.length
  const centerLon = allPoints.reduce((sum, c) => sum + c[0], 0) / allPoints.length

  const geometry =
    coordinates.length === 1
      ? { type: 'LineString', coordinates: coordinates[0] }
      : { type: 'MultiLineString', coordinates }

  // Compute rough length_km for all geometries
  let dist = 0
  for (const line of coordinates) {
    for (let i = 1; i < line.length; i++) {
      const dLat = (line[i][1] - line[i - 1][1]) * (Math.PI / 180)
      const dLon = (line[i][0] - line[i - 1][0]) * (Math.PI / 180)
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(line[i - 1][1] * (Math.PI / 180)) *
          Math.cos(line[i][1] * (Math.PI / 180)) *
          Math.sin(dLon / 2) ** 2
      dist += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }
  }
  const length_km = Math.round(dist * 10) / 10

  const pttk = isPTTK(tags)
  const trailColor = extractTrailColor(tags)

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

function bboxHash(north: number, south: number, east: number, west: number): string {
  const r = (v: number) => Math.round(v * 100) / 100
  return `${r(south)},${r(west)},${r(north)},${r(east)}`
}

function buildOverpassQuery(bbox: Bbox): string {
  const { north, south, east, west } = bbox
  const b = `${south},${west},${north},${east}`
  return `[out:json][timeout:25];
(
  relation["type"="route"]["route"="hiking"]["network"="lwn"](${b});
  relation["type"="route"]["route"="foot"]["network"="lwn"](${b});
  relation["type"="route"]["route"="walking"]["network"="lwn"](${b});
  relation["type"="route"]["route"="hiking"]["network"="rwn"](${b});
  way["highway"="path"]["name"]["dogs"!="no"](${b});
  way["highway"="track"]["name"]["dogs"!="no"](${b});
  way["highway"="footway"]["name"]["footway"!="sidewalk"]["dogs"!="no"](${b});
);
out geom;`
}

// ---------------------------------------------------------------------------
// Overpass fetch with retry (inlined from fetchOverpass.ts)
// ---------------------------------------------------------------------------

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const TIMEOUT_MS = 20_000
const MAX_RETRIES = 2

async function fetchOverpass(query: string, attempt = 0): Promise<OverpassResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return (await response.json()) as OverpassResponse
  } catch (err) {
    clearTimeout(timeoutId)
    if (attempt < MAX_RETRIES) {
      const backoff = 1000 * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, backoff))
      return fetchOverpass(query, attempt + 1)
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// Edge Function entry point
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    // Parse and validate request body
    const body = await req.json()
    const { north, south, east, west, force } = body as {
      north?: number
      south?: number
      east?: number
      west?: number
      force?: boolean
    }

    if (
      typeof north !== 'number' ||
      typeof south !== 'number' ||
      typeof east !== 'number' ||
      typeof west !== 'number'
    ) {
      return new Response(
        JSON.stringify({ error: 'Nieprawidlowe parametry bbox' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const bbox: Bbox = { north, south, east, west }
    const hash = bboxHash(north, south, east, west)

    // Create Supabase service-role client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Cache check (PIPE-01) — skip if force=true
    if (!force) {
      const { data: cachedArea } = await supabase
        .from('search_areas')
        .select('id, expires_at')
        .eq('bbox_hash', hash)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (cachedArea) {
        // Return cached routes within bbox bounds
        const { data: routes, error: routesError } = await supabase
          .from('routes')
          .select('*')
          .gte('center_lat', south)
          .lte('center_lat', north)
          .gte('center_lon', west)
          .lte('center_lon', east)

        if (routesError) {
          console.error('Error fetching cached routes:', routesError)
        }

        return new Response(
          JSON.stringify({ routes: routes ?? [], cached: true }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    }

    // Cache miss — fetch from Overpass (PIPE-02, PIPE-03, PIPE-06)
    let overpassData: OverpassResponse
    try {
      overpassData = await fetchOverpass(buildOverpassQuery(bbox))
    } catch (_err) {
      return new Response(
        JSON.stringify({ error: 'Overpass API niedostepny' }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Normalize (PIPE-04) — filter out routes longer than 30km (not dog-walk friendly)
    const normalizedRoutes = overpassData.elements
      .map((el) => normalizeElement(el))
      .filter((r): r is NormalizedRoute => r !== null)
      .filter((r) => r.length_km === null || r.length_km <= 30)

    // Upsert routes (PIPE-05)
    if (normalizedRoutes.length > 0) {
      const { error: upsertError } = await supabase
        .from('routes')
        .upsert(normalizedRoutes, { onConflict: 'source_id' })

      if (upsertError) {
        console.error('Error upserting routes:', upsertError)
      }
    }

    // Insert search_areas record with 7-day TTL
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { error: searchAreaError } = await supabase.from('search_areas').insert({
      bbox_hash: hash,
      north,
      south,
      east,
      west,
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })

    if (searchAreaError) {
      console.error('Error inserting search_area:', searchAreaError)
    }

    return new Response(
      JSON.stringify({ routes: normalizedRoutes, cached: false }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Wewnetrzny blad serwera' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
