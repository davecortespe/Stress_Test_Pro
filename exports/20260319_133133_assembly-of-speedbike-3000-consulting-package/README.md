# Export Scenario Bundle

This bundle is a portable snapshot of a committed forecast scenario.

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
node exports/20260319_133133_assembly-of-speedbike-3000-consulting-package/run_forecast.mjs --path exports/20260319_133133_assembly-of-speedbike-3000-consulting-package
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
