# PDR Runbook: VSM Visual Simulator Skills Starter Kit

## Purpose

Use this repository as a reusable starter for simulator projects with a skills-first workflow:

- Generic simulator cockpit shell (top control ribbon, collapsible what-if rail, simulation-first center stage)
- VSM ingestion to deterministic non-DES forecast outputs (with optional DES compile path)
- Domain swaps through config/model data, not UI rewrites
- Operational diagnosis of simulation outputs for leader-ready decisions

## One-command start

1. Install dependencies:
   `npm install`
2. Bootstrap and run:
   `npm run start:sim`

`npm run start:sim` executes compile + validate and then launches Vite.

## Landing page + routing

- `/` serves the FlowStress AI landing page
- `/sim` serves the simulator
- The simulator route is lazy-loaded so landing-page visitors do not pull model and graph code until they open `/sim`
- Simulator access is gated by a validation code prompt before `/sim` opens
- Accepted code: `LEAN`
- On successful entry, the browser stores access in a cookie so repeat visits on the same browser do not prompt again
- Direct visits to `/sim` must enforce the same code gate as the landing-page CTAs

### Demo request configuration

Copy `.env.example` to a local env file and configure one or more of:

- `VITE_DEMO_FORM_ENDPOINT` for live POST submissions
- `VITE_DEMO_CONTACT_URL` for a fallback contact path
- `VITE_DEMO_CONTACT_EMAIL` for a mailto fallback

### SPA routing requirement

If the app is deployed behind a static host, configure rewrites so any request such as `/sim`
returns `index.html`. Without that rewrite, direct refreshes on nested routes will fail.

## Workflow A-F

1. Import or paste VSM into a normalized graph:
   `npm run import:vsm -- --from <input-file> --out models/vsm_graph.json`
2. Add/edit master tables:
   - `models/tables/products.csv`
   - `models/tables/equipment.csv`
   - `models/tables/processing.csv`
   - `models/tables/variability.csv`
   - then run `npm run build:master`
3. Compile to simulation spec:
   `npm run compile:spec`
4. Validate contracts:
   `npm run validate:models`
5. Run UI:
   `npm run dev`
6. Generate simulation results.
7. Call `operational-diagnosis` immediately after results exist and before export or reporting:
   - Use `.agents/skills/operational-diagnosis/SKILL.md`
   - Feed summary metrics, queue and backlog trends, bottleneck behavior, staffing, staging, and scenario deltas
   - Output a leader-ready Operational Diagnosis that explains failure mechanism, downstream effects, economic meaning, and smallest stabilizing action
8. Export/report the committed scenario only after the diagnosis is generated.

## Model semantics (forecast mode)

Use these definitions consistently when validating simulator behavior:

- `capacityUnits`: parallel processing units at a step (for example lines/stations in parallel).
- `CT/effective CT`: service-time basis for capacity and completion.
- `LT`: delay KPI (process + queue + explicit delay), not a completion trigger.
- `completed output`: capacity-constrained flow completion over elapsed simulation time.
- `processedQty`: pass-through volume at a specific step over elapsed runtime.
- `completedQty`: terminal completions only; non-terminal steps should use `processedQty` for pass-through volume.
- Edge badges in the flow canvas should display pass-through lots from `processedQty`, not terminal-only `completedQty`.
- `throughputState`: labels runtime throughput as `steady-state`, `transient`, or `fallback-analytical`.
- `warmupHours`: estimated elapsed hours before runtime throughput should be treated as warmed up.
- `warnings[]`: degraded-confidence flags for transient runtime output, rework loops, and other caution states.

Incoming demand behavior:

- If explicit demand is missing in source VSM data, the compile step seeds baseline demand from release/start-step capacity (not bottleneck capacity) and logs the assumption in `compiled_forecast_model.json`.
- Runtime demand used by the forecast engine is:
  `lineDemand = baselineDemandRatePerHour * demandMultiplier`.

Interpretation rule:

- If a step's theoretical max over horizon is high but completed quantity is low, check demand-limited operation first before diagnosing local capacity loss.

## One-command VSM image -> export workflow

Use this when you have ingested/transcribed a VSM image into `models/active/vsm_graph.json` and
`models/active/master_data.json` and want a deterministic export package plus launcher:

`npm run workflow:vsm:image -- --image <path-to-vsm-image> --name <export-name>`

What it enforces:
- writes `models/active/ingestion_manifest.json`
- refreshes accepted active artifacts in canonical order:
  - `compiled_forecast_model.json`
  - `result_metrics.json`
  - `operational_diagnosis.json`
  - `operational_diagnosis.md`
  - `consulting_report_export.{json,md,html}`
  - `public/generated/leanstorming-executive-report.pdf`
  - `public/generated/leanstorming-comparison-executive-report.pdf` when `models/active/scenario_comparisons.json` exists
- builds app assets
- exports bundle with full app + browser forecast
- writes `exports/LATEST_EXPORT.txt`
- writes `start_latest_export.bat` at repo root to launch latest exported full app

## Accepted forecast artifacts

When the active non-DES forecast model has been accepted, the canonical active files are:

- `models/active/compiled_forecast_model.json`
- `models/active/scenario_committed.json`
- `models/active/result_metrics.json`
- `models/active/operational_diagnosis.json`
- `models/active/operational_diagnosis.md`
- `models/active/consulting_report_export.json`
- `models/active/consulting_report_export.md`
- `models/active/consulting_report_export.html`
- `models/active/scenario_comparisons.json` when comparison snapshots exist
- `public/generated/leanstorming-executive-report.pdf`
- `public/generated/leanstorming-comparison-executive-report.pdf` when comparison snapshots exist

Recommended deterministic refresh order:

Preferred one-command refresh:

1. `npm run refresh:forecast:active`

Equivalent explicit order:

1. `node scripts/compile-forecast-model.mjs models/active`
2. `node scripts/generate-result-metrics.mjs --model models/active/compiled_forecast_model.json --scenario models/active/scenario_committed.json --out models/active/result_metrics.json`
3. `node scripts/generate-operational-diagnosis.mjs --model models/active/compiled_forecast_model.json --scenario models/active/scenario_committed.json --metrics models/active/result_metrics.json --outJson models/active/operational_diagnosis.json --outMd models/active/operational_diagnosis.md`
4. `node scripts/export-consulting-report.mjs --outJson models/active/consulting_report_export.json --outMd models/active/consulting_report_export.md --outHtml models/active/consulting_report_export.html`
5. `python scripts/export_executive_report_pdf.py`

Comparison reports are emitted by the same PDF exporter when `models/active/scenario_comparisons.json` is present, so both executive PDFs stay in sync with the active forecast refresh.

Workflow rule:

- `scripts/generate-result-metrics.mjs` is a thin wrapper over `src/lib/bottleneckForecast.ts`; do not maintain separate forecast math in that script.
- Preserve `globalMetrics.globalThroughput` as a compatibility alias for `forecastThroughput` in exported result metrics until all downstream consumers are updated.

## Simulator header contract

Current template behavior for the top control ribbon:

- Brand line above title: `LeanStorming Operational Stress Labs` (warning/yellow treatment)
- Actions row: `Start/Pause`, `Reset Time`, `Save Scenario`
- Playback controls are placed below actions in the same card
- `Reset Time` resets elapsed simulation time and view state only; it does not reset edited parameters
- Sim timer chip contains the `Simulation Horizon` control with presets: `8 hrs`, `16 hrs`, `24 hrs`, `1 week`, `1 month`
- Default simulation horizon is `1 week` (`168` hours)
- Horizon control is visible in the clock chip and should be disabled while the simulation is actively running
- Right status strip contains sim timer/progress, live state, and scenario library chip
- View buttons stretch across the available card width and use larger click targets
- Playback speed buttons are larger, high-visibility direct toggles with presets: `x1`, `x2`, `x5`, `x100`, `x200`, and `x1000`
- `Recommended move` is de-emphasized and collapsed by default:
  keep the title visible and expose supporting text behind a `more` toggle
- In `Flow`, KPI cards should not consume a full top row:
  use a compact in-canvas ribbon instead
- When a run reaches the horizon, the header should show `Run Complete` and keep the final state visible until the user resets.
- The top-ribbon `Start` button should not silently rewind a finished run.
- The step inspector `Apply & Start` action may restart from zero after a finished run so parameter edits can be tested again immediately.

## Flow workspace contract

- The simulation canvas is the visual hero and should start as close to the header as practical
- `Flow` mode uses a compact KPI ribbon inside the canvas, not a full-width KPI band above it
- Accepted baseline KPI ribbon in `Flow`:
  `Forecast Output / hr`, `Constraint Pressure`, `WIP Load`, `Total Completed Lots`
- `Total Completed Lots` sits last in the ribbon and uses a distinct magenta outline
- `Reset` returns the canvas to the accepted top-left start-lane framing
- Toggling the `What-if Controls` rail must not push the flow steps down or lose the saved viewport framing
- The flow edge badges should represent completed pass-through lots between steps via `processedQty`, not terminal completions.

## What-if rail contract

- Left rail is collapsible but always recoverable through a clear reopen handle
- In desktop flow mode, the rail behaves like a sticky drawer with its own internal scroll region
- The parameter list, not the whole page, owns scrolling when the rail is open
- Help tooltips for parameter fields should render as floating overlays so they are not clipped by the scroll container, and the info icons should open on click/focus as well as hover
- `Simulation Horizon` is no longer treated as a left-rail what-if lever once the header clock control exists

## Header utilities and result surfaces

- The header utility row exposes `Instruction Guide` and `Executive Report` shortcuts above the simulator cards
- Standard result surfaces are `FLOW`, `DIAGNOSIS`, `KAIZEN`, `THROUGHPUT`, `WASTE`, `ASSUMPTIONS`, and `COMPARE`
- `COMPARE` is a saved-run delta view, not a second live model: it reads two saved scenario files and shows A/B metric changes side by side
- The scenario library should support assigning saved runs into comparison slots `A` and `B`, swapping them, clearing them, and opening compare mode without mutating the active committed scenario
- Compare workflows should preserve the same underlying metric semantics as the live simulator, especially `forecastThroughput`, `processedQty`, `completedQty`, and bottleneck migration interpretation

## On-demand Replit publish workflow

Use this only when you want a stable deployment target for Replit. It keeps the normal timestamped export flow intact, then republishes the latest accepted bundle into `deploy/replit/`:

`npm run export:replit`

Preferred agent request:

`Export the current committed scenario to a Replit bundle named "<bundle-name>" and tell me the output path.`

Optional inputs:

- `npm run export:replit -- --name sterile-brr-replit`
- `npm run export:replit -- --scenario models/active/scenario_committed.json --metrics models/active/result_metrics.json --skipBuild true`

Default behavior:

- If `models/active/scenario_committed.json` exists, `npm run export:replit` uses it automatically.
- If `models/active/result_metrics.json` exists, `npm run export:replit` uses it automatically.
- If `models/active/operational_diagnosis.json` / `.md` exist, `npm run export:replit` preserves them in the deploy target instead of regenerating different copies.

What it writes:

- `deploy/replit/app/`
- `deploy/replit/server.mjs`
- `deploy/replit/package.json`
- `deploy/replit/README.md`
- `deploy/replit/dashboard_config.json`
- `deploy/replit/vsm_graph.json`
- `deploy/replit/master_data.json`
- `deploy/replit/compiled_forecast_model.json`
- `deploy/replit/scenario_committed.json`
- `deploy/replit/result_metrics.json`
- `deploy/replit/operational_diagnosis.json`
- `deploy/replit/operational_diagnosis.md`
- `deploy/replit/publish_manifest.json`

How to run after publishing:

- From repo root: `npm run start:replit-bundle`
- In Replit, set the run command to: `npm run start:replit-bundle`

## Key files

- `models/dashboard_config.json`
- `models/active/vsm_graph.json`
- `models/active/master_data.json`
- `models/active/compiled_forecast_model.json`
- `models/active/scenario_committed.json`
- `models/active/result_metrics.json`
- `models/active/operational_diagnosis.json`
- `models/active/operational_diagnosis.md`
- `models/active/consulting_report_export.json`
- `models/active/consulting_report_export.md`
- `models/active/consulting_report_export.html`
- `models/active/scenario_comparisons.json` when comparison snapshots exist

## Consulting-grade report exporter

Use this when you need an executive-ready report or presentation package without changing the substance of the current artifacts:

`npm run export:consulting-report`

What it does:

- reads the current active report artifacts as-is
- preserves wording, recommendations, uncertainty, and evidence gaps
- reorganizes the material into a consulting-style section/page structure
- outputs a machine-friendly export spec, a reviewer-friendly markdown outline, and a browser-presentable HTML deck

What it writes:

- `models/active/consulting_report_export.json`
- `models/active/consulting_report_export.md`
- `models/active/consulting_report_export.html`

Bundle behavior:

- `npm run export:bundle` now includes `consulting_report_export.json`, `consulting_report_export.md`, and `consulting_report_export.html`
- these files are organization specs only; they do not rewrite the underlying analysis
- timestamped bundles can include the portable browser snapshot and the full built app package at the same time
- generated bundle READMEs document both the browser cockpit path and the CLI runner path
- `models/vsm_graph.json` (legacy/standard compile path)
- `models/master_data.json` (legacy/standard compile path)
- `models/compiled_sim_spec.json` (legacy/standard compile path)
- `src/lib/simulatorAccess.ts`
- `src/components/SimulatorAccessDialog.tsx`

## Skills

- `.agents/skills/export-scenario-bundle/SKILL.md`
- `.agents/skills/operational-diagnosis/SKILL.md`
- `.agents/skills/project-bootstrap-simulator/SKILL.md`
- `.agents/skills/sim-engine-des/SKILL.md`
- `.agents/skills/sim-scenario-insights/SKILL.md`
- `.agents/skills/sim-visual-motion/SKILL.md`
- `.agents/skills/ui-sim-dashboard-shell/SKILL.md`
- `.agents/skills/vsm-to-sim-model/SKILL.md`

## Orchestrator handoff

When using an assumptions-plan-execute-deliver workflow, insert `operational-diagnosis` immediately after simulation results are generated and before scenario export, reporting, or final recommendations. Treat it as the translation layer from model outputs to operator action:

- determine whether the system is stable, stressed, brittle, or overloaded
- identify the true system constraint and its mechanism
- explain queue propagation, downstream blockage, and business impact
- recommend the smallest stabilizing intervention first

## Acceptance checklist

- Repo is runnable with `npm run start:sim` (after install)
- UI layout remains fixed while config/data changes content
- Forecast workflow emits active compiled model, committed scenario, metrics, and diagnosis artifacts
- Forecast workflow also keeps consulting report exports in sync with the accepted active artifacts
- UI still renders using mocked output if DES is not implemented
- Demand seeding assumptions are explicit and traceable in compiled model assumptions
- Landing page requires access code `LEAN` before simulator entry unless prior acceptance cookie exists
- Direct `/sim` navigation is gated by the same access flow
- Header utilities include `Instruction Guide` and `Executive Report`
- View surfaces include `FLOW`, `DIAGNOSIS`, `KAIZEN`, `THROUGHPUT`, `WASTE`, `ASSUMPTIONS`, and `COMPARE`
- Saved-run comparison can assign two files and open Scenario Compare without overwriting the committed active scenario
- Waste and Throughput report wording should remain operator-friendly without changing metrics or section structure
- `Flow` opens with the graph framed near the first steps rather than centered low in the canvas
- `What-if Controls` remain reachable when collapsed and show an obvious internal scrollbar when open
