# Export Scenario Bundle

This bundle is a portable snapshot of a committed forecast scenario.

## Run

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
node exports/20260225_222609_currentsimulation/run_forecast.mjs --path exports/20260225_222609_currentsimulation
```

## Included files

- `dashboard_config.json`
- `vsm_graph.json`
- `master_data.json`
- `compiled_forecast_model.json`
- `scenario_committed.json`
- `run_forecast.mjs`
- `README.md`
- `result_metrics.json` contains latest exported metrics from the source run.
