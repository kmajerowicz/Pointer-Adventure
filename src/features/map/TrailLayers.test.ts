import { describe, test, expect, vi } from 'vitest'
import { routesToPointFeatures, pttkToLineFeatures, initTrailLayers } from './TrailLayers'
import type { Route } from '../../lib/types'

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'r1',
    source_id: 'osm:1',
    name: 'Test Trail',
    description: null,
    geometry: { type: 'LineString', coordinates: [[19.0, 50.0], [19.1, 50.1]] },
    length_km: 5,
    surface_type: 'dirt',
    difficulty: 'easy',
    water_access: 'none',
    source: 'osm',
    water_type: null,
    dogs_allowed: true,
    trail_color: 'red',
    is_marked: true,
    center_lat: 50.05,
    center_lon: 19.05,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    ...overrides,
  }
}

function makeMockMap(sourceExists = false) {
  const mockSource = sourceExists
    ? { setData: vi.fn(), getClusterExpansionZoom: vi.fn() }
    : null

  return {
    getSource: vi.fn((id: string) => (id === 'trails' && sourceExists ? mockSource : null)),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }
}

describe('routesToPointFeatures', () => {
  test('converts Route[] to GeoJSON FeatureCollection of Points using center_lat/center_lon', () => {
    const routes = [
      makeRoute({ id: 'r1', name: 'Trail A', trail_color: 'red', source: 'osm', center_lat: 50.1, center_lon: 19.1 }),
      makeRoute({ id: 'r2', name: 'Trail B', trail_color: 'blue', source: 'pttk', center_lat: 51.0, center_lon: 20.0 }),
    ]

    const fc = routesToPointFeatures(routes)

    expect(fc.type).toBe('FeatureCollection')
    expect(fc.features).toHaveLength(2)

    const f1 = fc.features[0]
    expect(f1.geometry.type).toBe('Point')
    if (f1.geometry.type === 'Point') {
      expect(f1.geometry.coordinates).toEqual([19.1, 50.1])
    }
    expect(f1.properties).toMatchObject({ id: 'r1', name: 'Trail A', trail_color: 'red', source: 'osm' })

    const f2 = fc.features[1]
    expect(f2.geometry.type).toBe('Point')
    if (f2.geometry.type === 'Point') {
      expect(f2.geometry.coordinates).toEqual([20.0, 51.0])
    }
    expect(f2.properties).toMatchObject({ id: 'r2', name: 'Trail B', trail_color: 'blue', source: 'pttk' })
  })

  test('returns empty FeatureCollection for empty array', () => {
    const fc = routesToPointFeatures([])
    expect(fc.type).toBe('FeatureCollection')
    expect(fc.features).toHaveLength(0)
  })
})

describe('pttkToLineFeatures', () => {
  test('filters to only source===pttk routes with geometry, returns FeatureCollection', () => {
    const pttkRoute = makeRoute({
      id: 'pttk1',
      source: 'pttk',
      trail_color: 'yellow',
      geometry: { type: 'LineString', coordinates: [[19.0, 50.0], [19.1, 50.1]] },
    })

    const fc = pttkToLineFeatures([pttkRoute])
    expect(fc.type).toBe('FeatureCollection')
    expect(fc.features).toHaveLength(1)
    expect(fc.features[0].properties).toMatchObject({ id: 'pttk1', trail_color: 'yellow' })
  })

  test('excludes non-PTTK routes and routes without geometry', () => {
    const osmRoute = makeRoute({ id: 'osm1', source: 'osm' })
    const pttkNoGeom = makeRoute({ id: 'pttk2', source: 'pttk', geometry: null as unknown as Route['geometry'] })
    const pttkWithGeom = makeRoute({ id: 'pttk3', source: 'pttk' })

    const fc = pttkToLineFeatures([osmRoute, pttkNoGeom, pttkWithGeom])
    expect(fc.features).toHaveLength(1)
    expect(fc.features[0].properties?.id).toBe('pttk3')
  })
})

describe('initTrailLayers', () => {
  test('calls addSource twice and addLayer for cluster/unclustered/line layers', () => {
    const mockMap = makeMockMap(false) as unknown as Parameters<typeof initTrailLayers>[0]

    initTrailLayers(mockMap)

    expect(mockMap.addSource).toHaveBeenCalledTimes(2)
    expect(mockMap.addSource).toHaveBeenCalledWith('trails', expect.objectContaining({ type: 'geojson', cluster: true }))
    expect(mockMap.addSource).toHaveBeenCalledWith('trails-lines', expect.objectContaining({ type: 'geojson' }))

    // Should add cluster, cluster-count, unclustered, line-casing, line-fill layers
    expect(mockMap.addLayer).toHaveBeenCalledTimes(5)

    const layerIds = (mockMap.addLayer as ReturnType<typeof vi.fn>).mock.calls.map(
      (call: unknown[]) => (call[0] as { id: string }).id
    )
    expect(layerIds).toContain('trail-clusters')
    expect(layerIds).toContain('trail-cluster-count')
    expect(layerIds).toContain('trail-unclustered')
    expect(layerIds).toContain('trail-line-casing')
    expect(layerIds).toContain('trail-line-fill')
  })

  test('is idempotent — if map.getSource("trails") returns truthy, does NOT call addSource again', () => {
    const mockMap = makeMockMap(true) as unknown as Parameters<typeof initTrailLayers>[0]

    initTrailLayers(mockMap)

    expect(mockMap.addSource).not.toHaveBeenCalled()
    expect(mockMap.addLayer).not.toHaveBeenCalled()
  })
})
