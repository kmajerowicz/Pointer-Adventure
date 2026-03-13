import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useViewportStore } from '../../stores/viewport'
import { MapControls } from './MapControls'
import { LocationSearch } from './LocationSearch'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [searchHighlighted, setSearchHighlighted] = useState(false)

  const setCenter = useViewportStore((s) => s.setCenter)
  const setZoom = useViewportStore((s) => s.setZoom)
  const setBounds = useViewportStore((s) => s.setBounds)

  // Check WebGL support at render time — throw so MapErrorBoundary catches it
  if (!mapboxgl.supported()) {
    throw new Error('WebGL2 not supported on this device')
  }

  useEffect(() => {
    // Guard: Strict Mode double-init prevention (MAP-06)
    if (mapRef.current) return
    if (!containerRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [19.145, 51.919],
      zoom: 6,
      attributionControl: false,
    })

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right',
    )

    // Wire moveend → Zustand viewport store (MAP-04)
    map.on('moveend', () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      const bounds = map.getBounds()

      setCenter([center.lng, center.lat])
      setZoom(zoom)

      if (bounds) {
        setBounds({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        })
      }
    })

    mapRef.current = map

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [setCenter, setZoom, setBounds])

  function handleGpsDenied() {
    setSearchHighlighted(true)
    setTimeout(() => setSearchHighlighted(false), 2000)
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />
      <LocationSearch mapRef={mapRef} searchHighlighted={searchHighlighted} />
      <MapControls mapRef={mapRef} onGpsDenied={handleGpsDenied} />
    </div>
  )
}
