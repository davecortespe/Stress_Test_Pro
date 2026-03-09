---
name: operational-diagnosis
description: Interpret simulation outputs from warehouse, manufacturing, and distribution flow models and convert them into operator-friendly diagnoses, root-cause explanations, economic impact statements, and recommended interventions. Use when Codex must explain what is breaking, why it is breaking, what downstream effects it creates, what action would stabilize the system, or which scenario improves system stability most.
---

# Operational Diagnosis

## Overview

Convert simulation outputs into an executive-ready Operational Diagnosis block for operations leaders.

Never stop at metric restatement. Explain:
- what is breaking
- why it is breaking
- what downstream effects it creates
- what action would stabilize the system
- what the likely business impact is

Write in direct, operational language. Keep the tone executive-friendly, not academic, and avoid generic AI phrasing.

## Core Data Model

Treat the diagnosis as three layers:

1. `system_signals`
   - simulation summary metrics
   - throughput vs required rate
   - backlog trend
   - in-system stock
   - bottleneck flags
   - bottleneck migration notes
   - scenario comparison outputs

2. `node_signals`
   - node-level utilization
   - queue lengths
   - service times / receive times / cycle times
   - staffing levels
   - staging capacities
   - optional VSM-derived process names and flow order

3. `diagnosis_output`
   - system status
   - primary constraint
   - constraint mechanism
   - downstream effects
   - economic interpretation
   - recommended action
   - scenario guidance
   - AI opportunity lens
   - confidence and missing-data note

## Reasoning Rules

Prioritize system dynamics over static averages.

Use these rules consistently:
- Treat queue growth, backlog trend, and bottleneck migration as first-class signals.
- Distinguish a locally busy node from the true system constraint.
- If utilization is near 100% and backlog rises, diagnose overload or brittleness rather than "high utilization."
- If throughput is below required rate, state exactly where flow is breaking.
- If downstream congestion is blocking upstream work, say that explicitly.
- If average capacity looks sufficient but queue spikes come from bunching, release timing, or arrival peaking, diagnose instability rather than pure undersizing.
- Always connect the diagnosis to an operator action.

Internal logic anchor:
"What is the AI doing that humans currently cannot scale?"
Answer:
The AI is detecting nonlinear flow interactions, bottleneck migration, queue propagation, and scenario-dependent failure points faster and more consistently than humans can analyze manually.

## Diagnosis Workflow

1. Classify system status.
   - `stable`: throughput meets required rate, queues remain bounded, backlog is flat or improving.
   - `stressed`: operation still clears demand, but queues or utilizations show low margin and rising volatility.
   - `brittle`: average capacity may be adequate, but bunching, migration, or staging limits create repeated instability.
   - `overloaded`: sustained backlog growth, throughput deficit, or persistent saturation indicates the system cannot clear work.

2. Find the true constraint.
   - Start with the node where queue, saturation, and backlog coupling are strongest.
   - Prefer the constraint that best explains system throughput loss, not the node with the highest isolated utilization.
   - Use VSM order and migration notes to separate a stable bottleneck from a rotating one.

3. Explain the mechanism.
   - Compare arrival pressure to effective service capacity.
   - Check whether staging or downstream handling prevents inventory from clearing.
   - Check whether release timing creates unstable peaks even when averages look acceptable.

4. Translate the mechanism into consequences.
   - Name the visible operational symptoms the floor will feel.
   - Tie them to service, labor, inventory, and lead-time outcomes.

5. Recommend the smallest stabilizing action first.
   - Prefer labor rebalance, sequencing, release control, standard work, or staging policy before software or capex.
   - Escalate to larger interventions only when smaller ones cannot restore flow balance.

6. If scenario comparison exists, rank scenarios by stability improvement first.
   - Prefer the scenario that reduces backlog growth, queue volatility, and migration risk.
   - Do not choose a scenario only because it improves one average KPI.

## Constraint Heuristics

Use these patterns as working heuristics:

- `arrivals exceed handling capacity`
  - Signals: upstream arrival rate above combined effective service rate, early queues grow immediately, backlog rises.
  - Likely action: smooth arrivals, add temporary handling capacity, reduce service time.

- `dock doors saturated`
  - Signals: unloading queues persist, dock utilization stays pinned, downstream teams wait on release windows.
  - Likely action: appointment smoothing, extra dock coverage in peak window, overflow routing.

- `put-away labor undersized`
  - Signals: receiving can unload, but staged inventory does not clear and dock-to-stock delay grows.
  - Likely action: add or rebalance 1 operator, re-sequence put-away by aging or priority, extend peak coverage.

- `staging capacity too small`
  - Signals: staging fills before labor or equipment fully starves, upstream unloading blocks despite some downstream capacity.
  - Likely action: increase usable staging slots, shorten dwell time, tighten release discipline.

- `receive/service time too high`
  - Signals: queue grows at a single activity even with adequate labor count, service time dominates cycle.
  - Likely action: standard work, error-proofing, pre-stage paperwork, remove rework loops.

- `capacity adequate but unstable because of bunching`
  - Signals: mean throughput is near target, but queues spike during waves and bottleneck flags migrate.
  - Likely action: smooth releases, gate appointments, rebalance labor by time-of-day rather than average headcount.

## Required Output

Produce a single `Operational Diagnosis` block with these sections in this order:

### 1. System Status
State whether the operation is stable, stressed, brittle, or overloaded, and why.

### 2. Primary Constraint
Identify the current system constraint in plain operational language.

### 3. Constraint Mechanism
Explain the flow physics causing the constraint.

### 4. Downstream Effects
Translate the constraint into visible operational consequences.

### 5. Economic Interpretation
Estimate business impact qualitatively or quantitatively when the inputs support it.

### 6. Recommended Action
Recommend the smallest high-leverage intervention first.

### 7. Scenario Guidance
If comparison data exists, explain which scenario improves the system most and why.

### AI Opportunity Lens
Explicitly identify:
- where data already exists but is unused
- where decisions are manual but pattern-based
- where reports are backward-looking instead of predictive
- where email or tribal knowledge may be acting as an unstructured database
- where visibility gaps create profit leakage

### Confidence
State confidence as `high`, `medium`, or `low`.
If confidence is not high, name the missing fields that would materially improve the diagnosis.

## Output Template

Use this structure exactly:

```md
## Operational Diagnosis

**1. System Status**
[1-3 sentences]

**2. Primary Constraint**
[1-2 sentences]

**3. Constraint Mechanism**
[1-3 sentences]

**4. Downstream Effects**
[1-3 sentences]

**5. Economic Interpretation**
[1-3 sentences]

**6. Recommended Action**
[1-3 sentences]

**7. Scenario Guidance**
[1-3 sentences, or "Scenario comparison not provided."]

**AI Opportunity Lens**
- Data already exists but is underused: [...]
- Manual but pattern-based decisions: [...]
- Backward-looking vs predictive gap: [...]
- Tribal knowledge / email as database: [...]
- Visibility gaps causing profit leakage: [...]

**Confidence**
[high|medium|low] - [brief reason and missing fields if needed]
```

## Guardrails

- Do not hallucinate exact financial values unless the inputs support them.
- If the data is incomplete, say so directly and reduce confidence.
- Prefer high-leverage operational interventions over expensive interventions.
- Do not recommend software as the first solution if labor balancing, sequencing, release control, or flow discipline would solve it.
- Do not confuse a temporary local queue with the system constraint unless it governs throughput or backlog.
- Do not describe averages without discussing variability, propagation, or migration when those signals exist.

## Quality Bar

Before delivering, verify that the diagnosis:
- explains a causal chain rather than listing KPIs
- names the most likely failure mechanism
- makes the downstream consequence legible to operators and leaders
- recommends an action that could realistically be tried first
- connects the system issue to business impact without invented precision
