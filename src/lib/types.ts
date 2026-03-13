export interface Route {
  id: string
  source_id: string
  name: string | null
  description: string | null
  geometry: import('geojson').Geometry
  length_km: number | null
  surface_type: 'dirt' | 'gravel' | 'asphalt' | 'mixed' | 'unknown'
  difficulty: 'easy' | 'moderate' | 'hard' | 'unknown'
  water_access: 'none' | 'nearby' | 'on_route'
  source: 'osm' | 'pttk' | null
  water_type: 'river' | 'lake' | 'stream' | null
  dogs_allowed: boolean | null
  trail_color: 'red' | 'blue' | 'yellow' | 'green' | 'black' | null
  is_marked: boolean
  center_lat: number
  center_lon: number
  created_at: string
  updated_at: string
}

export interface SearchArea {
  id: string
  bbox_hash: string
  north: number
  south: number
  east: number
  west: number
  fetched_at: string
  expires_at: string
}

export interface Favorite {
  id: string
  user_id: string
  route_id: string
  note: string | null
  created_at: string
}

export interface ActivityLogEntry {
  id: string
  user_id: string
  route_id: string
  walked_at: string
  created_at: string
}

export interface User {
  id: string
  display_name: string | null
  dog_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Invitation {
  id: string
  token: string
  created_by: string
  used_by: string | null
  used_at: string | null
  expires_at: string
  created_at: string
}

export type SurfaceType = Route['surface_type']
export type Difficulty = Route['difficulty']
export type TrailColor = NonNullable<Route['trail_color']>
export type WaterAccess = Route['water_access']
export type WaterType = Route['water_type']
