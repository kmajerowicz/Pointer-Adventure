import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useNavigate } from 'react-router-dom'
import { useViewportStore } from '../../stores/viewport'
import { useTrails } from '../../hooks/useTrails'
import { useFilteredRoutes } from '../../hooks/useFilteredRoutes'
import { initTrailLayers, setupTrailInteractions, updateTrailData } from './TrailLayers'
import { MapControls } from './MapControls'
import { LocationSearch } from './LocationSearch'
import { LoadingBar } from './LoadingBar'
import { CacheTimestamp } from './CacheTimestamp'
import { FilterButton } from './FilterButton'
import { FilterPanel } from './FilterPanel'
import { ActiveFilterChips } from './ActiveFilterChips'
import { useUIStore } from '../../stores/ui'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const navigate = useNavigate()
  // Store navigate in a ref so the style.load closure always has the latest stable reference
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate
  const [searchHighlighted, setSearchHighlighted] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setCenter = useViewportStore((s) => s.setCenter)
  const setZoom = useViewportStore((s) => s.setZoom)
  const setBounds = useViewportStore((s) => s.setBounds)
  const requestedZoom = useViewportStore((s) => s.requestedZoom)
  const clearRequestedZoom = useViewportStore((s) => s.clearRequestedZoom)

  const filteredRoutes = useFilteredRoutes()
  const { loading, error, retry, forceRefresh } = useTrails()

  const isFilterOpen = useUIStore((s) => s.isFilterOpen)
  const setFilterOpen = useUIStore((s) => s.setFilterOpen)
  const [scrollToCategory, setScrollToCategory] = useState<string | null>(null)

  // Check WebGL support at render time — throw so MapErrorBoundary catches it
  if (!mapboxgl.supported()) {
    throw new Error('WebGL2 not supported on this device')
  }

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      setErrorToast(error)
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      errorTimerRef.current = setTimeout(() => setErrorToast(null), 5000)
    }
  }, [error])

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [])

  // Watch requestedZoom — dispatched by EmptyTrailState zoom-out CTA
  useEffect(() => {
    const map = mapRef.current
    if (requestedZoom == null || !map) return
    map.flyTo({ zoom: requestedZoom, center: map.getCenter() })
    clearRequestedZoom()
  }, [requestedZoom, clearRequestedZoom])

  // Map initialization
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

    // Initialize trail layers once map style is loaded
    map.on('style.load', () => {
      initTrailLayers(map)
      setupTrailInteractions(map, (id) => navigateRef.current(`/trails/${id}`))
    })

    mapRef.current = map

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [setCenter, setZoom, setBounds])

  // Update trail data whenever routes change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!map.getSource('trails')) return
    updateTrailData(map, filteredRoutes)
  }, [filteredRoutes])

  function handleChipTap(category: string) {
    setScrollToCategory(category)
    setFilterOpen(true)
  }

  function handleGpsDenied() {
    setSearchHighlighted(true)
    setTimeout(() => setSearchHighlighted(false), 2000)
  }

  function handleRetry() {
    setErrorToast(null)
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    retry?.()
  }

  return (
    <div className="relative w-full flex-1 h-full">
      <LoadingBar visible={loading} />
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      <LocationSearch mapRef={mapRef} searchHighlighted={searchHighlighted} />
      {/* Active filter chips — positioned below the search bar */}
      <div className="absolute top-[4.5rem] left-4 right-4 z-10">
        <ActiveFilterChips onChipTap={handleChipTap} />
      </div>
      <MapControls mapRef={mapRef} onGpsDenied={handleGpsDenied} />
      <FilterButton onPress={() => setFilterOpen(true)} />
      <CacheTimestamp forceRefresh={forceRefresh} />
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => {
          setFilterOpen(false)
          setScrollToCategory(null)
        }}
        scrollToCategory={scrollToCategory}
      />

      {/* Error toast — trail fetch failure */}
      {errorToast && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-[calc(var(--spacing-tab-bar)+5rem)] left-1/2 -translate-x-1/2 z-50 bg-bg-elevated text-text-primary text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-[fade-in_200ms]"
        >
          <span>{errorToast}</span>
          <button
            onClick={handleRetry}
            className="text-accent font-medium hover:underline shrink-0"
          >
            Sprobuj ponownie
          </button>
        </div>
      )}
    </div>
  )
}
