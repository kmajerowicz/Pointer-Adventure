import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[MapErrorBoundary] Map failed to load:', error, info)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-bg-surface gap-4 px-6 text-center">
          <AlertTriangle className="w-12 h-12 text-error" strokeWidth={1.5} />
          <h2 className="text-text-primary text-xl font-semibold">
            Nie udało się załadować mapy
          </h2>
          <p className="text-text-secondary text-sm max-w-xs">
            Sprawdź połączenie internetowe i odśwież stronę
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-3 rounded-full bg-accent text-bg-base font-semibold text-sm active:scale-95 transition-transform"
          >
            Spróbuj ponownie
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
