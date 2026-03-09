import { createConstraintForecast } from "./bottleneckForecast.js";
import { stepScenarioKey, toNumber } from "../simulator/scenarioState.js";
const HIGH_EFFICIENCY_MAX_GAIN_RATIO = 0.1;
const MEDIUM_EFFICIENCY_MAX_GAIN_RATIO = 0.25;
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
function formatPct(value, decimals = 0) {
    return `${(value * 100).toFixed(decimals)}%`;
}
function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}
function readOptionalNumber(value) {
    const parsed = toNumber(value, Number.NaN);
    return Number.isFinite(parsed) ? parsed : null;
}
function sumOrNull(values) {
    if (values.some((value) => value === null)) {
        return null;
    }
    return values.reduce((sum, value) => sum + (value ?? 0), 0);
}
function sumKnown(values) {
    const known = values.filter((value) => typeof value === "number" && Number.isFinite(value));
    if (known.length === 0) {
        return null;
    }
    return known.reduce((sum, value) => sum + value, 0);
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
function efficiencyStatusFromGainRatio(gainRatio) {
    if (gainRatio <= HIGH_EFFICIENCY_MAX_GAIN_RATIO) {
        return "high";
    }
    if (gainRatio <= MEDIUM_EFFICIENCY_MAX_GAIN_RATIO) {
        return "medium";
    }
    return "low";
}
function efficiencyLabel(status) {
    if (status === "high") {
        return "High";
    }
    if (status === "medium") {
        return "Medium";
    }
    return "Low";
}
function getStepLabels(model) {
    return new Map(model.stepModels.map((step) => [step.stepId, step.label]));
}
function getProcessingMap(masterData) {
    return new Map((masterData.processing ?? []).map((row) => [row.stepId, row]));
}
function resolveInputValue(scenario, processing, stepId, field) {
    const override = readOptionalNumber(scenario[stepScenarioKey(stepId, field)]);
    if (override !== null) {
        return Math.max(0, override);
    }
    const rawDefault = processing?.[field];
    if (typeof rawDefault === "number" && Number.isFinite(rawDefault)) {
        return Math.max(0, rawDefault);
    }
    return null;
}
function stepTimeHoursPerUnit(effectiveCtMinutes, effectiveUnits) {
    if (typeof effectiveCtMinutes !== "number" ||
        !Number.isFinite(effectiveCtMinutes) ||
        effectiveCtMinutes <= 0 ||
        typeof effectiveUnits !== "number" ||
        !Number.isFinite(effectiveUnits) ||
        effectiveUnits <= 0) {
        return null;
    }
    return effectiveCtMinutes / effectiveUnits / 60;
}
function buildStepRows(model, masterData, scenario) {
    const processingByStepId = getProcessingMap(masterData);
    const constraint = createConstraintForecast(model, scenario);
    return model.stepModels.map((step) => {
        const processing = processingByStepId.get(step.stepId);
        const materialCost = resolveInputValue(scenario, processing, step.stepId, "materialCostPerUnit");
        const laborRatePerHour = resolveInputValue(scenario, processing, step.stepId, "laborRatePerHour");
        const equipmentRatePerHour = resolveInputValue(scenario, processing, step.stepId, "equipmentRatePerHour");
        const stepEval = constraint.baseline.stepEvals[step.stepId];
        const timeHoursPerUnit = stepTimeHoursPerUnit(stepEval?.effectiveCtMinutes ?? null, stepEval?.effectiveUnits ?? null);
        const laborCostPerUnit = laborRatePerHour !== null && timeHoursPerUnit !== null ? laborRatePerHour * timeHoursPerUnit : null;
        const equipmentCostPerUnit = equipmentRatePerHour !== null && timeHoursPerUnit !== null
            ? equipmentRatePerHour * timeHoursPerUnit
            : null;
        const totalStepCost = materialCost !== null && laborCostPerUnit !== null && equipmentCostPerUnit !== null
            ? materialCost + laborCostPerUnit + equipmentCostPerUnit
            : null;
        return {
            stepId: step.stepId,
            stepName: step.label,
            materialCost,
            laborRatePerHour,
            equipmentRatePerHour,
            laborCostPerUnit,
            equipmentCostPerUnit,
            totalStepCost,
            hasMissingCosts: materialCost === null ||
                laborRatePerHour === null ||
                equipmentRatePerHour === null ||
                timeHoursPerUnit === null
        };
    });
}
function getPrimaryBottleneckId(output, fallbackStepId) {
    const flagged = Object.entries(output.nodeMetrics).find(([, metrics]) => metrics.bottleneckFlag)?.[0];
    return flagged ?? fallbackStepId;
}
function getNextBottleneckId(primaryStepId, baselineSorted, reliefSorted) {
    const reliefCandidate = reliefSorted.find((row) => row.stepId !== primaryStepId)?.stepId;
    if (reliefCandidate) {
        return reliefCandidate;
    }
    return baselineSorted.find((row) => row.stepId !== primaryStepId)?.stepId ?? primaryStepId;
}
function buildValidations(sellingPrice, stepRows, bottleneckTimePerUnit, nextConstraintThroughput) {
    const validations = [];
    if (sellingPrice === null || sellingPrice <= 0) {
        validations.push({
            code: "selling-price-missing",
            severity: "error",
            metricKey: "sellingPrice",
            message: "Transfer price per unit is required before throughput economics can be computed."
        });
    }
    const missingMaterial = stepRows.filter((row) => row.materialCost === null);
    if (missingMaterial.length > 0) {
        validations.push({
            code: "material-cost-missing",
            severity: "error",
            metricKey: "materialCostPerUnit",
            message: `Material cost is missing for: ${missingMaterial.map((row) => row.stepName).join(", ")}.`
        });
    }
    const missingLabor = stepRows.filter((row) => row.laborRatePerHour === null);
    if (missingLabor.length > 0) {
        validations.push({
            code: "labor-rate-missing",
            severity: "warning",
            metricKey: "laborCostPerUnit",
            message: `Labor rate is missing for: ${missingLabor.map((row) => row.stepName).join(", ")}.`
        });
    }
    const missingEquipment = stepRows.filter((row) => row.equipmentRatePerHour === null);
    if (missingEquipment.length > 0) {
        validations.push({
            code: "equipment-rate-missing",
            severity: "warning",
            metricKey: "equipmentCostPerUnit",
            message: `Equipment rate is missing for: ${missingEquipment.map((row) => row.stepName).join(", ")}.`
        });
    }
    const missingStepTime = stepRows.filter((row) => (row.laborRatePerHour !== null || row.equipmentRatePerHour !== null) &&
        (row.laborCostPerUnit === null || row.equipmentCostPerUnit === null));
    if (missingStepTime.length > 0) {
        validations.push({
            code: "step-time-missing",
            severity: "error",
            metricKey: "bottleneckTimePerUnit",
            message: `Labor/equipment conversion is blocked because effective step time is invalid for: ${missingStepTime
                .map((row) => row.stepName)
                .join(", ")}.`
        });
    }
    if (bottleneckTimePerUnit === null || bottleneckTimePerUnit <= 0) {
        validations.push({
            code: "bottleneck-time-invalid",
            severity: "error",
            metricKey: "bottleneckTimePerUnit",
            message: "Bottleneck-minute metrics are blocked because the active bottleneck cycle time or effective parallel capacity is invalid."
        });
    }
    if (nextConstraintThroughput === null || nextConstraintThroughput <= 0) {
        validations.push({
            code: "next-constraint-missing",
            severity: "error",
            metricKey: "estimatedGainUnits",
            message: "Estimated gain is blocked because the next bottleneck constraint could not be derived."
        });
    }
    return validations;
}
function buildInsights(args) {
    const { summary, stepRows, validations } = args;
    const blockingErrors = validations.filter((validation) => validation.severity === "error");
    if (blockingErrors.length > 0) {
        return [
            {
                finding: "Throughput economics are incomplete.",
                impactEstimate: `${blockingErrors.length} blocking input issue(s) must be resolved before the summary can be trusted.`,
                recommendedAction: "Enter transfer price and missing step costs, then reopen the Throughput Analysis panel."
            }
        ];
    }
    const topCostStep = stepRows
        .filter((row) => row.totalStepCost !== null)
        .sort((a, b) => (b.totalStepCost ?? 0) - (a.totalStepCost ?? 0))[0] ?? null;
    const gainPercent = summary.estimatedGainPercent ?? 0;
    const gainDollars = summary.estimatedGainDollars ?? 0;
    return [
        {
            finding: `${summary.primaryBottleneck} is the current economic constraint.`,
            impactEstimate: `Relieving it changes throughput by ${formatPct(gainPercent, 1)} and about ${formatCurrency(gainDollars)} per hour-equivalent of throughput contribution.`,
            recommendedAction: `Focus the next improvement on ${summary.primaryBottleneck} first, then validate the shift to ${summary.nextBottleneck}.`
        },
        {
            finding: `The next bottleneck after relief is ${summary.nextBottleneck}.`,
            impactEstimate: `Projected throughput rises from ${(summary.currentThroughput ?? 0).toFixed(3)} to ${(summary.improvedThroughput ?? 0).toFixed(3)} units/hr before the next constraint binds.`,
            recommendedAction: `Use the relief scenario as a bounded intervention, not a blanket capacity increase across all steps.`
        },
        {
            finding: topCostStep ? `${topCostStep.stepName} is the largest fully loaded cost driver per unit.` : "Step-level cost signal is limited.",
            impactEstimate: topCostStep
                ? `Its fully loaded step cost is ${formatCurrency(topCostStep.totalStepCost ?? 0)} per unit.`
                : "Not all step costs are present, so cost-driver ranking is incomplete.",
            recommendedAction: topCostStep
                ? `Review material cost and hourly labor/equipment rates at ${topCostStep.stepName} before making downstream pricing or margin decisions.`
                : "Complete the missing step-level cost fields to unlock cost-driver analysis."
        }
    ];
}
function scaleByCompletedUnits(value, completedUnits) {
    if (value === null ||
        completedUnits === null ||
        !Number.isFinite(value) ||
        !Number.isFinite(completedUnits) ||
        completedUnits < 0) {
        return null;
    }
    return value * completedUnits;
}
function scaleByWholeLots(value, completedUnits) {
    if (value === null ||
        completedUnits === null ||
        !Number.isFinite(value) ||
        !Number.isFinite(completedUnits) ||
        completedUnits < 0) {
        return null;
    }
    return value * Math.floor(completedUnits);
}
export function buildThroughputAnalysis(model, masterData, scenario, output) {
    const stepLabelById = getStepLabels(model);
    const constraint = createConstraintForecast(model, scenario);
    const primaryStepId = getPrimaryBottleneckId(output, constraint.baseline.bottleneckStepId);
    const nextStepId = getNextBottleneckId(primaryStepId, constraint.baseline.sortedByBottleneck, constraint.relief.sortedByBottleneck);
    const stepRows = buildStepRows(model, masterData, scenario);
    const sellingPriceRaw = readOptionalNumber(scenario.sellingPricePerUnit);
    const sellingPriceDefault = readOptionalNumber(masterData.economicsDefaults?.sellingPricePerUnit);
    const sellingPrice = sellingPriceRaw ?? sellingPriceDefault;
    const materialCostPerUnit = sumOrNull(stepRows.map((row) => row.materialCost));
    const laborCostPerUnit = sumOrNull(stepRows.map((row) => row.laborCostPerUnit));
    const equipmentCostPerUnit = sumOrNull(stepRows.map((row) => row.equipmentCostPerUnit));
    const tocThroughputPerUnit = sellingPrice !== null && materialCostPerUnit !== null ? sellingPrice - materialCostPerUnit : null;
    const fullyLoadedProfitPerUnit = sellingPrice !== null &&
        materialCostPerUnit !== null &&
        laborCostPerUnit !== null &&
        equipmentCostPerUnit !== null
        ? sellingPrice - materialCostPerUnit - laborCostPerUnit - equipmentCostPerUnit
        : null;
    const primaryEval = constraint.baseline.stepEvals[primaryStepId];
    const nextConstraintThroughput = Number.isFinite(constraint.relief.throughput) && constraint.relief.throughput > 0
        ? constraint.relief.throughput
        : null;
    const currentThroughput = num(output.globalMetrics.forecastThroughput, constraint.baseline.throughput);
    const completedUnits = readOptionalNumber(output.globalMetrics.totalCompletedOutputPieces);
    const estimatedGainUnits = nextConstraintThroughput !== null ? Math.max(0, nextConstraintThroughput - currentThroughput) : null;
    const estimatedGainPercent = estimatedGainUnits !== null && currentThroughput > 0 ? estimatedGainUnits / currentThroughput : null;
    const estimatedGainDollars = estimatedGainUnits !== null && tocThroughputPerUnit !== null
        ? estimatedGainUnits * tocThroughputPerUnit
        : null;
    const bottleneckTimePerUnit = primaryEval?.effectiveCtMinutes !== null &&
        primaryEval?.effectiveCtMinutes !== undefined &&
        primaryEval.effectiveUnits !== null &&
        primaryEval.effectiveUnits !== undefined &&
        primaryEval.effectiveUnits > 0
        ? primaryEval.effectiveCtMinutes / primaryEval.effectiveUnits
        : null;
    const tocThroughputPerBottleneckMinute = tocThroughputPerUnit !== null && bottleneckTimePerUnit !== null && bottleneckTimePerUnit > 0
        ? tocThroughputPerUnit / bottleneckTimePerUnit
        : null;
    const gainRatioToNextConstraint = estimatedGainUnits !== null && nextConstraintThroughput !== null && nextConstraintThroughput > 0
        ? estimatedGainUnits / nextConstraintThroughput
        : 0;
    const efficiencyStatus = efficiencyStatusFromGainRatio(gainRatioToNextConstraint);
    const validations = buildValidations(sellingPrice, stepRows, bottleneckTimePerUnit, nextConstraintThroughput);
    const hasBlockingErrors = validations.some((validation) => validation.severity === "error");
    const productFamilyLabel = masterData.products[0]?.family ?? null;
    const partialMaterialCostPerUnit = sumKnown(stepRows.map((row) => row.materialCost));
    const partialLaborCostPerUnit = sumKnown(stepRows.map((row) => row.laborCostPerUnit));
    const partialEquipmentCostPerUnit = sumKnown(stepRows.map((row) => row.equipmentCostPerUnit));
    const salesTotal = scaleByWholeLots(sellingPrice, completedUnits);
    const materialTotal = scaleByCompletedUnits(partialMaterialCostPerUnit, completedUnits);
    const laborTotal = scaleByCompletedUnits(partialLaborCostPerUnit, completedUnits);
    const equipmentTotal = scaleByCompletedUnits(partialEquipmentCostPerUnit, completedUnits);
    const finalRevenueTotal = salesTotal !== null
        ? salesTotal - (materialTotal ?? 0) - (laborTotal ?? 0) - (equipmentTotal ?? 0)
        : null;
    const summary = {
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
    const profitLossRows = [
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
    const summaryRows = [
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
            label: "TOC throughput per unit",
            value: summary.tocThroughputPerUnit,
            format: "currency"
        },
        {
            key: "fullyLoadedProfitPerUnit",
            label: "Fully loaded profit per unit",
            value: summary.fullyLoadedProfitPerUnit,
            format: "currency"
        },
        { key: "primaryBottleneck", label: "Primary bottleneck", value: summary.primaryBottleneck, format: "text" },
        {
            key: "bottleneckTimePerUnit",
            label: "Bottleneck time per unit",
            value: summary.bottleneckTimePerUnit,
            format: "duration"
        },
        {
            key: "tocThroughputPerBottleneckMinute",
            label: "TOC throughput per bottleneck minute",
            value: summary.tocThroughputPerBottleneckMinute,
            format: "currency"
        },
        { key: "nextBottleneck", label: "Next bottleneck", value: summary.nextBottleneck, format: "text" },
        {
            key: "estimatedGainUnits",
            label: "Estimated gain if primary bottleneck is relieved",
            value: summary.estimatedGainUnits,
            format: "number",
            decimals: 3
        },
        {
            key: "estimatedGainDollars",
            label: "Estimated gain dollars",
            value: summary.estimatedGainDollars,
            format: "currency"
        },
        {
            key: "estimatedGainPercent",
            label: "Estimated gain percent",
            value: summary.estimatedGainPercent,
            format: "percent",
            decimals: 1
        },
        {
            key: "efficiencyStatus",
            label: "Efficiency status",
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
export function buildThroughputSummaryCsv(result) {
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
export function buildThroughputStepCsv(result) {
    return toCsv([
        "Step Name",
        "Material Cost Per Unit",
        "Labor Rate Per Hour",
        "Labor Cost Per Unit",
        "Equipment Rate Per Hour",
        "Equipment Cost Per Unit",
        "Total Step Cost Per Unit",
        "Missing Costs"
    ], result.stepRows.map((row) => [
        row.stepName,
        row.materialCost ?? "",
        row.laborRatePerHour ?? "",
        row.laborCostPerUnit ?? "",
        row.equipmentRatePerHour ?? "",
        row.equipmentCostPerUnit ?? "",
        row.totalStepCost ?? "",
        row.hasMissingCosts ? "yes" : "no"
    ]));
}
