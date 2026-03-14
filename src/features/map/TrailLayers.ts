import mapboxgl, { type Map as MapboxMap, type GeoJSONSource } from 'mapbox-gl'
import type { FeatureCollection, Point, Feature } from 'geojson'
import type { Route } from '../../lib/types'
import { TRAIL_COLOR_MAP, ACCENT_GOLD, DARK_CASING } from '../../lib/trailColors'

export function routesToPointFeatures(routes: Route[]): FeatureCollection<Point> {
  const features: Feature<Point>[] = routes.map((r, i) => ({
    type: 'Feature',
    id: i,
    geometry: {
      type: 'Point',
      coordinates: [r.center_lon, r.center_lat],
    },
    properties: {
      routeId: r.id || r.source_id,
      name: r.name,
      trail_color: r.trail_color,
      source: r.source,
    },
  }))

  return { type: 'FeatureCollection', features }
}

export function pttkToLineFeatures(routes: Route[]): FeatureCollection {
  const features = routes
    .filter((r) => r.source === 'pttk' && r.geometry != null)
    .map((r, i) => ({
      type: 'Feature' as const,
      id: i,
      geometry: r.geometry,
      properties: {
        routeId: r.id || r.source_id,
        name: r.name,
        trail_color: r.trail_color,
      },
    }))

  return { type: 'FeatureCollection', features }
}

export function initTrailLayers(map: MapboxMap): void {
  // Idempotency guard — handles React Strict Mode double-init
  if (map.getSource('trails')) return

  const emptyFC: FeatureCollection = { type: 'FeatureCollection', features: [] }

  // Cluster source for pins
  map.addSource('trails', {
    type: 'geojson',
    data: emptyFC,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  })

  // Line source for PTTK polylines (no clustering)
  map.addSource('trails-lines', {
    type: 'geojson',
    data: emptyFC,
  })

  // Cluster circle layer
  map.addLayer({
    id: 'trail-clusters',
    type: 'circle',
    source: 'trails',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ACCENT_GOLD,
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        16,
        10, 22,
        50, 28,
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': DARK_CASING,
    },
  })

  // Cluster count label
  map.addLayer({
    id: 'trail-cluster-count',
    type: 'symbol',
    source: 'trails',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-size': 12,
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': DARK_CASING,
    },
  })

  // Unclustered pin layer with color-coded dots
  map.addLayer({
    id: 'trail-unclustered',
    type: 'circle',
    source: 'trails',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match',
        ['get', 'trail_color'],
        'red', TRAIL_COLOR_MAP.red,
        'blue', TRAIL_COLOR_MAP.blue,
        'yellow', TRAIL_COLOR_MAP.yellow,
        'green', TRAIL_COLOR_MAP.green,
        'black', TRAIL_COLOR_MAP.black,
        ACCENT_GOLD, // default
      ],
      'circle-radius': 6,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': DARK_CASING,
    },
  })

  // PTTK line casing (dark outline)
  map.addLayer({
    id: 'trail-line-casing',
    type: 'line',
    source: 'trails-lines',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': DARK_CASING,
      'line-width': 7,
    },
  })

  // PTTK line fill (colored)
  map.addLayer({
    id: 'trail-line-fill',
    type: 'line',
    source: 'trails-lines',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': [
        'match',
        ['get', 'trail_color'],
        'red', TRAIL_COLOR_MAP.red,
        'blue', TRAIL_COLOR_MAP.blue,
        'yellow', TRAIL_COLOR_MAP.yellow,
        'green', TRAIL_COLOR_MAP.green,
        'black', TRAIL_COLOR_MAP.black,
        ACCENT_GOLD,
      ],
      'line-width': 4,
    },
  })
}

export function updateTrailData(map: MapboxMap, routes: Route[]): void {
  const trailsSource = map.getSource('trails') as GeoJSONSource | undefined
  const linesSource = map.getSource('trails-lines') as GeoJSONSource | undefined

  if (trailsSource) {
    trailsSource.setData(routesToPointFeatures(routes))
  }
  if (linesSource) {
    linesSource.setData(pttkToLineFeatures(routes))
  }
}

export function setupTrailInteractions(
  map: MapboxMap,
  onTrailClick?: (id: string) => void,
): void {
  // Cluster click — expand (no onTrailClick behavior, always zoom in)
  map.on('click', 'trail-clusters', (e) => {
    if (!e.features || e.features.length === 0) return
    const feature = e.features[0]
    const clusterId = feature.properties?.cluster_id as number
    const source = map.getSource('trails') as GeoJSONSource

    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return
      if (feature.geometry.type === 'Point') {
        map.easeTo({
          center: feature.geometry.coordinates as [number, number],
          zoom: zoom ?? 14,
        })
      }
    })
  })

  // Unclustered pin click — navigate to detail if callback provided, else show popup
  map.on('click', 'trail-unclustered', (e) => {
    if (!e.features || e.features.length === 0) return
    const feature = e.features[0]
    // Properties may be stringified by Mapbox clustering — try both properties and feature id
    const id = feature.properties?.routeId as string | undefined

    if (onTrailClick && id) {
      onTrailClick(id)
      return
    }

    // Fallback: popup (backward-compatible)
    const name = feature.properties?.name as string | null
    if (feature.geometry.type === 'Point') {
      new mapboxgl.Popup()
        .setLngLat(feature.geometry.coordinates as [number, number])
        .setHTML(`<span>${name ?? 'Trasa'}</span>`)
        .addTo(map)
    }
  })

  // Line click — navigate to detail if callback provided, else show popup
  map.on('click', 'trail-line-fill', (e) => {
    if (!e.features || e.features.length === 0) return
    const feature = e.features[0]
    const id = feature.properties?.routeId as string | undefined

    if (onTrailClick && id) {
      onTrailClick(id)
      return
    }

    // Fallback: popup (backward-compatible)
    const name = feature.properties?.name as string | null
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`<span>${name ?? 'Trasa'}</span>`)
      .addTo(map)
  })

  // Cursor changes
  map.on('mouseenter', 'trail-unclustered', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'trail-unclustered', () => { map.getCanvas().style.cursor = '' })
  map.on('mouseenter', 'trail-line-fill', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'trail-line-fill', () => { map.getCanvas().style.cursor = '' })
}
