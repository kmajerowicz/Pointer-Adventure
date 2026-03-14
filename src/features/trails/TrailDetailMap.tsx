import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import type { Geometry, Position } from 'geojson'
import type { Route } from '../../lib/types'
import { TRAIL_COLOR_MAP, ACCENT_GOLD } from '../../lib/trailColors'

interface TrailDetailMapProps {
  route: Route
}

/**
 * Recursively flatten any GeoJSON geometry into a flat array of [lng, lat] positions.
 */
function flattenCoords(geometry: Geometry): Position[] {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates]
    case 'MultiPoint':
    case 'LineString':
      return geometry.coordinates
    case 'MultiLineString':
    case 'Polygon':
      return geometry.coordinates.flat()
    case 'MultiPolygon':
      return geometry.coordinates.flat(2)
    case 'GeometryCollection':
      return geometry.geometries.flatMap(flattenCoords)
  }
}

function fitBoundsOrCenter(map: mapboxgl.Map, route: Route): void {
  const coords = flattenCoords(route.geometry)

  if (coords.length >= 2) {
    const bounds = new mapboxgl.LngLatBounds()
    for (const [lng, lat] of coords) {
      bounds.extend([lng, lat])
    }
    map.fitBounds(bounds, { padding: 40, duration: 0 })
  } else {
    // Single point or no geometry — center on trail's centroid
    map.setCenter([route.center_lon, route.center_lat])
    map.setZoom(14)
  }
}

export function TrailDetailMap({ route }: TrailDetailMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    // Strict Mode double-init guard — identical pattern to MapView
    if (mapRef.current) return
    if (!containerRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [route.center_lon, route.center_lat],
      zoom: 12,
      attributionControl: false,
      interactive: true,
    })

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('style.load', () => {
      // Add route geometry as GeoJSON source
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: route.geometry,
          properties: {},
        },
      })

      const lineColor = route.trail_color
        ? (TRAIL_COLOR_MAP[route.trail_color] ?? ACCENT_GOLD)
        : ACCENT_GOLD

      // Casing for contrast
      map.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#1a1a1a', 'line-width': 7 },
      })

      // Colored fill on top
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': lineColor, 'line-width': 4 },
      })

      fitBoundsOrCenter(map, route)
    })

    mapRef.current = map

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  // Route data won't change while detail is mounted — empty dep array is intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
