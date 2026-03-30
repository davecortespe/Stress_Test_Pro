import { createConstraintForecast } from "./bottleneckForecast";
import {
  DEFAULT_STEP_EQUIPMENT_RATE_PER_HOUR,
  DEFAULT_STEP_LABOR_RATE_PER_HOUR,
  DEFAULT_STEP_MATERIAL_COST_PER_UNIT,
  stepScenarioKey,
  toNumber,
  type ScenarioState
} from "../simulator/scenarioState";
import type {
  CompiledForecastModel,
  MasterData,
  ProcessingRow,
  SimulationOutput,
  ThroughputAnalysisResult,
  ThroughputAnalysisValidation,
  ThroughputEfficiencyStatus,
  ThroughputInsight,
  ThroughputProfitLossRow,
  ThroughputStepCostRow,
  ThroughputSummaryMetrics,
  ThroughputSummaryRow
} from "../types/contracts";

const HIGH_EFFICIENCY_MAX_GAIN_RATIO = 0.1;
const MEDIUM_EFFICIENCY_MAX_GAIN_RATIO = 0.25;

type StepInputField = "materialCostPerUnit" | "laborRatePerHour" | "equipmentRatePerHour";

function defaultStepInputValue(field: StepInputField): number {
  if (field === "materialCostPerUnit") {
    return DEFAULT_STEP_MATERIAL_COST_PER_UNIT;
  }
  if (field === "laborRatePerHour") {
    return DEFAULT_STEP_LABOR_RATE_PER_HOUR;
  }
  return DEFAULT_STEP_EQUIPMENT_RATE_PER_HOUR;
}

function num(value: number | string | null | undefined, fallback: number): number {
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

function formatPct(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function readOptionalNumber(value: unknown): number | null {
  const parsed = toNumber(value as number | string | undefined, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function sumOrNull(values: Array<number | null>): number | null {
  if (values.some((value) => value === null)) {
    return null;
  }
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

function sumKnown(values: Array<number | null>): number | null {
  const known = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (known.length === 0) {
    return null;
  }
  return known.reduce((sum, value) => sum + value, 0);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const lines = [headers.map(csvEscape).join(",")];
  rows.forEach((row) => {
    lines.push(row.map((value) => csvEscape(String(value))).join(","));
  });
  return `${lines.join("\n")}\n`;
}

function efficiencyStatusFromGainRatio(gainRatio: number): ThroughputEfficiencyStatus {
  if (gainRatio <= HIGH_EFFICIENCY_MAX_GAIN_RATIO) {
    return "high";
  }
  if (gainRatio <= MEDIUM_EFFICIENCY_MAX_GAIN_RATIO) {
    return "medium";
  }
  return "low";
}

function efficiencyLabel(status: ThroughputEfficiencyStatus): "High" | "Medium" | "Low" {
  if (status === "high") {
    return "High";
  }
  if (status === "medium") {
    return "Medium";
  }
  return "Low";
}

function getStepLabels(model: CompiledForecastModel): Map<string, string> {
  return new Map(model.stepModels.map((step) => [step.stepId, step.label]));
}

function getProcessingMap(masterData: MasterData): Map<string, ProcessingRow> {
  return new Map((masterData.processing ?? []).map((row) => [row.stepId, row]));
}

function resolveInputValue(
  scenario: ScenarioState,
  processing: ProcessingRow | undefined,
  stepId: string,
  field: StepInputField
): number | null {
  const override = readOptionalNumber(scenario[stepScenarioKey(stepId, field)]);
  if (override !== null) {
    return Math.max(0, override);
  }

  const rawDefault = processing?.[field];
  if (typeof rawDefault === "number" && Number.isFinite(rawDefault)) {
    return Math.max(0, rawDefault);
  }

  return defaultStepInputValue(field);
}

function stepTimeHoursPerUnit(effectiveCtMinutes: number | null, effectiveUnits: number | null): number | null {
  if (
    typeof effectiveCtMinutes !== "number" ||
    !Number.isFinite(effectiveCtMinutes) ||
    effectiveCtMinutes <= 0 ||
    typeof effectiveUnits !== "number" ||
    !Number.isFinite(effectiveUnits) ||
    effectiveUnits <= 0
  ) {
    return null;
  }
  return effectiveCtMinutes / effectiveUnits / 60;
}

function buildStepRows(
  model: CompiledForecastModel,
  masterData: MasterData,
  scenario: ScenarioState
): ThroughputStepCostRow[] {
  const processingByStepId = getProcessingMap(masterData);
  const constraint = createConstraintForecast(model, scenario);
  return model.stepModels.map((step) => {
    const processing = processingByStepId.get(step.stepId);
    const materialCost = resolveInputValue(scenario, processing, step.stepId, "materialCostPerUnit");
    const laborRatePerHour = resolveInputValue(scenario, processing, step.stepId, "laborRatePerHour");
    const equipmentRatePerHour = resolveInputValue(
      scenario,
      processing,
      step.stepId,
      "equipmentRatePerHour"
    );
    const stepEval = constraint.baseline.stepEvals[step.stepId];
    const timeHoursPerUnit = stepTimeHoursPerUnit(
      stepEval?.effectiveCtMinutes ?? null,
      stepEval?.effectiveUnits ?? null
    );
    const baselineCapacityUnits = Math.max(1, Math.round(step.effectiveUnits));
    const currentCapacityUnits = Math.max(
      1,
      Math.round(stepEval?.effectiveUnits ?? step.effectiveUnits)
    );
    const addedFteCount = Math.max(0, currentCapacityUnits - baselineCapacityUnits);
    const baselineTimeHoursPerUnit = stepTimeHoursPerUnit(
      step.effectiveCtMinutes ?? step.ctMinutes ?? null,
      baselineCapacityUnits
    );
    const addedFteLaborCostPerUnit =
      laborRatePerHour !== null && baselineTimeHoursPerUnit !== null
        ? addedFteCount * laborRatePerHour * baselineTimeHoursPerUnit
        : null;
    const laborCostPerUnit =
      laborRatePerHour !== null && timeHoursPerUnit !== null
        ? laborRatePerHour * timeHoursPerUnit + (addedFteLaborCostPerUnit ?? 0)
        : null;
    const equipmentCostPerUnit =
      equipmentRatePerHour !== null && timeHoursPerUnit !== null
        ? equipmentRatePerHour * timeHoursPerUnit
        : null;
    const totalStepCost =
      materialCost !== null && laborCostPerUnit !== null && equipmentCostPerUnit !== null
        ? materialCost + laborCostPerUnit + equipmentCostPerUnit
        : null;

    return {
      stepId: step.stepId,
      stepName: step.label,
      materialCost,
      laborRatePerHour,
      equipmentRatePerHour,
      addedFteCount,
      addedFteLaborCostPerUnit,
      laborCostPerUnit,
      equipmentCostPerUnit,
      totalStepCost,
      hasMissingCosts:
        materialCost === null ||
        laborRatePerHour === null ||
        equipmentRatePerHour === null ||
        timeHoursPerUnit === null
    };
  });
}

function getPrimaryBottleneckId(
  output: SimulationOutput,
  fallbackStepId: string
): string {
  const flagged = Object.entries(output.nodeMetrics).find(([, metrics]) => metrics.bottleneckFlag)?.[0];
  return flagged ?? fallbackStepId;
}

function getNextBottleneckId(
  primaryStepId: string,
  baselineSorted: Array<{ stepId: string; score: number }>,
  reliefSorted: Array<{ stepId: string; score: number }>
): string {
  const reliefCandidate = reliefSorted.find((row) => row.stepId !== primaryStepId)?.stepId;
  if (reliefCandidate) {
    return reliefCandidate;
  }
  return baselineSorted.find((row) => row.stepId !== primaryStepId)?.stepId ?? primaryStepId;
}

function buildValidations(
  sellingPrice: number | null,
  stepRows: ThroughputStepCostRow[],
  bottleneckTimePerUnit: number | null,
  nextConstraintThroughput: number | null
): ThroughputAnalysisValidation[] {
  const validations: ThroughputAnalysisValidation[] = [];

  if (sellingPrice === null || sellingPrice <= 0) {
    validations.push({
      code: "selling-price-missing",
      severity: "error",
      metricKey: "sellingPrice",
      message: "Add transfer price per unit before this report can calculate throughput and margin."
    });
  }

  const missingMaterial = stepRows.filter((row) => row.materialCost === null);
  if (missingMaterial.length > 0) {
    validations.push({
      code: "material-cost-missing",
      severity: "error",
      metricKey: "materialCostPerUnit",
      message: `Add material cost for: ${missingMaterial.map((row) => row.stepName).join(", ")}.`
    });
  }

  const missingLabor = stepRows.filter((row) => row.laborRatePerHour === null);
  if (missingLabor.length > 0) {
    validations.push({
      code: "labor-rate-missing",
      severity: "warning",
      metricKey: "laborCostPerUnit",
      message: `Add labor rate for: ${missingLabor.map((row) => row.stepName).join(", ")}.`
    });
  }

  const missingEquipment = stepRows.filter((row) => row.equipmentRatePerHour === null);
  if (missingEquipment.length > 0) {
    validations.push({
      code: "equipment-rate-missing",
      severity: "warning",
      metricKey: "equipmentCostPerUnit",
      message: `Add equipment rate for: ${missingEquipment.map((row) => row.stepName).join(", ")}.`
    });
  }

  const missingStepTime = stepRows.filter(
    (row) => (row.laborRatePerHour !== null || row.equipmentRatePerHour !== null) &&
      (row.laborCostPerUnit === null || row.equipmentCostPerUnit === null)
  );
  if (missingStepTime.length > 0) {
    validations.push({
      code: "step-time-missing",
      severity: "error",
      metricKey: "bottleneckTimePerUnit",
      message: `Labor and equipment cost per unit cannot be calculated until valid step time exists for: ${missingStepTime
        .map((row) => row.stepName)
        .join(", ")}.`
    });
  }

  if (bottleneckTimePerUnit === null || bottleneckTimePerUnit <= 0) {
    validations.push({
      code: "bottleneck-time-invalid",
      severity: "error",
      metricKey: "bottleneckTimePerUnit",
      message: "Per-bottleneck-minute results are blocked because the active bottleneck time or parallel capacity is not valid."
    });
  }

  if (nextConstraintThroughput === null || nextConstraintThroughput <= 0) {
    validations.push({
      code: "next-constraint-missing",
      severity: "error",
      metricKey: "estimatedGainUnits",
      message: "The expected gain cannot be estimated because the next limiting step could not be determined."
    });
  }

  return validations;
}

function buildInsights(args: {
  summary: ThroughputSummaryMetrics;
  stepRows: ThroughputStepCostRow[];
  validations: ThroughputAnalysisValidation[];
}): ThroughputInsight[] {
  const { summary, stepRows, validations } = args;
  const blockingErrors = validations.filter((validation) => validation.severity === "error");
  if (blockingErrors.length > 0) {
    return [
      {
        finding: "This throughput report is not ready yet.",
        impactEstimate: `${blockingErrors.length} required input issue(s) must be fixed before the numbers can be trusted.`,
        recommendedAction: "Add transfer price and any missing step costs, then review this report again."
      }
    ];
  }

  const topCostStep =
    stepRows
      .filter((row) => row.totalStepCost !== null)
      .sort((a, b) => (b.totalStepCost ?? 0) - (a.totalStepCost ?? 0))[0] ?? null;
  const gainPercent = summary.estimatedGainPercent ?? 0;
  const gainDollars = summary.estimatedGainDollars ?? 0;

  return [
    {
      finding: `${summary.primaryBottleneck} is the step holding back output right now.`,
      impactEstimate: `If that step is improved, output changes by ${formatPct(gainPercent, 1)} and adds about ${formatCurrency(gainDollars)} in throughput value for each hour of added output.`,
      recommendedAction: `Start the next improvement at ${summary.primaryBottleneck}, then confirm whether the limit moves to ${summary.nextBottleneck}.`
    },
    {
      finding: `If the current bottleneck is relieved, ${summary.nextBottleneck} becomes the next limit.`,
      impactEstimate: `Projected output rises from ${(summary.currentThroughput ?? 0).toFixed(3)} to ${(summary.improvedThroughput ?? 0).toFixed(3)} units/hr before the next limit is hit.`,
      recommendedAction: "Treat this as a targeted fix, not a broad capacity increase across every step."
    },
    {
      finding: topCostStep ? `${topCostStep.stepName} is the highest-cost step per unit.` : "Step-level cost detail is still limited.",
      impactEstimate: topCostStep
        ? `That step adds about ${formatCurrency(topCostStep.totalStepCost ?? 0)} per unit.`
        : "Some step costs are still missing, so the cost ranking is not complete.",
      recommendedAction: topCostStep
        ? `Review material cost and hourly labor and equipment rates at ${topCostStep.stepName} before making pricing or margin decisions.`
        : "Fill in the missing step cost fields to complete the cost view."
    }
  ];
}

function scaleByCompletedUnits(value: number | null, completedUnits: number | null): number | null {
  if (
    value === null ||
    completedUnits === null ||
    !Number.isFinite(value) ||
    !Number.isFinite(completedUnits) ||
    completedUnits < 0
  ) {
    return null;
  }
  return value * completedUnits;
}

function scaleByWholeLots(value: number | null, completedUnits: number | null): number | null {
  if (
    value === null ||
    completedUnits === null ||
    !Number.isFinite(value) ||
    !Number.isFinite(completedUnits) ||
    completedUnits < 0
  ) {
    return null;
  }
  return value * Math.floor(completedUnits);
}

export function buildThroughputAnalysis(
  model: CompiledForecastModel,
  masterData: MasterData,
  scenario: ScenarioState,
  output: SimulationOutput
) : ThroughputAnalysisResult {
  const stepLabelById = getStepLabels(model);
  const constraint = createConstraintForecast(model, scenario);
  const primaryStepId = getPrimaryBottleneckId(output, constraint.baseline.bottleneckStepId);
  const nextStepId = getNextBottleneckId(
    primaryStepId,
    constraint.baseline.sortedByBottleneck,
    constraint.relief.sortedByBottleneck
  );

  const stepRows = buildStepRows(model, masterData, scenario);
  const sellingPriceRaw = readOptionalNumber(scenario.sellingPricePerUnit);
  const sellingPriceDefault = readOptionalNumber(masterData.economicsDefaults?.sellingPricePerUnit);
  const sellingPrice = sellingPriceRaw ?? sellingPriceDefault;

  const materialCostPerUnit = sumOrNull(stepRows.map((row) => row.materialCost));
  const laborCostPerUnit = sumOrNull(stepRows.map((row) => row.laborCostPerUnit));
  const equipmentCostPerUnit = sumOrNull(stepRows.map((row) => row.equipmentCostPerUnit));
  const tocThroughputPerUnit =
    sellingPrice !== null && materialCostPerUnit !== null ? sellingPrice - materialCostPerUnit : null;
  const fullyLoadedProfitPerUnit =
    sellingPrice !== null &&
    materialCostPerUnit !== null &&
    laborCostPerUnit !== null &&
    equipmentCostPerUnit !== null
      ? sellingPrice - materialCostPerUnit - laborCostPerUnit - equipmentCostPerUnit
      : null;

  const primaryEval = constraint.baseline.stepEvals[primaryStepId];
  const nextConstraintThroughput =
    Number.isFinite(constraint.relief.throughput) && constraint.relief.throughput > 0
      ? constraint.relief.throughput
      : null;
  const currentThroughput = num(
    output.globalMetrics.forecastThroughput as number | string | undefined,
    constraint.baseline.throughput
  );
  const completedUnits = readOptionalNumber(output.globalMetrics.totalCompletedOutputPieces);
  const estimatedGainUnits =
    nextConstraintThroughput !== null ? Math.max(0, nextConstraintThroughput - currentThroughput) : null;
  const estimatedGainPercent =
    estimatedGainUnits !== null && currentThroughput > 0 ? estimatedGainUnits / currentThroughput : null;
  const estimatedGainDollars =
    estimatedGainUnits !== null && tocThroughputPerUnit !== null
      ? estimatedGainUnits * tocThroughputPerUnit
      : null;

  const bottleneckTimePerUnit =
    primaryEval?.effectiveCtMinutes !== null &&
    primaryEval?.effectiveCtMinutes !== undefined &&
    primaryEval.effectiveUnits !== null &&
    primaryEval.effectiveUnits !== undefined &&
    primaryEval.effectiveUnits > 0
      ? primaryEval.effectiveCtMinutes / primaryEval.effectiveUnits
      : null;
  const tocThroughputPerBottleneckMinute =
    tocThroughputPerUnit !== null && bottleneckTimePerUnit !== null && bottleneckTimePerUnit > 0
      ? tocThroughputPerUnit / bottleneckTimePerUnit
      : null;

  const gainRatioToNextConstraint =
    estimatedGainUnits !== null && nextConstraintThroughput !== null && nextConstraintThroughput > 0
      ? estimatedGainUnits / nextConstraintThroughput
      : 0;
  const efficiencyStatus = efficiencyStatusFromGainRatio(gainRatioToNextConstraint);

  const validations = buildValidations(
    sellingPrice,
    stepRows,
    bottleneckTimePerUnit,
    nextConstraintThroughput
  );
  const hasBlockingErrors = validations.some((validation) => validation.severity === "error");

  const productFamilyLabel = masterData.products[0]?.family ?? null;
  const partialMaterialCostPerUnit = sumKnown(stepRows.map((row) => row.materialCost));
  const partialLaborCostPerUnit = sumKnown(stepRows.map((row) => row.laborCostPerUnit));
  const partialEquipmentCostPerUnit = sumKnown(stepRows.map((row) => row.equipmentCostPerUnit));
  const salesTotal = scaleByWholeLots(sellingPrice, completedUnits);
  const materialTotal = scaleByCompletedUnits(partialMaterialCostPerUnit, completedUnits);
  const laborTotal = scaleByCompletedUnits(partialLaborCostPerUnit, completedUnits);
  const equipmentTotal = scaleByCompletedUnits(partialEquipmentCostPerUnit, completedUnits);
  const finalRevenueTotal =
    salesTotal !== null
      ? salesTotal - (materialTotal ?? 0) - (laborTotal ?? 0) - (equipmentTotal ?? 0)
      : null;
  const summary: ThroughputSummaryMetrics = {
    sellingPrice: sellingPrice ?? null,
    materialCostPerUnit,
    laborCostPerUnit,
    equipmentCostPerUnit,
    tocThroughputPerUnit,
    fullyLoadedProfitPerUnit,
    primaryBottleneck: stepLabelById.get(primaryStepId) ?? primaryStepId,
    bottleneckTimePerUnit,
    tocThroughputPerBottleneckMinute,
    nextBottleneck: stepLabelById.get(nextStepId) ?? nextStepId,
    estimatedGainUnits,
    estimatedGainDollars,
    estimatedGainPercent,
    currentThroughput,
    improvedThroughput: nextConstraintThroughput,
    efficiencyStatus
  };

  const profitLossRows: ThroughputProfitLossRow[] = [
    {
      key: "sales",
      label: "Total transfer price",
      total: salesTotal
    },
    {
      key: "material-cost",
      label: "Total material",
      total: materialTotal
    },
    {
      key: "labor-cost",
      label: "Total labor",
      total: laborTotal
    },
    {
      key: "equipment-cost",
      label: "Total equipment",
      total: equipmentTotal
    },
    {
      key: "fully-loaded-profit",
      label: "Final rev.",
      total: finalRevenueTotal
    }
  ];

  const summaryRows: ThroughputSummaryRow[] = [
    { key: "sellingPrice", label: "Transfer price", value: summary.sellingPrice, format: "currency" },
    {
      key: "materialCostPerUnit",
      label: "Material cost per unit",
      value: summary.materialCostPerUnit,
      format: "currency"
    },
    {
      key: "laborCostPerUnit",
      label: "Labor cost per unit",
      value: summary.laborCostPerUnit,
      format: "currency"
    },
    {
      key: "equipmentCostPerUnit",
      label: "Equipment cost per unit",
      value: summary.equipmentCostPerUnit,
      format: "currency"
    },
    {
      key: "tocThroughputPerUnit",
      label: "Throughput value per unit",
      value: summary.tocThroughputPerUnit,
      format: "currency"
    },
    {
      key: "fullyLoadedProfitPerUnit",
      label: "Profit per unit",
      value: summary.fullyLoadedProfitPerUnit,
      format: "currency"
    },
    { key: "primaryBottleneck", label: "Current bottleneck", value: summary.primaryBottleneck, format: "text" },
    {
      key: "bottleneckTimePerUnit",
      label: "Time at bottleneck per unit",
      value: summary.bottleneckTimePerUnit,
      format: "duration"
    },
    {
      key: "tocThroughputPerBottleneckMinute",
      label: "Throughput value per bottleneck minute",
      value: summary.tocThroughputPerBottleneckMinute,
      format: "currency"
    },
    { key: "nextBottleneck", label: "Next limit if fixed", value: summary.nextBottleneck, format: "text" },
    {
      key: "estimatedGainUnits",
      label: "More output if bottleneck is fixed",
      value: summary.estimatedGainUnits,
      format: "number",
      decimals: 3
    },
    {
      key: "estimatedGainDollars",
      label: "More throughput dollars",
      value: summary.estimatedGainDollars,
      format: "currency"
    },
    {
      key: "estimatedGainPercent",
      label: "Output gain percent",
      value: summary.estimatedGainPercent,
      format: "percent",
      decimals: 1
    },
    {
      key: "efficiencyStatus",
      label: "Improvement headroom",
      value: efficiencyLabel(summary.efficiencyStatus),
      format: "text"
    }
  ];

  return {
    scenarioLabel: model.metadata.name || "Current Scenario",
    productFamilyLabel,
    efficiencyStatus,
    efficiencyLabel: efficiencyLabel(efficiencyStatus),
    validations,
    hasBlockingErrors,
    summary,
    summaryRows,
    stepRows,
    profitLossRows,
    insights: buildInsights({ summary, stepRows, validations })
  };
}

export function buildThroughputSummaryCsv(result: ThroughputAnalysisResult): string {
  const headers = [
    "Scenario Label",
    "Product Family",
    "Transfer Price",
    "Material Cost Per Unit",
    "Labor Cost Per Unit",
    "Equipment Cost Per Unit",
    "TOC Throughput Per Unit",
    "Fully Loaded Profit Per Unit",
    "Primary Bottleneck",
    "Bottleneck Time Per Unit",
    "TOC Throughput Per Bottleneck Minute",
    "Next Bottleneck",
    "Estimated Gain Units",
    "Estimated Gain Dollars",
    "Estimated Gain Percent",
    "Efficiency Status"
  ];

  return toCsv(headers, [
    [
      result.scenarioLabel,
      result.productFamilyLabel ?? "",
      result.summary.sellingPrice ?? "",
      result.summary.materialCostPerUnit ?? "",
      result.summary.laborCostPerUnit ?? "",
      result.summary.equipmentCostPerUnit ?? "",
      result.summary.tocThroughputPerUnit ?? "",
      result.summary.fullyLoadedProfitPerUnit ?? "",
      result.summary.primaryBottleneck,
      result.summary.bottleneckTimePerUnit ?? "",
      result.summary.tocThroughputPerBottleneckMinute ?? "",
      result.summary.nextBottleneck,
      result.summary.estimatedGainUnits ?? "",
      result.summary.estimatedGainDollars ?? "",
      result.summary.estimatedGainPercent ?? "",
      result.efficiencyLabel
    ]
  ]);
}

export function buildThroughputStepCsv(result: ThroughputAnalysisResult): string {
  return toCsv(
    [
      "Step Name",
      "Material Cost Per Unit",
      "Labor Rate Per Hour",
      "Added FTEs",
      "Added FTE Labor Per Unit",
      "Labor Cost Per Unit",
      "Equipment Rate Per Hour",
      "Equipment Cost Per Unit",
      "Total Step Cost Per Unit",
      "Missing Costs"
    ],
    result.stepRows.map((row) => [
      row.stepName,
      row.materialCost ?? "",
      row.laborRatePerHour ?? "",
      row.addedFteCount,
      row.addedFteLaborCostPerUnit ?? "",
      row.laborCostPerUnit ?? "",
      row.equipmentRatePerHour ?? "",
      row.equipmentCostPerUnit ?? "",
      row.totalStepCost ?? "",
      row.hasMissingCosts ? "yes" : "no"
    ])
  );
}
