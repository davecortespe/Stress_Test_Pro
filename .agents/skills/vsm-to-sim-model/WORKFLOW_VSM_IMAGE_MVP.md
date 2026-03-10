# Workflow: VSM Image -> Forecast Simulator MVP

Use this workflow when a user shares a VSM image and wants a fast, repeatable bottleneck forecasting simulator (non-DES).

## Scope
- Preserve VSM structure exactly.
- Build deterministic forecast model and UI wiring.
- Avoid discrete-event simulation unless explicitly requested.
- Keep layout fixed (left parameters, top KPIs, center canvas).

## Phase Order (do not reorder)

### Phase 1: Strict VSM transcription
Skill: `vsm-to-sim-model`

Outputs:
- `models/active/vsm_graph.json`
- `models/active/master_data.json`
- `models/missing_data_report.md`

Rules:
- Use VSM image as single source of truth.
- Keep exact step names and exact left-to-right sequence.
- Extract only visible CT/C/O/waits/worker/parallel-procedure values.
- Unreadable or ambiguous values => `null` with reason in missing data report.

Exit gate:
- Every process box appears exactly once in graph.
- No invented defaults.

### Phase 2: Forecast model compilation
Skill: `vsm-to-sim-model`

Output:
- `models/active/compiled_forecast_model.json`

Required metrics:
- per-step: effective capacity, utilization, headroom, queue risk, bottleneck index
- global: throughput, bottleneck index, bottleneck migration, brittleness

Exit gate:
- Deterministic output from same inputs.
- Assumptions explicitly logged.

### Phase 3: UI shell wiring (no layout changes)
Skill: `ui-sim-dashboard-shell`

Rules:
- Use existing dark operations style.
- Bind left parameters to model inputs.
- Bind KPI cards and node styling to forecast outputs.
- Keep graph zoom/pan and animated dashed edges.

Exit gate:
- UI renders from model/config data with no hardcoded domain labels.

### Phase 4: Forecast engine runtime behavior
Skill: `sim-engine-des` in Forecast-Engine Compatibility Mode (non-DES)

Rules:
- Recompute instantly on parameter change.
- No DES token/event simulation.
- Support bottleneck migration prediction.
- Runtime clock drives live metrics when enabled.

Exit gate:
- WIP can start at zero and evolve with elapsed simulation time.
- Node/global metrics update smoothly while running.

### Phase 5: Optional motion polish
Skill: `sim-visual-motion`

Rules:
- Subtle glow/emphasis/transitions only.
- No playful animations.
- Respect reduced-motion preferences.

## UX Contract (template baseline)
- Header left: `Start/Pause`, `Reset`, live indicator.
- Header right: large simulation timer + speed chips (`x1/x2/x5/x50/x200`) + scenarios chip.
- Left parameters include `Simulation Horizon` presets: `8 hrs`, `16 hrs`, `24 hrs`, `1 week`, `1 month`.
- Node cards: `util`, `lot/wip`, `Completed Lot`, `status` + WIP fill strip.
- Step edit: double-click node opens near-node popover on desktop (modal on small screens).

## Delivery Hygiene
- Work in batches.
- Stop after each phase with short summary.
- Do not add dependencies unless explicitly approved.
- Do not rename/delete files unless asked.
