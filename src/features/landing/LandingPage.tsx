import { Link } from 'react-router-dom'
import { MapPin, SlidersHorizontal, Heart, WifiOff, ArrowRight, Mail, Map, Footprints } from 'lucide-react'

/* ── Inline SVG topo pattern (brand element from logo) ── */
const topoPatternSvg = `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4D8DC' stroke-width='1' opacity='0.35'%3E%3Cpath d='M0 80 Q100 60 200 90 T400 70'/%3E%3Cpath d='M0 140 Q80 120 180 150 T400 130'/%3E%3Cpath d='M0 200 Q120 180 220 210 T400 190'/%3E%3Cpath d='M0 260 Q90 240 190 270 T400 250'/%3E%3Cpath d='M0 320 Q110 300 210 330 T400 310'/%3E%3Cpath d='M0 380 Q100 360 200 390 T400 370'/%3E%3Cpath d='M0 40 Q60 20 160 50 T400 30'/%3E%3C/g%3E%3C/svg%3E")`

/* ── Decorative Poland map outline with trail lines ── */
function PolandMapDecoration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Poland outline */}
      <path
        d="M180 40 L220 35 L270 30 L310 38 L350 32 L380 45 L410 55 L430 80 L445 110 L440 140 L450 170 L440 200 L430 230 L410 250 L390 265 L370 290 L350 310 L330 340 L310 360 L280 380 L250 395 L220 400 L190 410 L160 400 L130 380 L110 350 L90 320 L80 290 L75 260 L70 230 L80 200 L90 170 L100 140 L110 110 L130 80 L155 55 Z"
        fill="#2D5A3D"
        fillOpacity="0.06"
        stroke="#2D5A3D"
        strokeWidth="1.5"
        strokeOpacity="0.15"
      />
      {/* Red trail */}
      <path
        d="M100 310 Q150 290 200 300 Q250 310 300 290 Q350 270 390 280"
        stroke="#E53E3E"
        strokeWidth="2.5"
        strokeOpacity="0.5"
        strokeLinecap="round"
        strokeDasharray="8 4"
      />
      {/* Blue trail */}
      <path
        d="M120 220 Q180 200 240 210 Q300 220 360 200 Q400 190 430 210"
        stroke="#3B82F6"
        strokeWidth="2.5"
        strokeOpacity="0.45"
        strokeLinecap="round"
        strokeDasharray="8 4"
      />
      {/* Yellow trail */}
      <path
        d="M140 150 Q200 135 260 145 Q320 155 380 140"
        stroke="#EAB308"
        strokeWidth="2"
        strokeOpacity="0.45"
        strokeLinecap="round"
        strokeDasharray="6 4"
      />
      {/* Green trail */}
      <path
        d="M250 60 Q240 120 255 180 Q270 240 260 310 Q250 360 245 390"
        stroke="#22C55E"
        strokeWidth="2"
        strokeOpacity="0.4"
        strokeLinecap="round"
        strokeDasharray="6 4"
      />
      {/* Trail markers */}
      <circle cx="250" cy="210" r="5" fill="#E53E3E" fillOpacity="0.35" />
      <circle cx="260" cy="145" r="4" fill="#3B82F6" fillOpacity="0.35" />
      <circle cx="255" cy="300" r="5" fill="#22C55E" fillOpacity="0.35" />
      <circle cx="200" cy="300" r="4" fill="#E53E3E" fillOpacity="0.35" />
      <circle cx="360" cy="200" r="4" fill="#3B82F6" fillOpacity="0.35" />
      {/* City dots */}
      <circle cx="270" cy="180" r="3" fill="#1A1A1A" fillOpacity="0.15" />
      <circle cx="180" cy="250" r="3" fill="#1A1A1A" fillOpacity="0.15" />
      <circle cx="340" cy="160" r="2.5" fill="#1A1A1A" fillOpacity="0.15" />
      <circle cx="150" cy="340" r="2.5" fill="#1A1A1A" fillOpacity="0.15" />
    </svg>
  )
}

const features = [
  {
    icon: MapPin,
    title: 'Interaktywna mapa',
    desc: 'Przeglądaj szlaki turystyczne na mapie topograficznej. Włącz lokalizację i zobacz trasy w\u00a0okolicy.',
    color: 'bg-forest/10 text-forest',
  },
  {
    icon: SlidersHorizontal,
    title: 'Filtry szlaków',
    desc: 'Filtruj po kolorze oznaczenia PTTK, długości trasy i\u00a0nawierzchni. Znajdź idealny spacer.',
    color: 'bg-amber-500/10 text-earth',
  },
  {
    icon: Heart,
    title: 'Ulubione i historia',
    desc: 'Zapisuj trasy do ulubionych, dodawaj notatki i\u00a0śledź historię swoich wędrówek z\u00a0psem.',
    color: 'bg-red-500/10 text-trail-red',
  },
  {
    icon: WifiOff,
    title: 'Tryb offline',
    desc: 'Zainstaluj Psi Szlak jako aplikację na telefonie — korzystaj nawet bez zasięgu na szlaku.',
    color: 'bg-sky/20 text-sky',
  },
]

const trailColors = [
  { name: 'Czerwony', hex: '#E53E3E', bg: 'bg-trail-red', text: 'Popularne trasy główne', desc: 'Główne szlaki o znaczeniu krajowym' },
  { name: 'Niebieski', hex: '#3B82F6', bg: 'bg-trail-blue', text: 'Szlaki o średniej długości', desc: 'Regionalne trasy łączące miejscowości' },
  { name: 'Żółty', hex: '#EAB308', bg: 'bg-trail-yellow', text: 'Krótkie szlaki lokalne', desc: 'Idealne na popołudniowy spacer z psem' },
  { name: 'Zielony', hex: '#22C55E', bg: 'bg-trail-green', text: 'Łączniki i warianty', desc: 'Alternatywne trasy i dojścia' },
  { name: 'Czarny', hex: '#1A1A1A', bg: 'bg-text-dark', text: 'Dojścia do schronisk', desc: 'Krótkie trasy dojazdowe' },
]

const steps = [
  {
    num: '1',
    icon: Mail,
    title: 'Otrzymaj zaproszenie',
    desc: 'Poproś znajomego o link — Psi Szlak działa na zaproszenia, żeby społeczność rosła organicznie.',
  },
  {
    num: '2',
    icon: Map,
    title: 'Odkryj szlaki w okolicy',
    desc: 'Otwórz mapę, włącz GPS i przeglądaj oznaczone trasy. Filtruj po tym co ważne dla Ciebie i psa.',
  },
  {
    num: '3',
    icon: Footprints,
    title: 'Ruszaj na przygodę',
    desc: 'Wybierz trasę, weź psa i idźcie razem. Zapisuj ulubione szlaki i wracaj do nich kiedy chcesz.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen font-sans antialiased">
      {/* ═══════════ HERO ═══════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(170deg, #A8C4D4 0%, #bdd0db 30%, #ddd9d0 60%, #F7F5F0 100%)',
        }}
      >
        {/* Topo pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: topoPatternSvg, backgroundSize: '400px 400px' }}
        />

        {/* Poland map — desktop: right side, large */}
        <PolandMapDecoration className="absolute right-[2%] top-1/2 -translate-y-[45%] w-[600px] h-[576px] pointer-events-none opacity-50 hidden lg:block" />
        {/* Poland map — mobile: faded bg */}
        <PolandMapDecoration className="absolute -right-20 top-4 w-[280px] h-[268px] pointer-events-none opacity-20 lg:hidden" />

        {/* Navigation bar */}
        <nav className="relative max-w-6xl mx-auto px-6 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shadow-black/10">
              <img src="/icons/icon-192.png" alt="" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="text-base font-semibold text-text-dark tracking-tight">Psi Szlak</span>
          </div>
          <Link
            to="/app/auth"
            className="text-sm font-medium text-text-body hover:text-forest transition-colors px-4 py-2 rounded-lg hover:bg-black/5"
          >
            Zaloguj się
          </Link>
        </nav>

        {/* Hero content */}
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-24 sm:pt-20 sm:pb-28 md:pt-24 md:pb-32 lg:pt-28 lg:pb-36">
          <div className="grid lg:grid-cols-[1fr_auto] lg:gap-20 items-center">
            {/* Text column */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest/8 border border-forest/15 mb-8">
                <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
                <span className="text-xs font-medium text-forest tracking-wide uppercase">Dla właścicieli psów w Polsce</span>
              </div>

              <h1 className="text-[2.75rem] sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight text-text-dark leading-[1.1]">
                Odkryj szlaki
                <br />
                <span className="text-forest">dla Ciebie</span>
                <br className="sm:hidden" />
                <span className="text-forest"> i&nbsp;Twojego psa</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-text-body leading-relaxed max-w-md">
                Interaktywna mapa szlaków PTTK w Polsce. Filtruj trasy, zapisuj ulubione, planuj wędrówki z&nbsp;czworonogiem.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-10">
                <Link
                  to="/app"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-accent text-white font-semibold text-base min-h-[52px] shadow-lg shadow-accent/25 hover:bg-cta-hover-light hover:shadow-xl hover:shadow-accent/30 active:scale-[0.98] transition-all duration-200"
                >
                  Otwórz aplikację
                  <ArrowRight size={18} strokeWidth={2.5} />
                </Link>
                <Link
                  to="/app/auth"
                  className="inline-flex items-center justify-center px-6 py-4 rounded-xl border-2 border-forest/25 text-forest font-semibold text-sm min-h-[52px] hover:bg-forest/8 hover:border-forest/40 active:scale-[0.98] transition-all duration-200"
                >
                  Mam już konto
                </Link>
              </div>

              {/* Social proof hint */}
              <div className="mt-10 flex items-center gap-4 text-sm text-text-body/70">
                <div className="flex -space-x-1.5">
                  {['#E53E3E', '#3B82F6', '#EAB308', '#22C55E'].map((c) => (
                    <span
                      key={c}
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-page-bg"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span>5 kolorów szlaków PTTK na mapie</span>
              </div>
            </div>

            {/* Logo showcase — desktop */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Decorative ring */}
                <div className="absolute -inset-4 rounded-[2rem] border-2 border-forest/10" />
                <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/20 w-[360px] h-[360px] xl:w-[400px] xl:h-[400px]">
                  <img
                    src="/icons/icon-512.png"
                    alt="Wyżeł niemiecki szorstkowłosy na leśnym szlaku"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-6 bg-white rounded-xl px-4 py-2.5 shadow-lg shadow-black/10 border border-gray-100 flex items-center gap-2">
                  <MapPin size={16} className="text-forest" />
                  <span className="text-sm font-semibold text-text-dark">Szlaki PTTK</span>
                </div>
              </div>
            </div>

            {/* Logo — mobile/tablet */}
            <div className="mt-12 flex justify-center lg:hidden">
              <div className="rounded-3xl overflow-hidden shadow-xl shadow-black/15 w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]">
                <img
                  src="/icons/icon-512.png"
                  alt="Wyżeł niemiecki szorstkowłosy na leśnym szlaku"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section className="bg-page-bg">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold text-accent uppercase tracking-widest">Funkcje</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-dark tracking-tight">
              Wszystko czego potrzebujesz na szlaku
            </h2>
            <p className="mt-4 text-text-body leading-relaxed text-lg">
              Psi Szlak łączy dane o szlakach PTTK z narzędziami ułatwiającymi planowanie spacerów z&nbsp;czworonogiem.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group bg-white rounded-xl p-7 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-semibold text-text-dark text-lg">{title}</h3>
                <p className="mt-2 text-sm text-text-body leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="bg-page-bg-alt">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold text-forest uppercase tracking-widest">Jak zacząć</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-dark tracking-tight">
              Trzy kroki do pierwszego szlaku
            </h2>
            <p className="mt-4 text-text-body leading-relaxed text-lg">
              Trzy kroki dzielą Cię od pierwszego spaceru z Psi Szlak.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div
                key={s.num}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center flex flex-col items-center"
              >
                {/* Number badge */}
                <div className="relative mb-5">
                  <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-forest text-white text-xl font-bold shadow-md shadow-forest/20">
                    {s.num}
                  </span>
                  <div className="absolute -inset-1.5 rounded-2xl border-2 border-forest/15" />
                </div>
                {/* Icon */}
                <s.icon size={28} className="text-forest/60 mb-4" />
                <h3 className="font-semibold text-text-dark text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-text-body leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Connecting line on desktop */}
          <div className="hidden sm:flex justify-center mt-8">
            <div className="flex items-center gap-2 text-sm text-text-body/50">
              <span className="w-12 h-px bg-forest/20" />
              <span className="text-xs">prosty start</span>
              <span className="w-12 h-px bg-forest/20" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRAIL COLORS ═══════════ */}
      <section className="bg-page-bg">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="lg:grid lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:items-center">
            {/* Left: text */}
            <div className="max-w-lg mb-12 lg:mb-0">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">Oznaczenia PTTK</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-dark tracking-tight">
                Szlaki we wszystkich kolorach
              </h2>
              <p className="mt-4 text-text-body leading-relaxed text-lg">
                Filtruj trasy po oficjalnych oznaczeniach PTTK — od głównych czerwonych szlaków po lokalne żółte ścieżki.
              </p>
              {/* Mini Poland map for this section */}
              <PolandMapDecoration className="hidden lg:block w-[200px] h-[192px] mt-8 opacity-40" />
            </div>

            {/* Right: trail color cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {trailColors.map((t) => (
                <div
                  key={t.name}
                  className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow"
                >
                  <span
                    className="shrink-0 w-6 h-6 rounded-lg mt-0.5 ring-2 ring-black/5"
                    style={{ backgroundColor: t.hex }}
                  />
                  <div>
                    <span className="font-semibold text-text-dark text-sm">{t.name}</span>
                    <p className="text-xs text-text-body mt-0.5 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              ))}
              {/* Extra card — app CTA */}
              <div className="bg-forest/8 rounded-xl px-5 py-4 border border-forest/15 flex items-center gap-4 sm:col-span-2 lg:col-span-2">
                <MapPin size={20} className="text-forest shrink-0" />
                <p className="text-sm text-forest font-medium">
                  Wszystkie kolory dostępne na interaktywnej mapie z filtrami
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ BOTTOM CTA (dark) ═══════════ */}
      <section className="relative bg-bg-base overflow-hidden">
        {/* Topo pattern on dark */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: topoPatternSvg, backgroundSize: '400px 400px' }}
        />

        {/* Diagonal decorative accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-trail-red via-trail-blue to-trail-green opacity-60" />

        <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center">
            <div className="inline-block rounded-2xl overflow-hidden shadow-xl shadow-black/40 mb-8">
              <img
                src="/icons/icon-192.png"
                alt="Psi Szlak"
                width={88}
                height={88}
                className="w-[88px] h-[88px] object-cover"
              />
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
                className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-xl bg-accent text-bg-base font-semibold text-lg min-h-[52px] shadow-lg shadow-accent/30 hover:bg-accent-hover hover:shadow-xl active:scale-[0.98] transition-all duration-200"
              >
                Otwórz Psi Szlak
                <ArrowRight size={20} strokeWidth={2.5} />
              </Link>
              <Link
                to="/app/auth"
                className="text-sm font-medium text-text-secondary hover:text-accent transition-colors px-4 py-3 min-h-[48px] inline-flex items-center"
              >
                Zaloguj się do konta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-bg-base border-t border-bg-elevated">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <img src="/icons/icon-192.png" alt="" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Psi Szlak</span>
          </div>
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Psi Szlak. Dane szlaków na podstawie OpenStreetMap.
          </p>
        </div>
      </footer>
    </div>
  )
}
