import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const activeDir = args[0] ?? path.join("models", "active");
const graphPath = path.join(activeDir, "vsm_graph.json");
const masterPath = path.join(activeDir, "master_data.json");
const outputPath = path.join(activeDir, "compiled_forecast_model.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toNumber(value, fallback = Number.NaN) {
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

function stationUnits(raw) {
  if (typeof raw !== "string") {
    return null;
  }
  const match = raw.match(/station\s*=\s*(\d+)/i);
  if (!match) {
    return null;
  }
  const units = Number(match[1]);
  return Number.isFinite(units) && units > 0 ? units : null;
}

function parseLeadTimeText(raw) {
  if (typeof raw !== "string") {
    return null;
  }
  const input = raw.trim().toLowerCase();
  if (input.length === 0) {
    return null;
  }

  const match = input.match(/([0-9]+(?:\.[0-9]+)?)\s*(day|days|d|hour|hours|hr|hrs|h|min|mins|minute|minutes|m)\b/);
  if (!match) {
    return null;
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
  return toNumber(step?.ct?.params?.value, Number.NaN);
}

function changeoverMinutesOf(step) {
  return toNumber(step?.changeover?.time?.params?.value, Number.NaN);
}

function leadTimeMinutesOf(step) {
  const explicit = toNumber(step?.leadTimeMinutes, Number.NaN);
  if (Number.isFinite(explicit) && explicit >= 0) {
    return explicit;
  }
  const fromWaitRaw = parseLeadTimeText(step?.wait?.raw);
  if (fromWaitRaw !== null) {
    return fromWaitRaw;
  }
  return null;
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

const graph = readJson(graphPath);
const master = readJson(masterPath);
const LOT_SIZE_ASSUMPTION = 40;
const DEFAULT_VARIABILITY_CV = 0.18;
const sellingPricePerUnit =
  typeof master?.economicsDefaults?.sellingPricePerUnit === "number" &&
  Number.isFinite(master.economicsDefaults.sellingPricePerUnit)
    ? master.economicsDefaults.sellingPricePerUnit
    : Array.isArray(master?.products)
      ? Number(
          (
            master.products.find(
              (product) =>
                typeof product?.sellingPricePerUnit === "number" &&
                Number.isFinite(product.sellingPricePerUnit)
            )?.sellingPricePerUnit ?? 0
          ).toFixed(2)
        )
      : 0;

const processingByStepId = new Map((master.processing ?? []).map((row) => [row.stepId, row]));

const stepModels = (graph.nodes ?? []).map((node) => {
  const processing = processingByStepId.get(node.id) ?? {};
  const workers = toNumber(processing.workers, 0);
  const ctMinutesRaw = ctMinutesOf(processing);
  const ctMinutes = Number.isFinite(ctMinutesRaw) && ctMinutesRaw > 0 ? ctMinutesRaw : null;

  const changeoverMinutesRaw = changeoverMinutesOf(processing);
  const changeoverMinutes =
    Number.isFinite(changeoverMinutesRaw) && changeoverMinutesRaw >= 0 ? changeoverMinutesRaw : null;
  const changeoverPenaltyPerUnitMinutes =
    typeof changeoverMinutes === "number" ? changeoverMinutes / LOT_SIZE_ASSUMPTION : null;

  const leadTimeMinutesRaw = leadTimeMinutesOf(processing);
  const leadTimeMinutes =
    typeof leadTimeMinutesRaw === "number" && Number.isFinite(leadTimeMinutesRaw) && leadTimeMinutesRaw >= 0
      ? Number(leadTimeMinutesRaw.toFixed(4))
      : null;

  const inferredStationUnits = stationUnits(processing.stationRaw);
  const effectiveUnits = Math.max(0.5, inferredStationUnits ?? (workers > 0 ? workers : 1));
  const variabilityCv = DEFAULT_VARIABILITY_CV;

  const effectiveCtMinutes =
    ctMinutes === null ? null : Math.max(0.05, ctMinutes + (changeoverPenaltyPerUnitMinutes ?? 0));
  const effectiveCapacityPerHour =
    effectiveCtMinutes === null ? null : (effectiveUnits * 60) / Math.max(0.05, effectiveCtMinutes);

  return {
    stepId: node.id,
    label: node.label,
    equipmentType: processing.equipmentType ?? null,
    workerCount: workers > 0 ? workers : 0,
    parallelProcedures: 1,
    effectiveUnits: Number(effectiveUnits.toFixed(3)),
    ctMinutes,
    changeoverMinutes,
    changeoverPenaltyPerUnitMinutes:
      changeoverPenaltyPerUnitMinutes === null ? null : Number(changeoverPenaltyPerUnitMinutes.toFixed(4)),
    leadTimeMinutes,
    variabilityCv,
    effectiveCtMinutes: effectiveCtMinutes === null ? null : Number(effectiveCtMinutes.toFixed(4)),
    effectiveCapacityPerHour:
      effectiveCapacityPerHour === null ? null : Number(effectiveCapacityPerHour.toFixed(4)),
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
const demandRatePerHour = Number((lineCapacityPerHour * 0.9).toFixed(4));
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

for (const step of stepModels) {
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

  const utilizationRaw = demandRatePerHour / Math.max(0.001, step.effectiveCapacityPerHour);
  const utilization = clamp(utilizationRaw, 0, 1.35);
  const headroom = Math.max(0, 1 - utilizationRaw);
  const queuePressure = (utilization * utilization) / Math.max(0.08, 1 - utilization);
  const queueRisk = clamp((queuePressure * (0.48 + step.variabilityCv)) / 6.4, 0, 1);
  const queueDepth = Math.max(0, Math.max(0, utilizationRaw - 0.7) * 7 + queueRisk * 12);
  const queueDelayMinutes = (queueDepth / Math.max(0.001, step.effectiveCapacityPerHour)) * 60;
  const explicitLeadMinutes = Math.max(0, step.leadTimeMinutes ?? 0);
  const stepLeadMinutes = step.ctMinutes + queueDelayMinutes + explicitLeadMinutes;

  const wipQty = queueDepth + Math.max(0, demandRatePerHour - step.effectiveCapacityPerHour) * 8;
  const shortage = clamp(utilizationRaw - 1, 0, 1);
  const bottleneckIndex = clamp(
    0.62 * (Math.min(utilizationRaw, 1.25) / 1.25) + 0.28 * queueRisk + 0.1 * shortage,
    0,
    1
  );
  const status = statusFrom(utilizationRaw, bottleneckIndex);

  step.baseline = {
    demandRatePerHour,
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
  ranked.push({ stepId: step.stepId, score: bottleneckIndex });

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

ranked.sort((a, b) => b.score - a.score);
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
const wipPressure = clamp(totalWipQty / Math.max(1, 8 * Math.max(1, stepModels.length) * 10), 0, 1);
const brittleness = clamp(
  0.52 * topScore +
    0.18 * avgQueueRisk +
    0.15 * cascadePressure +
    0.15 * wipPressure +
    (topScore - secondScore < 0.08 ? 0.05 : 0),
  0,
  1
);
const waitSharePct =
  totalLeadTimeMinutes > 0 ? totalExplicitLeadTimeMinutes / totalLeadTimeMinutes : 0;

const compiled = {
  version: "0.2.0",
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
      options: ["balanced", "station-1-heavy", "final-step-heavy"]
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
      defaultValue: 7,
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
      min: 0.5,
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
      defaultValue: "8",
      options: [
        { label: "8 hrs", value: "8" },
        { label: "16 hrs", value: "16" },
        { label: "24 hrs", value: "24" },
        { label: "1 week", value: "168" },
        { label: "1 month", value: "720" }
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
    unplannedDowntimePct: 7,
    ctMultiplier: 1,
    setupPenaltyMultiplier: 1,
    variabilityMultiplier: 1,
    simulationHorizonHours: "8",
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
  assumptions: [
    {
      id: "compile-001",
      severity: "warning",
      text: "Demand rate is not shown in the VSM image; baseline demandRatePerHour is set to 90% of computed line capacity."
    },
    {
      id: "compile-002",
      severity: "warning",
      text: "Station=n text is interpreted as effective parallel units during forecast compilation."
    },
    {
      id: "compile-003",
      severity: "warning",
      text: "A lot-size assumption of 40 units is used to convert visible C/O minutes into per-unit setup penalty."
    },
    {
      id: "compile-004",
      severity: "warning",
      text: "Where C/O is null or ambiguous in strict transcription, setup penalty contribution is set to zero in forecast equations."
    },
    {
      id: "compile-005",
      severity: "warning",
      text: "Default variability CV is set to 0.18 for all steps because step-level variability is not shown in the image."
    },
    {
      id: "compile-006",
      severity: "warning",
      text: "Step lead time values not visible in the image are stored as null in master data and treated as 0 minutes in aggregate lead-time calculations."
    },
    {
      id: "compile-007",
      severity: "info",
      text: "Queue risk, bottleneck index, brittleness, and migration outputs are deterministic non-DES heuristics for rapid forecast recompute."
    }
  ]
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(compiled, null, 2), "utf8");

console.log(`Compiled forecast model written: ${outputPath}`);
console.log(`Steps: ${stepModels.length} | Bottleneck: ${bottleneckStepId ?? "n/a"}`);
