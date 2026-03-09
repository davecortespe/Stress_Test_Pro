#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
      continue;
    }
    result[key] = next;
    i += 1;
  }
  return result;
}

function num(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeOutgoing(edges) {
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

function computeVisitFactors(graph) {
  const nodeIds = graph.nodes.map((node) => node.id);
  const outgoingRaw = new Map();
  const outgoing = new Map();

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
  const startNodes = Array.isArray(graph.startNodes) && graph.startNodes.length > 0 ? graph.startNodes : fallbackStart;
  const base = new Map();
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

  const result = {};
  for (const nodeId of nodeIds) {
    result[nodeId] = clamp(num(visits.get(nodeId), 0), 0.01, 12);
  }
  return result;
}

function mixModifier(stepId, index, total, mixProfile) {
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

function stepStatus(utilization, bottleneckIndex) {
  if (utilization >= 0.98 || bottleneckIndex >= 0.82) {
    return "critical";
  }
  if (utilization >= 0.85 || bottleneckIndex >= 0.62) {
    return "risk";
  }
  return "healthy";
}

function readStepOverride(scenario, stepId, field) {
  const value = num(scenario[`step_${stepId}_${field}`], Number.NaN);
  return Number.isFinite(value) ? value : null;
}

function evaluateSystem(model, scenario, visitFactors, reliefStepId, reliefUnits) {
  const baselineDemand = num(model.inputDefaults?.demandRatePerHour, num(model.baseline?.demandRatePerHour, 10));
  const demandMultiplier = clamp(num(scenario.demandMultiplier, 1), 0.2, 3);
  const lineDemand = Math.max(0.1, baselineDemand * demandMultiplier);
  const staffingMultiplier = clamp(num(scenario.staffingMultiplier, 1), 0.25, 3);
  const equipmentMultiplier = clamp(num(scenario.equipmentMultiplier, 1), 0.25, 3);
  const availabilityMultiplier = clamp(1 - num(scenario.unplannedDowntimePct, 7) / 100, 0.2, 1);
  const ctMultiplier = clamp(num(scenario.ctMultiplier, 1), 0.25, 3);
  const setupPenaltyMultiplier = clamp(num(scenario.setupPenaltyMultiplier, 1), 0, 3);
  const variabilityMultiplier = clamp(num(scenario.variabilityMultiplier, 1), 0.2, 3);
  const horizonHours = clamp(num(scenario.simulationHorizonHours, 8), 8, 24);
  const horizonSeverity = 1 + ((horizonHours - 8) / 16) * 0.22;
  const mixProfile = String(scenario.mixProfile ?? "balanced");

  const stepEvals = {};
  const ranked = [];
  let lineCapacity = Number.POSITIVE_INFINITY;
  let totalWipQty = 0;
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
        wipQty: null,
        capacityPerHour: null,
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
    const stepDowntimePct = clamp(readStepOverride(scenario, step.stepId, "downtimePct") ?? 0, 0, 95);

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

    const worstCtMinutes =
      Math.max(0.05, ctBaseline * ctMultiplier * stepCtMultiplier) * (1 + stepDowntimePct / 100);
    worstCaseTouchTime += worstCtMinutes;

    const utilizationRaw = stepDemandRate / Math.max(0.001, capacityRate);
    const utilization = clamp(utilizationRaw, 0, 1.35);
    const headroom = Math.max(0, 1 - utilizationRaw);
    const cv = Math.max(0.03, num(step.variabilityCv, 0.18) * variabilityMultiplier);
    const queuePressure = (utilization * utilization) / Math.max(0.06, 1 - utilization);
    const queueRisk = clamp((queuePressure * (0.52 + cv)) / 7.2, 0, 1);
    const queueDepth = Math.max(
      0,
      Math.min(24, (Math.max(0, utilizationRaw - 0.66) * 8 + queueRisk * 14) * stepVisitFactor)
    );
    const accumulationRate = Math.max(0, stepDemandRate - capacityRate);
    const wipQty = Math.max(0, queueDepth + accumulationRate * horizonHours);
    totalWipQty += wipQty;

    const shortage = clamp(utilizationRaw - 1, 0, 1);
    const bottleneckIndex = clamp(
      (0.6 * (Math.min(utilizationRaw, 1.25) / 1.25) + 0.3 * queueRisk + 0.1 * shortage) * horizonSeverity,
      0,
      1
    );
    const status = stepStatus(utilizationRaw, bottleneckIndex);
    const throughputLimit = capacityRate / Math.max(0.01, stepVisitFactor * stepMixFactor);

    lineCapacity = Math.min(lineCapacity, throughputLimit);
    stepEvals[step.stepId] = {
      demandRatePerHour: stepDemandRate,
      utilization,
      headroom,
      queueRisk,
      queueDepth,
      wipQty,
      capacityPerHour: capacityRate,
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
    avgQueueRisk,
    totalWipQty,
    worstCaseTouchTime,
    horizonHours,
    sortedByBottleneck: ranked
  };
}

function migrationLabel(model, baseline, relief) {
  const labels = new Map(model.graph.nodes.map((node) => [node.id, node.label]));
  const currentLabel = labels.get(baseline.bottleneckStepId) ?? baseline.bottleneckStepId;
  const nextLabel = labels.get(relief.bottleneckStepId) ?? relief.bottleneckStepId;
  if (!currentLabel || !nextLabel) {
    return "n/a";
  }
  if (currentLabel === nextLabel) {
    return currentLabel + " -> no change";
  }
  const top = relief.sortedByBottleneck[0]?.score ?? 0;
  const second = relief.sortedByBottleneck[1]?.score ?? 0;
  const confidence = top - second < 0.05 ? " (low confidence)" : "";
  return currentLabel + " -> " + nextLabel + confidence;
}

function runForecast(model, scenario) {
  const visitFactors = computeVisitFactors(model.graph);
  const baseline = evaluateSystem(model, scenario, visitFactors, "", 0);
  const reliefUnits = Math.max(0, Math.round(num(scenario.bottleneckReliefUnits, 1)));
  const relief =
    baseline.bottleneckStepId && reliefUnits > 0
      ? evaluateSystem(model, scenario, visitFactors, baseline.bottleneckStepId, reliefUnits)
      : baseline;

  const topScore = baseline.sortedByBottleneck[0]?.score ?? 0;
  const secondScore = baseline.sortedByBottleneck[1]?.score ?? 0;
  const margin = Math.max(0, topScore - secondScore);
  const known = Object.values(baseline.stepEvals).filter((step) => step.utilization !== null);
  const nearSatCount = known.filter((step) => (step.utilization ?? 0) >= 0.9).length;
  const cascadePressure = known.length > 0 ? nearSatCount / known.length : 0;
  const wipPressure = clamp(
    baseline.totalWipQty / Math.max(1, baseline.horizonHours * Math.max(1, model.stepModels.length) * 10),
    0,
    1
  );
  const migrationPenalty = baseline.bottleneckStepId !== relief.bottleneckStepId ? 0.08 : 0;
  const brittleness = clamp(
    0.48 * topScore +
      0.18 * baseline.avgQueueRisk +
      0.16 * cascadePressure +
      0.18 * wipPressure +
      migrationPenalty +
      (margin < 0.08 ? 0.06 : 0) -
      margin * 0.3,
    0,
    1
  );

  const labels = new Map(model.graph.nodes.map((node) => [node.id, node.label]));
  const top3 = baseline.sortedByBottleneck.slice(0, 3).map((row) => {
    const stepEval = baseline.stepEvals[row.stepId];
    return {
      stepId: row.stepId,
      label: labels.get(row.stepId) ?? row.stepId,
      bottleneckIndex: row.score,
      utilization: stepEval?.utilization ?? null,
      headroom: stepEval?.headroom ?? null,
      queueRisk: stepEval?.queueRisk ?? null,
      capacityPerHour: stepEval?.capacityPerHour ?? null,
      status: stepEval?.status ?? "unknown"
    };
  });

  return {
    globalKpis: {
      throughputPerHour: baseline.throughput,
      totalWipQty: baseline.totalWipQty,
      bottleneck: labels.get(baseline.bottleneckStepId) ?? baseline.bottleneckStepId,
      brittleness,
      worstCaseTouchTimeMinutes: baseline.worstCaseTouchTime,
      bottleneckMigration: migrationLabel(model, baseline, relief)
    },
    topConstrainedSteps: top3,
    nodeMetrics: baseline.stepEvals
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const args = parseArgs(process.argv.slice(2));
const bundlePath = path.resolve(String(args.path ?? process.cwd()));
const model = readJson(path.join(bundlePath, "compiled_forecast_model.json"));
const scenario = readJson(path.join(bundlePath, "scenario_committed.json"));
const result = runForecast(model, scenario);

if (args.json) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
} else {
  process.stdout.write("Forecast KPIs\n");
  process.stdout.write("-------------\n");
  process.stdout.write("Throughput/hr: " + result.globalKpis.throughputPerHour.toFixed(3) + "\n");
  process.stdout.write("Total WIP: " + result.globalKpis.totalWipQty.toFixed(2) + "\n");
  process.stdout.write("Bottleneck: " + result.globalKpis.bottleneck + "\n");
  process.stdout.write("Brittleness: " + (result.globalKpis.brittleness * 100).toFixed(1) + "%\n");
  process.stdout.write(
    "Worst-case touch time: " + result.globalKpis.worstCaseTouchTimeMinutes.toFixed(2) + " min\n"
  );
  process.stdout.write("Bottleneck migration: " + result.globalKpis.bottleneckMigration + "\n\n");
  process.stdout.write("Top 3 constrained steps\n");
  process.stdout.write("-----------------------\n");
  result.topConstrainedSteps.forEach((step, index) => {
    const util = typeof step.utilization === "number" ? (step.utilization * 100).toFixed(1) + "%" : "--";
    const headroom = typeof step.headroom === "number" ? (step.headroom * 100).toFixed(1) + "%" : "--";
    const qRisk = typeof step.queueRisk === "number" ? (step.queueRisk * 100).toFixed(1) + "%" : "--";
    const score = typeof step.bottleneckIndex === "number" ? step.bottleneckIndex.toFixed(3) : "--";
    process.stdout.write(
      (index + 1) +
        ". " +
        step.label +
        " | score " +
        score +
        " | util " +
        util +
        " | headroom " +
        headroom +
        " | queue risk " +
        qRisk +
        "\n"
    );
  });
}
