export interface GeocodingFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
  properties: {
    name: string
    place_formatted: string
    mapbox_id: string
    feature_type: string
  }
}

/**
 * Search for Polish locations using Mapbox Geocoding v6 API.
 * Returns empty array for queries shorter than 3 characters (billing optimization).
 * Accepts an AbortSignal to cancel in-flight requests.
 */
export async function searchLocations(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodingFeature[]> {
  if (query.trim().length < 3) return []

  // If already aborted before we even start
  if (signal?.aborted) return []

  const params = new URLSearchParams({
    q: query,
    country: 'pl',
    limit: '5',
    language: 'pl',
    access_token: import.meta.env.VITE_MAPBOX_TOKEN as string,
  })

  const url = `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`

  try {
    const response = await fetch(url, { signal })

    if (!response.ok) return []

    const data = (await response.json()) as { features?: GeocodingFeature[] }
    return data.features ?? []
  } catch {
    // AbortError or network errors — silently return empty
    return []
  }
}
