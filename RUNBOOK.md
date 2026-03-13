# PDR Runbook: VSM Visual Simulator Skills Starter Kit

## Purpose

Use this repository as a reusable starter for simulator projects with a skills-first workflow:

- Generic dashboard shell (left parameters, top KPIs, center graph/simulation)
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
- compiles `models/active/compiled_forecast_model.json`
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

Recommended deterministic refresh order:

1. `node scripts/compile-forecast-model.mjs models/active`
2. `node scripts/generate-result-metrics.mjs --model models/active/compiled_forecast_model.json --scenario models/active/scenario_committed.json --out models/active/result_metrics.json`
3. `node scripts/generate-operational-diagnosis.mjs --model models/active/compiled_forecast_model.json --scenario models/active/scenario_committed.json --metrics models/active/result_metrics.json --outJson models/active/operational_diagnosis.json --outMd models/active/operational_diagnosis.md`

## Simulator header contract

Current template behavior for the top control ribbon:

- Brand line above title: `LeanStorming Operational Stress Labs` (warning/yellow treatment)
- Actions row: `Start/Pause`, `Reset Time`, `Import Library CSV`, `Save Scenario`
- Playback controls are placed below actions in the same card
- `Reset Time` resets elapsed simulation time and view state only; it does not reset edited parameters
- Right status strip contains sim timer/progress and scenario library chip

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
- `models/vsm_graph.json` (legacy/standard compile path)
- `models/master_data.json` (legacy/standard compile path)
- `models/compiled_sim_spec.json` (legacy/standard compile path)

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
- UI still renders using mocked output if DES is not implemented
- Demand seeding assumptions are explicit and traceable in compiled model assumptions
