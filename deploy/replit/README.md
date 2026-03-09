# Replit Deploy Bundle

This folder is a stable deployment target for Replit, published on demand from the current accepted simulator state.

## Publish target

- Name: `sterile-brr-replit`
- Folder: `deploy/replit`

## Replit usage

1. Connect the repository in Replit.
2. Set the run command to:
   `npm run start:replit-bundle`
3. If you prefer to run from this folder directly, use:
   `cd deploy/replit && npm start`

## Included artifacts

- `app/` full exported web app
- `server.mjs` static Node server
- `dashboard_config.json`
- `vsm_graph.json`
- `master_data.json`
- `compiled_forecast_model.json`
- `scenario_committed.json`
- `result_metrics.json`
- `operational_diagnosis.json`
- `operational_diagnosis.md`
- `publish_manifest.json`

## Notes

- This target is intentionally stable and overwriteable. Re-publishing replaces the prior Replit deploy snapshot.
- Run `npm run export:replit` whenever you want to refresh the Replit deployment with a newly accepted scenario.
