---
name: ui-sim-dashboard-shell
description: Use this skill when creating or refactoring ANY simulator dashboard UI (manufacturing lines, warehouse flows, service bays, etc.). It locks a generic simulator cockpit layout: header + collapsible left What-if rail + simulation-first center stage with zoom/pan and animated dashed edges, with KPI treatment adapted by view mode. All labels, inputs, and KPI cards are driven by models/dashboard_config.json. No domain-specific wording or logic.
argument-hint: "[optional: theme=dark] [optional: graph=svg] [optional: stack=react]"
---

# UI Simulator Dashboard Shell (Generic)

## Goal
Build a reusable, consistent simulator dashboard shell that is domain-agnostic:
- Parameters on the left (group panels with sliders/inputs)
- Simulation canvas as the dominant center stage (node graph + animation + zoom/pan)
- KPI cards available as either a top row or a compact in-canvas ribbon, depending on view mode
- Header (title, run/pause, save scenario, live indicator)

This skill is ONLY about UI structure, design system, and graph rendering.
It must not embed manufacturing or warehouse specific assumptions.

---

## Hard rules (Non-negotiable)
1) **No domain-specific labels** in code (for example "doors", "receivers"). All UI text comes from `models/dashboard_config.json`.
2) **Do not change the core layout regions.** Header, left parameters, and center simulation must exist. KPI presentation may be top-row or in-canvas depending on the accepted workflow.
3) **Use a tokenized theme** with CSS variables (no scattered one-off styling).
4) **Reusable components** only: Panel, MetricCard, SliderRow, NodeCard, Badge, Button.
5) **Graph is data-driven**: render nodes/edges from a graph model; show metrics from a metrics map.
6) **UI does not contain simulation logic.** UI consumes `graph`, `nodeMetrics`, and `globalMetrics` only.
7) **Use strict dark operations styling** when requested; match reference visuals closely.
8) **Do NOT rename layout regions.**
9) **Do NOT simplify visuals.**
10) **Do NOT invent alternative layouts.**
11) **If unsure, match the reference visually rather than abstracting.**
12) **Use mocked data if needed. Do not change simulation logic.**

If the project already has UI, refactor to comply.

---

## Strict Dark Operations Style (Reference Match)
Apply a strict dark operations simulator UI style matching the provided reference.

### Hard requirements
- Left fixed configuration panel with grouped sliders and numeric badges.
- Top header with compact spacing, brand line above title, actions, and live state.
- KPI cards row with glass/dark panels, glow accents, and clear hierarchy.
- Central simulation canvas with:
  - dark grid background
  - curved dashed animated edges
  - node cards with utilization, queue depth, and status
  - red glow for bottlenecks
  - green/teal for healthy nodes
- Zoom / pan controls over the canvas.

### Style rules (non-negotiable)
- Dark navy/ink background.
- Cyan/teal accents for flow.
- Magenta/red accents for risk and bottlenecks.
- Subtle glow, depth, and separation (no flat UI).
- Rounded cards, soft shadows, inner borders.
- Calm, professional, industrial tone (NOT playful).

### Implementation rules
- Use CSS variables as design tokens.
- Create reusable components (`Panel`, `MetricCard`, `NodeCard`, `SliderRow`).
- Do NOT rename layout regions.
- Do NOT simplify visuals.
- Do NOT invent alternative layouts.
- If unsure, match the reference visually rather than abstracting.

---

## Template MVP Interaction Profile (for repeatable VSM-image delivery)
Apply this profile when building the same style of cockpit achieved in this repo.

### Locked layout behavior
- Keep structure fixed: top control ribbon, left parameters rail, simulation-first center canvas.
- Do not create alternative panel layouts.
- In `Flow`, prefer a compact KPI ribbon inside the canvas over a full-width KPI row when vertical space is tight.

### Header behavior and placement
- Left cluster:
  - yellow brand mark: `LeanStorming Operational Stress Labs`
  - title + subtitle
  - actions: `Start/Pause`, `Reset Time`, `Save Scenario`
  - playback chips below actions: `x1`, `x2`, `x5`, `x100`, `x200`, `x1000`
- Utility row:
  - `Instruction Guide`
  - `Executive Report`
- Right cluster:
  - large `Sim Time {elapsed} / {horizon} h` chip with inline `Simulation Horizon` preset dropdown
  - progress bar + percent
  - live indicator
  - `Scenarios` chip placeholder
- Secondary row:
  - compact `Recommended move` card
  - `Recommended move` remains collapsed by default and uses a `more` toggle for explanatory copy

### Simulation controls UX
- Speed chips are direct toggles (no dropdown).
- `Start/Pause` is the primary control (single toggle).
- `Reset Time` resets elapsed time and graph view-fit state only.
- `Reset Time` must not restore baseline parameters or discard user edits.
- `Simulation Horizon` lives in the sim-time chip, not in the left parameter panel.
- Horizon dropdown uses presets: `8 hrs`, `16 hrs`, `24 hrs`, `1 week`, `1 month`.
- Horizon should be visible but disabled while the run is live.
- Keep top ribbon compact so graph/node rows stay visually dominant.
- View mode buttons should be larger than default chips for easy click/tap targeting.
- View mode buttons should fill the available width of the View card evenly.
- Place the report help `(i)` inside each view button, aligned as part of the button, not as a separate row.
- Speed chips should be visually larger than default pills for quick operator recognition.

### Standard report surfaces
- `FLOW`
- `DIAGNOSIS`
- `KAIZEN`
- `THROUGHPUT`
- `WASTE`
- `ASSUMPTIONS`
- `COMPARE`

### Scenario compare behavior
- Saved runs can be assigned into comparison slots `A` and `B` from the scenario library.
- `COMPARE` opens a side-by-side delta stage and should not mutate the active committed scenario.
- The compare workflow should support opening the library, choosing files, swapping slots, and clearing the comparison set.

### Report-language guidance
- Keep report structure and metrics stable.
- Prefer operator-facing wording over analyst jargon in `THROUGHPUT` and `WASTE`.
- Simplify labels such as:
  - "Validation" -> more direct pre-use wording when appropriate
  - "Waste" -> "delay" language where it improves understanding
  - "Economic constraint" -> "step holding back output" style plain English

### Landing-to-simulator routing
- If the project uses a marketing landing page before the simulator, keep routing consistent between CTA entry and direct simulator entry.
- Do not invent an access-code gate by default.
- Only preserve a gate when the accepted product behavior already requires one.

### Node card contract
- Must show at least:
  - `util`
  - `lot/wip`
  - `Completed Lot`
  - `status`
- Include WIP visual fill strip (segmented bar) under node metrics.
- Bottleneck node uses red/magenta emphasis; healthy nodes teal/cyan.

### Step editing UX
- Double-click node opens a popover near the node (not side drawer) on desktop.
- On small screens, use modal fallback.
- User-friendly controls: stepper buttons, numeric inputs, clear units.

### Responsiveness
- KPI cards wrap on smaller widths for analysis views, but `Flow` should preserve a single compact KPI ribbon whenever practical.
- Left panel remains collapsible, scrollable, and always recoverable with an obvious reopen handle.
- Header right cluster can wrap below left cluster on narrow viewports.
- Parameter help tooltips must not be clipped by the rail or graph container; use floating overlay behavior when needed.

---

## Required outputs (create if missing)
### Theme / tokens
- `src/ui/theme/sim-dark.css`
- `src/ui/theme/index.ts`

### Components
- `src/ui/components/Panel.tsx`
- `src/ui/components/MetricCard.tsx`
- `src/ui/components/SliderRow.tsx`
- `src/ui/components/NodeCard.tsx`
- `src/ui/components/Badge.tsx`
- `src/ui/components/Button.tsx`

### Layout + page
- `src/ui/layout/DashboardShell.tsx`
- `src/pages/SimulatorPage.tsx` (or equivalent entry route)

### Graph
- `src/ui/graph/types.ts`
- `src/ui/graph/layout.ts` (left-to-right DAG layout helper)
- `src/ui/graph/edgePath.ts` (curved SVG path helper)
- `src/ui/graph/zoomPan.ts` (lightweight pan/zoom state)
- `src/ui/graph/SimGraphView.tsx` (graph renderer)

### Config + models
- `models/dashboard_config.json`
- `models/examples/graph.example.json`
- `models/examples/metrics.example.json`

### Docs
- Add section to `RUNBOOK.md`: "Dashboard Shell (Generic)"

---

## Locked layout regions (must implement)

### Header (top bar)
- Left: brand mark + title + subtitle (from config)
- Utility row: instruction + report shortcuts
- Left controls: actions grid + playback row
- Right status strip: large Sim Time chip + horizon dropdown + progress + live state + scenario chip

### Body (two-column)
- Left sidebar: Parameters panel (scrollable)
  - Section title: "Parameters" (or config-driven label)
  - Parameter groups rendered from config
- Main content:
  - KPI row or compact flow ribbon: MetricCards rendered from config
  - Simulation canvas: fills remaining space
    - grid background
    - node graph
    - zoom/pan controls overlay

Use responsive layout; sidebar fixed-ish width; main content fluid.

---

## Config-driven UI contract (authoritative)

Create `models/dashboard_config.json` with this structure:

- `header`:
  - `title`: string
  - `subtitle`: string
- `parameterGroups`: array of:
  - `id`, `title`
  - `controls`: array of:
    - `id`, `label`, `type`: "slider" | "number" | "select"
    - `valuePath`: string (scenario key, for example "arrivals.ratePerHour")
    - `min`, `max`, `step` (for slider)
    - `options` (for select)
    - `format`: "int" | "float" | "pct" | "time"
- `kpis`: array of:
  - `id`, `title`
  - `valuePath`: string (globalMetrics key path, for example "throughput.perHour")
  - `format`: "int" | "float" | "pct" | "time"
  - `viz`: optional "bars" | "delta" | "none"
- `nodeCard`:
  - `titleField`: "label"
  - `fields`: array of:
    - `label`, `valuePath` (nodeMetrics path), `format`
- `graphStyle`:
  - `edge`: "curved-dashed-animated"
  - `direction`: "LR"
  - `nodeWidth`, `nodeHeight`, `hGap`, `vGap`

### IMPORTANT
- The UI must render even if simulation is not ready, using example graph + metrics JSON.
- Do not remove existing dark operations visual language when adding controls.

---

## Example models (must generate)

Create `models/examples/graph.example.json`:
- 5-7 nodes, 6-8 edges, left-to-right flow.

Create `models/examples/metrics.example.json`:
- `globalMetrics`: include at least 6 keys used by KPI cards
- `nodeMetrics`: map keyed by nodeId with values for fields in nodeCard config

---

## Graph rendering requirements (SimGraphView)
- Use a container with a dark grid background (CSS).
- Render edges with SVG paths:
  - curved connector from node right anchor to target left anchor
  - dashed stroke
  - animate dash offset to imply flow
- Render nodes as card-like elements positioned by computed layout.
  - node cards include utilization, queue depth, and status
  - bottlenecks use red/magenta glow emphasis
  - healthy nodes use teal/green styling
- Implement zoom/pan:
  - wheel zoom
  - click-drag pan
  - simple on-canvas controls (+ / - / reset)

### Layout
Implement a deterministic left-to-right DAG layout:
- compute layers via topological depth
- assign y positions with spacing to avoid overlap
- stable output for same graph

Fallback:
- if cycles exist or layout fails, render in simple columns based on node list order.

---

## Data types (TS)
In `src/ui/graph/types.ts`, define:

- `GraphNode`: { id: string; label: string; type?: string; position?: {x:number;y:number} }
- `GraphEdge`: { from: string; to: string; probability?: number }
- `SimGraph`: { nodes: GraphNode[]; edges: GraphEdge[] }

- `NodeMetrics`: Record<string, any>
- `GlobalMetrics`: Record<string, any>

---

## Defaults / missing info behavior
If config files are missing, create them with sensible defaults.
If metrics are missing, load `models/examples/metrics.example.json`.
If graph is missing, load `models/examples/graph.example.json`.

The app must render a working dashboard immediately.

---

## Acceptance checklist (must pass)
- [ ] Sidebar renders parameter groups from config with proper controls and value badges
- [ ] Header uses Start/Pause + Reset Time and keeps playback controls below actions
- [ ] Brand line appears above title with warning/yellow styling
- [ ] Utility row exposes `Instruction Guide` and `Executive Report`
- [ ] Large timer chip is on the right side of header and contains the horizon preset dropdown
- [ ] Speed chips x1/x2/x5/x100/x200/x1000 are visible and selectable below actions
- [ ] Reset Time does not wipe edited parameters
- [ ] Simulation Horizon control includes 8 hrs, 16 hrs, 24 hrs, 1 week, and 1 month presets in the timer chip
- [ ] `Recommended move` collapses to title-only with `more`/`less` expansion
- [ ] KPI row or ribbon renders cards from config and formats values
- [ ] KPI row has glass/dark panels, glow accents, and clear hierarchy
- [ ] `Flow` mode can render KPIs as a compact in-canvas ribbon to preserve simulation space
- [ ] View buttons span the width of the View card with large, readable targets
- [ ] Each view button contains an in-button `(i)` explainer affordance
- [ ] Standard result surfaces include `COMPARE` alongside the other report views
- [ ] Scenario library compare flow can assign two saved runs and open compare mode without mutating the active scenario
- [ ] Graph canvas renders nodes/edges from graph JSON
- [ ] Canvas uses dark grid background with overlaid zoom/pan controls
- [ ] Edges are curved + dashed + animated
- [ ] Node cards show utilization, queue depth, and status
- [ ] Node cards include Completed Lot and WIP fill strip
- [ ] Bottlenecks are highlighted with red/magenta glow; healthy nodes are teal/green
- [ ] Zoom/pan works
- [ ] Flow canvas opens near the first steps rather than low-centered in the stage
- [ ] Left rail can be collapsed and reopened without losing discoverability
- [ ] Parameter help tooltips are readable and not clipped by scroll containers
- [ ] Theme is consistent and tokenized (CSS variables)
- [ ] Palette follows dark navy/ink base, cyan/teal flow, magenta/red risk
- [ ] No domain-specific labels hardcoded
- [ ] SimulatorPage renders without needing the simulation engine
- [ ] If access-gated, both landing-page entry and direct simulator route entry enforce the same code prompt
