import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const activeDir = args[0] ?? path.join("models", "active");
const graphPath = path.join(activeDir, "vsm_graph.json");
const masterPath = path.join(activeDir, "master_data.json");
const outputPath = path.join(activeDir, "compiled_forecast_model.json");

const BASELINE_HORIZON_HOURS = 24;
const DEFAULT_VARIABILITY_CV = 0.18;
const DEFAULT_ACTIVE_SHIFT_COUNT = "3";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function toNumber(value, fallback = Number.NaN) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const normalized = value.replace(/,/g, "").trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function slugify(input) {
  return (
    String(input ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "step"
  );
}

function parseDurationMinutes(raw) {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw !== "string") {
    return null;
  }

  const input = raw.trim().toLowerCase();
  if (!input) {
    return null;
  }

  const match = input.match(/([0-9]+(?:\.[0-9]+)?)\s*(day|days|d|hour|hours|hr|hrs|h|min|mins|minute|minutes|m)\b/);
  if (!match) {
    const bareNumber = toNumber(input, Number.NaN);
    return Number.isFinite(bareNumber) ? bareNumber : null;
  }

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  const unit = match[2];
  if (unit === "day" || unit === "days" || unit === "d") {
    return value * 24 * 60;
  }
  if (unit === "hour" || unit === "hours" || unit === "hr" || unit === "hrs" || unit === "h") {
    return value * 60;
  }
  return value;
}

function ctMinutesOf(step) {
  const explicit = toNumber(step?.ct?.params?.value, Number.NaN);
  if (Number.isFinite(explicit) && explicit >= 0) {
    return explicit;
  }
  return parseDurationMinutes(step?.sourcePtRaw ?? step?.ptRaw ?? step?.ctRaw);
}

function changeoverMinutesOf(step) {
  const explicit = toNumber(step?.changeover?.time?.params?.value, Number.NaN);
  if (Number.isFinite(explicit) && explicit >= 0) {
    return explicit;
  }
  return parseDurationMinutes(step?.changeoverRaw);
}

function leadTimeMinutesOf(step) {
  const explicit = toNumber(step?.leadTimeMinutes, Number.NaN);
  if (Number.isFinite(explicit) && explicit >= 0) {
    return explicit;
  }
  const fromWait = parseDurationMinutes(step?.wait?.raw);
  if (fromWait !== null) {
    return fromWait;
  }
  return parseDurationMinutes(step?.leadTimeRaw ?? step?.waitRaw);
}

function stationUnits(raw) {
  if (typeof raw !== "string") {
    return null;
  }
  const match = raw.match(/station\s*=\s*(\d+(?:\.\d+)?)/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseResourcePoolsFromString(raw) {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return [];
  }

  return raw.split(",").map((segment) => {
    const text = segment.trim();
    const match = text.match(/^(.*?)\s*\((\d+(?:\.\d+)?)\)\s*(.*)$/);
    if (!match) {
      return {
        name: text,
        count: null,
        optional: /if\b/i.test(text),
        external: /patient\/family/i.test(text)
      };
    }

    return {
      name: match[1].trim(),
      count: Number(match[2]),
      optional: /if\b/i.test(match[3]),
      external: /patient\/family/i.test(match[1])
    };
  });
}

function normalizeResourcePools(processing) {
  if (Array.isArray(processing?.resourcePools) && processing.resourcePools.length > 0) {
    return processing.resourcePools.map((pool) => ({
      name: String(pool?.name ?? "").trim(),
      count:
        typeof pool?.count === "number" && Number.isFinite(pool.count) && pool.count > 0
          ? pool.count
          : null,
      optional: Boolean(pool?.optional),
      external: Boolean(pool?.external)
    }));
  }
  return parseResourcePoolsFromString(processing?.resourcesRaw);
}

function mixModifier(index, total, mixProfile) {
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

function statusFrom(utilization, bottleneckIndex) {
  if (utilization === null || bottleneckIndex === null) {
    return "unknown";
  }
  if (utilization >= 0.98 || bottleneckIndex >= 0.82) {
    return "critical";
  }
  if (utilization >= 0.85 || bottleneckIndex >= 0.62) {
    return "risk";
  }
  return "healthy";
}

function nextAssumptionId(index) {
  return `compile-${String(index + 1).padStart(3, "0")}`;
}

function buildCompileAssumptions(masterAssumptions, compileTexts) {
  const assumptions = Array.isArray(masterAssumptions)
    ? masterAssumptions.map((entry) => ({
        id: String(entry?.id ?? slugify(entry?.text)),
        severity:
          entry?.severity === "info" || entry?.severity === "warning" || entry?.severity === "blocker"
            ? entry.severity
            : "warning",
        text: String(entry?.text ?? "")
      }))
    : [];

  const existingTexts = new Set(assumptions.map((entry) => entry.text));
  let compileIndex = 0;
  for (const text of compileTexts) {
    if (!text || existingTexts.has(text)) {
      continue;
    }
    assumptions.push({
      id: nextAssumptionId(compileIndex),
      severity: "warning",
      text
    });
    existingTexts.add(text);
    compileIndex += 1;
  }
  assumptions.push({
    id: nextAssumptionId(compileIndex),
    severity: "info",
    text: "Queue risk, bottleneck index, brittleness, and migration outputs are deterministic non-DES forecast heuristics for rapid recompute."
  });

  return assumptions;
}

function inferEffectiveUnits(processing, compileTexts) {
  const explicitParallel = toNumber(processing?.parallelProcedures, Number.NaN);
  if (Number.isFinite(explicitParallel) && explicitParallel > 0) {
    return {
      effectiveUnits: explicitParallel,
      parallelProcedures: explicitParallel
    };
  }

  const stationCount = stationUnits(processing?.stationRaw);
  if (stationCount !== null) {
    return {
      effectiveUnits: stationCount,
      parallelProcedures: stationCount
    };
  }

  const resourcePools = normalizeResourcePools(processing);
  const simultaneousCounts = resourcePools
    .filter((pool) => !pool.optional && !pool.external && typeof pool.count === "number" && pool.count > 0)
    .map((pool) => pool.count);

  if (simultaneousCounts.length > 0) {
    compileTexts.add(
      "Where explicit parallel procedures are not shown, forecast capacity uses the minimum visible required shared-pool count at that step as the concurrency assumption."
    );
    return {
      effectiveUnits: Math.max(1, Math.min(...simultaneousCounts)),
      parallelProcedures: null
    };
  }

  compileTexts.add(
    "Where no explicit parallel procedure count is shown and visible resources are optional or external, forecast capacity assumes one concurrent service unit for that step."
  );
  return {
    effectiveUnits: 1,
    parallelProcedures: null
  };
}

const graph = readJson(graphPath);
const master = readJson(masterPath);
const processingByStepId = new Map((master.processing ?? []).map((row) => [row.stepId, row]));
const variabilityByStepId = new Map(
  (master.ctVariability ?? []).map((row) => [row.stepId, toNumber(row?.cv, DEFAULT_VARIABILITY_CV)])
);
const compileTexts = new Set();

const sellingPricePerUnit =
  typeof master?.economicsDefaults?.sellingPricePerUnit === "number" &&
  Number.isFinite(master.economicsDefaults.sellingPricePerUnit)
    ? master.economicsDefaults.sellingPricePerUnit
    : 0;

compileTexts.add(
  "Demand rate is not shown in the source image; baseline demandRatePerHour is seeded at 90% of computed release capacity from the start step."
);
compileTexts.add(
  "The source image does not show a shift calendar; activeShiftCount defaults to 3 so runtime capacity reflects continuous daily availability unless the user overrides it."
);
compileTexts.add(
  "Step-level variability is not shown in the source image; baseline variabilityCv defaults to 0.18 for all steps."
);

const stepModels = (graph.nodes ?? []).map((node) => {
  const processing = processingByStepId.get(node.id) ?? {};
  const ctMinutesRaw = ctMinutesOf(processing);
  const ctMinutes = Number.isFinite(ctMinutesRaw) && ctMinutesRaw > 0 ? ctMinutesRaw : null;

  const changeoverMinutesRaw = changeoverMinutesOf(processing);
  const changeoverMinutes =
    Number.isFinite(changeoverMinutesRaw) && changeoverMinutesRaw >= 0 ? changeoverMinutesRaw : null;

  const lotSize = toNumber(processing?.lotSize, Number.NaN);
  const normalizedLotSize = Number.isFinite(lotSize) && lotSize > 0 ? lotSize : null;
  const changeoverPenaltyPerUnitMinutes =
    changeoverMinutes === null
      ? null
      : Number((changeoverMinutes / Math.max(1, normalizedLotSize ?? 1)).toFixed(4));

  if (changeoverMinutes !== null && normalizedLotSize === null) {
    compileTexts.add(
      "Visible changeover minutes without a visible lot size are converted to per-unit setup penalty using a lot-size fallback of 1."
    );
  }

  const leadTimeMinutesRaw = leadTimeMinutesOf(processing);
  const leadTimeMinutes =
    typeof leadTimeMinutesRaw === "number" && Number.isFinite(leadTimeMinutesRaw) && leadTimeMinutesRaw >= 0
      ? Number(leadTimeMinutesRaw.toFixed(4))
      : null;

  const workers = toNumber(processing?.workers, Number.NaN);
  const workerCount = Number.isFinite(workers) && workers > 0 ? workers : 0;
  const resourcePools = normalizeResourcePools(processing);
  const unitInference = inferEffectiveUnits(processing, compileTexts);
  const effectiveUnits = Number(unitInference.effectiveUnits.toFixed(3));
  const variabilityCv = Number(
    clamp(variabilityByStepId.get(node.id) ?? DEFAULT_VARIABILITY_CV, 0.03, 2).toFixed(4)
  );
  const effectiveCtMinutes =
    ctMinutes === null
      ? null
      : Number((Math.max(0.05, ctMinutes + (changeoverPenaltyPerUnitMinutes ?? 0))).toFixed(4));
  const effectiveCapacityPerHour =
    effectiveCtMinutes === null
      ? null
      : Number(((effectiveUnits * 60) / Math.max(0.05, effectiveCtMinutes)).toFixed(4));

  return {
    stepId: node.id,
    label: node.label,
    equipmentType:
      processing.equipmentType ??
      resourcePools.find((pool) => !pool.external)?.name ??
      node.label,
    workerCount,
    parallelProcedures: unitInference.parallelProcedures ?? 1,
    effectiveUnits,
    ctMinutes,
    changeoverMinutes,
    changeoverPenaltyPerUnitMinutes,
    leadTimeMinutes,
    variabilityCv,
    effectiveCtMinutes,
    effectiveCapacityPerHour,
    baseline: {
      demandRatePerHour: 0,
      utilization: null,
      headroom: null,
      queueRisk: null,
      bottleneckIndex: null,
      status: "unknown"
    }
  };
});

const validCapacities = stepModels
  .map((step) => step.effectiveCapacityPerHour)
  .filter((value) => typeof value === "number" && Number.isFinite(value) && value > 0);
const lineCapacityPerHour = validCapacities.length > 0 ? Math.min(...validCapacities) : 1;
const startNodeIds =
  Array.isArray(graph.startNodes) && graph.startNodes.length > 0
    ? graph.startNodes
    : stepModels.length > 0
      ? [stepModels[0].stepId]
      : [];
const startCapacityPerHour = startNodeIds
  .map((startId) => stepModels.find((step) => step.stepId === startId)?.effectiveCapacityPerHour ?? null)
  .filter((value) => typeof value === "number" && Number.isFinite(value) && value > 0)
  .reduce((sum, value) => sum + value, 0);
const releaseCapacityPerHour = startCapacityPerHour > 0 ? startCapacityPerHour : lineCapacityPerHour;
const demandRatePerHour = Number((releaseCapacityPerHour * 0.9).toFixed(4));
const throughputPerHour = Number(Math.min(demandRatePerHour, lineCapacityPerHour).toFixed(4));

const nodeMetrics = {};
const ranked = [];
let avgQueueRiskAccumulator = 0;
let totalWipQty = 0;
let worstCaseTouchTime = 0;
let totalLeadTimeMinutes = 0;
let totalExplicitLeadTimeMinutes = 0;
let leadTimeTopContributor = "n/a";
let leadTimeTopValue = -1;

for (const [index, step] of stepModels.entries()) {
  if (step.ctMinutes === null || step.effectiveCapacityPerHour === null) {
    step.baseline = {
      demandRatePerHour,
      utilization: null,
      headroom: null,
      queueRisk: null,
      bottleneckIndex: null,
      status: "unknown"
    };
    nodeMetrics[step.stepId] = {
      utilization: null,
      headroom: null,
      queueRisk: null,
      queueDepth: null,
      wipQty: null,
      completedQty: 0,
      leadTimeMinutes: step.leadTimeMinutes,
      capacityPerHour: null,
      bottleneckIndex: null,
      bottleneckFlag: false,
      status: "unknown"
    };
    continue;
  }

  const stepDemandRate = demandRatePerHour * mixModifier(index, stepModels.length, "balanced");
  const utilizationRaw = stepDemandRate / Math.max(0.001, step.effectiveCapacityPerHour);
  const utilization = clamp(utilizationRaw, 0, 1.35);
  const headroom = Math.max(0, 1 - utilizationRaw);
  const queuePressure = (utilization * utilization) / Math.max(0.08, 1 - utilization);
  const queueRisk = clamp((queuePressure * (0.5 + step.variabilityCv)) / 6.8, 0, 1);
  const queueDepth = Math.max(0, Math.max(0, utilizationRaw - 0.68) * 7 + queueRisk * 12);
  const queueDelayMinutes = (queueDepth / Math.max(0.001, step.effectiveCapacityPerHour)) * 60;
  const explicitLeadMinutes = Math.max(0, step.leadTimeMinutes ?? 0);
  const stepLeadMinutes = step.ctMinutes + queueDelayMinutes + explicitLeadMinutes;
  const wipQty =
    queueDepth + Math.max(0, stepDemandRate - step.effectiveCapacityPerHour) * BASELINE_HORIZON_HOURS;
  const shortage = clamp(utilizationRaw - 1, 0, 1);
  const bottleneckIndex = clamp(
    0.6 * (Math.min(utilizationRaw, 1.25) / 1.25) + 0.3 * queueRisk + 0.1 * shortage,
    0,
    1
  );
  const status = statusFrom(utilizationRaw, bottleneckIndex);

  step.baseline = {
    demandRatePerHour: Number(stepDemandRate.toFixed(4)),
    utilization: Number(utilization.toFixed(4)),
    headroom: Number(headroom.toFixed(4)),
    queueRisk: Number(queueRisk.toFixed(4)),
    bottleneckIndex: Number(bottleneckIndex.toFixed(4)),
    status
  };

  avgQueueRiskAccumulator += queueRisk;
  totalWipQty += wipQty;
  worstCaseTouchTime += step.ctMinutes;
  totalLeadTimeMinutes += stepLeadMinutes;
  totalExplicitLeadTimeMinutes += explicitLeadMinutes;
  ranked.push({ stepId: step.stepId, score: bottleneckIndex, capacityPerHour: step.effectiveCapacityPerHour });

  if (stepLeadMinutes > leadTimeTopValue) {
    leadTimeTopValue = stepLeadMinutes;
    leadTimeTopContributor = step.label;
  }

  nodeMetrics[step.stepId] = {
    utilization: Number(utilization.toFixed(4)),
    headroom: Number(headroom.toFixed(4)),
    queueRisk: Number(queueRisk.toFixed(4)),
    queueDepth: Number(queueDepth.toFixed(4)),
    wipQty: Number(wipQty.toFixed(4)),
    completedQty: 0,
    leadTimeMinutes: Number(stepLeadMinutes.toFixed(4)),
    capacityPerHour: Number(step.effectiveCapacityPerHour.toFixed(4)),
    bottleneckIndex: Number(bottleneckIndex.toFixed(4)),
    bottleneckFlag: false,
    status
  };
}

ranked.sort((a, b) => {
  const scoreDelta = b.score - a.score;
  if (Math.abs(scoreDelta) > 1e-9) {
    return scoreDelta;
  }
  return (a.capacityPerHour ?? Number.POSITIVE_INFINITY) - (b.capacityPerHour ?? Number.POSITIVE_INFINITY);
});
const bottleneckStepId = ranked[0]?.stepId ?? null;
if (bottleneckStepId && nodeMetrics[bottleneckStepId]) {
  nodeMetrics[bottleneckStepId].bottleneckFlag = true;
  nodeMetrics[bottleneckStepId].status = "critical";
}

const avgQueueRisk = ranked.length > 0 ? avgQueueRiskAccumulator / ranked.length : 0;
const topScore = ranked[0]?.score ?? 0;
const secondScore = ranked[1]?.score ?? 0;
const nearSatCount = Object.values(nodeMetrics).filter(
  (item) => typeof item.utilization === "number" && item.utilization >= 0.9
).length;
const cascadePressure = ranked.length > 0 ? nearSatCount / ranked.length : 0;
const wipPressure = clamp(
  totalWipQty / Math.max(1, BASELINE_HORIZON_HOURS * Math.max(1, stepModels.length) * 10),
  0,
  1
);
const brittleness = clamp(
  0.5 * topScore +
    0.18 * avgQueueRisk +
    0.16 * cascadePressure +
    0.16 * wipPressure +
    (topScore - secondScore < 0.08 ? 0.05 : 0),
  0,
  1
);
const waitSharePct =
  totalLeadTimeMinutes > 0 ? totalExplicitLeadTimeMinutes / totalLeadTimeMinutes : 0;

const compiled = {
  version: "0.3.0",
  generatedAt: new Date().toISOString(),
  metadata: {
    name: graph.metadata?.name ?? "VSM Forecast",
    units: "per-hour",
    mode: "constraint-forecast-non-des"
  },
  graph,
  inputs: [
    {
      key: "demandMultiplier",
      label: "Demand Multiplier",
      type: "number",
      defaultValue: 1,
      min: 0.6,
      max: 1.8,
      step: 0.05
    },
    {
      key: "mixProfile",
      label: "Mix Profile",
      type: "select",
      defaultValue: "balanced",
      options: ["balanced", "front-loaded", "midstream-heavy", "back-loaded"]
    },
    {
      key: "staffingMultiplier",
      label: "Staffing Multiplier",
      type: "number",
      defaultValue: 1,
      min: 0.7,
      max: 1.4,
      step: 0.05
    },
    {
      key: "equipmentMultiplier",
      label: "Equipment Multiplier",
      type: "number",
      defaultValue: 1,
      min: 0.7,
      max: 1.4,
      step: 0.05
    },
    {
      key: "unplannedDowntimePct",
      label: "Unplanned Downtime",
      type: "number",
      defaultValue: 0,
      min: 0,
      max: 35,
      step: 0.5
    },
    {
      key: "ctMultiplier",
      label: "Cycle Time Multiplier",
      type: "number",
      defaultValue: 1,
      min: 0.75,
      max: 1.6,
      step: 0.05
    },
    {
      key: "setupPenaltyMultiplier",
      label: "Setup Penalty",
      type: "number",
      defaultValue: 1,
      min: 0,
      max: 1.8,
      step: 0.05
    },
    {
      key: "variabilityMultiplier",
      label: "Variability Multiplier",
      type: "number",
      defaultValue: 1,
      min: 0.6,
      max: 1.8,
      step: 0.05
    },
    {
      key: "simulationHorizonHours",
      label: "Simulation Horizon",
      type: "select",
      defaultValue: "24",
      options: [
        { label: "8 hrs", value: "8" },
        { label: "16 hrs", value: "16" },
        { label: "24 hrs", value: "24" },
        { label: "1 week", value: "168" },
        { label: "1 month", value: "720" }
      ]
    },
    {
      key: "activeShiftCount",
      label: "Operating Shifts",
      type: "select",
      defaultValue: DEFAULT_ACTIVE_SHIFT_COUNT,
      options: [
        { label: "1 shift", value: "1" },
        { label: "2 shifts", value: "2" },
        { label: "3 shifts", value: "3" }
      ]
    },
    {
      key: "bottleneckReliefUnits",
      label: "Bottleneck Relief (+units)",
      type: "number",
      defaultValue: 1,
      min: 0,
      max: 6,
      step: 1
    },
    {
      key: "sellingPricePerUnit",
      label: "Selling Price / Unit",
      type: "number",
      defaultValue: sellingPricePerUnit,
      min: 0,
      max: 100000,
      step: 0.01
    }
  ],
  inputDefaults: {
    demandRatePerHour,
    demandMultiplier: 1,
    mixProfile: "balanced",
    staffingMultiplier: 1,
    equipmentMultiplier: 1,
    unplannedDowntimePct: 0,
    ctMultiplier: 1,
    setupPenaltyMultiplier: 1,
    variabilityMultiplier: 1,
    simulationHorizonHours: "24",
    activeShiftCount: DEFAULT_ACTIVE_SHIFT_COUNT,
    bottleneckReliefUnits: 1,
    sellingPricePerUnit
  },
  stepModels,
  baseline: {
    demandRatePerHour,
    lineCapacityPerHour: Number(lineCapacityPerHour.toFixed(4)),
    bottleneckStepId,
    globalMetrics: {
      throughput: throughputPerHour,
      globalThroughput: throughputPerHour,
      forecastThroughput: throughputPerHour,
      throughputDelta: 0,
      bottleneckMigration: "baseline only",
      bottleneckIndex: Number(topScore.toFixed(4)),
      brittleness: Number(brittleness.toFixed(4)),
      avgQueueRisk: Number(avgQueueRisk.toFixed(4)),
      totalWipQty: Number(totalWipQty.toFixed(4)),
      worstCaseTouchTime: Number(worstCaseTouchTime.toFixed(4)),
      totalLeadTimeMinutes: Number(totalLeadTimeMinutes.toFixed(4)),
      leadTimeDeltaMinutes: 0,
      waitSharePct: Number(waitSharePct.toFixed(4)),
      leadTimeTopContributor
    },
    nodeMetrics
  },
  assumptions: buildCompileAssumptions(master.assumptions, compileTexts)
};

writeJson(outputPath, compiled);

console.log(`Compiled forecast model written: ${outputPath}`);
console.log(`Steps: ${stepModels.length} | Bottleneck: ${bottleneckStepId ?? "n/a"}`);
