import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchLocations, type GeocodingFeature } from './geocoding'

// Mock import.meta.env
vi.stubEnv('VITE_MAPBOX_TOKEN', 'test-token')

const makeMockFeature = (name: string, place_formatted: string): GeocodingFeature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [19.937, 50.061] },
  properties: {
    name,
    place_formatted,
    mapbox_id: `mapbox-id-${name}`,
    feature_type: 'place',
  },
})

const mockFeature = makeMockFeature('Kraków', 'Kraków, Małopolskie, Polska')

function makeOkResponse(features: GeocodingFeature[]) {
  return new Response(JSON.stringify({ features }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('searchLocations', () => {
  test('returns empty array for queries shorter than 3 characters', async () => {
    const result = await searchLocations('Kr')
    expect(result).toEqual([])
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  test('returns empty array for empty query', async () => {
    const result = await searchLocations('')
    expect(result).toEqual([])
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  test('calls Mapbox Geocoding v6 endpoint with correct params (country=pl, limit=5, language=pl)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse([mockFeature]))

    await searchLocations('Kraków')

    expect(vi.mocked(fetch)).toHaveBeenCalledOnce()
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('https://api.mapbox.com/search/geocode/v6/forward')
    expect(calledUrl).toContain('q=Krak%C3%B3w')
    expect(calledUrl).toContain('country=pl')
    expect(calledUrl).toContain('limit=5')
    expect(calledUrl).toContain('language=pl')
    expect(calledUrl).toContain('access_token=test-token')
  })

  test('parses response and returns array of GeocodingFeature objects', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse([mockFeature]))

    const result = await searchLocations('Kraków')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(mockFeature)
  })

  test('returns empty array on HTTP error (non-ok response)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    )

    const result = await searchLocations('Kraków')
    expect(result).toEqual([])
  })

  test('returns empty array when AbortSignal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    const result = await searchLocations('Kraków', controller.signal)
    expect(result).toEqual([])
  })
})
