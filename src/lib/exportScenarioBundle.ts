import type { OperationalDiagnosis } from "../types/contracts";

interface ExportScenarioBundleInput {
  name?: string;
  includeMetrics: boolean;
  dashboardConfig: unknown;
  vsmGraph: unknown;
  masterData: unknown;
  compiledForecastModel: unknown;
  scenarioCommitted: Record<string, number | string>;
  resultMetrics?: {
    globalMetrics: Record<string, number | string>;
    nodeMetrics: Record<string, unknown>;
  };
  operationalDiagnosis?: OperationalDiagnosis;
  operationalDiagnosisMarkdown?: string;
}

interface ExportScenarioBundleResult {
  folderName: string;
  exportPath: string;
}

function formatTimestamp(date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

function sanitizeName(input: string): string {
  const compact = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return compact.length > 0 ? compact.slice(0, 48) : "scenario";
}

async function directoryExists(parent: any, name: string): Promise<boolean> {
  try {
    await parent.getDirectoryHandle(name);
    return true;
  } catch {
    return false;
  }
}

async function createUniqueDirectory(parent: any, baseName: string): Promise<{ name: string; handle: any }> {
  for (let i = 0; i < 5000; i += 1) {
    const candidate = i === 0 ? baseName : `${baseName}_${i + 1}`;
    const exists = await directoryExists(parent, candidate);
    if (exists) {
      continue;
    }
    const handle = await parent.getDirectoryHandle(candidate, { create: true });
    return { name: candidate, handle };
  }
  throw new Error("Unable to allocate unique export directory.");
}

async function writeTextFile(directoryHandle: any, fileName: string, contents: string): Promise<void> {
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}

async function writeJsonFile(directoryHandle: any, fileName: string, value: unknown): Promise<void> {
  await writeTextFile(directoryHandle, fileName, `${JSON.stringify(value, null, 2)}\n`);
}

export function buildPortableRunnerSource(): string {
  return `#!/usr/bin/env node
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

function readActiveShiftCount(scenario) {
  return clamp(Math.round(num(scenario.activeShiftCount, 3)), 1, 3);
}

function getActiveHoursPerDay(scenario) {
  const shiftCount = readActiveShiftCount(scenario);
  return clamp(num(scenario.shiftDurationHours, shiftCount * 8), 1, 24);
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

function rawMixModifier(index, total, mixProfile) {
  if (mixProfile === "front-loaded") {
    return index < Math.ceil(total / 3) ? 1.12 : 0.94;
  }
  if (mixProfile === "midstream-heavy") {
    const start = Math.floor(total / 3);
    const end = Math.ceil((total * 2) / 3);
    return index >= start && index < end ? 1.12 : 0.94;
  }
  if (mixProfile === "back-loaded") {
    return index >= Math.floor((total * 2) / 3) ? 1.12 : 0.94;
  }
  return 1;
}

function buildMixModifiers(total, mixProfile) {
  if (total <= 0) {
    return [];
  }
  const raw = Array.from({ length: total }, (_, index) => rawMixModifier(index, total, mixProfile));
  const sum = raw.reduce((acc, value) => acc + value, 0);
  if (sum <= 0) {
    return raw.map(() => 1);
  }
  const normalization = total / sum;
  return raw.map((value) => value * normalization);
}

function analyticalQueueDepth(demandRatePerHour, capacityPerHour, variabilityCv, horizonHours) {
  const rhoRaw = demandRatePerHour / Math.max(0.001, capacityPerHour);
  if (rhoRaw < 1) {
    const rho = Math.min(0.9999, Math.max(0, rhoRaw));
    const cv = Math.max(0.03, variabilityCv);
    return (rho * rho * (1 + cv * cv)) / (2 * Math.max(0.0001, 1 - rho));
  }
  return Math.max(0, demandRatePerHour - capacityPerHour) * Math.max(0, horizonHours);
}

function queueRiskFromDepth(queueDepth, capacityPerHour) {
  return clamp(queueDepth / Math.max(1, capacityPerHour * 0.6), 0, 1);
}

function bottleneckIndexFrom(utilization, queueRisk) {
  return clamp(0.65 * clamp(utilization, 0, 1.35) + 0.35 * clamp(queueRisk, 0, 1), 0, 1);
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
  const value = num(scenario[\`step_\${stepId}_\${field}\`], Number.NaN);
  return Number.isFinite(value) ? value : null;
}

function evaluateSystem(model, scenario, visitFactors, reliefStepId, reliefUnits) {
  const baselineDemand = num(model.inputDefaults?.demandRatePerHour, num(model.baseline?.demandRatePerHour, 10));
  const demandMultiplier = clamp(num(scenario.demandMultiplier, 1), 0, 3);
  const lineDemand = Math.max(0, baselineDemand * demandMultiplier);
  const staffingMultiplier = clamp(num(scenario.staffingMultiplier, 1), 0.25, 3);
  const equipmentMultiplier = clamp(num(scenario.equipmentMultiplier, 1), 0.25, 3);
  const availabilityMultiplier = clamp(1 - num(scenario.unplannedDowntimePct, 7) / 100, 0.2, 1);
  const ctMultiplier = clamp(num(scenario.ctMultiplier, 1), 0.25, 3);
  const setupPenaltyMultiplier = clamp(num(scenario.setupPenaltyMultiplier, 1), 0, 3);
  const variabilityMultiplier = clamp(num(scenario.variabilityMultiplier, 1), 0.2, 3);
  const horizonHours = clamp(num(scenario.simulationHorizonHours, 8), 8, 720);
  const activeHoursPerDay = getActiveHoursPerDay(scenario);
  const activeCapacityFraction = activeHoursPerDay / 24;
  const mixProfile = String(scenario.mixProfile ?? "balanced");
  const mixFactors = buildMixModifiers(model.stepModels.length, mixProfile);

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
        calendarCapacityPerHour: null,
        bottleneckIndex: null,
        status: "unknown",
        throughputLimit: null
      };
      return;
    }

    const stepVisitFactor = Math.max(0.01, num(visitFactors[step.stepId], 1));
    const stepMixFactor = mixFactors[index] ?? 1;
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
    const calendarCapacityRate = Math.max(0.001, capacityRate * activeCapacityFraction);

    const worstCtMinutes = Math.max(0.05, ctBaseline * ctMultiplier * stepCtMultiplier);
    worstCaseTouchTime += worstCtMinutes;

    const utilizationRaw = stepDemandRate / Math.max(0.001, calendarCapacityRate);
    const utilization = clamp(utilizationRaw, 0, 1.35);
    const headroom = Math.max(0, 1 - utilizationRaw);
    const cv = Math.max(0.03, num(step.variabilityCv, 0.18) * variabilityMultiplier);
    const queueDepth = analyticalQueueDepth(stepDemandRate, calendarCapacityRate, cv, horizonHours);
    const queueRisk = queueRiskFromDepth(queueDepth, calendarCapacityRate);
    const inServiceWip = Math.max(0, Math.min(stepDemandRate, calendarCapacityRate) * (effectiveCt / 60));
    const wipQty = Math.max(0, queueDepth + inServiceWip);
    totalWipQty += wipQty;

    const bottleneckIndex = bottleneckIndexFrom(utilization, queueRisk);
    const status = stepStatus(utilization, bottleneckIndex);
    const throughputLimit = calendarCapacityRate / Math.max(0.01, stepVisitFactor * stepMixFactor);

    lineCapacity = Math.min(lineCapacity, throughputLimit);
    stepEvals[step.stepId] = {
      demandRatePerHour: stepDemandRate,
      utilization,
      headroom,
      queueRisk,
      queueDepth,
      wipQty,
      capacityPerHour: capacityRate,
      calendarCapacityPerHour: calendarCapacityRate,
      bottleneckIndex,
      status,
      throughputLimit
    };
    ranked.push({ stepId: step.stepId, score: bottleneckIndex, throughputLimit });
  });

  ranked.sort((a, b) => {
    const scoreDelta = b.score - a.score;
    if (Math.abs(scoreDelta) > 1e-9) {
      return scoreDelta;
    }
    return (a.throughputLimit ?? Number.POSITIVE_INFINITY) - (b.throughputLimit ?? Number.POSITIVE_INFINITY);
  });
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
      capacityPerHour: stepEval?.calendarCapacityPerHour ?? stepEval?.capacityPerHour ?? null,
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
  process.stdout.write(JSON.stringify(result, null, 2) + "\\n");
} else {
  process.stdout.write("Forecast KPIs\\n");
  process.stdout.write("-------------\\n");
  process.stdout.write("Throughput/hr: " + result.globalKpis.throughputPerHour.toFixed(3) + "\\n");
  process.stdout.write("Total WIP: " + result.globalKpis.totalWipQty.toFixed(2) + "\\n");
  process.stdout.write("Bottleneck: " + result.globalKpis.bottleneck + "\\n");
  process.stdout.write("Brittleness: " + (result.globalKpis.brittleness * 100).toFixed(1) + "%\\n");
  process.stdout.write(
    "Worst-case touch time: " + result.globalKpis.worstCaseTouchTimeMinutes.toFixed(2) + " min\\n"
  );
  process.stdout.write("Bottleneck migration: " + result.globalKpis.bottleneckMigration + "\\n\\n");
  process.stdout.write("Top 3 constrained steps\\n");
  process.stdout.write("-----------------------\\n");
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
        "\\n"
    );
  });
}
`;
}

function buildReadme(folderName: string, includeMetrics: boolean): string {
  const metricsLine = includeMetrics
    ? "- `result_metrics.json` contains latest exported metrics from the source run."
    : "- `result_metrics.json` not included for this export.";
  return `# Export Scenario Bundle

This bundle is a portable snapshot of a committed forecast scenario.
The forecast engine is deterministic math with a transient runtime-flow overlay, not a full discrete-event simulation.

## Run

### Browser cockpit (recommended)

Open \`browser_forecast.html\` in your browser.

### Node CLI

From this bundle folder:

\`\`\`bash
node run_forecast.mjs --path .
\`\`\`

Machine-readable output:

\`\`\`bash
node run_forecast.mjs --path . --json
\`\`\`

From the repo root:

\`\`\`bash
node exports/${folderName}/run_forecast.mjs --path exports/${folderName}
\`\`\`

## Included files

- \`dashboard_config.json\`
- \`vsm_graph.json\`
- \`master_data.json\`
- \`compiled_forecast_model.json\`
- \`scenario_committed.json\`
- \`run_forecast.mjs\`
- \`browser_forecast.html\`
- \`operational_diagnosis.json\`
- \`operational_diagnosis.md\`
- \`README.md\`
${metricsLine}

## Metric semantics

- \`forecastThroughput\` may be steady-state, transient, or fallback-analytical. Check \`globalMetrics.throughputState\`.
- \`globalMetrics.warmupHours\` estimates when runtime throughput should be treated as warmed up.
- \`warnings[]\` flags degraded-confidence conditions such as cyclic graphs or transient runtime output.
- \`nodeMetrics.processedQty\` is pass-through volume at a step over elapsed time.
- \`nodeMetrics.completedQty\` is terminal completions only.
`;
}

function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildBrowserSnapshotHtmlSource(
  dashboardConfig: unknown,
  compiledForecastModel: unknown,
  scenarioCommitted: unknown,
  resultMetrics?: {
    globalMetrics: Record<string, number | string>;
    nodeMetrics: Record<string, unknown>;
  },
  operationalDiagnosis?: OperationalDiagnosis
): string {
  const dashboardJson = safeJsonForScript(dashboardConfig);
  const modelJson = safeJsonForScript(compiledForecastModel);
  const scenarioJson = safeJsonForScript(scenarioCommitted);
  const metricsJson = safeJsonForScript(resultMetrics ?? null);
  const diagnosisJson = safeJsonForScript(operationalDiagnosis ?? null);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Forecast Browser Snapshot</title>
  <style>
    body { margin: 0; background: #061326; color: #dff7ff; font-family: Arial, sans-serif; padding: 16px; }
    .card { background: #0b2436; border: 1px solid #1f4e68; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
    h1 { margin: 0; font-size: 24px; }
    h2 { margin: 0 0 8px; font-size: 16px; color: #9fd4e6; }
    .muted { color: #8eb7c8; }
    .kpi-grid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
    .kpi { background: #081b2c; border: 1px solid #214f67; border-radius: 8px; padding: 8px; }
    .kpi .label { color: #8eb7c8; font-size: 12px; }
    .kpi .value { margin-top: 6px; font-size: 20px; font-family: monospace; }
    .nodes { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
    .node { background: #082133; border: 2px solid #1cc2af; border-radius: 10px; padding: 8px; }
    .node.critical { border-color: #ff4f72; }
    .node.risk { border-color: #f2b766; }
    .node h3 { margin: 0 0 8px; font-size: 15px; }
    .node p { margin: 3px 0; font-family: monospace; font-size: 13px; }
    .diagnosis-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .diagnosis-grid article { background: #081b2c; border: 1px solid #214f67; border-radius: 8px; padding: 10px; }
    .diagnosis-grid h3 { margin: 0 0 6px; color: #9fd4e6; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; }
    .diagnosis-grid p, .diagnosis ul { margin: 0; color: #dff7ff; line-height: 1.45; }
    .diagnosis ul { padding-left: 18px; }
    pre { white-space: pre-wrap; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1 id="title"></h1>
    <p id="subtitle" class="muted"></p>
  </div>

  <div class="card">
    <h2>Global KPIs</h2>
    <div id="kpis" class="kpi-grid"></div>
  </div>

  <div class="card">
    <h2>Node Metrics</h2>
    <div id="nodes" class="nodes"></div>
  </div>

  <div class="card diagnosis">
    <h2>Operational Diagnosis</h2>
    <div id="diagnosis"></div>
  </div>

  <div class="card">
    <h2>Committed Scenario</h2>
    <pre id="scenario"></pre>
  </div>

  <script>
    const dashboardConfig = ${dashboardJson};
    const compiledForecastModel = ${modelJson};
    const committedScenario = ${scenarioJson};
    const resultMetrics = ${metricsJson} || {
      globalMetrics: (compiledForecastModel && compiledForecastModel.baseline && compiledForecastModel.baseline.globalMetrics) || {},
      nodeMetrics: (compiledForecastModel && compiledForecastModel.baseline && compiledForecastModel.baseline.nodeMetrics) || {}
    };
    const operationalDiagnosis = ${diagnosisJson};

    document.getElementById("title").textContent = dashboardConfig.appTitle || "Forecast Browser Snapshot";
    document.getElementById("subtitle").textContent = dashboardConfig.subtitle || "Portable export";
    document.getElementById("scenario").textContent = JSON.stringify(committedScenario, null, 2);

    const kpis = Array.isArray(dashboardConfig.kpis) ? dashboardConfig.kpis : [];
    const kpiContainer = document.getElementById("kpis");
    kpiContainer.innerHTML = kpis.map((kpi) => {
      const value = resultMetrics.globalMetrics && resultMetrics.globalMetrics[kpi.key] != null ? resultMetrics.globalMetrics[kpi.key] : "--";
      return "<div class=\\"kpi\\"><div class=\\"label\\">" + kpi.label + "</div><div class=\\"value\\">" + String(value) + "</div></div>";
    }).join("");

    const nodes = Array.isArray(compiledForecastModel.graph && compiledForecastModel.graph.nodes)
      ? compiledForecastModel.graph.nodes
      : [];
    const nodeMetrics = resultMetrics.nodeMetrics || {};
    document.getElementById("nodes").innerHTML = nodes.map((node) => {
      const m = nodeMetrics[node.id] || {};
      const status = String(m.status || "unknown");
      const klass = status === "critical" ? "critical" : (status === "risk" ? "risk" : "");
      const util = typeof m.utilization === "number" ? (m.utilization * 100).toFixed(1) + "%" : "--";
      const wip = typeof m.wipQty === "number" ? Math.round(m.wipQty) + " pcs" : "--";
      const processed = typeof m.processedQty === "number" ? Math.round(m.processedQty) + " pcs" : "--";
      const completed = typeof m.completedQty === "number" ? Math.round(m.completedQty) + " pcs" : "--";
      return "<article class=\\"node " + klass + "\\"><h3>" + node.label + "</h3><p>util: " + util + "</p><p>lot/wip: " + wip + "</p><p>processed: " + processed + "</p><p>completed: " + completed + "</p><p>status: " + status + "</p></article>";
    }).join("");

    const diagnosisEl = document.getElementById("diagnosis");
    if (operationalDiagnosis) {
      diagnosisEl.innerHTML =
        "<div class=\\"diagnosis-grid\\">" +
        "<article><h3>System Status</h3><p>" + operationalDiagnosis.statusSummary + "</p></article>" +
        "<article><h3>Primary Constraint</h3><p>" + operationalDiagnosis.primaryConstraint + "</p></article>" +
        "<article><h3>Constraint Mechanism</h3><p>" + operationalDiagnosis.constraintMechanism + "</p></article>" +
        "<article><h3>Downstream Effects</h3><p>" + operationalDiagnosis.downstreamEffects + "</p></article>" +
        "<article><h3>Economic Interpretation</h3><p>" + operationalDiagnosis.economicInterpretation + "</p></article>" +
        "<article><h3>Recommended Action</h3><p>" + operationalDiagnosis.recommendedAction + "</p></article>" +
        "</div>" +
        "<div class=\\"diagnosis-grid\\" style=\\"margin-top:10px\\">" +
        "<article><h3>Scenario Guidance</h3><p>" + operationalDiagnosis.scenarioGuidance + "</p></article>" +
        "<article><h3>Confidence</h3><p>" + operationalDiagnosis.confidence + " - " + operationalDiagnosis.confidenceNote + "</p></article>" +
        "</div>" +
        "<div style=\\"margin-top:10px\\"><h3 style=\\"margin:0 0 6px;color:#9fd4e6;font-size:13px;text-transform:uppercase;letter-spacing:0.04em;\\">AI Opportunity Lens</h3><ul>" +
        "<li><strong>Data already exists but is underused:</strong> " + operationalDiagnosis.aiOpportunityLens.dataAlreadyExists + "</li>" +
        "<li><strong>Manual but pattern-based decisions:</strong> " + operationalDiagnosis.aiOpportunityLens.manualPatternDecisions + "</li>" +
        "<li><strong>Backward-looking vs predictive gap:</strong> " + operationalDiagnosis.aiOpportunityLens.predictiveGap + "</li>" +
        "<li><strong>Tribal knowledge / email as database:</strong> " + operationalDiagnosis.aiOpportunityLens.tribalKnowledge + "</li>" +
        "<li><strong>Visibility gaps causing profit leakage:</strong> " + operationalDiagnosis.aiOpportunityLens.visibilityGap + "</li>" +
        "</ul></div>";
    } else {
      diagnosisEl.textContent = "Operational diagnosis not included in this export.";
    }
  </script>
</body>
</html>
`;
}

export async function exportScenarioBundleToLocalFolder(
  input: ExportScenarioBundleInput
): Promise<ExportScenarioBundleResult> {
  const w = window as Window & { showDirectoryPicker?: (options?: { mode?: string }) => Promise<any> };
  if (typeof w.showDirectoryPicker !== "function") {
    throw new Error("File System Access API is not available in this browser.");
  }

  const rootHandle = await w.showDirectoryPicker({ mode: "readwrite" });
  const exportsHandle = await rootHandle.getDirectoryHandle("exports", { create: true });

  const timestamp = formatTimestamp(new Date());
  const safeName = sanitizeName(input.name ?? "scenario");
  const { name: folderName, handle: bundleHandle } = await createUniqueDirectory(
    exportsHandle,
    `${timestamp}_${safeName}`
  );

  await writeJsonFile(bundleHandle, "dashboard_config.json", input.dashboardConfig);
  await writeJsonFile(bundleHandle, "vsm_graph.json", input.vsmGraph);
  await writeJsonFile(bundleHandle, "master_data.json", input.masterData);
  await writeJsonFile(bundleHandle, "compiled_forecast_model.json", input.compiledForecastModel);
  await writeJsonFile(bundleHandle, "scenario_committed.json", input.scenarioCommitted);
  if (input.includeMetrics) {
    await writeJsonFile(bundleHandle, "result_metrics.json", input.resultMetrics ?? null);
  }
  if (input.operationalDiagnosis) {
    await writeJsonFile(bundleHandle, "operational_diagnosis.json", input.operationalDiagnosis);
  }
  if (input.operationalDiagnosisMarkdown) {
    await writeTextFile(bundleHandle, "operational_diagnosis.md", `${input.operationalDiagnosisMarkdown}\n`);
  }
  await writeTextFile(bundleHandle, "run_forecast.mjs", buildPortableRunnerSource());
  await writeTextFile(
    bundleHandle,
    "browser_forecast.html",
    buildBrowserSnapshotHtmlSource(
      input.dashboardConfig,
      input.compiledForecastModel,
      input.scenarioCommitted,
      input.resultMetrics,
      input.operationalDiagnosis
    )
  );
  await writeTextFile(bundleHandle, "README.md", buildReadme(folderName, input.includeMetrics));

  return {
    folderName,
    exportPath: `${rootHandle.name}/exports/${folderName}`
  };
}
