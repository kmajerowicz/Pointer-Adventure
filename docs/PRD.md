# Psi Szlak — Product Requirements Document

**Wersja:** 1.0 MVP  
**Typ:** Web App + PWA  
**Zasięg:** Polska  
**Odbiorcy:** Właściciel + znajomi (mała, zamknięta grupa, dostęp przez zaproszenie)  
**Ostatnia aktualizacja:** 2026-03

---

## 1. Cel produktu

Aplikacja do odkrywania i planowania tras spacerowych oraz hikingowych przyjaznych psom — ze szczególnym uwzględnieniem potrzeb wyżłów (dostęp do wody, naturalne nawierzchnie, otwarte przestrzenie). Wyklucza trasy miejskie i przy ruchliwych drogach.

---

## 2. Stack technologiczny

### Frontend

- **Framework:** React + Vite
- **Język:** TypeScript
- **Stylowanie:** Tailwind CSS
- **Routing:** React Router v6

### Mapy

- **Mapbox GL JS** — renderowanie WebGL, płynne na mobile
- Styl **Mapbox Outdoors** — szlaki, poziomice, lasy, rzeki gotowe out of the box
- **Mapbox Geocoding API** — wyszukiwarka miejscowości w tym samym ekosystemie
- Darmowy tier: 50 000 map loads/miesiąc — przy małej grupie użytkowników w ogóle nieosiągalny

### Backend

- **Supabase** (darmowy tier) — PostgreSQL + auth + storage
    - Konta użytkowników (rejestracja tylko przez zaproszenie)
    - Zapisywanie ulubionych tras
    - Baza tras zasilana automatycznie

### PWA

- Service Worker (Workbox) — cache map i tras offline
- Web App Manifest — instalacja na telefonie
- Geolokalizacja przez browser API

---

## 3. Źródła danych o trasach

Dane pozyskiwane automatycznie z dwóch komplementarnych źródeł. Żadna trasa nie jest dodawana ręcznie.

### 3.1 OpenStreetMap / Overpass API

Główne źródło — darmowe, największa baza danych geograficznych świata.

**Pobierane typy tras:**

- `route=hiking` — szlaki piesze i turystyczne
- `route=foot` — trasy spacerowe
- `highway=path` + `highway=track` — ścieżki i drogi gruntowe
- `leisure=nature_reserve` — tereny przyrodnicze
- `waterway=river`, `natural=water` — dane o dostępie do wody wzdłuż trasy

**Wykluczenia (filtry negatywne):**

- `highway=primary`, `secondary`, `tertiary` — ruchliwe drogi
- `landuse=residential`, `landuse=commercial` — tereny miejskie
- `access=no`, `dogs=no` — zakaz wstępu z psami

**Proces zasilania — on-demand via Supabase Edge Function:**

- Użytkownik wyszukuje lokalizację lub przesuwa mapę
- Frontend **zawsze** wywołuje Edge Function `/search-trails` z bounding boxem widocznego obszaru (single entry point — logika cache server-side)
- Edge Function sprawdza tabelę `search_areas` (TTL: 7 dni) — jeśli obszar już odpytany i dane świeże, zwraca z bazy
- Jeśli brak pokrycia lub cache wygasł → Edge Function odpytuje Overpass API dla tego obszaru
- Wyniki normalizowane i zapisywane do tabeli `routes` w Supabase
- Duplikaty deduplikowane po `source_id` (OSM ID)

### 3.2 Turystyczne szlaki znakowane (PTTK / OSM Relations)

Polskie szlaki turystyczne znakowane kolorami — osobna warstwa danych.

- Pobierane przez tę samą Edge Function `/search-trails` — zapytanie Overpass rozszerzone o relacje PTTK
- OSM Relations: `type=route`, `route=hiking`, `network=lwn|rwn|nwn`
- Zawierają szlaki PTTK opisane w OSM (czerwone, niebieskie, żółte, zielone, czarne)
- Wyświetlane na mapie jako osobna warstwa z kolorami zgodnymi ze znakowaniem
- Atrybut `trail_color` mapowany na kolor pinezki / linii trasy na mapie

### 3.3 Schemat normalizacji danych

Wszystkie źródła sprowadzane do wspólnego schematu przed zapisem:

```
surface_type:    "dirt" | "gravel" | "asphalt" | "mixed" | null
difficulty:      "easy" | "moderate" | "hard" | null
water_access:    "none" | "nearby" | "on_route"
water_type:      "river" | "lake" | "stream" | null
dogs_allowed:    boolean
trail_color:     "red" | "blue" | "yellow" | "green" | "black" | null
source:          "osm" | "pttk"
```

**Mapowanie atrybutów OSM:**

- `surface_type`: z tagu `surface=*` (`dirt`, `gravel`, `asphalt`, `mixed`). Brak tagu → `null` (wyświetlane jako „Nieznana" w UI)
- `difficulty`: z tagu `sac_scale`: `hiking` → `easy`, `mountain_hiking` → `moderate`, `demanding_mountain_hiking` i wyżej → `hard`. Brak tagu → `null` (wyświetlane jako „Nieznana" w UI)
- `water_access`: **obliczane** przez Edge Function via Overpass `around:200` query do obiektów `waterway=*` / `natural=water`. `on_route` jeśli trasa przecina wodę, `nearby` jeśli w buforze 200m, `none` w pozostałych przypadkach. Brak spatial math w naszym kodzie — logika proximity delegowana do Overpass
- `dogs_allowed`: brak tagu `dogs=no` → `true`
- `trail_color`: z tagów `colour=*` lub `osmc:symbol=*` na relacjach PTTK

### 3.4 Edge Function: `/search-trails`

**Input (POST):**

```json
{
  "south": 49.5,
  "north": 50.2,
  "west": 19.5,
  "east": 20.3
}
```

**Logika:**

1. Sprawdź tabelę `search_areas` — czy istnieje wpis z `searched_at` < 7 dni pokrywający żądany bounding box
2. Jeśli tak — zwróć trasy z `routes` dla tego obszaru
3. Jeśli nie — wyślij zapytanie do Overpass API z filtrami (route=hiking, route=foot, highway=path/track + wykluczenia) oraz relacje PTTK: `relation[route=hiking][network~"lwn|rwn|nwn"]`
4. Znormalizuj wyniki wg schematu 3.3 (w tym oblicz `water_access` via Overpass `around:200` query)
5. Upsert do tabeli `routes` (deduplikacja po `source_id`)
6. Wstaw nowy wiersz do `search_areas` z odpytanym bounding boxem
7. Zwróć trasy

**Output:**

```json
{
  "routes": [{ "id": "...", "name": "...", ... }],
  "from_cache": true
}
```

---

## 4. Architektura bazy danych (Supabase)

```sql
routes
  id              uuid PRIMARY KEY
  name            text
  description     text
  length_km       numeric
  surface_type    text        -- dirt / gravel / asphalt / mixed / null
  difficulty      text        -- easy / moderate / hard / null
  water_access    text        -- none / nearby / on_route
  water_type      text        -- river / lake / stream / null
  dogs_allowed    boolean
  trail_color     text        -- dla szlaków PTTK
  geometry        jsonb       -- przebieg trasy
  center_lat      float       -- środek trasy (do query przestrzennych)
  center_lon      float
  bbox_south      float       -- bounding box trasy
  bbox_north      float
  bbox_west       float
  bbox_east       float
  source          text        -- osm / pttk
  source_id       text UNIQUE -- id w źródłowym systemie (deduplikacja)
  created_at      timestamptz
  updated_at      timestamptz

search_areas                    -- śledzenie odpytanych obszarów (cache coverage)
  id              uuid PRIMARY KEY
  bbox_south      float
  bbox_north      float
  bbox_west       float
  bbox_east       float
  searched_at     timestamptz

favorites
  id              uuid PRIMARY KEY
  user_id         uuid REFERENCES auth.users
  route_id        uuid REFERENCES routes
  note            text        -- prywatna notatka użytkownika
  created_at      timestamptz

activity_log                  -- zbierany od MVP via przycisk "Przeszedłem!", używany w v2 do rekomendacji
  id              uuid PRIMARY KEY
  user_id         uuid REFERENCES auth.users
  route_id        uuid REFERENCES routes
  walked_at       timestamptz
  duration_min    integer

users
  id              uuid REFERENCES auth.users
  display_name    text
  dog_name        text
  avatar_url      text

invitations
  id              uuid PRIMARY KEY
  token           text UNIQUE
  created_by      uuid REFERENCES auth.users
  used_by         uuid REFERENCES auth.users
  used_at         timestamptz
  expires_at      timestamptz
```

---

## 5. Funkcjonalności MVP

### 5.1 Mapa i geolokalizacja

- Interaktywna mapa Polski (Mapbox Outdoors)
- Przycisk „Gdzie jestem" — centrowanie na aktualnej lokalizacji
- Wyszukiwarka miejscowości / regionów (Mapbox Geocoding API)
- Klastry pinezek tras (żeby nie zaśmiecać widoku przy odpychaniu mapy)
- Osobna warstwa: szlaki PTTK z kolorowym znakowaniem

### 5.2 Przeglądanie tras

- Widok mapowy + lista (przełącznik)
- Karta trasy zawiera:
    - Nazwę i opis
    - Długość (km)
    - Typ nawierzchni
    - Dostęp do wody (brak / w pobliżu / na trasie)
    - Miniaturę mapy z przebiegiem
    - Poziom trudności
    - Kolor szlaku (jeśli trasa PTTK)

### 5.3 Filtrowanie tras

|Filtr|Opcje|
|---|---|
|Długość|< 5 km / 5–15 km / > 15 km|
|Nawierzchnia|Ziemia / Żwir / Asfalt / Mieszana / Nieznana|
|Dostęp do wody|Wymagana / Mile widziana / Obojętne|
|Trudność|Łatwa / Średnia / Trudna / Nieznana|
|Odległość od miejsca|< 10 km / < 30 km / < 50 km (obliczana client-side Haversine na `center_lat`/`center_lon`)|
|Szlak znakowany|Tak / Obojętne|

Wykluczenia systemowe (zawsze aktywne, niewidoczne dla użytkownika):

- Trasy przy drogach głównych
- Trasy w centrach miast
- Trasy z `dogs=no`

Sortowanie wyników:

- „Mile widziana woda" winduje trasy z wodą wyżej, nie wyklucza pozostałych

### 5.4 Zapisywanie ulubionych

- Dodanie do ulubionych (ikona serca na karcie trasy)
- Widok „Moje ulubione" — lista z możliwością filtrowania
- Prywatna notatka do każdej trasy

### 5.5 Konta użytkowników

- Rejestracja wyłącznie przez jednorazowy link zaproszeniowy
- Logowanie: magic link (email) — jedyna metoda autentykacji
- Profil: imię, imię psa, avatar
- Generowanie linków zaproszeniowych przez właściciela konta

### 5.6 Przeszedłem! (logowanie aktywności)

- Przycisk „Przeszedłem!" na widoku szczegółów trasy
- Kliknięcie → zapis do tabeli `activity_log` (user_id, route_id, walked_at = now)
- Potwierdzenie: toast „Zapisano spacer!"
- Dane zbierane od MVP, wykorzystywane w v2 do rekomendacji

---

## 6. Onboarding użytkownika

### Ścieżka: nowy użytkownik z zaproszeniem

```
1. Otrzymuje link zaproszeniowy: [vercel-url]/invite?token=xyz (custom domain psiszlak.pl w v1.1)
2. Otwiera link → ekran rejestracji z pre-wypełnionym tokenem
3. Podaje imię i email → otrzymuje magic link do logowania
4. Ekran powitalny: „Cześć [imię]! Jak ma na imię Twój pies?"
5. Podaje imię psa → zapisywane w profilu
6. Prośba o zgodę na geolokalizację (z wyjaśnieniem po co)
7. Mapa wycentrowana na aktualnej lokalizacji z pierwszymi trasami
8. Krótki tooltip: „Filtruj trasy tutaj" → wskazuje na panel filtrów
```

### Ścieżka: powracający użytkownik

- Auto-login przez zapisaną sesję (Supabase session persistence)
- Mapa od razu na ostatniej lokalizacji lub aktualnej GPS

---

## 7. Stany puste i obsługa błędów

### Brak tras w okolicy

- Ilustracja + komunikat: „Brak tras w tym miejscu. Spróbuj powiększyć obszar wyszukiwania."
- Przycisk: „Szukaj w promieniu 50 km"

### Brak internetu (offline)

- Service Worker serwuje ostatnio przeglądane trasy z cache
- Baner informacyjny: „Tryb offline — wyświetlam zapisane trasy"
- Mapa w ostatnim pobranym obszarze (Mapbox tile cache)
- Funkcje niedostępne offline: wyszukiwarka, aktualizacja ulubionych

### Brak GPS / odmowa dostępu

- Komunikat: „Nie mamy dostępu do Twojej lokalizacji. Wpisz miejscowość, żeby znaleźć trasy."
- Automatyczne przejście do wyszukiwarki miejscowości
- Mapa domyślnie wycentrowana na centrum Polski

### Błąd ładowania tras (API down)

- Komunikat: „Coś poszło nie tak. Spróbuj odświeżyć."
- Retry button z exponential backoff (1s → 2s → 4s)
- Fallback na dane z cache Supabase jeśli dostępne

### Pusty widok ulubionych

- Ilustracja psa + komunikat: „Nie masz jeszcze ulubionych tras. Znajdź coś dla [imię psa]!"
- Przycisk CTA: „Przeglądaj trasy"

---

## 8. Design System

- **Inspiracja:** Strava (sportowy, czytelny, mobile-first)
- **Tryb:** Ciemny (domyślny i jedyny w MVP)
- **Kolor akcentu:** Złoty `#C9A84C`
- **Tło:** `#111318` (ciemna szaroniebieskawa czerń)
- **Powierzchnie:** `#1C1F26` / `#252930`
- **Typografia:** Inter
- **Nawigacja:** Dolny tab bar (Mapa / Trasy / Ulubione / Profil)
- **UX:** Duże przyciski, obsługa jedną ręką, mobile-first

---

## 9. PWA — wymagania

- Web App Manifest z ikoną, nazwą, splash screen
- Service Worker (Workbox) — cache tras i fragmentów mapy
- Instalacja na ekranie głównym telefonu
- Geolokalizacja przez browser API

---

## 10. Metryki sukcesu MVP

|Metryka|Cel|
|---|---|
|Czas do pierwszej trasy|< 30 sekund od wejścia na stronę|
|Trasy załadowane w pierwszej sesji|≥ 20 w okolicy użytkownika|
|Pokrycie szlakami PTTK|≥ 80% głównych szlaków w OSM|
|Ulubione na użytkownika|≥ 3 w ciągu pierwszego miesiąca|
|Powracający użytkownicy|≥ 60% w ciągu 30 dni|
|Działanie offline|Cache działa dla ostatnich 10 przeglądanych tras|

---

## 11. Backlog

### v1.1

- Tworzenie własnych tras (Route Drawing — Mapbox GL Draw)
- Custom domain `psiszlak.pl`

### v2

- Nawigacja turn-by-turn podczas spaceru
- Zdjęcia przy trasach
- Oceny i komentarze
- Integracja z pogodą
- Powiadomienia push
- Aplikacja natywna (React Native)

### Moduł rekomendacji (v2)

Rekomendacje oparte o historię i lokalizację. Wymaga danych z `activity_log` zbieranych od MVP.

**Logika (od prostej do złożonej):**

1. „Jeszcze tu nie byłeś" — trasy w pobliżu spoza historii
2. „Podobne do Twoich ulubionych" — matching po atrybutach
3. „Popularne wśród znajomych" — społecznościowy ranking
4. Personalizacja ML — daleka przyszłość

**Wymagania techniczne:**

- Algorytm scoringowy (wagi: odległość, nowość, dopasowanie preferencji)
- Sekcja „Dla Ciebie" na ekranie głównym z 3–5 propozycjami

---

## 12. Koszty (szacunek miesięczny)

|Usługa|Plan|Koszt|
|---|---|---|
|Supabase|Free tier (500 MB DB, 50k auth)|**0 zł**|
|Mapbox|Free tier (50k loads/mies.)|**0 zł**|
|OpenStreetMap / Overpass API|Darmowe (on-demand, rate-limit friendly)|**0 zł**|
|Hosting (Vercel)|Free tier|**0 zł**|
|**Łącznie MVP**||**~0 zł/mies.**|

---

## 13. Kolejne kroki

1. Utworzenie projektu React + Vite + Tailwind + TypeScript
2. Konfiguracja Supabase (auth, tabele, RLS policies)
3. Integracja Mapbox GL JS + styl Outdoors
4. Edge Function `/search-trails` (Overpass API → normalizacja → Supabase cache)
5. Warstwa szlaków PTTK z kolorowym znakowaniem
6. Implementacja filtrów i widoku listy tras
7. Widok ulubionych + system zaproszeń
8. Onboarding flow (magic link only)
9. PWA manifest + Service Worker
10. Testy na urządzeniach mobilnych
11. Udostępnienie znajomym