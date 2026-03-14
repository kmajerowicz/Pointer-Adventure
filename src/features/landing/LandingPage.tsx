import { Link } from 'react-router-dom'
import { MapPin, SlidersHorizontal, Heart, WifiOff, ArrowRight, Mail, Map, Footprints } from 'lucide-react'

/* ── Inline SVG topo pattern ── */
const topoPatternSvg = `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4D8DC' stroke-width='1' opacity='0.35'%3E%3Cpath d='M0 80 Q100 60 200 90 T400 70'/%3E%3Cpath d='M0 140 Q80 120 180 150 T400 130'/%3E%3Cpath d='M0 200 Q120 180 220 210 T400 190'/%3E%3Cpath d='M0 260 Q90 240 190 270 T400 250'/%3E%3Cpath d='M0 320 Q110 300 210 330 T400 310'/%3E%3Cpath d='M0 380 Q100 360 200 390 T400 370'/%3E%3Cpath d='M0 40 Q60 20 160 50 T400 30'/%3E%3C/g%3E%3C/svg%3E")`

/* ── Poland map with trail lines — used as prominent visual element ── */
function PolandMap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 480" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Poland fill */}
      <path
        d="M180 40 L220 35 L270 30 L310 38 L350 32 L380 45 L410 55 L430 80 L445 110 L440 140 L450 170 L440 200 L430 230 L410 250 L390 265 L370 290 L350 310 L330 340 L310 360 L280 380 L250 395 L220 400 L190 410 L160 400 L130 380 L110 350 L90 320 L80 290 L75 260 L70 230 L80 200 L90 170 L100 140 L110 110 L130 80 L155 55 Z"
        fill="#2D5A3D" fillOpacity="0.08"
        stroke="#2D5A3D" strokeWidth="2" strokeOpacity="0.25"
      />
      {/* Red trail — south */}
      <path d="M100 310 Q150 290 200 300 Q250 310 300 290 Q350 270 390 280" stroke="#E53E3E" strokeWidth="3" strokeOpacity="0.6" strokeLinecap="round" strokeDasharray="8 5" />
      {/* Blue trail — central */}
      <path d="M120 220 Q180 200 240 210 Q300 220 360 200 Q400 190 430 210" stroke="#3B82F6" strokeWidth="3" strokeOpacity="0.55" strokeLinecap="round" strokeDasharray="8 5" />
      {/* Yellow trail — north */}
      <path d="M140 150 Q200 135 260 145 Q320 155 380 140" stroke="#EAB308" strokeWidth="2.5" strokeOpacity="0.55" strokeLinecap="round" strokeDasharray="7 4" />
      {/* Green trail — vertical */}
      <path d="M250 60 Q240 120 255 180 Q270 240 260 310 Q250 360 245 390" stroke="#22C55E" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" strokeDasharray="7 4" />
      {/* Black trail — short */}
      <path d="M330 280 Q340 300 335 330" stroke="#444" strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" strokeDasharray="5 4" />
      {/* Marker dots */}
      <circle cx="250" cy="210" r="6" fill="#E53E3E" fillOpacity="0.5" />
      <circle cx="260" cy="145" r="5" fill="#3B82F6" fillOpacity="0.5" />
      <circle cx="255" cy="300" r="6" fill="#22C55E" fillOpacity="0.45" />
      <circle cx="200" cy="300" r="5" fill="#E53E3E" fillOpacity="0.45" />
      <circle cx="360" cy="200" r="5" fill="#3B82F6" fillOpacity="0.45" />
      <circle cx="335" cy="305" r="4" fill="#444" fillOpacity="0.3" />
      {/* City labels — tiny text */}
      <circle cx="270" cy="175" r="3.5" fill="#1A1A1A" fillOpacity="0.2" />
      <circle cx="180" cy="245" r="3" fill="#1A1A1A" fillOpacity="0.18" />
      <circle cx="340" cy="155" r="2.5" fill="#1A1A1A" fillOpacity="0.18" />
      <circle cx="150" cy="340" r="2.5" fill="#1A1A1A" fillOpacity="0.18" />
      <circle cx="390" cy="120" r="2.5" fill="#1A1A1A" fillOpacity="0.15" />
    </svg>
  )
}

const features = [
  {
    icon: MapPin,
    title: 'Interaktywna mapa',
    desc: 'Przeglądaj szlaki na mapie topograficznej. Włącz lokalizację i\u00a0zobacz trasy w\u00a0okolicy.',
    color: 'bg-forest/10 text-forest',
  },
  {
    icon: SlidersHorizontal,
    title: 'Filtry szlaków',
    desc: 'Filtruj po kolorze PTTK, długości i\u00a0nawierzchni. Znajdź idealny spacer dla siebie i\u00a0psa.',
    color: 'bg-amber-500/10 text-earth',
  },
  {
    icon: Heart,
    title: 'Ulubione i historia',
    desc: 'Zapisuj trasy, dodawaj notatki i\u00a0śledź historię swoich wędrówek z\u00a0czworonogiem.',
    color: 'bg-red-500/10 text-trail-red',
  },
  {
    icon: WifiOff,
    title: 'Działa offline',
    desc: 'Zainstaluj jako aplikację — korzystaj nawet bez zasięgu w\u00a0terenie.',
    color: 'bg-sky/20 text-[#5a8a9e]',
  },
]

const trailColors = [
  { name: 'Czerwony', hex: '#E53E3E', desc: 'Główne szlaki o znaczeniu krajowym' },
  { name: 'Niebieski', hex: '#3B82F6', desc: 'Regionalne trasy łączące miejscowości' },
  { name: 'Żółty', hex: '#EAB308', desc: 'Idealne na popołudniowy spacer z psem' },
  { name: 'Zielony', hex: '#22C55E', desc: 'Alternatywne trasy i dojścia' },
  { name: 'Czarny', hex: '#333', desc: 'Krótkie trasy dojazdowe do schronisk' },
]

const steps = [
  { num: '1', icon: Mail, title: 'Otrzymaj zaproszenie', desc: 'Poproś znajomego o link — społeczność rośnie organicznie.' },
  { num: '2', icon: Map, title: 'Odkryj szlaki', desc: 'Otwórz mapę, włącz GPS i przeglądaj oznaczone trasy w okolicy.' },
  { num: '3', icon: Footprints, title: 'Ruszaj na szlak', desc: 'Wybierz trasę, zabierz psa i odkrywaj nowe miejsca razem.' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen font-sans antialiased">

      {/* ═══ HERO ═══ */}
      <section
        className="relative overflow-hidden min-h-[90vh] flex flex-col"
        style={{ background: 'linear-gradient(170deg, #8eb5c8 0%, #a7c5d4 25%, #c8d5d0 50%, #e2ddd4 75%, #F7F5F0 100%)' }}
      >
        {/* Topo pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-70" style={{ backgroundImage: topoPatternSvg, backgroundSize: '400px 400px' }} />

        {/* Nav */}
        <nav className="relative max-w-7xl mx-auto w-full px-6 lg:px-10 pt-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg overflow-hidden">
              <img src="/icons/icon-192.png" alt="" width={36} height={36} className="w-full h-full scale-110 object-cover" />
            </div>
            <span className="text-base font-semibold text-text-dark">Psi Szlak</span>
          </div>
          <Link to="/app/auth" className="text-sm font-medium text-text-body hover:text-forest transition-colors px-4 py-2 rounded-lg hover:bg-black/5">
            Zaloguj się
          </Link>
        </nav>

        {/* Hero grid */}
        <div className="relative flex-1 flex items-center max-w-7xl mx-auto w-full px-6 lg:px-10 py-12 lg:py-0">
          <div className="w-full grid lg:grid-cols-2 gap-10 lg:gap-0 items-center">

            {/* Left — text */}
            <div className="max-w-lg lg:max-w-xl z-10">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-text-dark leading-[1.05]">
                Odkryj szlaki
                <span className="block text-forest">z Twoim psem</span>
              </h1>

              <p className="mt-6 text-lg text-text-body leading-relaxed max-w-md">
                Interaktywna mapa szlaków PTTK w Polsce. Filtruj trasy, zapisuj ulubione i planuj wędrówki z&nbsp;czworonogiem.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-10">
                <Link
                  to="/app"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-accent text-white font-semibold text-base min-h-[52px] shadow-lg shadow-accent/25 hover:bg-cta-hover-light active:scale-[0.98] transition-all"
                >
                  Otwórz aplikację
                  <ArrowRight size={18} strokeWidth={2.5} />
                </Link>
                <Link
                  to="/app/auth"
                  className="inline-flex items-center justify-center px-6 py-4 rounded-xl border-2 border-text-dark/15 text-text-dark font-medium text-sm min-h-[52px] hover:border-text-dark/30 hover:bg-black/5 active:scale-[0.98] transition-all"
                >
                  Mam już konto
                </Link>
              </div>

              {/* Trail color dots */}
              <div className="mt-8 flex items-center gap-3">
                <div className="flex gap-1.5">
                  {['#E53E3E', '#3B82F6', '#EAB308', '#22C55E', '#333'].map((c) => (
                    <span key={c} className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="text-sm text-text-body/60">5 kolorów szlaków PTTK</span>
              </div>
            </div>

            {/* Right — logo + map composition */}
            <div className="relative flex items-center justify-center lg:justify-end">
              {/* Poland map — large background */}
              <PolandMap className="absolute w-[420px] h-[400px] sm:w-[500px] sm:h-[480px] lg:w-[560px] lg:h-[538px] -right-4 lg:right-0 opacity-80" />

              {/* App icon — overlaid on map */}
              <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/25 w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] lg:w-[280px] lg:h-[280px]">
                <img
                  src="/icons/icon-512.png"
                  alt="Wyżeł niemiecki szorstkowłosy na leśnym szlaku"
                  className="w-full h-full object-cover scale-[1.08]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="bg-page-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 md:py-28">
          <div className="max-w-2xl mb-14">
            <span className="text-xs font-semibold text-accent uppercase tracking-widest">Funkcje</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-dark tracking-tight">
              Wszystko czego potrzebujesz na szlaku
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-text-dark">{title}</h3>
                <p className="mt-1.5 text-sm text-text-body leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="bg-page-bg-alt">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-xs font-semibold text-forest uppercase tracking-widest">Jak zacząć</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-dark tracking-tight">
              Trzy kroki do pierwszego szlaku
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.num} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-forest flex items-center justify-center mb-4 shadow-md shadow-forest/20">
                  <span className="text-white text-xl font-bold">{s.num}</span>
                </div>
                <s.icon size={24} className="text-forest/50 mb-3" />
                <h3 className="font-semibold text-text-dark text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-text-body leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRAIL COLORS ═══ */}
      <section className="bg-page-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 md:py-28">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-start">
            {/* Left — text + map */}
            <div>
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">Oznaczenia PTTK</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-dark tracking-tight">
                Szlaki we&nbsp;wszystkich kolorach
              </h2>
              <p className="mt-4 text-text-body leading-relaxed text-lg max-w-md">
                Polskie szlaki turystyczne oznaczone są pięcioma kolorami. Filtruj trasy po kolorze i znajdź idealne na spacer z&nbsp;psem.
              </p>
              <PolandMap className="hidden lg:block w-[280px] h-[269px] mt-8 opacity-50" />
            </div>

            {/* Right — color cards */}
            <div className="space-y-3">
              {trailColors.map((t) => (
                <div key={t.name} className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <span className="shrink-0 w-4 h-10 rounded-full" style={{ backgroundColor: t.hex }} />
                  <div className="min-w-0">
                    <span className="font-semibold text-text-dark text-sm">{t.name}</span>
                    <p className="text-xs text-text-body mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="relative bg-bg-base overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: topoPatternSvg, backgroundSize: '400px 400px' }} />
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-trail-red via-trail-blue to-trail-green opacity-60" />

        <div className="relative max-w-3xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-black/40 mx-auto mb-8">
            <img src="/icons/icon-192.png" alt="Psi Szlak" className="w-full h-full object-cover scale-110" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight">
            Gotowy na szlak?
          </h2>
          <p className="mt-4 text-lg text-text-secondary leading-relaxed max-w-md mx-auto">
            Otwórz aplikację, znajdź trasę w okolicy i ruszaj na przygodę z&nbsp;Twoim psem.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-accent text-bg-base font-semibold text-lg min-h-[52px] shadow-lg shadow-accent/30 hover:bg-accent-hover active:scale-[0.98] transition-all"
            >
              Otwórz Psi Szlak
              <ArrowRight size={20} strokeWidth={2.5} />
            </Link>
            <Link to="/app/auth" className="text-sm font-medium text-text-secondary hover:text-accent transition-colors px-4 py-3">
              Zaloguj się do konta
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-bg-base border-t border-bg-elevated">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md overflow-hidden">
              <img src="/icons/icon-192.png" alt="" width={28} height={28} className="w-full h-full object-cover scale-110" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Psi Szlak</span>
          </div>
          <p className="text-xs text-text-muted">&copy; {new Date().getFullYear()} Psi Szlak. Dane szlaków na podstawie OpenStreetMap.</p>
        </div>
      </footer>
    </div>
  )
}
