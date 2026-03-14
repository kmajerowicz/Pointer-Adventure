import { useNavigate } from 'react-router-dom'

export function WelcomePage() {
  const navigate = useNavigate()

  const handleBrowse = () => {
    localStorage.setItem('psi_szlak_welcomed', '1')
    navigate('/')
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-bg-base px-6 text-center">
      <div className="text-6xl mb-6">🐾</div>
      <h1 className="text-3xl font-bold text-text-primary mb-3">Psi Szlak</h1>
      <p className="text-text-secondary text-lg mb-10 max-w-xs">
        Odkrywaj trasy spacerowe dla Ciebie i Twojego psa
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate('/auth')}
          className="w-full h-12 rounded-lg bg-accent text-bg-base font-semibold text-base active:scale-[0.97] transition-transform"
        >
          Zaloguj sie
        </button>
        <button
          onClick={handleBrowse}
          className="w-full h-12 rounded-lg border border-text-muted text-text-secondary text-base active:scale-[0.97] transition-transform"
        >
          Najpierw rozgladam sie
        </button>
      </div>
    </div>
  )
}
