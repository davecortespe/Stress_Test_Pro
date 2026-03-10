import type { CompiledForecastModel, SimulationOutput, VsmEdge, VsmGraph } from "../types/contracts";

export interface ConstraintStepEval {
  demandRatePerHour: number | null;
  utilization: number | null;
  headroom: number | null;
  queueRisk: number | null;
  queueDepth: number | null;
  queueDelayMinutes: number | null;
  wipQty: number | null;
  effectiveUnits: number | null;
  effectiveCtMinutes: number | null;
  capacityPerHour: number | null;
  calendarCapacityPerHour: number | null;
  serviceTimeHours: number | null;
  explicitLeadTimeMinutes: number | null;
  stepLeadTimeMinutes: number | null;
  bottleneckIndex: number | null;
  status: "healthy" | "risk" | "critical" | "unknown";
  throughputLimit: number | null;
}

export interface ConstraintSystemEval {
  lineDemand: number;
  throughput: number;
  stepEvals: Record<string, ConstraintStepEval>;
  bottleneckStepId: string;
  leadTimeTopStepId: string;
  avgQueueRisk: number;
  totalWipQty: number;
  totalLeadTimeMinutes: number;
  totalExplicitLeadTimeMinutes: number;
  worstCaseTouchTime: number;
  horizonHours: number;
  sortedByBottleneck: Array<{ stepId: string; score: number }>;
}

export interface ConstraintForecastSnapshot {
  baseline: ConstraintSystemEval;
  relief: ConstraintSystemEval;
  reliefUnits: number;
  visitFactors: Record<string, number>;
}

function num(input: unknown, fallback: number): number {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }
  if (typeof input === "string" && input.trim().length > 0) {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readActiveShiftCount(scenario: Record<string, number | string>): number {
  return clamp(Math.round(num(scenario.activeShiftCount, 3)), 1, 3);
}

function getActiveHoursPerDay(shiftCount: number): number {
  return clamp(shiftCount, 1, 3) * 8;
}

function activeHoursBetween(startHour: number, endHour: number, activeHoursPerDay: number): number {
  if (endHour <= startHour || activeHoursPerDay <= 0) {
    return 0;
  }
  if (activeHoursPerDay >= 24) {
    return endHour - startHour;
  }

  let cursor = startHour;
  let activeHours = 0;
  while (cursor < endHour - 1e-9) {
    const dayIndex = Math.floor(cursor / 24);
    const dayStart = dayIndex * 24;
    const activeWindowEnd = dayStart + activeHoursPerDay;
    const nextBoundary = Math.min(endHour, dayStart + 24);

    if (cursor < activeWindowEnd) {
      activeHours += Math.max(0, Math.min(nextBoundary, activeWindowEnd) - cursor);
    }
    cursor = nextBoundary;
  }

  return activeHours;
}

function normalizeOutgoing(edges: VsmEdge[]): Array<{ to: string; probability: number }> {
  if (edges.length === 0) {
    return [];
  }

  const explicitTotal = edges.reduce(
    (sum, edge) => sum + (typeof edge.probability === "number" ? edge.probability : 0),
    0
  );
  const missingCount = edges.filter((edge) => typeof edge.probability !== "number").length;
  const remaining = Math.max(0, 1 - explicitTotal);
  const implied = missingCount > 0 ? (remaining > 0 ? remaining / missingCount : 1 / edges.length) : 0;

  const provisional = edges.map((edge) => ({
    to: edge.to,
    probability: typeof edge.probability === "number" ? num(edge.probability, 0) : implied
  }));
  const total = provisional.reduce((sum, edge) => sum + edge.probability, 0);
  if (total <= 0) {
    const uniform = 1 / edges.length;
    return edges.map((edge) => ({ to: edge.to, probability: uniform }));
  }
  return provisional.map((edge) => ({ to: edge.to, probability: edge.probability / total }));
}

function computeVisitFactors(graph: VsmGraph): Record<string, number> {
  const nodeIds = graph.nodes.map((node) => node.id);
  const outgoingRaw = new Map<string, VsmEdge[]>();
  const outgoing = new Map<string, Array<{ to: string; probability: number }>>();

  for (const nodeId of nodeIds) {
    outgoingRaw.set(nodeId, []);
    outgoing.set(nodeId, []);
  }
  for (const edge of graph.edges) {
    const group = outgoingRaw.get(edge.from) ?? [];
    group.push(edge);
    outgoingRaw.set(edge.from, group);
  }
  for (const [nodeId, edges] of outgoingRaw.entries()) {
    outgoing.set(nodeId, normalizeOutgoing(edges));
  }

  const fallbackStart = nodeIds.length > 0 ? [nodeIds[0]] : [];
  const startNodes = graph.startNodes.length > 0 ? graph.startNodes : fallbackStart;
  const base = new Map<string, number>();
  for (const nodeId of nodeIds) {
    base.set(nodeId, 0);
  }

  const perStart = 1 / Math.max(1, startNodes.length);
  for (const nodeId of startNodes) {
    base.set(nodeId, (base.get(nodeId) ?? 0) + perStart);
  }

  let visits = new Map(base);
  for (let i = 0; i < 350; i += 1) {
    const next = new Map(base);
    for (const nodeId of nodeIds) {
      const fromVisits = visits.get(nodeId) ?? 0;
      if (fromVisits <= 0) {
        continue;
      }
      for (const edge of outgoing.get(nodeId) ?? []) {
        next.set(edge.to, (next.get(edge.to) ?? 0) + fromVisits * edge.probability);
      }
    }
    let maxDelta = 0;
    for (const nodeId of nodeIds) {
      maxDelta = Math.max(maxDelta, Math.abs((next.get(nodeId) ?? 0) - (visits.get(nodeId) ?? 0)));
    }
    visits = next;
    if (maxDelta < 1e-8) {
      break;
    }
  }

  const result: Record<string, number> = {};
  for (const nodeId of nodeIds) {
    result[nodeId] = clamp(num(visits.get(nodeId), 0), 0.01, 12);
  }
  return result;
}

function mixModifier(stepId: string, index: number, total: number, mixProfile: string): number {
  if (mixProfile === "station-1-heavy") {
    return index <= 1 ? 1.12 : 0.96;
  }
  if (mixProfile === "final-step-heavy") {
    return index >= Math.max(0, total - 2) ? 1.12 : 0.96;
  }
  if (mixProfile === "family-A-heavy") {
    return stepId === "station_1" || stepId === "station_2" ? 1.1 : 0.97;
  }
  if (mixProfile === "family-B-heavy") {
    return stepId === "station_4" || stepId === "station_5" ? 1.1 : 0.97;
  }
  return 1;
}

function stepStatus(utilization: number, bottleneckIndex: number): "healthy" | "risk" | "critical" {
  if (utilization >= 0.98 || bottleneckIndex >= 0.82) {
    return "critical";
  }
  if (utilization >= 0.85 || bottleneckIndex >= 0.62) {
    return "risk";
  }
  return "healthy";
}

function readStepOverride(
  scenario: Record<string, number | string>,
  stepId: string,
  field: "capacityUnits" | "ctBaseline" | "ctMultiplier" | "downtimePct" | "leadTimeMinutes"
): number | null {
  const value = num(scenario[`step_${stepId}_${field}`], Number.NaN);
  return Number.isFinite(value) ? value : null;
}

function evaluateSystem(
  model: CompiledForecastModel,
  scenario: Record<string, number | string>,
  visitFactors: Record<string, number>,
  reliefStepId: string,
  reliefUnits: number
): ConstraintSystemEval {
  const baselineDemand = num(model.inputDefaults.demandRatePerHour, num(model.baseline.demandRatePerHour, 10));
  const demandMultiplier = clamp(num(scenario.demandMultiplier, 1), 0.2, 3);
  const lineDemand = Math.max(0.1, baselineDemand * demandMultiplier);
  const staffingMultiplier = clamp(num(scenario.staffingMultiplier, 1), 0.25, 3);
  const equipmentMultiplier = clamp(num(scenario.equipmentMultiplier, 1), 0.25, 3);
  const availabilityMultiplier = clamp(1 - num(scenario.unplannedDowntimePct, 7) / 100, 0.2, 1);
  const ctMultiplier = clamp(num(scenario.ctMultiplier, 1), 0.25, 3);
  const setupPenaltyMultiplier = clamp(num(scenario.setupPenaltyMultiplier, 1), 0, 3);
  const variabilityMultiplier = clamp(num(scenario.variabilityMultiplier, 1), 0.2, 3);
  const horizonHours = clamp(num(scenario.simulationHorizonHours, 8), 8, 720);
  const activeShiftCount = readActiveShiftCount(scenario);
  const activeHoursPerDay = getActiveHoursPerDay(activeShiftCount);
  const activeCapacityFraction = activeHoursPerDay / 24;
  const horizonSeverity = 1 + ((horizonHours - 8) / 16) * 0.22;
  const mixProfile = String(scenario.mixProfile ?? "balanced");

  const stepEvals: Record<string, ConstraintStepEval> = {};
  const ranked: Array<{ stepId: string; score: number }> = [];
  let lineCapacity = Number.POSITIVE_INFINITY;
  let totalWipQty = 0;
  let totalLeadTimeMinutes = 0;
  let totalExplicitLeadTimeMinutes = 0;
  let leadTimeTopStepId = "";
  let leadTimeTopValue = -1;
  let worstCaseTouchTime = 0;

  model.stepModels.forEach((step, index) => {
    const ctMinutes = typeof step.ctMinutes === "number" ? step.ctMinutes : null;
    if (ctMinutes === null) {
      stepEvals[step.stepId] = {
        demandRatePerHour: null,
        utilization: null,
        headroom: null,
        queueRisk: null,
        queueDepth: null,
        queueDelayMinutes: null,
        wipQty: null,
        effectiveUnits: null,
        effectiveCtMinutes: null,
        capacityPerHour: null,
        calendarCapacityPerHour: null,
        serviceTimeHours: null,
        explicitLeadTimeMinutes: null,
        stepLeadTimeMinutes: null,
        bottleneckIndex: null,
        status: "unknown",
        throughputLimit: null
      };
      return;
    }

    const stepVisitFactor = Math.max(0.01, num(visitFactors[step.stepId], 1));
    const stepMixFactor = mixModifier(step.stepId, index, model.stepModels.length, mixProfile);
    const stepDemandRate = lineDemand * stepVisitFactor * stepMixFactor;

    const stepCapacityUnitsOverride = readStepOverride(scenario, step.stepId, "capacityUnits");
    const stepCtBaselineOverride = readStepOverride(scenario, step.stepId, "ctBaseline");
    const stepCtMultiplier = Math.max(
      0.1,
      readStepOverride(scenario, step.stepId, "ctMultiplier") ?? 1
    );
    const stepDowntimePct = clamp(
      readStepOverride(scenario, step.stepId, "downtimePct") ?? 0,
      0,
      95
    );
    const stepLeadTimeMinutesOverride = readStepOverride(scenario, step.stepId, "leadTimeMinutes");

    const ctBaseline = Math.max(0.05, stepCtBaselineOverride ?? ctMinutes);
    const setupPenalty = Math.max(0, num(step.changeoverPenaltyPerUnitMinutes, 0));
    const effectiveCt =
      Math.max(0.05, ctBaseline * ctMultiplier * stepCtMultiplier) +
      Math.max(0, setupPenalty * setupPenaltyMultiplier);
    const baseUnits = Math.max(
      0.05,
      (stepCapacityUnitsOverride ?? num(step.effectiveUnits, 1)) * staffingMultiplier * equipmentMultiplier
    );
    const relief = step.stepId === reliefStepId ? Math.max(0, reliefUnits) : 0;
    const effectiveUnits = baseUnits + relief;
    const stepAvailabilityMultiplier = availabilityMultiplier * (1 - stepDowntimePct / 100);
    const computedCapacityRate =
      (effectiveUnits * 60 * clamp(stepAvailabilityMultiplier, 0.05, 1)) / Math.max(0.05, effectiveCt);
    const capacityRate = Math.max(0.001, computedCapacityRate);
    const calendarCapacityRate = Math.max(0.001, capacityRate * activeCapacityFraction);
    const serviceTimeHours = effectiveCt / 60;

    const worstCtMinutes =
      Math.max(0.05, ctBaseline * ctMultiplier * stepCtMultiplier) * (1 + stepDowntimePct / 100);
    worstCaseTouchTime += worstCtMinutes;

    const utilizationRaw = stepDemandRate / Math.max(0.001, calendarCapacityRate);
    const utilization = clamp(utilizationRaw, 0, 1.35);
    const headroom = Math.max(0, 1 - utilizationRaw);
    const cv = Math.max(0.03, num(step.variabilityCv, 0.18) * variabilityMultiplier);
    const queuePressure = (utilization * utilization) / Math.max(0.06, 1 - utilization);
    const queueRisk = clamp((queuePressure * (0.52 + cv)) / 7.2, 0, 1);
    const queueDepth = Math.max(
      0,
      Math.min(24, (Math.max(0, utilizationRaw - 0.66) * 8 + queueRisk * 14) * stepVisitFactor)
    );
    const queueDelayMinutes = (queueDepth / Math.max(0.001, calendarCapacityRate)) * 60;
    const explicitLeadTimeMinutesBase =
      typeof step.leadTimeMinutes === "number" && Number.isFinite(step.leadTimeMinutes)
        ? Math.max(0, step.leadTimeMinutes)
        : null;
    const explicitLeadTimeMinutes =
      stepLeadTimeMinutesOverride !== null
        ? Math.max(0, stepLeadTimeMinutesOverride)
        : explicitLeadTimeMinutesBase;
    const stepLeadTimeMinutes = Math.max(
      0.01,
      effectiveCt + queueDelayMinutes + Math.max(0, explicitLeadTimeMinutes ?? 0)
    );
    totalLeadTimeMinutes += stepLeadTimeMinutes;
    totalExplicitLeadTimeMinutes += Math.max(0, explicitLeadTimeMinutes ?? 0);
    if (stepLeadTimeMinutes > leadTimeTopValue) {
      leadTimeTopValue = stepLeadTimeMinutes;
      leadTimeTopStepId = step.stepId;
    }
    const accumulationRate = Math.max(0, stepDemandRate - calendarCapacityRate);
    const wipQty = Math.max(0, queueDepth + accumulationRate * horizonHours);
    totalWipQty += wipQty;

    const shortage = clamp(utilizationRaw - 1, 0, 1);
    const bottleneckIndex = clamp(
      (0.6 * (Math.min(utilizationRaw, 1.25) / 1.25) + 0.3 * queueRisk + 0.1 * shortage) *
        horizonSeverity,
      0,
      1
    );
    const status = stepStatus(utilizationRaw, bottleneckIndex);
    const throughputLimit = calendarCapacityRate / Math.max(0.01, stepVisitFactor * stepMixFactor);

    lineCapacity = Math.min(lineCapacity, throughputLimit);
    stepEvals[step.stepId] = {
      demandRatePerHour: stepDemandRate,
      utilization,
      headroom,
      queueRisk,
      queueDepth,
      queueDelayMinutes,
      wipQty,
      effectiveUnits,
      effectiveCtMinutes: effectiveCt,
      capacityPerHour: capacityRate,
      calendarCapacityPerHour: calendarCapacityRate,
      serviceTimeHours,
      explicitLeadTimeMinutes,
      stepLeadTimeMinutes,
      bottleneckIndex,
      status,
      throughputLimit
    };
    ranked.push({ stepId: step.stepId, score: bottleneckIndex });
  });

  ranked.sort((a, b) => b.score - a.score);
  const throughput = Math.min(lineDemand, Number.isFinite(lineCapacity) ? lineCapacity : lineDemand);
  const avgQueueRisk =
    ranked.length > 0
      ? ranked.reduce((sum, row) => sum + (stepEvals[row.stepId]?.queueRisk ?? 0), 0) / ranked.length
      : 0;

  return {
    lineDemand,
    throughput,
    stepEvals,
    bottleneckStepId: ranked[0]?.stepId ?? "",
    leadTimeTopStepId,
    avgQueueRisk,
    totalWipQty,
    totalLeadTimeMinutes,
    totalExplicitLeadTimeMinutes,
    worstCaseTouchTime,
    horizonHours,
    sortedByBottleneck: ranked
  };
}

interface RuntimeStepSnapshot {
  utilization: number | null;
  queueRisk: number | null;
  queueDepth: number | null;
  wipQty: number | null;
  completedQty: number | null;
  idleWaitHours: number | null;
  idleWaitPct: number | null;
  bottleneckIndex: number | null;
  status: "healthy" | "risk" | "critical" | "unknown";
}

interface RuntimeSnapshot {
  node: Record<string, RuntimeStepSnapshot>;
  totalWipQty: number;
  bottleneckStepId: string | null;
  bottleneckIndex: number;
  realizedThroughput: number;
  completedOutputQty: number;
  completedQtyByStep: Record<string, number>;
}

function topologicalOrder(graph: VsmGraph): string[] {
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  const nodeIds = graph.nodes.map((node) => node.id);

  nodeIds.forEach((nodeId) => {
    indegree.set(nodeId, 0);
    outgoing.set(nodeId, []);
  });

  graph.edges.forEach((edge) => {
    if (!indegree.has(edge.from) || !indegree.has(edge.to)) {
      return;
    }
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge.to]);
  });

  const queue = nodeIds.filter((nodeId) => (indegree.get(nodeId) ?? 0) === 0);
  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    ordered.push(current);
    for (const next of outgoing.get(current) ?? []) {
      const nextDegree = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, nextDegree);
      if (nextDegree === 0) {
        queue.push(next);
      }
    }
  }

  if (ordered.length === nodeIds.length) {
    return ordered;
  }
  return nodeIds;
}

function resolveTerminalNodeIds(
  graph: VsmGraph,
  outgoingMap: Map<string, Array<{ to: string; probability: number }>>
): Set<string> {
  const declaredTerminalIds = (graph.endNodes ?? []).filter(
    (nodeId) => (outgoingMap.get(nodeId) ?? []).length === 0
  );
  if (declaredTerminalIds.length > 0) {
    return new Set(declaredTerminalIds);
  }
  return new Set(
    graph.nodes
      .map((node) => node.id)
      .filter((nodeId) => (outgoingMap.get(nodeId) ?? []).length === 0)
  );
}

function simulateRuntimeFlow(
  model: CompiledForecastModel,
  system: ConstraintSystemEval,
  elapsedHours: number,
  scenario: Record<string, number | string>
): RuntimeSnapshot {
  const orderedNodes = topologicalOrder(model.graph);
  const nodeIds = model.graph.nodes.map((node) => node.id);
  const startNodes =
    model.graph.startNodes.length > 0 ? model.graph.startNodes : orderedNodes.length > 0 ? [orderedNodes[0]] : [];
  const startRatePerNode = startNodes.length > 0 ? system.lineDemand / startNodes.length : 0;
  const activeHoursPerDay = getActiveHoursPerDay(readActiveShiftCount(scenario));
  const outgoingMap = new Map<string, Array<{ to: string; probability: number }>>();

  nodeIds.forEach((nodeId) => {
    const edges = model.graph.edges.filter((edge) => edge.from === nodeId);
    outgoingMap.set(nodeId, normalizeOutgoing(edges));
  });
  const terminalNodeSet = resolveTerminalNodeIds(model.graph, outgoingMap);

  const queueQty = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, 0]));
  const cumulativeProcessedQtyByStep = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, 0]));
  const snapshotProcessedRateByStep = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, 0]));
  const completedQtyByStep = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, 0]));
  const blockedIdleHoursByStep = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, 0]));
  let arrivals = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, 0]));
  let totalCompletedQty = 0;
  const cappedElapsed = Math.max(0, elapsedHours);
  const activeElapsedHours = activeHoursBetween(0, cappedElapsed, activeHoursPerDay);
  if (cappedElapsed > 0) {
    const maxSteps = 1800;
    const targetDt = 1 / 240; // 15 seconds in simulation time
    const rawSteps = Math.ceil(cappedElapsed / targetDt);
    const steps = Math.max(1, Math.min(maxSteps, rawSteps));
    const dtHours = cappedElapsed / steps;

    for (let tick = 0; tick < steps; tick += 1) {
      const intervalStartHours = tick * dtHours;
      const intervalEndHours = intervalStartHours + dtHours;
      const activeHours = activeHoursBetween(intervalStartHours, intervalEndHours, activeHoursPerDay);

      for (const startId of startNodes) {
        arrivals.set(startId, (arrivals.get(startId) ?? 0) + startRatePerNode * dtHours);
      }

      const nextArrivals = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, 0]));
      for (const nodeId of orderedNodes) {
        const stepEval = system.stepEvals[nodeId];
        const incomingQty = arrivals.get(nodeId) ?? 0;
        const outgoing = outgoingMap.get(nodeId) ?? [];
        if (!stepEval || stepEval.capacityPerHour === null || stepEval.capacityPerHour <= 0) {
          if (terminalNodeSet.has(nodeId)) {
            totalCompletedQty += incomingQty;
          }
          completedQtyByStep.set(nodeId, (completedQtyByStep.get(nodeId) ?? 0) + incomingQty);
          for (const edge of outgoing) {
            nextArrivals.set(edge.to, (nextArrivals.get(edge.to) ?? 0) + incomingQty * edge.probability);
          }
          cumulativeProcessedQtyByStep.set(
            nodeId,
            (cumulativeProcessedQtyByStep.get(nodeId) ?? 0) + incomingQty
          );
          snapshotProcessedRateByStep.set(nodeId, activeHours > 0 ? incomingQty / activeHours : 0);
          continue;
        }

        const availableQty = (queueQty.get(nodeId) ?? 0) + incomingQty;
        const capacityQty = stepEval.capacityPerHour * activeHours;
        let downstreamAcceptance = 1;
        if (outgoing.length > 0 && activeHours > 0) {
          let weightedAcceptance = 0;
          let totalProbability = 0;
          for (const edge of outgoing) {
            const childEval = system.stepEvals[edge.to];
            const probability = edge.probability;
            totalProbability += probability;
            if (!childEval) {
              weightedAcceptance += probability;
              continue;
            }
            const childQueueQty = queueQty.get(edge.to) ?? 0;
            const childPendingQty = (arrivals.get(edge.to) ?? 0) + (nextArrivals.get(edge.to) ?? 0);
            const childProjectedLoad = childQueueQty + childPendingQty;
            const childCalendarCapacity =
              childEval.calendarCapacityPerHour ?? childEval.capacityPerHour ?? 0;
            const childBufferQty = Math.max(1, childCalendarCapacity * 12);
            const childAcceptance = clamp(1 - childProjectedLoad / childBufferQty, 0.25, 1);
            weightedAcceptance += childAcceptance * probability;
          }
          if (totalProbability > 0) {
            downstreamAcceptance = weightedAcceptance / totalProbability;
          }
        }

        const processedQty = Math.min(availableQty, capacityQty * downstreamAcceptance);
        const queueRemaining = Math.max(0, availableQty - processedQty);
        queueQty.set(nodeId, queueRemaining);
        cumulativeProcessedQtyByStep.set(
          nodeId,
          (cumulativeProcessedQtyByStep.get(nodeId) ?? 0) + processedQty
        );
        snapshotProcessedRateByStep.set(nodeId, activeHours > 0 ? processedQty / activeHours : 0);
        completedQtyByStep.set(nodeId, (completedQtyByStep.get(nodeId) ?? 0) + processedQty);

        if (activeHours > 0 && outgoing.length > 0 && availableQty > 1e-9 && capacityQty > 1e-9) {
          const blockedIdleRatio = clamp(
            1 - processedQty / Math.max(1e-9, Math.min(availableQty, capacityQty)),
            0,
            1
          );
          blockedIdleHoursByStep.set(
            nodeId,
            (blockedIdleHoursByStep.get(nodeId) ?? 0) + activeHours * blockedIdleRatio
          );
        }

        if (terminalNodeSet.has(nodeId)) {
          totalCompletedQty += processedQty;
        }

        if (outgoing.length === 0) {
          continue;
        }
        for (const edge of outgoing) {
          nextArrivals.set(edge.to, (nextArrivals.get(edge.to) ?? 0) + processedQty * edge.probability);
        }
      }
      arrivals = nextArrivals;
    }
  }

  const node: RuntimeSnapshot["node"] = {};
  let totalWipQty = 0;
  let bottleneckStepId: string | null = null;
  let bottleneckIndex = 0;
  let realizedThroughput = cappedElapsed > 0 ? totalCompletedQty / cappedElapsed : 0;

  for (const nodeId of nodeIds) {
    const stepEval = system.stepEvals[nodeId];
    if (!stepEval || stepEval.capacityPerHour === null || stepEval.capacityPerHour <= 0) {
      node[nodeId] = {
        utilization: null,
        queueRisk: null,
        queueDepth: null,
        wipQty: null,
        completedQty: Math.max(0, completedQtyByStep.get(nodeId) ?? 0),
        idleWaitHours: null,
        idleWaitPct: null,
        bottleneckIndex: null,
        status: "unknown"
      };
      continue;
    }

    const displayedCapacityPerHour =
      stepEval.calendarCapacityPerHour ?? stepEval.capacityPerHour ?? 0;
    const cumulativeProcessedQty = cumulativeProcessedQtyByStep.get(nodeId) ?? 0;
    const realizedRate = cappedElapsed > 0 ? cumulativeProcessedQty / Math.max(1e-9, cappedElapsed) : 0;
    const utilizationRaw = realizedRate / Math.max(0.001, displayedCapacityPerHour);
    const utilization = clamp(utilizationRaw, 0, 1.35);
    const queueDepth = Math.max(0, queueQty.get(nodeId) ?? 0);
    const snapshotProcessedRate = snapshotProcessedRateByStep.get(nodeId) ?? 0;
    const processWip = Math.max(0, snapshotProcessedRate * Math.max(0, stepEval.serviceTimeHours ?? 0));
    const wipQty = queueDepth + processWip;
    totalWipQty += wipQty;
    const idleWaitHours = Math.max(0, blockedIdleHoursByStep.get(nodeId) ?? 0);
    const idleWaitPct =
      activeElapsedHours > 0 ? clamp(idleWaitHours / activeElapsedHours, 0, 1) : 0;
    const queueRisk = clamp(queueDepth / Math.max(1, displayedCapacityPerHour * 0.6), 0, 1);
    const stepBottleneckIndex = clamp(0.65 * utilization + 0.35 * queueRisk, 0, 1);
    const status = stepStatus(utilization, stepBottleneckIndex);

    if (stepBottleneckIndex > bottleneckIndex) {
      bottleneckIndex = stepBottleneckIndex;
      bottleneckStepId = nodeId;
    }

    node[nodeId] = {
      utilization,
      queueRisk,
      queueDepth,
      wipQty,
      completedQty: Math.max(0, completedQtyByStep.get(nodeId) ?? 0),
      idleWaitHours,
      idleWaitPct,
      bottleneckIndex: stepBottleneckIndex,
      status
    };
  }

  const completedQtyRecord: Record<string, number> = {};
  for (const nodeId of nodeIds) {
    completedQtyRecord[nodeId] = Math.max(0, completedQtyByStep.get(nodeId) ?? 0);
  }

  return {
    node,
    totalWipQty,
    bottleneckStepId,
    bottleneckIndex,
    realizedThroughput,
    completedOutputQty: totalCompletedQty,
    completedQtyByStep: completedQtyRecord
  };
}

function migrationLabel(
  model: CompiledForecastModel,
  baseline: ConstraintSystemEval,
  relief: ConstraintSystemEval
): string {
  const nodeLabel = new Map(model.graph.nodes.map((node) => [node.id, node.label]));
  const currentLabel = nodeLabel.get(baseline.bottleneckStepId) ?? baseline.bottleneckStepId;
  const nextLabel = nodeLabel.get(relief.bottleneckStepId) ?? relief.bottleneckStepId;
  if (!currentLabel || !nextLabel) {
    return "n/a";
  }
  if (currentLabel === nextLabel) {
    return `${currentLabel} -> no change`;
  }
  const top = relief.sortedByBottleneck[0]?.score ?? 0;
  const second = relief.sortedByBottleneck[1]?.score ?? 0;
  const confidence = top - second < 0.05 ? " (low confidence)" : "";
  return `${currentLabel} -> ${nextLabel}${confidence}`;
}

export function createConstraintForecast(
  model: CompiledForecastModel,
  scenario: Record<string, number | string>
): ConstraintForecastSnapshot {
  const visitFactors = computeVisitFactors(model.graph);
  const baseline = evaluateSystem(model, scenario, visitFactors, "", 0);
  const reliefUnits = Math.max(0, Math.round(num(scenario.bottleneckReliefUnits, 1)));
  const relief =
    baseline.bottleneckStepId && reliefUnits > 0
      ? evaluateSystem(model, scenario, visitFactors, baseline.bottleneckStepId, reliefUnits)
      : baseline;

  return {
    baseline,
    relief,
    reliefUnits,
    visitFactors
  };
}

export function createBottleneckForecastOutput(
  model: CompiledForecastModel,
  scenario: Record<string, number | string>,
  elapsedHours = 0
): SimulationOutput {
  const stepLabelById = new Map(model.stepModels.map((step) => [step.stepId, step.label]));
  const { baseline, relief } = createConstraintForecast(model, scenario);
  const runtime = simulateRuntimeFlow(model, baseline, elapsedHours, scenario);

  const topScore = runtime.bottleneckIndex;
  const secondScore = baseline.sortedByBottleneck[1]?.score ?? 0;
  const margin = Math.max(0, topScore - secondScore);
  const knownNodes = Object.values(runtime.node).filter((step) => step.utilization !== null);
  const nearSatCount = knownNodes.filter((step) => (step.utilization ?? 0) >= 0.9).length;
  const cascadePressure = knownNodes.length > 0 ? nearSatCount / knownNodes.length : 0;
  const wipPressure = clamp(
    runtime.totalWipQty / Math.max(1, baseline.horizonHours * Math.max(1, model.stepModels.length) * 10),
    0,
    1
  );
  const migrationPenalty =
    runtime.bottleneckStepId && runtime.bottleneckStepId !== relief.bottleneckStepId ? 0.08 : 0;
  const brittleness = clamp(
    0.48 * topScore +
      0.18 * (knownNodes.reduce((sum, row) => sum + (row.queueRisk ?? 0), 0) / Math.max(1, knownNodes.length)) +
      0.16 * cascadePressure +
      0.18 * wipPressure +
      migrationPenalty +
      (margin < 0.08 ? 0.06 : 0) -
      margin * 0.3,
    0,
    1
  );

  let totalLeadTimeMinutes = 0;
  let totalExplicitLeadTimeMinutes = 0;
  let leadTimeTopStepId = "";
  let leadTimeTopValue = -1;
  const nodeMetrics: SimulationOutput["nodeMetrics"] = {};
  for (const step of model.stepModels) {
    const evalStep = runtime.node[step.stepId];
    const stepBaseline = baseline.stepEvals[step.stepId];
    if (!evalStep) {
      nodeMetrics[step.stepId] = {
        utilization: null,
        headroom: null,
        queueRisk: null,
        queueDepth: null,
        wipQty: null,
        completedQty: 0,
        idleWaitHours: null,
        idleWaitPct: null,
        leadTimeMinutes: null,
        capacityPerHour: null,
        bottleneckIndex: null,
        bottleneckFlag: false,
        status: "unknown"
      };
      continue;
    }
    const capacityPerHour =
      stepBaseline?.calendarCapacityPerHour ?? stepBaseline?.capacityPerHour ?? null;
    const queueDelayMinutes =
      capacityPerHour !== null && capacityPerHour > 0
        ? ((evalStep.queueDepth ?? 0) / capacityPerHour) * 60
        : 0;
    const processMinutes = Math.max(0, (stepBaseline?.serviceTimeHours ?? 0) * 60);
    const explicitLeadMinutes = Math.max(0, stepBaseline?.explicitLeadTimeMinutes ?? 0);
    const leadTimeMinutes = processMinutes + queueDelayMinutes + explicitLeadMinutes;
    totalLeadTimeMinutes += leadTimeMinutes;
    totalExplicitLeadTimeMinutes += explicitLeadMinutes;
    if (leadTimeMinutes > leadTimeTopValue) {
      leadTimeTopValue = leadTimeMinutes;
      leadTimeTopStepId = step.stepId;
    }
    nodeMetrics[step.stepId] = {
      utilization: evalStep.utilization,
      headroom:
        evalStep.utilization !== null ? Math.max(0, 1 - evalStep.utilization) : stepBaseline?.headroom ?? null,
      queueRisk: evalStep.queueRisk,
      queueDepth: evalStep.queueDepth,
      wipQty: evalStep.wipQty,
      completedQty: evalStep.completedQty,
      idleWaitHours: evalStep.idleWaitHours,
      idleWaitPct: evalStep.idleWaitPct,
      leadTimeMinutes,
      capacityPerHour,
      bottleneckIndex: evalStep.bottleneckIndex,
      bottleneckFlag: step.stepId === runtime.bottleneckStepId,
      status: step.stepId === runtime.bottleneckStepId ? "critical" : evalStep.status
    };
  }
  const compiledBaselineLeadTime = num(
    model.baseline.globalMetrics.totalLeadTimeMinutes,
    baseline.totalLeadTimeMinutes
  );
  const waitSharePct = totalLeadTimeMinutes > 0 ? totalExplicitLeadTimeMinutes / totalLeadTimeMinutes : 0;

  return {
    globalMetrics: {
      simElapsedHours: elapsedHours,
      forecastThroughput: runtime.realizedThroughput > 0 ? runtime.realizedThroughput : baseline.throughput,
      totalCompletedOutputPieces: runtime.completedOutputQty,
      totalWipQty: runtime.totalWipQty,
      worstCaseTouchTime: baseline.worstCaseTouchTime,
      totalLeadTimeMinutes,
      leadTimeDeltaMinutes: totalLeadTimeMinutes - compiledBaselineLeadTime,
      waitSharePct,
      leadTimeTopContributor: stepLabelById.get(leadTimeTopStepId) ?? "n/a",
      throughputDelta: relief.throughput - baseline.throughput,
      bottleneckMigration: migrationLabel(model, baseline, relief),
      bottleneckIndex: topScore,
      brittleness
    },
    nodeMetrics
  };
}
