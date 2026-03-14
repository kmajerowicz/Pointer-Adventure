import { useState, useRef, useEffect, useCallback, type RefObject } from 'react'
import mapboxgl from 'mapbox-gl'
import { Search, X } from 'lucide-react'
import { searchLocations, type GeocodingFeature } from './geocoding'

interface LocationSearchProps {
  mapRef: RefObject<mapboxgl.Map | null>
  searchHighlighted?: boolean
  disabled?: boolean
}

export function LocationSearch({ mapRef, searchHighlighted = false, disabled = false }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodingFeature[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  // Remove temporary pin marker
  const removeMarker = useCallback(() => {
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
  }, [])

  // Close dropdown on outside click/touch
  useEffect(() => {
    function handleOutsideInteraction(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideInteraction)
    document.addEventListener('touchstart', handleOutsideInteraction)
    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction)
      document.removeEventListener('touchstart', handleOutsideInteraction)
    }
  }, [])

  // Cleanup debounce timer and dragstart listener on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
      const map = mapRef.current
      if (map) {
        map.off('dragstart', removeMarker)
      }
    }
  }, [mapRef, removeMarker])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)

    // Clear previous debounce timer
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    if (value.trim().length < 3) {
      setIsOpen(false)
      setResults([])
      return
    }

    debounceTimerRef.current = setTimeout(async () => {
      // Cancel previous in-flight request
      if (abortControllerRef.current) abortControllerRef.current.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setIsLoading(true)
      const features = await searchLocations(value, controller.signal)
      setIsLoading(false)

      if (!controller.signal.aborted) {
        setResults(features)
        setIsOpen(features.length > 0)
      }
    }, 300)
  }

  function handleSelect(feature: GeocodingFeature) {
    const [lng, lat] = feature.geometry.coordinates
    const map = mapRef.current

    setQuery(feature.properties.name)
    setIsOpen(false)

    if (map) {
      map.flyTo({ center: [lng, lat], zoom: 14, duration: 1500, essential: true })

      // Remove previous marker and place new accent-colored pin
      removeMarker()
      markerRef.current = new mapboxgl.Marker({ color: '#C9A84C' })
        .setLngLat([lng, lat])
        .addTo(map)

      // Remove marker on next user pan — once() self-cleans after firing
      map.once('dragstart', removeMarker)
    }
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setIsOpen(false)
    const map = mapRef.current
    if (map) {
      map.off('dragstart', removeMarker)
    }
    removeMarker()
    inputRef.current?.focus()
  }

  return (
    <div
      ref={containerRef}
      className={`absolute top-4 left-4 right-4 z-10${disabled ? ' opacity-50 pointer-events-none' : ''}`}
    >
      {/* Search input wrapper */}
      <div
        className={[
          'flex items-center gap-2',
          'bg-bg-surface rounded-lg px-4 py-3 shadow-lg',
          'border',
          searchHighlighted
            ? 'border-accent ring-2 ring-accent animate-pulse'
            : 'border-transparent focus-within:border-accent',
          'transition-all duration-200',
        ].join(' ')}
      >
        <Search
          size={18}
          strokeWidth={1.75}
          className={isLoading ? 'text-accent animate-pulse' : 'text-text-muted'}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleInputChange}
          placeholder={disabled ? 'Wyszukiwanie niedostępne offline' : 'Szukaj miejscowości...'}
          aria-label="Szukaj miejscowości"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          autoComplete="off"
          disabled={disabled}
          className={`flex-1 bg-transparent text-sm outline-none min-w-0 ${disabled ? 'text-text-muted placeholder:text-text-muted cursor-not-allowed' : 'text-text-primary placeholder:text-text-muted'}`}
        />
        {query && (
          <button
            onClick={handleClear}
            aria-label="Wyczyść wyszukiwanie"
            className="text-text-muted hover:text-text-primary transition-colors p-0.5 -mr-0.5"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          aria-label="Sugestie lokalizacji"
          className="mt-1 bg-bg-elevated rounded-lg shadow-xl overflow-hidden"
        >
          {results.map((feature) => (
            <li key={feature.properties.mapbox_id} role="option">
              <button
                onMouseDown={(e) => {
                  // Prevent blur from firing before click registers
                  e.preventDefault()
                  handleSelect(feature)
                }}
                className={[
                  'w-full text-left px-4 py-3 min-h-[3rem]',
                  'flex flex-col justify-center gap-0.5',
                  'hover:bg-bg-surface active:bg-bg-surface',
                  'transition-colors',
                ].join(' ')}
              >
                <span className="text-sm text-text-primary leading-tight">
                  {feature.properties.name}
                </span>
                {feature.properties.place_formatted && (
                  <span className="text-xs text-text-secondary leading-tight">
                    {feature.properties.place_formatted}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
