import { Link } from 'react-router-dom'
import { MapPin, SlidersHorizontal, Heart, WifiOff, ArrowRight } from 'lucide-react'

/* ── Inline SVG topo pattern (brand element from logo) ── */
const topoPatternSvg = `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4D8DC' stroke-width='1' opacity='0.35'%3E%3Cpath d='M0 80 Q100 60 200 90 T400 70'/%3E%3Cpath d='M0 140 Q80 120 180 150 T400 130'/%3E%3Cpath d='M0 200 Q120 180 220 210 T400 190'/%3E%3Cpath d='M0 260 Q90 240 190 270 T400 250'/%3E%3Cpath d='M0 320 Q110 300 210 330 T400 310'/%3E%3Cpath d='M0 380 Q100 360 200 390 T400 370'/%3E%3Cpath d='M0 40 Q60 20 160 50 T400 30'/%3E%3C/g%3E%3C/svg%3E")`

const features = [
  {
    icon: MapPin,
    title: 'Interaktywna mapa',
    desc: 'Przeglądaj szlaki turystyczne na mapie topograficznej. Włącz lokalizację i zobacz trasy w&nbsp;okolicy.',
    color: 'bg-forest/10 text-forest',
  },
  {
    icon: SlidersHorizontal,
    title: 'Filtry szlaków',
    desc: 'Filtruj po kolorze oznaczenia PTTK, długości trasy i&nbsp;nawierzchni. Znajdź idealny spacer.',
    color: 'bg-amber-500/10 text-earth',
  },
  {
    icon: Heart,
    title: 'Ulubione i historia',
    desc: 'Zapisuj trasy do ulubionych, dodawaj notatki i&nbsp;śledź historię swoich wędrówek z&nbsp;psem.',
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
  { name: 'Czerwony', bg: 'bg-trail-red', text: 'Popularne trasy główne' },
  { name: 'Niebieski', bg: 'bg-trail-blue', text: 'Szlaki o średniej długości' },
  { name: 'Żółty', bg: 'bg-trail-yellow', text: 'Krótkie szlaki lokalne' },
  { name: 'Zielony', bg: 'bg-trail-green', text: 'Łączniki i warianty' },
  { name: 'Czarny', bg: 'bg-text-dark', text: 'Dojścia do schronisk' },
]

const steps = [
  {
    num: '1',
    title: 'Otrzymaj zaproszenie',
    desc: 'Poproś znajomego o link — Psi Szlak działa na zaproszenia, żeby społeczność rosła organicznie.',
  },
  {
    num: '2',
    title: 'Odkryj szlaki w okolicy',
    desc: 'Otwórz mapę, włącz GPS i przeglądaj oznaczone trasy. Filtruj po tym co ważne dla Ciebie i psa.',
  },
  {
    num: '3',
    title: 'Ruszaj na przygodę',
    desc: 'Wybierz trasę, weź psa i idźcie razem. Zapisuj ulubione szlaki i wracaj do nich kiedy chcesz.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen font-sans">
      {/* ═══════════ HERO ═══════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #A8C4D4 0%, #c8d8e2 35%, #F7F5F0 100%)',
        }}
      >
        {/* Topo pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: topoPatternSvg, backgroundSize: '400px 400px' }}
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start md:gap-16">
            {/* Text content */}
            <div className="flex-1 max-w-xl">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-6">
                <img
                  src="/icons/icon-192.png"
                  alt="Psi Szlak"
                  width={64}
                  height={64}
                  className="rounded-2xl shadow-md shadow-black/15"
                />
                <span className="text-lg font-semibold text-text-dark tracking-tight">Psi Szlak</span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-text-dark leading-[1.15] sm:text-5xl lg:text-[3.5rem]">
                Odkryj szlaki
                <br />
                <span className="text-forest">dla Ciebie i&nbsp;Twojego psa</span>
              </h1>

              <p className="mt-5 text-lg text-text-body leading-relaxed max-w-md mx-auto md:mx-0">
                Psi Szlak to aplikacja, która pomaga właścicielom psów znajdować najlepsze szlaki turystyczne w&nbsp;Polsce. Mapa, filtry, ulubione — wszystko w&nbsp;jednym miejscu.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
                <Link
                  to="/app"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-white font-semibold text-base min-h-[48px] shadow-md shadow-accent/20 hover:bg-cta-hover-light active:scale-[0.98] transition-all"
                >
                  Otwórz aplikację
                  <ArrowRight size={18} strokeWidth={2.2} />
                </Link>
                <Link
                  to="/app/auth"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-accent text-accent font-semibold text-sm min-h-[48px] hover:bg-accent/10 active:scale-[0.98] transition-all"
                >
                  Mam już konto
                </Link>
              </div>
            </div>

            {/* Logo showcase — large on desktop */}
            <div className="mt-12 md:mt-0 shrink-0">
              <img
                src="/icons/icon-512.png"
                alt="Wyżeł niemiecki szorstkowłosy na leśnym szlaku"
                width={280}
                height={280}
                className="rounded-3xl shadow-xl shadow-black/20 md:w-[340px] md:h-[340px] lg:w-[380px] lg:h-[380px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section className="bg-page-bg">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-text-dark tracking-tight sm:text-4xl">
              Wszystko czego potrzebujesz na szlaku
            </h2>
            <p className="mt-3 text-text-body leading-relaxed">
              Psi Szlak łączy dane o szlakach PTTK z narzędziami ułatwiającymi planowanie spacerów z&nbsp;czworonogiem.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-text-dark text-lg">{title}</h3>
                <p
                  className="mt-1.5 text-sm text-text-body leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: desc }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="bg-page-bg-alt">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-text-dark tracking-tight sm:text-4xl">
              Jak zacząć?
            </h2>
            <p className="mt-3 text-text-body leading-relaxed">
              Trzy kroki dzielą Cię od pierwszego spaceru z Psi Szlak.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto">
            {steps.map((s) => (
              <div key={s.num} className="text-center sm:text-left">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-forest text-white text-lg font-bold mb-4 shadow-md shadow-forest/20">
                  {s.num}
                </span>
                <h3 className="font-semibold text-text-dark text-lg">{s.title}</h3>
                <p className="mt-1.5 text-sm text-text-body leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TRAIL COLORS ═══════════ */}
      <section className="bg-page-bg">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-text-dark tracking-tight sm:text-4xl">
              Szlaki we wszystkich kolorach
            </h2>
            <p className="mt-3 text-text-body leading-relaxed">
              Filtruj trasy po oficjalnych oznaczeniach PTTK — od głównych czerwonych szlaków po lokalne żółte ścieżki.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
            {trailColors.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-3 bg-white rounded-xl px-5 py-3.5 shadow-sm border border-gray-100 min-w-[200px]"
              >
                <span className={`shrink-0 w-5 h-5 rounded-full ${t.bg} ring-2 ring-black/5`} />
                <div>
                  <span className="font-semibold text-text-dark text-sm">{t.name}</span>
                  <p className="text-xs text-text-body">{t.text}</p>
                </div>
              </div>
            ))}
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

        <div className="relative max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
          <img
            src="/icons/icon-192.png"
            alt="Psi Szlak"
            width={80}
            height={80}
            className="rounded-2xl shadow-lg shadow-black/40 mx-auto mb-6"
          />
          <h2 className="text-3xl font-bold text-text-primary tracking-tight sm:text-4xl">
            Gotowy na szlak?
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed max-w-md mx-auto">
            Otwórz aplikację, znajdź trasę w okolicy i ruszaj na przygodę z&nbsp;Twoim psem.
          </p>
          <Link
            to="/app"
            className="mt-8 inline-flex items-center justify-center gap-2 px-10 py-4 rounded-lg bg-accent text-bg-base font-semibold text-lg min-h-[48px] hover:bg-accent-hover active:scale-[0.98] transition-all"
          >
            Otwórz Psi Szlak
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-bg-base border-t border-bg-elevated">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-lg" />
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
