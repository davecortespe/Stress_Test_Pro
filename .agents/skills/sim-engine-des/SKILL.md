---
name: sim-engine-des
description: Use this skill to implement or upgrade the discrete-event simulation engine for any VSM-based simulator. Reads models/compiled_sim_spec.json and outputs globalMetrics, nodeMetrics, and an eventLog suitable for UI animation. Must support CT variability (distributions), resource pools (equipment counts), queues/WIP limits, routing probabilities, and changeover setups by product/family.
argument-hint: "[optional: runtime=browser] [optional: lang=ts]"
---

# Discrete-Event Simulation Engine Skill (Generic)

## Goal
Implement a deterministic, testable DES engine that reads:
- `models/compiled_sim_spec.json`

And produces:
- `src/sim/types.ts` (engine types)
- `src/sim/distributions.ts` (samplers)
- `src/sim/engine.ts` (event queue + core loop)
- `src/sim/runSimulation.ts` (one-call runner for UI)
- `src/sim/metrics.ts` (rollups + bottleneck detection)
- `src/sim/examples.test.ts` (smoke test / deterministic run)
- Update UI integration points so `SimulatorPage` can run simulation and render results.

This skill must remain domain-agnostic.

---

## Forecast-Engine Compatibility Mode (for VSM image MVP templates)
When the user explicitly does NOT want DES and asks for fast bottleneck forecasting, run a non-DES mode with deterministic real-time updates.

Use this mode when:
- user asks for bottleneck forecast engine
- user asks for instant recompute on parameter edits
- user asks to avoid token/event simulation

Expected outputs (non-DES mode):
- `globalMetrics` and `nodeMetrics` compatible with existing UI
- no DES event queue requirement
- optional `models/active/compiled_forecast_model.json` hand-off consumption

Non-DES required behavior:
- Effective capacity per step from CT, units, downtime, staffing/equipment multipliers
- Utilization/headroom/queue risk/bottleneck index recompute on every parameter change
- Bottleneck migration preview when relief units are applied
- Runtime elapsed-hours integration for live behavior:
  - WIP starts at zero at simulation start
  - WIP/queue/completed output evolve with elapsed time
  - speed multipliers (x1/x2/x5) scale elapsed progression deterministically

UI contract expectations:
- Node metrics include `utilization`, `wipQty`, `completedQty`, `status`
- Global metrics include `totalWipQty`, `totalCompletedOutputPieces`, throughput proxy, bottleneck index
- Engine remains deterministic for same scenario + elapsed time

---

## Hard rules
1) Engine must be **pure**: no DOM access, no UI code inside engine.
2) Engine inputs/outputs must be serializable JSON.
3) Provide **seeded randomness** for reproducibility.
4) Changeover must be modeled as **setup time consuming the same resource**.
5) Support routing probabilities and detect invalid probability sums.

---

## Engine I/O Contract

### Input: CompiledSimSpec
Read `models/compiled_sim_spec.json` with:
- arrivals: product mix + arrival process
- resources: equipment pools
- steps: each step uses a resource pool, CT distribution, changeover rule+time dist, queue settings
- routing: edges with probabilities

### Output: SimResult (for UI)
Return from `runSimulation(spec, options)`:

```ts
type SimResult = {
  globalMetrics: Record<string, any>;
  nodeMetrics: Record<string, {
    utilization: number;      // 0..1
    queueDepth: number;       // avg or last snapshot
    avgWait: number;
    avgProc: number;
    wip: number;
    throughput: number;       // items completed at node (if node is end) or passed-through
    bottleneckFlag: boolean;
    held?: number;
  }>;
  eventLog: Array<{
    t: number;
    type: "ARRIVAL"|"ENQUEUE"|"START"|"END"|"MOVE"|"SETUP_START"|"SETUP_END"|"COMPLETE";
    entityId: string;
    productId: string;
    stepId: string;
    toStepId?: string;
    resourcePoolId?: string;
  }>;
  warnings: string[];
};
```
