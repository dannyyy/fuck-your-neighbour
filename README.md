# Fuck Your Neighbour 🃏

Digitale Umsetzung der Schweizer Jass-Variante **„Fuck Your Neighbour"** – mobile-first
im Browser, ein Mensch gegen 2–5 KI-Gegner (total 3–6 Spieler).

## Spielregeln (Kurzfassung)

- 36 Deutschschweizer Jasskarten, **ohne Trumpf** – nur der Rang zählt, Farben sind wertlos.
- **Rangordnung (tief → hoch):** `6 < 7 < 8 < 10/Banner < Under < Ober < König < 9 < Ass`
  (die **9 ist zweithöchste** Karte, die 10/Banner liegt unter dem Under).
- **11 Runden** mit `6→5→4→3→2→1→2→3→4→5→6` Karten.
- Vor jeder Runde sagt reihum jeder seine Stichzahl an. Der **Geber sagt zuletzt** an und
  darf die Summe nicht auf die Kartenzahl bringen; niemand darf **zweimal in Folge 0** ansagen.
- **Stechen** bei Gleichstand: alle legen eine weitere Karte, der Gewinner bekommt mehrere
  Stiche gutgeschrieben (Summe der Stiche = ausgeteilte Karten). Bei der letzten Karte
  gewinnt die **darunterliegende** Karte (Erben).
- **1-Karten-Runde:** eigene Karte verdeckt „an der Stirn", alle anderen offen.
- **Punkte:** exakte Ansage → **+10**, pro Stich Abweichung → **−5**.

## Technik

- **Vite + React + TypeScript**, **Tailwind CSS v4**, **Framer Motion**, **Zustand**.
- Reine, framework-unabhängige Spiel-Engine unter `src/game` (voll unit-getestet).
- KI in `src/ai` mit drei Stufen (leicht / mittel / schwer) – Monte-Carlo-Schätzung der
  Ansage, zielgerichtete Kartenwahl, korrekte Behandlung von Reststapel & verdeckten Karten.
- Synthetischer Sound über die Web Audio API (keine Asset-Dateien), installierbar als PWA.

## Befehle

```bash
npm install      # Abhängigkeiten
npm run dev      # Entwicklung (http://localhost:5173)
npm test         # Unit-/Integrationstests (Vitest)
npm run build    # Produktions-Build
npm run preview  # Build lokal ansehen
```

## Projektstruktur

```
src/game/   Spiel-Engine (Karten, Ansage, Stich/Stechen, Wertung, Zustandsmaschine)
src/ai/     KI (Wahrscheinlichkeit, Heuristik, Monte-Carlo, Sicht/Observation)
src/state/  Zustand-Store (Orchestrierung + Timing) und Sound
src/ui/     Screens & Komponenten (Karten-Rendering, Tisch, Overlays)
src/i18n/   Deutsche Texte
```
