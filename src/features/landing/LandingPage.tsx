import { Link } from 'react-router-dom'
import { MapPin, SlidersHorizontal, Heart, WifiOff, ArrowRight, Mail, Map, Footprints, Share, PlusSquare, Download, MoreVertical } from 'lucide-react'

/* ── Subtle topo texture ── */
const topoSvg = `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4D8DC' stroke-width='1' opacity='0.3'%3E%3Cpath d='M0 80 Q100 60 200 90 T400 70'/%3E%3Cpath d='M0 140 Q80 120 180 150 T400 130'/%3E%3Cpath d='M0 200 Q120 180 220 210 T400 190'/%3E%3Cpath d='M0 260 Q90 240 190 270 T400 250'/%3E%3Cpath d='M0 320 Q110 300 210 330 T400 310'/%3E%3Cpath d='M0 380 Q100 360 200 390 T400 370'/%3E%3C/g%3E%3C/svg%3E")`

const trailDots = ['#E53E3E', '#3B82F6', '#EAB308', '#22C55E', '#333']

const features = [
  { icon: MapPin, title: 'Interaktywna mapa', desc: 'Szlaki PTTK na mapie topograficznej z\u00a0Twoją lokalizacją.', color: 'bg-forest/10 text-forest' },
  { icon: SlidersHorizontal, title: 'Filtry szlaków', desc: 'Kolor, długość, nawierzchnia — znajdź idealny spacer.', color: 'bg-amber-500/10 text-earth' },
  { icon: Heart, title: 'Ulubione i historia', desc: 'Zapisuj trasy, notatki i\u00a0historię swoich wędrówek.', color: 'bg-red-500/10 text-trail-red' },
  { icon: WifiOff, title: 'Działa offline', desc: 'Zainstaluj jako aplikację — działa bez zasięgu.', color: 'bg-[#5a8a9e]/10 text-[#5a8a9e]' },
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
  { num: '2', icon: Map, title: 'Odkryj szlaki', desc: 'Otwórz mapę, włącz GPS i przeglądaj trasy w okolicy.' },
  { num: '3', icon: Footprints, title: 'Ruszaj na szlak', desc: 'Wybierz trasę, zabierz psa i odkrywaj nowe miejsca.' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen font-sans antialiased">

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-bg-base">
        {/* Topo texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: topoSvg, backgroundSize: '400px 400px' }} />

        {/* Nav */}
        <nav className="relative max-w-7xl mx-auto w-full px-6 lg:px-10 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg overflow-hidden">
              <img src="/icons/icon-192.png" alt="" width={36} height={36} className="w-full h-full scale-110 object-cover" />
            </div>
            <span className="text-base font-semibold text-text-primary">Psi Szlak</span>
          </div>
          <Link
            to="/app/auth"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors px-5 py-2.5 rounded-lg border border-accent/30 hover:border-accent/60 hover:bg-accent/5"
          >
            Zaloguj się
          </Link>
        </nav>

        {/* Hero content */}
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — text */}
            <div className="max-w-xl">
              {/* Trail color bar */}
              <div className="flex gap-1.5 mb-8">
                {trailDots.map((c) => (
                  <span key={c} className="w-8 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary leading-[1.05]">
                Odkryj szlaki
                <span className="block text-accent">z Twoim psem</span>
              </h1>

              <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-md">
                Interaktywna mapa szlaków turystycznych w&nbsp;Polsce. Filtruj trasy, zapisuj ulubione i planuj wędrówki z&nbsp;czworonogiem.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-10">
                <Link
                  to="/app"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-accent text-bg-base font-semibold text-base min-h-[52px] shadow-lg shadow-accent/25 hover:bg-accent-hover active:scale-[0.98] transition-all"
                >
                  Otwórz aplikację
                  <ArrowRight size={18} strokeWidth={2.5} />
                </Link>
              </div>

              <p className="mt-6 text-sm text-text-muted">
                Dostęp przez zaproszenie — poproś znajomego o&nbsp;link lub <Link to="/app/auth" className="text-accent hover:text-accent-hover underline underline-offset-2">zaloguj się</Link> jeśli masz konto.
              </p>
            </div>

            {/* Right — logo large */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Glow behind logo */}
                <div className="absolute -inset-8 bg-accent/10 rounded-full blur-3xl" />
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50 w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] lg:w-[400px] lg:h-[400px]">
                  <img
                    src="/icons/icon-512.png"
                    alt="Wyżeł niemiecki szorstkowłosy na leśnym szlaku"
                    className="w-full h-full object-cover scale-[1.08]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trail color strip at bottom of hero */}
        <div className="h-1 bg-gradient-to-r from-trail-red via-trail-blue to-trail-green" />
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="bg-page-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 md:py-28">
          <div className="max-w-2xl mb-14">
            <span className="text-xs font-semibold text-accent uppercase tracking-widest">Funkcje</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-dark tracking-tight">
              Wszystko czego potrzebujesz na szlaku
            </h2>
            <p className="mt-3 text-text-body leading-relaxed">
              Psi Szlak łączy dane o szlakach PTTK z narzędziami do planowania spacerów.
            </p>
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
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">Oznaczenia PTTK</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-dark tracking-tight">
                Szlaki we&nbsp;wszystkich kolorach
              </h2>
              <p className="mt-4 text-text-body leading-relaxed text-lg max-w-md">
                Polskie szlaki oznaczone pięcioma kolorami. Filtruj po kolorze i znajdź idealną trasę na spacer.
              </p>
            </div>

            <div className="space-y-3">
              {trailColors.map((t) => (
                <div key={t.name} className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <span className="shrink-0 w-4 h-10 rounded-full" style={{ backgroundColor: t.hex }} />
                  <div>
                    <span className="font-semibold text-text-dark text-sm">{t.name}</span>
                    <p className="text-xs text-text-body mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PWA INSTALL ═══ */}
      <section className="bg-page-bg-alt">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-xs font-semibold text-forest uppercase tracking-widest">Instalacja</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-text-dark tracking-tight">
              Zainstaluj na telefonie
            </h2>
            <p className="mt-4 text-text-body leading-relaxed text-lg">
              Psi Szlak działa jak natywna aplikacja — bez App Store, prosto z&nbsp;przeglądarki.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
            {/* iOS */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-text-dark text-lg mb-4">iPhone / iPad</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-forest/10 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-forest">1</span>
                  </span>
                  <p className="text-sm text-text-body">
                    Otwórz <strong className="text-text-dark">psiszlak.vercel.app</strong> w Safari
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-forest/10 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-forest">2</span>
                  </span>
                  <p className="text-sm text-text-body flex items-center gap-1.5 flex-wrap">
                    Kliknij <Share size={14} className="text-[#007AFF] inline" /> <strong className="text-text-dark">Udostępnij</strong>
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-forest/10 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-forest">3</span>
                  </span>
                  <p className="text-sm text-text-body flex items-center gap-1.5 flex-wrap">
                    Wybierz <PlusSquare size={14} className="text-[#007AFF] inline" /> <strong className="text-text-dark">Dodaj do ekranu początkowego</strong>
                  </p>
                </li>
              </ol>
            </div>

            {/* Android */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-text-dark text-lg mb-4">Android</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-forest/10 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-forest">1</span>
                  </span>
                  <p className="text-sm text-text-body">
                    Otwórz <strong className="text-text-dark">psiszlak.vercel.app</strong> w Chrome
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-forest/10 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-forest">2</span>
                  </span>
                  <p className="text-sm text-text-body flex items-center gap-1.5 flex-wrap">
                    Kliknij <MoreVertical size={14} className="text-text-dark inline" /> <strong className="text-text-dark">menu</strong> (trzy kropki)
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-forest/10 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-forest">3</span>
                  </span>
                  <p className="text-sm text-text-body flex items-center gap-1.5 flex-wrap">
                    Wybierz <Download size={14} className="text-text-dark inline" /> <strong className="text-text-dark">Zainstaluj aplikację</strong>
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="relative bg-bg-base overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: topoSvg, backgroundSize: '400px 400px' }} />
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
          <Link
            to="/app"
            className="mt-10 inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-accent text-bg-base font-semibold text-lg min-h-[52px] shadow-lg shadow-accent/30 hover:bg-accent-hover active:scale-[0.98] transition-all"
          >
            Otwórz Psi Szlak
            <ArrowRight size={20} strokeWidth={2.5} />
          </Link>
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
