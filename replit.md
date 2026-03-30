# VSM Visual Simulator Starter

A reusable starter kit for building industrial simulator cockpits. Translates Value Stream Map (VSM) data into deterministic forecasts and provides an interactive "what-if" environment to diagnose system stability, bottlenecks, and throughput under different scenarios.

## Project Structure

- `src/` — React 18 frontend application
  - `components/` — UI widgets (Gauges, Sidebars, Graphs, Modals)
  - `lib/` — Business logic and skills (forecast math, report generators, graph layout)
  - `simulator/` — Core simulator application logic, hooks, and configuration
  - `marketing/` — Landing page and static content
  - `types/` — TypeScript type definitions
- `models/` — Source data and compiled simulation models
  - `active/` — Current committed model and derived outputs
  - `tables/` — CSV source files for equipment, products, and processing
- `scripts/` — Node.js and Python data pipeline utilities
- `deploy/replit/` — Replit deployment bundle (standalone server)
- `public/` — Static assets and generated PDF reports
- `tests/` — Unit tests for forecast math and analysis logic

## Tech Stack

- **Frontend**: React 18 + React Router 7
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **Package Manager**: npm

## Development

```bash
npm run dev        # Start dev server on port 5000
npm run build      # TypeScript compile + Vite build
npm run preview    # Preview production build
```

## Data Pipeline Scripts

```bash
npm run import:vsm            # Transcribe VSM to JSON
npm run build:master          # Process CSV tables
npm run compile:spec          # Create simulation spec
npm run validate:models       # Validate data contracts
npm run refresh:forecast:active  # Generate reports and diagnosis
npm run export:bundle         # Export scenario bundle
npm run export:replit         # Export Replit deployment bundle
```

## Deployment

- **Type**: Static site (React SPA)
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Dev server**: `0.0.0.0:5000`
