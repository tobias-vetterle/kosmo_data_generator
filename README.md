# KOSMO Data Generator

Initiales Web-App-Setup für den **KOSMO - Synthetischer Datengenerator** auf Basis von **Vite + React + TypeScript**.

## Projektstruktur

```text
src/
  app/                  # App-Shell, Layout und globale Styles
  features/
    tables/             # Tabellenverwaltung
    columns/            # Spaltendefinitionen
    correlations/       # Regel- und Korrelationseditor
    export/             # Export (CSV/ZIP/Projekt-JSON)
  lib/
    generator/          # Datengenerierung
  state/                # Globaler Projektzustand (Zustand)
```

## Voraussetzungen

- Node.js 18+
- npm 9+

## Start

```bash
npm install
npm run dev
```

App läuft dann standardmäßig unter `http://localhost:5173`.

## Skripte

- `npm run dev` – Startet den Entwicklungsserver.
- `npm run build` – TypeScript-Check und Produktionsbuild.
- `npm run preview` – Lokale Vorschau des Production-Builds.
