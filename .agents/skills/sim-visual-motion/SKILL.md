---
name: sim-visual-motion
description: Use this skill to add visually compelling motion, animation, and flow cues to any simulator UI. Enhances clarity and aesthetic impact using token movement, queue buildup visuals, utilization heat, bottleneck emphasis, and smooth KPI transitions. Does not modify layout or simulation logic.
argument-hint: "[optional: style=calm|industrial|expressive]"
---

# Simulation Visual Motion & Animation Skill

## Goal
Make the simulator visually intuitive and engaging by animating:
- flow
- congestion
- utilization
- bottlenecks
without overwhelming the user.

Animations should *explain the system*, not distract.

---

## Inputs
- Graph structure (nodes + edges)
- `eventLog` from simulation engine (optional but preferred)
- `nodeMetrics` + `globalMetrics`

---

## Outputs / Files
- `src/ui/animation/TokenLayer.tsx`
- `src/ui/animation/useFlowAnimation.ts`
- `src/ui/animation/useQueueAnimation.ts`
- `src/ui/animation/useKpiTransitions.ts`
- `src/ui/animation/constants.ts`
- Updates to `SimGraphView.tsx` to integrate motion layers

---

## Motion primitives (must implement)

### 1) Flow tokens
- Small circles or pills representing entities/jobs
- Spawn on ARRIVAL events
- Move along edges on MOVE events
- Fade out on COMPLETE
- Speed scaled by simulation time multiplier

Rules:
- Multiple tokens can share an edge
- Token color tied to product/family if available
- If no eventLog, fake token flow proportional to throughput

---

### 2) Queue buildup visualization
For each node:
- When queueDepth increases:
  - show stacked mini-bars or dots
  - or numeric badge grows + subtle glow
- When queue clears:
  - animate shrink/fade

Avoid literal stacks of thousands — cap visually.

---

### 3) Utilization heat
Map utilization to color intensity:
- <50% → cool / neutral
- 50–80% → warm
- >80% → hot

Apply to:
- node border
- subtle background tint
- pulse rate (higher utilization = faster pulse)

---

### 4) Bottleneck emphasis
If `bottleneckFlag === true`:
- stronger border glow
- subtle shake or “pressure” animation
- edge inflow slows visually
- optional warning icon fade-in

This node should *draw the eye naturally*.

---

### 5) KPI transitions
- Numbers should animate smoothly (count up/down)
- Color briefly flashes green/red on improvement/degradation
- Avoid sudden jumps unless simulation is reset

Implement with requestAnimationFrame or lightweight animation utilities (no heavy libs required).

---

## Time control
Support:
- pause
- 1× / 2× / 5× speed
- step (optional)

Animation speed must respect simulation time scaling.

---

## Style guidelines
Default style = **calm + professional**
- no bouncing
- no arcade effects
- smooth easing (ease-in-out)
- subtle glow, not neon

Allow style variants via config.

---

## Accessibility / Performance
- Motion can be disabled via config
- Animations must degrade gracefully on low-power devices
- Avoid re-render storms; use layers and transforms

---

## Acceptance checklist
- [ ] Tokens visibly move through the graph
- [ ] Congestion is visually obvious without reading numbers
- [ ] Bottleneck draws attention naturally
- [ ] KPIs transition smoothly
- [ ] Motion enhances understanding, not noise
