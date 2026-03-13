import { useViewportStore } from '../../stores/viewport'

export function EmptyTrailState() {
  function handleZoomOut() {
    useViewportStore.getState().requestZoomOut(9)
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 gap-6 text-center">
      {/* Placeholder SVG slot — user will supply final illustration */}
      <div
        className="w-24 h-24 rounded-full bg-bg-elevated flex items-center justify-center"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 text-text-muted"
        >
          <path
            d="M32 8C18.745 8 8 18.745 8 32s10.745 24 24 24 24-10.745 24-24S45.255 8 32 8z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M20 36c0-6.627 5.373-12 12-12s12 5.373 12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M26 28l6-8 6 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Message */}
      <div className="flex flex-col gap-2">
        <p className="text-text-primary text-lg font-semibold">Brak tras w okolicy</p>
        <p className="text-text-secondary text-sm">
          Przesun mape lub poszerz obszar szukania
        </p>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleZoomOut}
        className="bg-accent text-bg-base font-semibold text-sm px-6 py-3 rounded-xl min-h-[48px] active:opacity-80 transition-opacity"
      >
        Szukaj w promieniu 50 km
      </button>
    </div>
  )
}
