interface WelcomeStepProps {
  name: string | null
  onNext: () => void
}

export function WelcomeStep({ name, onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[80vh] px-6 text-center">
      <div className="text-6xl mb-6" role="img" aria-label="Łapa psa">🐾</div>
      <h1 className="text-3xl font-bold text-text-primary mb-3">
        {name ? `Witaj, ${name}!` : 'Witaj!'}
      </h1>
      <p className="text-text-secondary text-lg leading-relaxed mb-12 max-w-xs">
        Odkrywaj najlepsze trasy spacerowe dla Ciebie i Twojego psa.
      </p>
      <button
        onClick={onNext}
        className="w-full max-w-xs bg-accent text-bg-base font-semibold rounded-lg py-3 min-h-[48px] hover:bg-accent/90 transition-colors active:scale-95"
      >
        Dalej
      </button>
    </div>
  )
}
