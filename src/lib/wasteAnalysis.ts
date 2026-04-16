import { createConstraintForecast, type ConstraintStepEval } from "./bottleneckForecast";
import { stepScenarioKey, toNumber, type ScenarioState } from "../simulator/scenarioState";
import type {
  CompiledForecastModel,
  SimulationOutput,
  WasteAnalysisResult,
  WasteAnalysisValidation,
  WasteInsight,
  WasteStepRow,
  WasteSummaryMetrics,
  WasteSummaryRow
} from "../types/contracts";

type OutputNodeMetrics = SimulationOutput["nodeMetrics"][string];

interface ResolvedComparisonTimes {
  comparisonCtMinutes: number | null;
  comparisonLtMinutes: number | null;
  usedCtFallback: boolean;
  usedLtFallback: boolean;
  missingBoth: boolean;
  ltBelowCt: boolean;
}

function readOptionalNumber(value: unknown): number | null {
  const parsed = toNumber(value as number | string | undefined, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function finitePositive(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function finiteNonNegative(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
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

function sumKnown(values: Array<number | null>): number | null {
  const known = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (known.length === 0) {
    return null;
  }
  return known.reduce((sum, value) => sum + value, 0);
}

function routeWeightForStep(stepEval: ConstraintStepEval | undefined, lineDemand: number): number {
  const stepDemand = Math.max(0, finiteNonNegative(stepEval?.demandRatePerHour) ?? 0);
  if (!Number.isFinite(lineDemand) || lineDemand <= 0) {
    return 0;
  }
  return stepDemand / lineDemand;
}

function resolveWasteComparisonTimes(args: {
  stepId: string;
  stepCtMinutes: number | null;
  stepEffectiveCtMinutes: number | null;
  stepLeadTimeMinutes: number | null;
  scenario: ScenarioState;
  stepEval?: ConstraintStepEval;
  nodeMetrics?: OutputNodeMetrics;
}): ResolvedComparisonTimes {
  const scenarioLeadOverride = finiteNonNegative(
    readOptionalNumber(args.scenario[stepScenarioKey(args.stepId, "leadTimeMinutes")])
  );
  const runtimeLt = finiteNonNegative(args.nodeMetrics?.leadTimeMinutes ?? null);
  const compiledLt = finiteNonNegative(args.stepLeadTimeMinutes);
  const baseLt = runtimeLt ?? scenarioLeadOverride ?? compiledLt;

  const scenarioCt = finitePositive(args.stepEval?.effectiveCtMinutes ?? null);
  const compiledEffectiveCt = finitePositive(args.stepEffectiveCtMinutes);
  const rawCt = finitePositive(args.stepCtMinutes);
  const baseCt = scenarioCt ?? compiledEffectiveCt ?? rawCt;

  const comparisonCtMinutes = baseCt ?? baseLt ?? null;
  const comparisonLtMinutes = baseLt ?? baseCt ?? null;
  const missingBoth = comparisonCtMinutes === null || comparisonLtMinutes === null;
  const usedCtFallback = baseCt === null && baseLt !== null;
  const usedLtFallback = baseLt === null && baseCt !== null;
  const ltBelowCt =
    !missingBoth &&
    comparisonLtMinutes !== null &&
    comparisonCtMinutes !== null &&
    comparisonLtMinutes + 1e-9 < comparisonCtMinutes;

  return {
    comparisonCtMinutes,
    comparisonLtMinutes,
    usedCtFallback,
    usedLtFallback,
    missingBoth,
    ltBelowCt
  };
}

function buildValidations(stepRows: WasteStepRow[]): WasteAnalysisValidation[] {
  const validations: WasteAnalysisValidation[] = [];
  const missingBoth = stepRows.filter((row) => row.missingBoth);
  const fallbackRows = stepRows.filter((row) => row.usedCtFallback || row.usedLtFallback);
  const ltBelowCtRows = stepRows.filter((row) => row.ltBelowCt);

  missingBoth.forEach((row) => {
    validations.push({
      code: "waste-time-missing",
      severity: "error",
      stepId: row.stepId,
      metricKey: "comparisonTimes",
      message: `${row.stepName} is not included in waste totals because both CT and LT are missing.`
    });
  });

  fallbackRows.forEach((row) => {
    const copiedField = row.usedCtFallback ? "CT" : "LT";
    const sourceField = row.usedCtFallback ? "LT" : "CT";
    validations.push({
      code: row.usedCtFallback ? "waste-ct-fallback" : "waste-lt-fallback",
      severity: "warning",
      stepId: row.stepId,
      metricKey: copiedField,
      message: `${row.stepName} is using ${sourceField} as a stand-in for ${copiedField} because one time is missing.`
    });
  });

  ltBelowCtRows.forEach((row) => {
    validations.push({
      code: "waste-lt-below-ct",
      severity: "warning",
      stepId: row.stepId,
      metricKey: "comparisonLtMinutes",
      message: `${row.stepName} shows LT below CT. Waste is forced to zero, but the source data should be checked.`
    });
  });

  return validations;
}

function buildInsights(args: {
  summary: WasteSummaryMetrics;
  stepRows: WasteStepRow[];
  validations: WasteAnalysisValidation[];
}): WasteInsight[] {
  const { summary, stepRows, validations } = args;
  const blockingErrors = validations.filter((validation) => validation.severity === "error");
  if (blockingErrors.length > 0) {
    return [
      {
        finding: "This waste report is not complete yet.",
        impactEstimate: `${blockingErrors.length} step(s) are being left out of the total because required time data is missing.`,
        recommendedAction: "Fill in CT or LT for the flagged steps, or confirm the fallback assumption if that is intended."
      }
    ];
  }

  const byWeightedWaste = [...stepRows]
    .filter((row) => row.weightedWasteMinutes !== null)
    .sort((a, b) => (b.weightedWasteMinutes ?? 0) - (a.weightedWasteMinutes ?? 0));
  const byWastePct = [...stepRows]
    .filter((row) => row.wastePct !== null)
    .sort((a, b) => (b.wastePct ?? 0) - (a.wastePct ?? 0));
  const mirroredFallback = [...stepRows]
    .filter((row) => row.usedCtFallback || row.usedLtFallback)
    .sort((a, b) => (b.weightedLtMinutes ?? 0) - (a.weightedLtMinutes ?? 0))[0] ?? null;
  const inconsistentSteps = stepRows.filter((row) => row.ltBelowCt);

  return [
    {
      finding:
        byWeightedWaste[0]
          ? `${byWeightedWaste[0].stepName} is adding the most delay to the overall flow.`
          : "Weighted delay is not available yet.",
      impactEstimate:
        summary.totalWasteMinutes !== null
          ? `Across the current flow mix, total weighted delay is ${summary.totalWasteMinutes.toFixed(2)} minutes.`
          : "Total line delay cannot be calculated until comparison times are available.",
      recommendedAction:
        byWeightedWaste[0]
          ? `Reduce waiting, queue, batching, or hold time at ${byWeightedWaste[0].stepName} before working on lower-impact steps.`
          : "Add CT and LT for the active path first."
    },
    {
      finding:
        byWastePct[0]
          ? `${byWastePct[0].stepName} has the highest share of delay.`
          : "Delay percentage ranking is not available.",
      impactEstimate:
        byWastePct[0]?.wastePct !== null
          ? `${((byWastePct[0]?.wastePct ?? 0) * 100).toFixed(1)}% of its elapsed time is delay rather than hands-on work.`
          : "Delay % requires at least one valid LT and CT pair.",
      recommendedAction:
        byWastePct[0]
          ? `Use ${byWastePct[0].stepName} to explain where elapsed time is being consumed by waiting instead of work.`
          : "Add step-level LT and CT to unlock the delay ranking."
    },
    {
      finding: mirroredFallback
        ? `${mirroredFallback.stepName} is using the largest fallback time assumption.`
        : "No CT or LT fallback assumptions are active.",
      impactEstimate: mirroredFallback
        ? `${mirroredFallback.usedCtFallback ? "CT" : "LT"} is being copied from the other field, which can hide true delay until the real value is entered.`
        : "Every compared step has both CT and LT filled in.",
      recommendedAction: mirroredFallback
        ? `Replace the fallback value at ${mirroredFallback.stepName} with the actual ${mirroredFallback.usedCtFallback ? "CT" : "LT"} before sharing this waste baseline outside the team.`
        : "Keep both CT and LT filled in so the comparison stays accurate."
    },
    {
      finding:
        inconsistentSteps.length > 0
          ? `${inconsistentSteps.length} step(s) show LT below CT.`
          : "No LT-below-CT issues were found.",
      impactEstimate:
        inconsistentSteps.length > 0
          ? "Those steps are being forced to zero delay, so this points to a data issue rather than a real improvement."
          : `Value-add ratio is ${summary.valueAddRatio !== null ? `${(summary.valueAddRatio * 100).toFixed(1)}%` : "not available"}.`,
      recommendedAction:
        inconsistentSteps.length > 0
          ? "Check the LT source for those steps before using this waste comparison in external reporting."
          : "Use the line-level value-add ratio to compare scenarios on current delay."
    }
  ];
}

export function buildWasteAnalysis(
  model: CompiledForecastModel,
  scenario: ScenarioState,
  output: SimulationOutput
): WasteAnalysisResult {
  const constraint = createConstraintForecast(model, scenario);
  const lineDemand = constraint.baseline.lineDemand;

  const stepRows = model.stepModels
    .map((step) => {
      const stepEval = constraint.baseline.stepEvals[step.stepId];
      const nodeMetrics = output.nodeMetrics[step.stepId];
      const resolved = resolveWasteComparisonTimes({
        stepId: step.stepId,
        stepCtMinutes: step.ctMinutes,
        stepEffectiveCtMinutes: step.effectiveCtMinutes,
        stepLeadTimeMinutes: step.leadTimeMinutes,
        scenario,
        stepEval,
        nodeMetrics
      });
      const routeWeight = routeWeightForStep(stepEval, lineDemand);
      const wasteMinutes =
        resolved.missingBoth || resolved.comparisonCtMinutes === null || resolved.comparisonLtMinutes === null
          ? null
          : Math.max(0, resolved.comparisonLtMinutes - resolved.comparisonCtMinutes);
      const wastePct =
        wasteMinutes !== null && resolved.comparisonLtMinutes !== null && resolved.comparisonLtMinutes > 0
          ? wasteMinutes / resolved.comparisonLtMinutes
          : wasteMinutes === 0 && resolved.comparisonLtMinutes === 0
            ? 0
            : null;
      const valueAddPct = wastePct !== null ? Math.max(0, 1 - wastePct) : null;

      return {
        stepId: step.stepId,
        stepName: step.label,
        comparisonCtMinutes: resolved.comparisonCtMinutes,
        comparisonLtMinutes: resolved.comparisonLtMinutes,
        wasteMinutes,
        wastePct,
        valueAddPct,
        routeWeight,
        weightedWasteMinutes: wasteMinutes !== null ? wasteMinutes * routeWeight : null,
        weightedLtMinutes:
          resolved.comparisonLtMinutes !== null ? resolved.comparisonLtMinutes * routeWeight : null,
        weightedCtMinutes:
          resolved.comparisonCtMinutes !== null ? resolved.comparisonCtMinutes * routeWeight : null,
        usedCtFallback: resolved.usedCtFallback,
        usedLtFallback: resolved.usedLtFallback,
        missingBoth: resolved.missingBoth,
        ltBelowCt: resolved.ltBelowCt
      } satisfies WasteStepRow;
    })
    .sort((a, b) => {
      const wasteDelta = (b.weightedWasteMinutes ?? -1) - (a.weightedWasteMinutes ?? -1);
      if (Math.abs(wasteDelta) > 1e-9) {
        return wasteDelta;
      }
      return (b.wastePct ?? -1) - (a.wastePct ?? -1);
    });

  const validations = buildValidations(stepRows);
  const hasBlockingErrors = validations.some((validation) => validation.severity === "error");
  const totalLeadTimeMinutes = sumKnown(stepRows.map((row) => row.weightedLtMinutes));
  const totalTouchTimeMinutes = sumKnown(stepRows.map((row) => row.weightedCtMinutes));
  const totalWasteMinutes = sumKnown(stepRows.map((row) => row.weightedWasteMinutes));
  const totalWastePct =
    totalLeadTimeMinutes !== null && totalLeadTimeMinutes > 0 && totalWasteMinutes !== null
      ? totalWasteMinutes / totalLeadTimeMinutes
      : null;
  const valueAddRatio = totalWastePct !== null ? Math.max(0, 1 - totalWastePct) : null;
  const topWasteRow =
    stepRows.find((row) => (row.weightedWasteMinutes ?? 0) > 0) ??
    stepRows.find((row) => !row.missingBoth) ??
    null;
  const fallbackCount = stepRows.filter((row) => row.usedCtFallback || row.usedLtFallback).length;
  const warningCount = validations.filter((validation) => validation.severity === "warning").length;

  const summary: WasteSummaryMetrics = {
    totalLeadTimeMinutes,
    totalTouchTimeMinutes,
    totalWasteMinutes,
    totalWastePct,
    valueAddRatio,
    topWasteStep: topWasteRow?.stepName ?? "n/a",
    fallbackCount,
    warningCount
  };

  const summaryRows: WasteSummaryRow[] = [
    {
      key: "totalLeadTimeMinutes",
      label: "Weighted total elapsed time",
      value: summary.totalLeadTimeMinutes,
      format: "duration"
    },
    {
      key: "totalTouchTimeMinutes",
      label: "Weighted total hands-on time",
      value: summary.totalTouchTimeMinutes,
      format: "duration"
    },
    {
      key: "totalWasteMinutes",
      label: "Weighted total delay",
      value: summary.totalWasteMinutes,
      format: "duration"
    },
    {
      key: "totalWastePct",
      label: "Delay share",
      value: summary.totalWastePct,
      format: "percent",
      decimals: 1
    },
    {
      key: "valueAddRatio",
      label: "Value work ratio",
      value: summary.valueAddRatio,
      format: "percent",
      decimals: 1
    },
    {
      key: "topWasteStep",
      label: "Biggest delay step",
      value: summary.topWasteStep,
      format: "text"
    },
    {
      key: "fallbackCount",
      label: "Fallback time steps",
      value: summary.fallbackCount,
      format: "number",
      decimals: 0
    },
    {
      key: "warningCount",
      label: "Warnings",
      value: summary.warningCount,
      format: "number",
      decimals: 0
    }
  ];

  return {
    scenarioLabel: model.metadata.name || "Current Scenario",
    validations,
    hasBlockingErrors,
    summary,
    summaryRows,
    stepRows,
    insights: buildInsights({ summary, stepRows, validations })
  };
}

export function buildWasteSummaryCsv(result: WasteAnalysisResult): string {
  return toCsv(
    [
      "Scenario Label",
      "Weighted Total Lead Time Minutes",
      "Weighted Total Touch Time Minutes",
      "Weighted Total Waste Minutes",
      "Total Waste Percent",
      "Value Add Ratio",
      "Top Waste Contributor",
      "Fallback Count",
      "Warning Count"
    ],
    [
      [
        result.scenarioLabel,
        result.summary.totalLeadTimeMinutes ?? "",
        result.summary.totalTouchTimeMinutes ?? "",
        result.summary.totalWasteMinutes ?? "",
        result.summary.totalWastePct ?? "",
        result.summary.valueAddRatio ?? "",
        result.summary.topWasteStep,
        result.summary.fallbackCount,
        result.summary.warningCount
      ]
    ]
  );
}

export function buildWasteStepCsv(result: WasteAnalysisResult): string {
  return toCsv(
    [
      "Step Name",
      "Comparison LT Minutes",
      "Comparison CT Minutes",
      "Waste Minutes",
      "Waste Percent",
      "Value Add Percent",
      "Route Weight",
      "Weighted LT Minutes",
      "Weighted CT Minutes",
      "Weighted Waste Minutes",
      "Used CT Fallback",
      "Used LT Fallback",
      "Missing Both",
      "LT Below CT"
    ],
    result.stepRows.map((row) => [
      row.stepName,
      row.comparisonLtMinutes ?? "",
      row.comparisonCtMinutes ?? "",
      row.wasteMinutes ?? "",
      row.wastePct ?? "",
      row.valueAddPct ?? "",
      row.routeWeight,
      row.weightedLtMinutes ?? "",
      row.weightedCtMinutes ?? "",
      row.weightedWasteMinutes ?? "",
      row.usedCtFallback ? "yes" : "no",
      row.usedLtFallback ? "yes" : "no",
      row.missingBoth ? "yes" : "no",
      row.ltBelowCt ? "yes" : "no"
    ])
  );
}
