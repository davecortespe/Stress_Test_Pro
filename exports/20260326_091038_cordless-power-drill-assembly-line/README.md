# Export Scenario Bundle

This bundle is a portable snapshot of a committed forecast scenario.
The forecast engine is deterministic math with a transient runtime-flow overlay, not a full discrete-event simulation.

## Run

### Browser cockpit (recommended)

Open `browser_forecast.html` in your browser.
Playback presets in the exported cockpit include `x1`, `x2`, `x5`, `x100`, `x200`, and `x1000`.

### Full cockpit with one click (Windows)

Run:

```bat
start_full_app.bat
```

This starts a local static server and opens the full exported cockpit in your browser.
The `app/` files come from the current `dist/` build at export time.


### Node CLI

From this bundle folder:

```bash
node run_forecast.mjs --path .
```

Machine-readable output:

```bash
node run_forecast.mjs --path . --json
```

From the repo root:

```bash
node exports/20260326_091038_cordless-power-drill-assembly-line/run_forecast.mjs --path exports/20260326_091038_cordless-power-drill-assembly-line
```

## Included files

- `dashboard_config.json`
- `vsm_graph.json`
- `master_data.json`
- `compiled_forecast_model.json`
- `scenario_committed.json`
- `run_forecast.mjs`
- `browser_forecast.html`
- `operational_diagnosis.json`
- `operational_diagnosis.md`
- `consulting_report_export.json`
- `consulting_report_export.md`
- `consulting_report_export.html`
- `README.md`

- `app/` (full built web app)
- `server.mjs` (local static server)
- `start_full_app.bat` (one-click launcher)
- `result_metrics.json` contains latest exported metrics from the source run.

## Metric semantics

- `forecastThroughput` may be steady-state, transient, or fallback-analytical. Check `globalMetrics.throughputState`.
- `globalMetrics.warmupHours` estimates when runtime throughput should be treated as warmed up and may be `"unbounded"` for non-absorbing cycles.
- `warnings[]` flags degraded-confidence conditions such as cyclic graphs or transient runtime output.
- `queueRisk` is an equivalent single-server wait-probability approximation: `P(wait) ~= rho`. It is theory-based, but not a full network waiting model across arbitrary routing or blocking.
- `nodeMetrics.processedQty` is pass-through volume at a step over elapsed time.
- `nodeMetrics.completedQty` is terminal completions only.
