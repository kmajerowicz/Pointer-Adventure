import { Link } from 'react-router-dom'
import { MapPin, SlidersHorizontal, Heart, WifiOff, Route, PawPrint } from 'lucide-react'

const trailColors = [
  { name: 'Czerwony', color: 'bg-trail-red' },
  { name: 'Niebieski', color: 'bg-trail-blue' },
  { name: 'Żółty', color: 'bg-trail-yellow' },
  { name: 'Zielony', color: 'bg-trail-green' },
  { name: 'Czarny', color: 'bg-[#444]' },
]

const features = [
  {
    icon: MapPin,
    title: 'Interaktywna mapa',
    desc: 'Przeglądaj szlaki w okolicy na mapie topograficznej z oznaczeniami PTTK.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Inteligentne filtry',
    desc: 'Filtruj po kolorze szlaku, długości, nawierzchni — znajdź idealną trasę na spacer.',
  },
  {
    icon: Heart,
    title: 'Ulubione trasy',
    desc: 'Zapisuj i organizuj trasy, dodawaj notatki, śledź historię swoich spacerów.',
  },
  {
    icon: WifiOff,
    title: 'Działa offline',
    desc: 'Zainstaluj jako aplikację na telefonie — korzystaj nawet bez internetu.',
  },
]

const steps = [
  {
    num: '1',
    title: 'Dostań zaproszenie',
    desc: 'Poproś znajomego o link — Psi Szlak działa na zaproszenia.',
  },
  {
    num: '2',
    title: 'Przeglądaj mapę',
    desc: 'Otwórz mapę, włącz lokalizację i zobacz szlaki wokół siebie.',
  },
  {
    num: '3',
    title: 'Ruszaj na szlak',
    desc: 'Wybierz trasę, zabierz psa i odkrywaj nowe miejsca razem.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary overflow-x-hidden">
      {/* ─── Hero ─── */}
      <section className="relative flex flex-col items-center px-6 pt-16 pb-20 text-center">
        {/* Subtle radial glow behind logo */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-72 h-72 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

        <img
          src="/icons/icon-192.png"
          alt="Psi Szlak — pies na szlaku"
          width={120}
          height={120}
          className="relative rounded-3xl shadow-lg shadow-black/40 animate-[fade-in_600ms_ease-out]"
        />

        <h1 className="relative mt-6 text-4xl font-bold tracking-tight sm:text-5xl animate-[slide-up_500ms_ease-out]">
          Psi Szlak
        </h1>

        <p className="relative mt-3 text-lg text-text-secondary max-w-sm leading-relaxed animate-[slide-up_500ms_ease-out_100ms_both]">
          Szlaki turystyczne w Polsce, wybrane z myślą o spacerach z&nbsp;psem
        </p>

        {/* Trail color dots */}
        <div className="relative flex items-center gap-2 mt-5 animate-[slide-up_500ms_ease-out_200ms_both]">
          {trailColors.map((t) => (
            <span
              key={t.name}
              title={t.name}
              className={`w-3 h-3 rounded-full ${t.color} ring-1 ring-white/10`}
            />
          ))}
          <span className="ml-1 text-xs text-text-muted">oznaczenia PTTK</span>
        </div>

        <div className="relative flex flex-col items-center gap-3 mt-10 w-full max-w-xs animate-[slide-up_500ms_ease-out_300ms_both]">
          <Link
            to="/app"
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-bg-base font-semibold text-base min-h-[48px] hover:bg-accent-hover active:scale-[0.98] transition-all"
          >
            <Route size={18} strokeWidth={2.2} />
            Otwórz aplikację
          </Link>
          <Link
            to="/app/auth"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Mam już konto — zaloguj się
          </Link>
        </div>
      </section>

      {/* ─── Social proof strip ─── */}
      <div className="flex items-center justify-center gap-6 py-5 bg-bg-surface/50 border-y border-bg-elevated/50">
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <Route size={14} className="text-accent" />
          <span>Szlaki PTTK</span>
        </div>
        <div className="w-px h-4 bg-bg-elevated" />
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <MapPin size={14} className="text-accent" />
          <span>Cała Polska</span>
        </div>
        <div className="w-px h-4 bg-bg-elevated" />
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <PawPrint size={14} className="text-accent" />
          <span>Dla psiarzy</span>
        </div>
      </div>

      {/* ─── Features ─── */}
      <section className="px-6 py-16 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-center mb-3">
          Wszystko czego potrzebujesz na szlaku
        </h2>
        <p className="text-text-secondary text-sm text-center mb-10 max-w-sm mx-auto">
          Psi Szlak łączy dane o szlakach PTTK z narzędziami, które ułatwiają planowanie spacerów z czworonogiem.
        </p>

        <div className="space-y-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="flex gap-4 items-start p-4 rounded-2xl bg-bg-surface border border-bg-elevated/60"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Icon size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{title}</h3>
                <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="px-6 py-16 bg-bg-surface/30">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            Jak zacząć?
          </h2>

          <ol className="relative space-y-8">
            {/* Connecting line */}
            <div className="absolute left-[1.15rem] top-10 bottom-4 w-px bg-gradient-to-b from-accent/40 via-accent/20 to-transparent" />

            {steps.map((s) => (
              <li key={s.num} className="relative flex gap-5 items-start">
                <span className="relative shrink-0 w-10 h-10 rounded-full bg-accent text-bg-base flex items-center justify-center text-sm font-bold shadow-md shadow-accent/20">
                  {s.num}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-semibold text-text-primary">{s.title}</h3>
                  <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Trail colors showcase ─── */}
      <section className="px-6 py-16 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-center mb-3">
          Szlaki we wszystkich kolorach
        </h2>
        <p className="text-text-secondary text-sm text-center mb-8 max-w-sm mx-auto">
          Filtruj trasy po kolorach oznaczeń PTTK — czerwony, niebieski, żółty, zielony i czarny.
        </p>

        <div className="flex justify-center gap-3">
          {trailColors.map((t) => (
            <div key={t.name} className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-xl ${t.color} shadow-lg`} />
              <span className="text-xs text-text-muted">{t.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="px-6 pt-8 pb-20 text-center">
        <div className="max-w-sm mx-auto bg-bg-surface rounded-2xl p-8 border border-bg-elevated/60">
          <PawPrint size={32} className="text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Gotowy na szlak?</h2>
          <p className="text-sm text-text-secondary mb-6">
            Otwórz aplikację i znajdź pierwszą trasę dla siebie i swojego psa.
          </p>
          <Link
            to="/app"
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-bg-base font-semibold text-base min-h-[48px] hover:bg-accent-hover active:scale-[0.98] transition-all"
          >
            Otwórz Psi Szlak
          </Link>
        </div>
      </section>
    </div>
  )
}
