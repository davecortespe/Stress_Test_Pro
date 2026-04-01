# Workflow: VSM Image -> Forecast Simulator MVP

Use this workflow when a user shares a VSM image and wants a fast, repeatable bottleneck forecasting simulator (non-DES).

## Scope
- Preserve VSM structure exactly.
- Build deterministic forecast model and UI wiring.
- Avoid discrete-event simulation unless explicitly requested.
- Keep layout fixed as a simulation-first cockpit (top control ribbon, collapsible what-if rail, center canvas).

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

Required semantics:
- CT/effective CT controls service capacity and completion counting.
- LT is reported as a delay KPI (process + queue + explicit delay), not used as completion trigger.
- `capacityUnits` means parallel units at the step (lines/stations).
- If explicit demand is absent, baseline incoming demand must be seeded from release/start-step capacity, not bottleneck capacity.

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
- Keep the header utility shortcuts for `Instruction Guide` and `Executive Report`.
- Keep result views at: `FLOW`, `DIAGNOSIS`, `KAIZEN`, `THROUGHPUT`, `WASTE`, `ASSUMPTIONS`, `COMPARE`.
- Add short report-explainer `(i)` affordances inside the view buttons, not outside them.
- In `Flow`, prefer a compact KPI ribbon inside the graph workspace over a full-width KPI band when vertical space is constrained.

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
- Header title block includes brand line above title: `LeanStorming Operational Stress Labs` in warning/yellow styling.
- Header utility row includes `Instruction Guide` and `Executive Report` actions.
- Header actions use: `Start/Pause`, `Reset Time`, `Save Scenario`.
- `Reset Time` resets elapsed time (and viewport fit) only; it does not revert edited parameters/scenario state.
- Playback speed controls render below the actions row in the same card (`x1/x2/x5/x100/x200/x1000`).
- Header right keeps simulation timer/progress, live state, and scenarios chip.
- `Simulation Horizon` presets (`8 hrs`, `16 hrs`, `24 hrs`, `1 week`, `1 month`) live in the sim-time chip, not in the left rail.
- The sim-time horizon dropdown remains visible but should be disabled while the run is live.
- Top ribbon should stay compact to preserve vertical space for simulation steps.
- `Recommended move` stays compact by default: show the title only, then expand details behind a `more` toggle.
- View mode buttons (`FLOW`, `DIAGNOSIS`, `KAIZEN`, `THROUGHPUT`, `WASTE`, `ASSUMPTIONS`, `COMPARE`) should use comfortably large tap/click targets.
- View mode buttons should fill the view card width evenly and keep the `(i)` explainer inside the button.
- `KAIZEN` report is part of the standard report set and should sit with the other view buttons.
- `ASSUMPTIONS` is part of the standard report set and should sit with the other view buttons.
- `COMPARE` is part of the standard report set and should open a saved-run A/B delta stage rather than a second live simulation.
- Throughput and Waste report language should read clearly for ops personnel without changing metrics or report structure.
- In `Flow`, keep the graph as the hero surface and use a compact KPI ribbon:
  `Forecast Output / hr`, `Constraint Pressure`, `WIP Load`, `Total Completed Lots`
- `Total Completed Lots` should sit last in the flow ribbon and may use distinct accent styling.
- Node cards: `util`, `lot/wip`, `Completed Lot`, `status` + WIP fill strip.
- Step edit: double-click node opens near-node popover on desktop (modal on small screens).
- Left `What-if Controls` rail should be collapsible, sticky, internally scrollable, and always recoverable with a clear reopen affordance.
- Parameter help tooltips must not be clipped by the rail; use floating overlay behavior when needed.
- Scenario library flows should support choosing saved files for slot `A` and slot `B`, then opening compare mode without mutating the committed active scenario.

## Access Gate Contract
- Landing-page entry into `/sim` must be gated by a validation prompt.
- Accepted code: `LEAN`.
- Successful validation must persist in browser cookie storage so the same browser is not prompted every time.
- Direct route access to `/sim` must use the same validation rule.

## Delivery Hygiene
- Work in batches.
- Stop after each phase with short summary.
- Do not add dependencies unless explicitly approved.
- Do not rename/delete files unless asked.
