---
name: sim-scenario-insights
description: Use this skill to generate, run, and analyze simulation scenarios. Performs parameter sweeps and what-if analysis using the DES engine outputs to identify sensitivity, bottleneck stability, and actionable improvement levers. Produces comparison tables, charts-ready data, and plain-language recommendations.
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
- Base `compiled_sim_spec.json`
- Parameter definitions from `dashboard_config.json`
- Access to `runSimulation()` (Skill #3)

---

## Outputs (must create)
- `models/scenarios/` (generated scenario specs)
- `models/scenario_results.json`
- `models/insights.md` (human-readable)
- `models/sensitivity.json`
- (optional) data for charts/tables in UI

---

## Scenario generation modes

### Mode: explore
- Vary 1–2 parameters at a time (±10%, ±25%, ±50%)
- Run N seeds per scenario
- Capture mean + variance of KPIs

### Mode: compare
- User-defined A/B scenarios
- Same seeds for fairness
- Highlight deltas in throughput, lead time, WIP, bottlenecks

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

---

## Acceptance checklist
- [ ] Multiple scenarios generated reproducibly
- [ ] Sensitivity metrics computed
- [ ] Bottleneck stability assessed
- [ ] Plain-language insights generated
- [ ] Clear ranking of improvement levers
