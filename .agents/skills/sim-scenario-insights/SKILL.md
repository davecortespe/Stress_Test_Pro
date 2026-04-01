---
name: sim-scenario-insights
description: Use this skill to generate, run, and analyze simulation scenarios. Performs parameter sweeps and what-if analysis using DES or accepted forecast outputs to identify sensitivity, bottleneck stability, and actionable improvement levers. Produces comparison tables, charts-ready data, and plain-language recommendations.
argument-hint: "[optional: mode=explore|compare|recommend]"
---

# Simulation Scenario & Insight Skill (Generic)

## Goal
Transform raw simulation output into decision insight:
- identify high-leverage parameters
- explain bottleneck behavior
- compare scenarios side-by-side
- recommend next actions

---

## Inputs
- Base `compiled_sim_spec.json` or `models/active/compiled_forecast_model.json` in forecast-first repos
- Parameter definitions from `dashboard_config.json`
- Access to `runSimulation()` (Skill #3) or the accepted forecast recompute path

---

## Outputs (must create)
- `models/scenarios/` (generated scenario specs)
- `models/scenario_results.json`
- `models/insights.md` (human-readable)
- `models/sensitivity.json`
- `models/active/scenario_comparisons.json` when the repo supports saved-run comparison exports
- (optional) data for charts/tables in UI

---

## Scenario generation modes

### Mode: explore
- Vary 1–2 parameters at a time (±10%, ±25%, ±50%)
- Run N seeds per scenario
- Capture mean + variance of KPIs

### Mode: compare
- User-defined A/B scenarios
- Same seeds for fairness, or the same deterministic forecast semantics when DES is not in use
- Highlight deltas in throughput, lead time, WIP, bottlenecks, and constraint migration
- Produce a comparison snapshot that can feed the in-app `COMPARE` surface and comparison executive export when those features exist

### Mode: recommend
- Auto-generate 5–10 candidate changes:
  - +1 resource
  - -20% CT at top bottleneck
  - changeover reduction
  - WIP cap adjustments
- Rank by improvement per unit effort

---

## Sensitivity analysis
For each parameter:
- Compute elasticity: ΔKPI / Δparameter
- Flag:
  - high impact, low variance (stable lever)
  - high impact, high variance (risky lever)
  - low impact (noise)

Store in `models/sensitivity.json`.

---

## Bottleneck analysis
- Track bottleneck per run
- Compute:
  - % of time each step is bottleneck
  - migration frequency
- Classify system:
  - stable bottleneck
  - oscillating bottleneck
  - diffuse constraint

Include summary in insights.

---

## Recommendation logic (plain language)
Generate short, non-hype explanations:
- “Adding 1 unit of Equipment X reduces average lead time by ~18% with low variance.”
- “Reducing changeover at Step Y produces inconsistent gains due to upstream starvation.”

Avoid generic advice.

---

## Integration guidance
- Results must be consumable by UI but also readable standalone.
- Do not auto-change base model.
- Keep base scenario immutable.
- In forecast-first repos, keep saved-run comparison artifacts separate from the active committed scenario.
- If comparison exports are supported, write stable names and labels so `scenario_comparisons.json` can be used directly by report exporters.

---

## Acceptance checklist
- [ ] Multiple scenarios generated reproducibly
- [ ] Sensitivity metrics computed
- [ ] Bottleneck stability assessed
- [ ] Plain-language insights generated
- [ ] Clear ranking of improvement levers
- [ ] Comparison snapshots are ready for the app compare surface when compare mode is requested
