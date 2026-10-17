# Kości 🎲

**Wersja online:** https://maciejsajdera.github.io/diceroller/

Prosta aplikacja PWA do rzucania kośćmi w popularnych grach. Działa w przeglądarce na telefonie i komputerze, a po pierwszym otwarciu także offline.

## Tryby

| Tryb | Co robi |
|---|---|
| **Catan** | 2k6, suma, wyróżniona 7 (złodziej) |
| **Monopoly** | 2k6, wykrywanie dubletu, licznik dubletów z rzędu; 3. dublet = „do więzienia”, przycisk „Następny gracz” |
| **Kości (Yahtzee)** | 5k6, maks. 3 rzuty na turę, blokowanie kości dotknięciem, numer rzutu, podpowiedź układu (para, full, strit, generał…) |
| **D&D** | k4/k6/k8/k10/k12/k20/k100, liczba kości, modyfikator, przewaga/utrudnienie (2k20, wyższy/niższy), naturalna 1/20 |
| **Warhammer** | pula Nk6, próg trafienia (np. 3+), liczba trafień; opcjonalnie rzut na rany z trafień (próg np. 4+) |
| **Ryzyko** | atakujący 1–3k6 vs obrońca 1–2k6, porównanie od najwyższych, remis dla obrońcy, straty obu stron |
| **Własny** | dowolne grupy kości (do 8) + modyfikator |

Do tego:
- **presety** dla trybów D&D i Własny: zapis pod nazwą, wczytanie, zmiana nazwy, usunięcie,
- **historia** ostatnich 50 rzutów z godziną, trybem i wynikiem, z przyciskiem czyszczenia,
- **duży przycisk „Rzuć”** na dole ekranu, **spacja** na komputerze, krótka animacja (wyłączona przy `prefers-reduced-motion`), opcjonalne wibracje (Android; iOS Safari nie obsługuje Vibration API),
- ciemny motyw, układ od 360 px szerokości, etykiety ARIA i `aria-live` dla wyników.

Ustawienia, presety i historia są w `localStorage` (klucze `kosci:v1:*`), tylko na tym urządzeniu.

## Losowość

`src/dice.ts` to czysty moduł TS. Używa `crypto.getRandomValues` z **rejection sampling**: wartości z „ogona” zakresu 2³², który nie dzieli się równo przez liczbę ścianek, są odrzucane, więc nie ma biasu modulo. Testy w `src/dice.test.ts` (w tym test chi-kwadrat rozkładu k6).

## Uruchomienie

Wymagany Node ≥ 20.19.

```bash
npm install
npm run dev        # serwer deweloperski
npm test           # testy (vitest run)
npm run build      # typecheck (tsc) + build do dist/
npm run preview    # podgląd builda, http://localhost:4173
npm run icons      # ponowne wygenerowanie ikon w public/ (czysty Node, bez zależności)
```

Service worker działa tylko w buildzie (`build` + `preview`), nie w `dev`.

## Wdrożenie (GitHub Pages)

Aplikacja wdraża się automatycznie przez GitHub Actions (`.github/workflows/deploy.yml`) przy każdym pushu na `main`: `npm ci` → `npm test` → `npm run build` → publikacja `dist/` na Pages. Pages w repo ma ustawione źródło „GitHub Actions”. Ręcznie: *Actions → Deploy to GitHub Pages → Run workflow*.

Build ma `base: './'`, więc działa z podkatalogu `/diceroller/` (i z każdego innego hostingu statycznego) bez zmian w konfiguracji. Pages serwuje przez HTTPS, czego wymaga service worker i instalacja PWA. Na iPhonie: *Udostępnij → Do ekranu początkowego*; na Androidzie: menu Chrome → *Zainstaluj aplikację*.

## Wersje zależności

Sprawdzone przez `npm view` 18.10.2026:

| Pakiet | Wersja | Uwagi |
|---|---|---|
| react, react-dom | 19.3.1 | |
| vite | 8.3.4 | |
| @vitejs/plugin-react | 6.1.2 | |
| typescript | 7.0.2 | |
| vite-plugin-pwa | 2.0.0 | generateSW (Workbox) |
| vitest | 4.1.12 | najnowsza to 5.0.5, ale wymaga Node ≥ 22.12; lokalnie był Node 20.19, więc użyta jest najnowsza 4.x |
| @types/react, @types/react-dom | 19.3.0 | |

Bez frameworka UI i bez biblioteki stanu: zwykły CSS i własny hook `usePersistentState`.

## Struktura

```
src/dice.ts            silnik kości (czysty TS) + dice.test.ts
src/modes/*.tsx        widoki trybów
src/components/        Die, RollButton/Stepper/Segmented, Presets, History
src/storage.ts         hook localStorage
scripts/gen-icons.mjs  generator ikon PNG/SVG
public/                ikony
```

CI: Node 24 (LTS), actions/checkout@v7, setup-node@v7, configure-pages@v6, upload-pages-artifact@v5, deploy-pages@v5.

## Ograniczenia

- Brak tabeli punktów w Kościach (Yahtzee): jest tylko podpowiedź układu.
- Warhammer: bez przerzutów (re-roll 1s), krytyków, rzutów obronnych ani kolejnych kroków.
- Monopoly nie śledzi graczy; licznik dubletów jest wspólny, a „Następny gracz” go zeruje.
- Stan bieżącej tury (np. zablokowane kości) nie przetrwa przeładowania strony; ustawienia, presety i historia przetrwają.
- Aktualizacja aplikacji: `autoUpdate`, więc nowa wersja wchodzi po ponownym otwarciu aplikacji.
