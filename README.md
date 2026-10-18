# Kości 🎲

**Wersja online:** https://maciejsajdera.github.io/diceroller/

Nowoczesna aplikacja PWA do rzucania kośćmi w popularnych grach z pięknym interfejsem, efektami dźwiękowymi i opcjonalną wizualizacją 3D. Działa w przeglądarce na telefonie i komputerze, a po pierwszym otwarciu także offline.

## ✨ Funkcje

### Wizualizacja
- **🎨 Nowoczesny design** z gradientami, cieniami i płynnymi animacjami
- **🌓 Tryb jasny/ciemny** z płynnym przejściem
- **🎲 2D i 3D kości** - opcjonalna wizualizacja 3D z fizycznymi animacjami (Three.js)
- **📱 Responsywny** - dostosowany do telefonów, tabletów i komputerów

### Dźwięk i Haptyka
- **🔊 Efekty dźwiękowe** - realistyczne dźwięki rzutów kości (Web Audio API)
- **📳 Wibracje** - opcjonalne wibracje przy rzutach (Android)

### Statystyki i Historia
- **📊 Dashboard statystyk** - liczba rzutów, ulubione tryby, serie dni
- **🔥 Streak tracking** - śledź codzienne serie gry
- **📜 Historia rzutów** - ostatnie 50 rzutów z godziną, trybem i wynikiem
- **📤 Udostępnianie** - Web Share API do dzielenia się wynikami

### Presety i Personalizacja
- **💾 Presety** - zapisz ulubione konfiguracje (D&D i tryb Własny)
- **⚙️ Ustawienia** - wibracje, dźwięk, motyw, tryb 3D
- **💿 Offline** - wszystkie ustawienia w localStorage

## Tryby

| Tryb | Co robi |
|---|---|
| **Catan** | 2k6, suma, wyróżniona 7 (złodziej), 3D kości |
| **Monopoly** | 2k6, wykrywanie dubletu, licznik dubletów z rzędu; 3. dublet = „do więzienia" |
| **Kości (Yahtzee)** | 5k6, maks. 3 rzuty na turę, blokowanie kości, podpowiedź układu (generał, full, strit…) |
| **D&D** | k4/k6/k8/k10/k12/k20/k100, liczba kości, modyfikator, przewaga/utrudnienie (2k20) |
| **Warhammer** | pula Nk6, próg trafienia, liczba trafień, opcjonalnie rzut na rany |
| **Ryzyko** | atakujący 1–3k6 vs obrońca 1–2k6, porównanie od najwyższych, straty |
| **Własny** | dowolne grupy kości (do 8) + modyfikator |

## Losowość

`src/dice.ts` to czysty moduł TS. Używa `crypto.getRandomValues` z **rejection sampling**: wartości z „ogona" zakresu 2³², który nie dzieli się równo przez liczbę ścianek, są odrzucane, więc nie ma biasu modulo. Testy w `src/dice.test.ts` (w tym test chi-kwadrat rozkładu k6).

## Uruchomienie

Wymagany Node ≥ 20.19.

```bash
npm install
npm run dev        # serwer deweloperski
npm test           # testy (vitest run)
npm run build      # typecheck (tsc) + build do dist/
npm run preview    # podgląd builda, http://localhost:4173
npm run icons      # ponowne wygenerowanie ikon w public/
```

Service worker działa tylko w buildzie (`build` + `preview`), nie w `dev`.

## Wdrożenie (GitHub Pages)

Aplikacja wdraża się automatycznie przez GitHub Actions (`.github/workflows/deploy.yml`) przy każdym pushu na `main`: `npm ci` → `npm test` → `npm run build` → publikacja `dist/` na Pages. 

Build ma `base: './'`, więc działa z podkatalogu `/diceroller/` (i z każdego innego hostingu statycznego) bez zmian w konfiguracji. Pages serwuje przez HTTPS, czego wymaga service worker i instalacja PWA. Na iPhonie: *Udostępnij → Do ekranu początkowego*; na Androidzie: menu Chrome → *Zainstaluj aplikację*.

## Wersje zależności

| Pakiet | Wersja | Uwagi |
|---|---|---|
| react, react-dom | ^19.3.1 | |
| three | ^0.171.0 | 3D rendering |
| vite | ^8.3.4 | |
| @vitejs/plugin-react | ^6.1.2 | |
| typescript | ^7.0.2 | |
| vite-plugin-pwa | ^2.0.0 | generateSW (Workbox) |
| vitest | ^4.1.12 | testy jednostkowe |
| @types/react, @types/react-dom, @types/three | ^19.3.0 / ^0.171.0 | TypeScript types |

Bez frameworka UI i bez biblioteki stanu: zwykły CSS i własny hook `usePersistentState`.

## Struktura

```
src/
  dice.ts              silnik kości (czysty TS) + dice.test.ts
  audio.ts             Web Audio API - efekty dźwiękowe
  stats.ts             tracking statystyk i serii
  storage.ts           hook localStorage
  types.ts             typy TypeScript
  styles.css           główne style (light/dark theme)
  modes/               widoki trybów gier
    Catan.tsx          Catan z 3D kośćmi
    Monopoly.tsx       Monopoly z trackerem dubletów
    Yahtzee.tsx        Kości z blokowaniem
    Dnd.tsx            D&D z przewagą
    Warhammer.tsx      Warhammer 40k
    Risk.tsx           Ryzyko
    Custom.tsx         własne konfiguracje
  components/
    Die.tsx            2D kość (lub wrapper dla 3D)
    Dice3D.tsx         Three.js renderer dla 3D kości
    Controls.tsx       kontrolki (Stepper, Segmented, RollButton)
    History.tsx        lista historii z share
    Statistics.tsx     dashboard statystyk
    Presets.tsx        zarządzanie presetami
scripts/
  gen-icons.mjs        generator ikon PNG/SVG
public/
  icon-*.png           ikony PWA
  favicon.svg          favicon
```

CI: Node 24 (LTS), actions/checkout@v7, setup-node@v7, configure-pages@v6, upload-pages-artifact@v5, deploy-pages@v5.

## Technologie

- **React 19** - UI framework
- **TypeScript 7** - type safety
- **Three.js** - 3D rendering kości
- **Web Audio API** - proceduralne efekty dźwiękowe
- **Web Share API** - udostępnianie wyników
- **PWA** - offline, service worker, installable
- **Vite 8** - bundler i dev server
- **Vitest 4** - testing framework
- **CSS Variables** - light/dark theme

## Ograniczenia

- Yahtzee: brak tabeli punktów, tylko podpowiedź układu
- Warhammer: bez przerzutów (re-roll 1s), krytyków, rzutów obronnych
- Monopoly: licznik dubletów jest wspólny dla wszystkich graczy
- Stan bieżącej tury (np. zablokowane kości) nie przetrwa przeładowania
- 3D kości: tylko tryb Catan ma pełną integrację (inne tryby w rozwoju)
- Aktualizacja PWA: `autoUpdate`, więc nowa wersja wchodzi po ponownym otwarciu

## Licencja

MIT

---

**Autor:** Maciej Sajdera  
**GitHub:** https://github.com/MaciejSajdera/diceroller
