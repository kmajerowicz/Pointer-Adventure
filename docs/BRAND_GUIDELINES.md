# Psi Szlak — Brand Guidelines

## 1. Brand Essence

**Misja:** Pomagamy właścicielom psów odkrywać najlepsze szlaki do wspólnych wędrówek w Polsce.

**Osobowość marki:**
- **Przygodowa** — zachęca do wyjścia na szlak
- **Naturalna** — zakorzeniona w polskim krajobrazie
- **Pewna siebie** — jak wyżeł na tropie
- **Przyjazna** — ciepła, dostępna, bez elitaryzmu

**Ton komunikacji:** Bezpośredni, energiczny, z nutą humoru. Mówimy "my" i "Ty". Unikamy oficjalnego żargonu — piszemy jak do znajomego z psem.

---

## 2. Logo

### Opis
Ikona przedstawia wyżła niemieckiego szorstkowłosego (Deutsch Drahthaar) w dynamicznej pozie na leśnym szlaku. Pies jest czarny (czarny deresz), otoczony zielenią lasu, bursztynowymi akcentami roślinności, błękitnym niebem z liniami topograficznymi.

### Zasady użycia
- Logo zawsze jako kwadrat — system (iOS/Android) nakłada własną maskę
- Minimalna wielkość wyświetlania: 32x32 px
- Nie dodawać tekstu, ramek ani cieni do samego logo
- Nie zmieniać proporcji ani kolorów
- Na jasnym tle: logo bez modyfikacji
- Na ciemnym tle: logo bez modyfikacji (ilustracja ma własne tło)

### Pliki
- `public/icons/icon-512.png` — 512x512 (PWA, marketing)
- `public/icons/icon-192.png` — 192x192 (favicon, apple-touch-icon)

---

## 3. Paleta kolorów

### Kolory wyekstrahowane z logo

| Nazwa | Hex | Użycie |
|-------|-----|--------|
| **Pointer Black** | `#1A1A1A` | Pies, ciemne elementy, tekst na jasnym tle |
| **Forest Green** | `#2D5A3D` | Natura, tła sekcji, ilustracje |
| **Pine Green** | `#3B7A4A` | Drzewa, akcenty natury, ikony |
| **Trail Amber** | `#C9A84C` | Accent — CTA, linki, aktywne stany |
| **Earth Brown** | `#8B6F3A` | Ścieżki, ciepłe akcenty, secondary CTA |
| **Sky Blue** | `#A8C4D4` | Niebo, tła hero, subtelne gradienty |
| **Topo Gray** | `#D4D8DC` | Linie topograficzne, delikatne wzory, bordery |

### Kolory aplikacji (dark UI)

| Token | Hex | Rola |
|-------|-----|------|
| `bg-base` | `#111318` | Główne tło |
| `bg-surface` | `#1C1F26` | Karty, panele |
| `bg-elevated` | `#252930` | Modalne, tooltipy |
| `accent` | `#C9A84C` | Primary CTA, aktywne stany |
| `accent-hover` | `#D4B85E` | Hover na akcencie |
| `text-primary` | `#F5F5F5` | Nagłówki, body text |
| `text-secondary` | `#A0A0A0` | Opisy, metadane |
| `text-muted` | `#666666` | Placeholdery, nieaktywne |

### Kolory landing page (jasne tło)

| Nazwa | Hex | Rola |
|-------|-----|------|
| **Page BG** | `#F7F5F0` | Ciepłe kremowe tło (nie czysto białe) |
| **Section BG Alt** | `#EBE8E0` | Alternujące sekcje |
| **Hero Gradient** | `#A8C4D4 → #F7F5F0` | Sky blue do page BG |
| **Card BG** | `#FFFFFF` | Białe karty na kremowym tle |
| **Text Dark** | `#1A1A1A` | Pointer Black jako tekst |
| **Text Body** | `#4A4A4A` | Body text na jasnym tle |
| **CTA** | `#C9A84C` | Ten sam accent co w apce |
| **CTA Hover** | `#B8963F` | Ciemniejszy accent na jasnym tle |
| **Nature Green** | `#2D5A3D` | Sekcje "natura", badges, ikony |

---

## 4. Typografia

### Font stack
- **Primary:** Inter (sans-serif)
- **Fallback:** ui-sans-serif, system-ui, sans-serif

### Skala typograficzna

| Nazwa | Rozmiar | Waga | Użycie |
|-------|---------|------|--------|
| **Display** | 48–64px | 700 (Bold) | Landing hero headline |
| **H1** | 30–36px | 700 (Bold) | Tytuły sekcji landing, onboarding |
| **H2** | 24px | 600 (Semibold) | Podtytuły sekcji |
| **H3** | 20px | 600 (Semibold) | Nagłówki kart, nazwy szlaków |
| **Body** | 16px | 400 (Regular) | Główny tekst |
| **Body Small** | 14px | 400 (Regular) | Opisy, metadane |
| **Caption** | 12px | 500 (Medium) | Badge, etykiety, timestampy |
| **Label XS** | 10px | 500 (Medium) | Tab bar labels |

### Zasady
- Nagłówki: `tracking-tight` (-0.025em) dla Display i H1
- Body: domyślny tracking
- Line height: nagłówki 1.2, body 1.5–1.6
- Maksymalna szerokość tekstu na landing: `max-w-2xl` (672px)

---

## 5. Ikonografia i ilustracje

### Ikony UI
- **Biblioteka:** Lucide React
- **Rozmiary:** 16px (inline), 20px (buttons), 24px (navigation)
- **Styl:** Outline, stroke-width 2px
- **Kolor:** Dziedziczony z tekstu (`currentColor`)

### Wzór topograficzny (z logo)
Logo zawiera subtelne linie topograficzne na niebie. Ten motyw powinien pojawić się w aplikacji jako:
- **Tło hero** na landing page — subtelne, w `topo-gray` na jasnym tle
- **Puste stany** — zamiast pustej przestrzeni, delikatny wzór topo
- **Tła sekcji** — jako SVG pattern, opacity 5–10%
- **Separator sekcji** — fala topograficzna zamiast prostej linii

### Motyw szlaku (z logo)
Kręta ścieżka z logo to element brandingowy:
- **Progress indicators** — ścieżka zamiast prostego paska
- **Onboarding flow** — wizualna metafora "podróży"
- **Dividers** — delikatna linia ścieżki

### Fotografia / ilustracje
- Styl ilustracji spójny z logo: semi-realistyczny z graficzną stylizacją
- Kolorystyka: ziemiste zielenie, bursztyny, niebieskie niebo
- Psy w ruchu, na szlakach, w naturze
- Unikać: stock photos, sterylnych studyjnych zdjęć, zdjęć bez natury

---

## 6. Komponenty UI — wytyczne

### Buttony

**Primary CTA:**
```
bg-accent text-bg-base font-semibold
rounded-lg min-h-[48px] px-6 py-3
hover:bg-accent-hover active:scale-[0.98]
transition-all duration-150
```

**Secondary:**
```
bg-transparent border-2 border-accent text-accent
rounded-lg min-h-[48px] px-6 py-3
hover:bg-accent/10 active:scale-[0.98]
```

**Ghost:**
```
bg-transparent text-text-secondary
rounded-lg min-h-[48px] px-4 py-3
hover:text-text-primary hover:bg-bg-elevated/50
```

**Landing CTA (na jasnym tle):**
```
bg-accent text-white font-semibold
rounded-lg min-h-[48px] px-8 py-3
shadow-md shadow-accent/20
hover:bg-[#B8963F] active:scale-[0.98]
```

### Karty

**App card (dark):**
```
bg-bg-surface rounded-lg
border-l-4 border-[trail-color]
min-h-[72px] p-4
active:bg-bg-elevated transition-colors
```

**Landing card (light):**
```
bg-white rounded-xl p-6
shadow-sm border border-gray-100
hover:shadow-md transition-shadow
```

### Badges / Tagi
```
text-xs font-medium px-2.5 py-1 rounded-full
bg-[color]/10 text-[color]
```

Przykłady:
- Trudność łatwa: `bg-green-500/10 text-green-600`
- Trudność średnia: `bg-amber-500/10 text-amber-600`
- Trudność trudna: `bg-red-500/10 text-red-600`
- Woda: `bg-blue-500/10 text-blue-600`
- Las: `bg-emerald-500/10 text-emerald-600`

---

## 7. Layout — Landing Page

### Struktura sekcji

```
1. HERO
   - Tło: gradient sky-blue → kremowy + wzór topograficzny
   - Logo ikona (duża, 120–160px)
   - Headline: "Odkryj szlaki dla Ciebie i Twojego psa"
   - Subtitle: 1-2 zdania
   - CTA: "Dołącz do Psi Szlak" + secondary "Zobacz szlaki"
   - Mockup telefonu z aplikacją (opcjonalnie)

2. SOCIAL PROOF (opcjonalnie)
   - Liczba szlaków, użytkowników, psów
   - Małe ikony/statystyki w rzędzie

3. FEATURES (3-4 karty)
   - Ikona + tytuł + opis
   - Grid 2x2 (mobile) lub 4 w rzędzie (desktop)
   - Mapa, Szlaki, Ulubione, Społeczność

4. HOW IT WORKS
   - 3 kroki z numeracją lub ikonami szlaku
   - 1. Pobierz → 2. Znajdź szlak → 3. Ruszaj na przygodę

5. TRAIL PREVIEW
   - 2-3 przykładowe karty szlaków
   - Styl zbliżony do kart w apce ale na jasnym tle

6. CTA SECTION
   - Ciemne tło (bg-base) jak w apce — kontrast z resztą
   - Logo + headline + przycisk
   - Motyw topograficzny w tle

7. FOOTER
   - Minimalistyczny, bg-bg-base
   - Logo + linki + info prawne
```

### Responsywność
- Mobile-first (PWA to primary platform)
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)
- Hero: pełna szerokość, padding `px-6`
- Features grid: 1 col → 2 col → 4 col
- Max content width: `max-w-5xl` (1024px)

---

## 8. Animacje i mikro-interakcje

### Zasady
- Szybkie i subtelne: 150–300ms
- Easing: `ease-out` dla wejść, `ease-in` dla wyjść
- Nigdy nie blokować interakcji animacją

### Standardowe animacje
| Nazwa | Czas | Użycie |
|-------|------|--------|
| `fade-in` | 200ms | Pojawianie się elementów |
| `slide-up` | 250ms | Toasty, karty, bottom sheets |
| `scale-tap` | 150ms | Feedback na naciśnięcie (0.98) |
| `heart-pop` | 300ms | Dodanie do ulubionych |

### Landing-specific
- **Scroll reveal:** elementy wjeżdżają przy scrollu (fade-in + slide-up, staggered 100ms)
- **Counter animation:** liczby w social proof "odliczają" do wartości
- **Parallax (subtelny):** wzór topograficzny przesuwa się wolniej niż content

---

## 9. Nowe tokeny CSS do dodania

```css
@theme {
  /* Logo-derived nature palette */
  --color-forest: #2D5A3D;
  --color-forest-light: #3B7A4A;
  --color-earth: #8B6F3A;
  --color-sky: #A8C4D4;
  --color-topo: #D4D8DC;

  /* Landing page (light theme) */
  --color-page-bg: #F7F5F0;
  --color-page-bg-alt: #EBE8E0;
  --color-text-dark: #1A1A1A;
  --color-text-body: #4A4A4A;
  --color-cta-hover-light: #B8963F;
}
```

---

## 10. Do's and Don'ts

### Do
- Używaj kolorów z palety — nigdy nie hardcoduj hex
- Utrzymuj spójność między logo, apką i landing page (accent = #C9A84C wszędzie)
- Pokazuj psy w naturze, w ruchu
- Używaj motywu topograficznego jako subtelny element brandingowy
- Traktuj ścieżkę/szlak jako wizualną metaforę w UI

### Don't
- Nie używaj jasnego motywu w samej apce (dark mode only)
- Nie mieszaj stylu ilustracji logo z fotorealistycznymi zdjęciami
- Nie używaj generycznych ikon psów — wyżeł to nasz brand
- Nie przesadzaj z animacjami — subtlety > spectacle
- Nie używaj czystego białego (#FFFFFF) jako tła landing — zawsze kremowy (#F7F5F0)
- Nie dodawaj zaokrąglonych rogów do samego pliku logo
