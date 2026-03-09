---
name: vsm-to-sim-model
description: Use this skill when the user provides a Value Stream Map (VSM) plus tables (products, equipment, cycle time, changeover, CT variability). Convert the VSM into a graph model and compiled simulation spec, or run a strict transcription pass from a VSM image that preserves exact step names/order and writes only graph/master/missing-data artifacts with no invented defaults.
argument-hint: "[input=vsm_text|vsm_image|vsm_pdf] [tables=csv|json]"
---

# VSM -> Simulation Model Compiler (Generic)

## Goal
Create a clean, validated model pipeline:

Inputs:
- VSM (image/pdf or text)
- Tables: products, equipment, CT, changeover, variability

Outputs (standard compile mode, must create/update):
- `models/vsm_graph.json`
- `models/master_data.json`
- `models/compiled_sim_spec.json`
- `models/templates/` CSV templates (if missing data)
- `models/missing_data_report.md` (if incomplete)

Outputs (strict transcription mode, must create/update):
- `models/vsm_graph.json`
- `models/master_data.json`
- `models/missing_data_report.md`

Preferred active-runtime outputs for template projects:
- `models/active/vsm_graph.json`
- `models/active/master_data.json`
- `models/active/compiled_forecast_model.json` (forecast mode)
- `models/missing_data_report.md`

This skill does NOT build UI and does NOT implement the simulation engine.

---

## Operating modes
1) **Strict transcription mode (highest priority when explicitly requested)**
   - Trigger when the user says "STRICT TRANSCRIPTION", "exact transcription", or equivalent wording.
   - Treat the VSM image as the single source of truth.
   - Do not rename steps.
   - Do not merge steps.
   - Do not abstract or generalize.
   - Preserve step names exactly as shown in the VSM.
   - Preserve left-to-right sequence exactly as shown.
2) **Standard compile mode**
   - Use the normal graph + master data + compiled spec workflow below.
3) **VSM image -> forecast MVP mode (recommended for simulator templates)**
   - Trigger when user shares a VSM image and asks for a usable simulator quickly.
   - Run strict transcription first, then compile a non-DES forecast model for fast UI feedback.
   - Keep all names/order exact from the VSM.

When strict transcription mode is active, its rules override any conflicting standard compile behavior.

---

## Hard rules
1) **Never silently assume missing parameters.**
   - If something is missing, either:
     - write explicit defaults under `master_data.assumptions[]`, OR
     - emit `missing_data_report.md` and stop compilation.
2) **Everything must be domain-agnostic.**
3) **Compiled spec must be unambiguous.**
   - No "TBD" values in compiled output (unless explicitly placed under assumptions with a flag).
4) **Validate all JSON against a TS schema (zod) if present.**
   - If schema files do not exist, create `src/sim/schema.ts` with zod validators for these model files.
5) **Strict transcription override: do not invent defaults.**
   - If a parameter cannot be parsed with confidence, set it to `null` and add an assumptions entry explaining why.
   - In strict transcription mode, do not create inferred values to make compilation "work."

---

## Input types supported
### VSM input formats
- Text: `A -> B -> C` or step list + arrows
- Table: stepName, nextStep, probability
- Image/PDF: if available, transcribe nodes/edges into graph (best-effort) and list uncertainties

### Tables input formats
- CSV (preferred)
- JSON arrays

---

## Strict transcription workflow (image-first)
Apply this workflow when strict transcription mode is active.

1) For each VSM process box, create exactly one node with the exact process name text.
2) Keep process order and edges strictly left-to-right as drawn in the VSM.
3) For each process box, extract and attach all visible parameters:
   - Cycle Time (CT)
   - Changeover Time (C/O)
   - Wait time (if shown)
   - Notes such as "VARIABLE" or "WHEN NO WIP..."
4) If any parameter is ambiguous or unreadable:
   - set that field to `null`
   - add a precise reason to `master_data.assumptions[]`
   - add a matching ambiguity entry to `models/missing_data_report.md`
5) Output requirements in strict mode:
   - update `models/vsm_graph.json` with exact steps and exact sequence
   - populate `models/master_data.json` directly from VSM box data where available
   - highlight every ambiguity in `models/missing_data_report.md`
6) In strict mode, do not:
   - build UI
   - run simulation
   - invent defaults
   - generate `models/compiled_sim_spec.json` unless the user explicitly asks for a second pass

Recommended strict-mode representation (additive, non-breaking fields):
- In `models/vsm_graph.json` nodes, include a `boxData` object with raw extracted values (or `null`):
  - `ctRaw`
  - `changeoverRaw`
  - `waitRaw`
  - `notesRaw` (array of exact text snippets)
- In `models/master_data.json` processing entries, preserve raw VSM text in `sourceText` and only normalize when unambiguous.

---

## Repeatable VSM Image MVP Workflow (Template Standard)
Use this when the user provides only a VSM image and wants a working bottleneck forecast cockpit.

Canonical checklist file:
- `.agents/skills/vsm-to-sim-model/WORKFLOW_VSM_IMAGE_MVP.md`

### Phase 1: Strict transcription (no invention)
Required outputs:
- `models/active/vsm_graph.json`
- `models/active/master_data.json`
- `models/missing_data_report.md`

Rules:
- Preserve process names exactly (case, spacing, numbering).
- Preserve left-to-right sequence exactly.
- Extract only visible values: CT, C/O, waits, worker count, parallel procedures, notes.
- Ambiguous or unreadable value => `null` + explicit reason in `missing_data_report.md`.
- Do not merge steps, rename steps, or infer demand from intuition.

### Phase 2: Forecast model compilation (non-DES)
Required output:
- `models/active/compiled_forecast_model.json`

Compile structure:
- Inputs: demand multiplier, staffing/equipment multipliers, downtime, CT/setup multipliers, horizon, relief units.
- Per-step baselines: effective capacity/hr, utilization, headroom, queue risk, bottleneck index.
- Global metrics: throughput, bottleneck index, brittleness, migration summary.

Hard constraints:
- Keep model deterministic and fast (sub-second recompute target).
- Do not emit discrete-event artifacts in forecast mode.
- If a step CT is null (for example "*varies*"), keep that step metrics nullable and report assumption.

### Required assumptions behavior
- Every non-explicit assumption must be logged in `assumptions[]` with severity and reason.
- `missing_data_report.md` must map each unresolved field to a specific step.

### Hand-off contract to UI/engine skills
`compiled_forecast_model.json` must include at minimum:
- `graph.nodes[]` / `graph.edges[]`
- `inputs[]` and `inputDefaults`
- `stepModels[]` with `stepId`, `label`, `ctMinutes`, `effectiveUnits`, `changeoverPenaltyPerUnitMinutes`, `variabilityCv`
- `baseline.globalMetrics` and `baseline.nodeMetrics`

---

## Acceptance checklist (MVP image mode)
- [ ] Exact step labels and exact sequence match the VSM image
- [ ] All visible CT/C/O/wait values are transcribed without normalization loss
- [ ] Every ambiguity is `null` and documented
- [ ] `models/active/vsm_graph.json` created/updated
- [ ] `models/active/master_data.json` created/updated
- [ ] `models/active/compiled_forecast_model.json` created/updated (when phase 2 requested)
- [ ] No UI files changed by this skill

---

## Output file specs (authoritative)

### 1) `models/vsm_graph.json`
```json
{
  "metadata": { "name": "string", "units": "minutes" },
  "nodes": [{ "id": "string", "label": "string", "type": "process|buffer|decision|end|start" }],
  "edges": [{ "from": "string", "to": "string", "probability": 1.0 }],
  "startNodes": ["string"],
  "endNodes": ["string"]
}
```

### 2) `models/master_data.json`
```json
{
  "products": [
    { "productId": "string", "family": "string", "mixPct": 0.0, "demandRatePerHour": null, "batchSize": null }
  ],
  "equipment": [
    { "equipmentType": "string", "count": 1, "availability": { "shiftHours": null, "uptimePct": null } }
  ],
  "processing": [
    {
      "stepId": "string",
      "equipmentType": "string",
      "productKey": "productId|family|*",
      "ct": { "dist": "fixed|triangular|normal|lognormal|exponential", "params": { } },
      "changeover": {
        "rule": "none|family|product",
        "time": { "dist": "fixed|triangular|normal|lognormal|exponential", "params": { } }
      }
    }
  ],
  "assumptions": [
    { "id": "string", "severity": "info|warning|blocker", "text": "string" }
  ]
}
```

### 3) `models/compiled_sim_spec.json`

This is the engine-ready spec. It must:

- expand product mix into arrivals
- expand equipment counts into resource pools
- resolve every step to at least one processing mapping
- resolve routing probabilities (defaults to 1.0 if omitted)
- include a normalized distribution format for CT and changeover

```json
{
  "metadata": { "name": "string", "units": "minutes", "compiledAt": "ISO-8601" },
  "arrivals": {
    "type": "mix",
    "products": [{ "productId": "string", "mixPct": 0.0 }],
    "arrivalProcess": { "type": "poisson|fixed|schedule", "ratePerHour": 0.0, "schedule": [] }
  },
  "resources": [
    { "resourcePoolId": "string", "equipmentType": "string", "count": 1 }
  ],
  "steps": [
    {
      "stepId": "string",
      "label": "string",
      "resourcePoolId": "string",
      "ct": { "dist": "fixed|triangular|normal|lognormal|exponential", "params": { } },
      "changeover": { "rule": "none|family|product", "time": { "dist": "fixed|triangular|normal|lognormal|exponential", "params": { } } },
      "queue": { "capacity": null, "wipLimit": null }
    }
  ],
  "routing": [{ "from": "string", "to": "string", "probability": 1.0 }],
  "endNodes": ["string"],
  "assumptions": []
}
```
