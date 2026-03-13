---
name: export-scenario-bundle
description: Use this skill to export a snapshot of the current accepted simulation or forecast scenario into a portable, versioned bundle that can run outside the app. Trigger when the user asks to export, save a portable package, hand off a scenario, archive a run, or generate a CLI-runnable scenario bundle with model plus scenario plus optional metrics.
argument-hint: "[optional: name=MyScenario] [optional: includeMetrics=true]"
---

# Export Scenario Bundle (Portable)

## Goal
When user asks to export, create a self-contained, versioned bundle of the current accepted scenario so it can run elsewhere without the app.

Never overwrite prior exports.

## Bundle contents
Create folder:
`exports/<YYYYMMDD_HHMMSS>_<safeName>/`

Include:
- `dashboard_config.json` (copy from `models/`)
- `vsm_graph.json` (copy from `models/active/`)
- `master_data.json` (copy from `models/active/`)
- `compiled_forecast_model.json` (copy from `models/active/`)
- `scenario_committed.json` (committed scenario state used for metrics)
- `result_metrics.json` (optional latest `globalMetrics` + `nodeMetrics`)
- `operational_diagnosis.json` (accepted diagnosis snapshot)
- `operational_diagnosis.md` (human-readable diagnosis)
- `README.md` (how to run bundle)
- `run_forecast.mjs` (portable deterministic CLI runner)
- `browser_forecast.html` (standalone browser runner)

Optional full app package (when `includeFullApp=true`):
- `app/`
- `server.mjs`
- `start_full_app.bat`

## Hard rules
1. Create a new bundle directory each run; no overwrite.
2. Export committed scenario only, never staged scenario.
3. Keep runner dependency-free (Node built-ins only).
4. If required value is missing, fail with explicit error.
5. If `includeMetrics=false`, omit `result_metrics.json`.
6. Always preserve accepted diagnosis files if present in `models/active/`.

## Runner requirements (`run_forecast.mjs`)
Runner must:
- Load bundle JSON files from disk.
- Execute deterministic non-DES forecast calculations.
- Print global KPIs:
  - throughput/hr
  - total WIP
  - bottleneck
  - brittleness
  - worst-case touch time
- Print top 3 constrained steps ranked by `bottleneckIndex`.

Supported args:
- `--path <bundleFolder>`
- `--json` for machine-readable output

Exporter args commonly used:
- `--name <scenarioName>`
- `--scenario <path/to/scenario_committed.json>`
- `--metrics <path/to/result_metrics.json>`
- `--includeMetrics true|false`
- `--includeFullApp true|false`
- `--skipBuild true|false`

## Replit publish workflow (separate from timestamped bundle)
For stable overwriteable Replit deploy output, use:

- `npm run export:replit`

This writes to `deploy/replit/` and should not replace or modify the timestamped export flow.

## App integration
Add button: `Export Scenario`

On click:
1. Export currently committed scenario.
2. Accept optional scenario name.
3. Show resulting export folder path in UI.

If prompting is unavailable, default name to app title + timestamp.

## Acceptance checklist
- [ ] New folder is created on every export
- [ ] Bundle contains required files
- [ ] CLI runner works with `node run_forecast.mjs --path <bundleFolder>`
- [ ] README contains exact run command
