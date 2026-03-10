import { createConstraintForecast } from "./bottleneckForecast.js";
import { stepScenarioKey, toNumber } from "../simulator/scenarioState.js";
function readOptionalNumber(value) {
    const parsed = toNumber(value, Number.NaN);
    return Number.isFinite(parsed) ? parsed : null;
}
function finitePositive(value) {
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}
function finiteNonNegative(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}
function csvEscape(value) {
    if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, "\"\"")}"`;
    }
    return value;
}
function toCsv(headers, rows) {
    const lines = [headers.map(csvEscape).join(",")];
    rows.forEach((row) => {
        lines.push(row.map((value) => csvEscape(String(value))).join(","));
    });
    return `${lines.join("\n")}\n`;
}
function sumKnown(values) {
    const known = values.filter((value) => typeof value === "number" && Number.isFinite(value));
    if (known.length === 0) {
        return null;
    }
    return known.reduce((sum, value) => sum + value, 0);
}
function routeWeightForStep(stepEval, lineDemand) {
    const stepDemand = Math.max(0, finiteNonNegative(stepEval?.demandRatePerHour) ?? 0);
    if (!Number.isFinite(lineDemand) || lineDemand <= 0) {
        return 0;
    }
    return stepDemand / lineDemand;
}
export function resolveWasteComparisonTimes(args) {
    const scenarioLeadOverride = finiteNonNegative(readOptionalNumber(args.scenario[stepScenarioKey(args.stepId, "leadTimeMinutes")]));
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
    const ltBelowCt = !missingBoth &&
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
function buildValidations(stepRows) {
    const validations = [];
    const missingBoth = stepRows.filter((row) => row.missingBoth);
    const fallbackRows = stepRows.filter((row) => row.usedCtFallback || row.usedLtFallback);
    const ltBelowCtRows = stepRows.filter((row) => row.ltBelowCt);
    missingBoth.forEach((row) => {
        validations.push({
            code: "waste-time-missing",
            severity: "error",
            stepId: row.stepId,
            metricKey: "comparisonTimes",
            message: `${row.stepName} is excluded from waste totals because both CT and LT are missing.`
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
            message: `${row.stepName} is mirroring ${sourceField} into ${copiedField} because one time value is missing.`
        });
    });
    ltBelowCtRows.forEach((row) => {
        validations.push({
            code: "waste-lt-below-ct",
            severity: "warning",
            stepId: row.stepId,
            metricKey: "comparisonLtMinutes",
            message: `${row.stepName} has LT below CT. Waste is floored at zero, but the source data should be reviewed.`
        });
    });
    return validations;
}
function buildInsights(args) {
    const { summary, stepRows, validations } = args;
    const blockingErrors = validations.filter((validation) => validation.severity === "error");
    if (blockingErrors.length > 0) {
        return [
            {
                finding: "Waste totals are partially blocked by missing time data.",
                impactEstimate: `${blockingErrors.length} step-level error(s) are excluding steps from aggregate LT-vs-CT waste totals.`,
                recommendedAction: "Fill in CT or LT for the flagged steps, or accept the mirrored fallback where appropriate."
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
            finding: byWeightedWaste[0]
                ? `${byWeightedWaste[0].stepName} is the largest weighted waste contributor.`
                : "Weighted waste is not available yet.",
            impactEstimate: summary.totalWasteMinutes !== null
                ? `Weighted waiting waste is ${summary.totalWasteMinutes.toFixed(2)} minutes across the current route mix.`
                : "Line-level waste cannot be totaled until comparison times are available.",
            recommendedAction: byWeightedWaste[0]
                ? `Reduce wait, queue, batching, or hold time at ${byWeightedWaste[0].stepName} before chasing lower-impact steps.`
                : "Populate CT and LT on the active route first."
        },
        {
            finding: byWastePct[0]
                ? `${byWastePct[0].stepName} has the highest waste share.`
                : "Waste percentage ranking is not available.",
            impactEstimate: byWastePct[0]?.wastePct !== null
                ? `${((byWastePct[0]?.wastePct ?? 0) * 100).toFixed(1)}% of its LT is non-value-added versus CT.`
                : "Waste % requires at least one valid LT/CT pair.",
            recommendedAction: byWastePct[0]
                ? `Use ${byWastePct[0].stepName} to explain to clients where elapsed time is dominated by delay instead of touch time.`
                : "Provide step-level LT and CT to unlock waste-share ranking."
        },
        {
            finding: mirroredFallback
                ? `${mirroredFallback.stepName} is using the largest mirrored time assumption.`
                : "No mirrored CT/LT assumptions are active.",
            impactEstimate: mirroredFallback
                ? `${mirroredFallback.usedCtFallback ? "CT" : "LT"} is being copied from the other field, which suppresses waste at that step until real data is entered.`
                : "Every compared step has both CT and LT available.",
            recommendedAction: mirroredFallback
                ? `Replace the mirrored value at ${mirroredFallback.stepName} with the actual ${mirroredFallback.usedCtFallback ? "CT" : "LT"} before presenting the waste baseline externally.`
                : "Keep both CT and LT populated to preserve comparison fidelity."
        },
        {
            finding: inconsistentSteps.length > 0
                ? `${inconsistentSteps.length} step(s) report LT below CT.`
                : "No LT-below-CT inconsistencies were detected.",
            impactEstimate: inconsistentSteps.length > 0
                ? `These steps are being floored to zero waste, so the issue is a data-quality inconsistency rather than a true improvement signal.`
                : `Value-add ratio is ${summary.valueAddRatio !== null ? `${(summary.valueAddRatio * 100).toFixed(1)}%` : "not available"}.`,
            recommendedAction: inconsistentSteps.length > 0
                ? "Review the LT source on those steps before using the waste comparison in client-facing reports."
                : "Use the line-level value-add ratio to compare scenarios on current-state delay."
        }
    ];
}
export function buildWasteAnalysis(model, scenario, output) {
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
        const wasteMinutes = resolved.missingBoth || resolved.comparisonCtMinutes === null || resolved.comparisonLtMinutes === null
            ? null
            : Math.max(0, resolved.comparisonLtMinutes - resolved.comparisonCtMinutes);
        const wastePct = wasteMinutes !== null && resolved.comparisonLtMinutes !== null && resolved.comparisonLtMinutes > 0
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
            weightedLtMinutes: resolved.comparisonLtMinutes !== null ? resolved.comparisonLtMinutes * routeWeight : null,
            weightedCtMinutes: resolved.comparisonCtMinutes !== null ? resolved.comparisonCtMinutes * routeWeight : null,
            usedCtFallback: resolved.usedCtFallback,
            usedLtFallback: resolved.usedLtFallback,
            missingBoth: resolved.missingBoth,
            ltBelowCt: resolved.ltBelowCt
        };
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
    const totalWastePct = totalLeadTimeMinutes !== null && totalLeadTimeMinutes > 0 && totalWasteMinutes !== null
        ? totalWasteMinutes / totalLeadTimeMinutes
        : null;
    const valueAddRatio = totalWastePct !== null ? Math.max(0, 1 - totalWastePct) : null;
    const topWasteRow = stepRows.find((row) => (row.weightedWasteMinutes ?? 0) > 0) ??
        stepRows.find((row) => !row.missingBoth) ??
        null;
    const fallbackCount = stepRows.filter((row) => row.usedCtFallback || row.usedLtFallback).length;
    const warningCount = validations.filter((validation) => validation.severity === "warning").length;
    const summary = {
        totalLeadTimeMinutes,
        totalTouchTimeMinutes,
        totalWasteMinutes,
        totalWastePct,
        valueAddRatio,
        topWasteStep: topWasteRow?.stepName ?? "n/a",
        fallbackCount,
        warningCount
    };
    const summaryRows = [
        {
            key: "totalLeadTimeMinutes",
            label: "Weighted total lead time",
            value: summary.totalLeadTimeMinutes,
            format: "duration"
        },
        {
            key: "totalTouchTimeMinutes",
            label: "Weighted total touch time",
            value: summary.totalTouchTimeMinutes,
            format: "duration"
        },
        {
            key: "totalWasteMinutes",
            label: "Weighted total waste",
            value: summary.totalWasteMinutes,
            format: "duration"
        },
        {
            key: "totalWastePct",
            label: "Waste share",
            value: summary.totalWastePct,
            format: "percent",
            decimals: 1
        },
        {
            key: "valueAddRatio",
            label: "Value-add ratio",
            value: summary.valueAddRatio,
            format: "percent",
            decimals: 1
        },
        {
            key: "topWasteStep",
            label: "Top waste contributor",
            value: summary.topWasteStep,
            format: "text"
        },
        {
            key: "fallbackCount",
            label: "Mirrored fallback steps",
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
export function buildWasteSummaryCsv(result) {
    return toCsv([
        "Scenario Label",
        "Weighted Total Lead Time Minutes",
        "Weighted Total Touch Time Minutes",
        "Weighted Total Waste Minutes",
        "Total Waste Percent",
        "Value Add Ratio",
        "Top Waste Contributor",
        "Fallback Count",
        "Warning Count"
    ], [
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
    ]);
}
export function buildWasteStepCsv(result) {
    return toCsv([
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
    ], result.stepRows.map((row) => [
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
    ]));
}
