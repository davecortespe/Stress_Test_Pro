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
   - `build:master`
   - `compile:spec`
   - `validate:models`
   - `start:sim`
3. Seed starter data:
   - `models/dashboard_config.json`
   - `models/vsm_graph.json`
   - `models/active/` runtime artifacts folder
   - `models/tables/*.csv` and generated `models/master_data.json`
4. Generate compiled outputs:
   - `models/compiled_sim_spec.json`
   - `models/missing_data_checklist.json`
5. Verify the shell runs with mock simulation output before DES is implemented.
6. Include repeatable VSM-image workflow docs:
   - `.agents/skills/vsm-to-sim-model/WORKFLOW_VSM_IMAGE_MVP.md`

## Deliverables

- Consistent repo structure.
- Working scripts and sample data.
- Single-command bootstrap+run path (`npm run start:sim`).
