---
name: project-bootstrap-simulator
description: Scaffold and standardize a new simulator project with local skills, starter models, compile/validate scripts, and a runnable React+TypeScript shell so new projects start consistently.
---

# Project Bootstrap Simulator

Use this skill when creating a new simulator repo from scratch or bringing an existing repo up to the starter standard.

## Workflow

1. Ensure baseline structure exists:
   - `.agents/skills/`
   - `models/`
   - `scripts/`
   - `src/`
2. Confirm runnable commands in `package.json`:
   - `bootstrap`
   - `compile:forecast`
   - `refresh:forecast:active`
   - `workflow:vsm:image`
   - `export:consulting-report`
   - `export:bundle`
   - `export:replit`
   - `build:master`
   - `compile:spec`
   - `validate:models`
   - `start:sim`
3. Seed starter data:
   - `models/dashboard_config.json`
   - `models/vsm_graph.json`
   - `models/active/` runtime artifacts folder
   - `models/active/scenario_committed.json`
   - `models/tables/*.csv` and generated `models/master_data.json`
4. Generate compiled outputs:
   - `models/compiled_sim_spec.json`
   - `models/missing_data_checklist.json`
   - `models/active/compiled_forecast_model.json`
   - `models/active/result_metrics.json`
   - `models/active/operational_diagnosis.json`
   - `models/active/consulting_report_export.{json,md,html}`
5. Verify the shell runs with mock simulation output before DES is implemented.
6. Verify the landing page, simulator access gate, and saved-run comparison surfaces work with starter data.
7. Include repeatable VSM-image workflow docs:
   - `.agents/skills/vsm-to-sim-model/WORKFLOW_VSM_IMAGE_MVP.md`

## Deliverables

- Consistent repo structure.
- Working scripts and sample data.
- Single-command bootstrap+run path (`npm run start:sim`).
- Accepted forecast refresh, report export, and timestamped bundle flows documented and wired.
