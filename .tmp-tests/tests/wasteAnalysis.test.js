import assert from "node:assert/strict";
import { createBottleneckForecastOutput } from "../src/lib/bottleneckForecast.js";
import { buildWasteAnalysis, buildWasteStepCsv, buildWasteSummaryCsv } from "../src/lib/wasteAnalysis.js";
function assertClose(actual, expected, epsilon = 1e-9) {
    assert.ok(typeof actual === "number", `Expected numeric value close to ${expected}, received ${actual}`);
    assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be within ${epsilon} of ${expected}`);
}
function run(name, fn) {
    fn();
    console.log(`ok - ${name}`);
}
function createStep(args) {
    return {
        stepId: args.stepId,
        label: args.label ?? args.stepId,
        equipmentType: null,
        workerCount: 1,
        parallelProcedures: 1,
        effectiveUnits: 1,
        ctMinutes: args.ctMinutes,
        changeoverMinutes: null,
        changeoverPenaltyPerUnitMinutes: 0,
        leadTimeMinutes: args.leadTimeMinutes,
        variabilityCv: 0.18,
        effectiveCtMinutes: args.ctMinutes,
        effectiveCapacityPerHour: args.ctMinutes ? 60 / args.ctMinutes : null,
        baseline: {
            demandRatePerHour: 10,
            utilization: 0.5,
            headroom: 0.5,
            queueRisk: 0.2,
            bottleneckIndex: 0.2,
            status: "healthy"
        }
    };
}
function createModel(args) {
    return {
        version: "test",
        generatedAt: "2026-03-10T00:00:00.000Z",
        metadata: {
            name: args.name ?? "Waste Fixture",
            units: "per-hour",
            mode: "constraint-forecast-non-des"
        },
        graph: {
            nodes: args.nodes.map((node) => ({ ...node, type: "process" })),
            edges: args.edges,
            startNodes: args.startNodes,
            endNodes: args.endNodes
        },
        inputs: [],
        inputDefaults: {
            demandRatePerHour: 12,
            demandMultiplier: 1,
            mixProfile: "balanced",
            staffingMultiplier: 1,
            equipmentMultiplier: 1,
            unplannedDowntimePct: 0,
            ctMultiplier: 1,
            setupPenaltyMultiplier: 1,
            variabilityMultiplier: 1,
            simulationHorizonHours: "8",
            activeShiftCount: "3",
            bottleneckReliefUnits: 0,
            sellingPricePerUnit: 100
        },
        stepModels: args.stepModels,
        baseline: {
            demandRatePerHour: 12,
            lineCapacityPerHour: 12,
            bottleneckStepId: args.stepModels[0]?.stepId ?? null,
            globalMetrics: {
                totalLeadTimeMinutes: 0
            },
            nodeMetrics: {}
        },
        assumptions: []
    };
}
function createOutput(model, leadTimesByStepId) {
    const nodeMetrics = {};
    model.stepModels.forEach((step) => {
        nodeMetrics[step.stepId] = {
            utilization: null,
            headroom: null,
            queueRisk: null,
            queueDepth: null,
            wipQty: null,
            completedQty: 0,
            idleWaitHours: null,
            idleWaitPct: null,
            leadTimeMinutes: leadTimesByStepId[step.stepId] ?? null,
            capacityPerHour: null,
            bottleneckIndex: null,
            bottleneckFlag: false,
            status: "healthy"
        };
    });
    return {
        globalMetrics: {},
        nodeMetrics
    };
}
run("missing LT falls back to CT and produces zero waste", () => {
    const model = createModel({
        nodes: [{ id: "cut", label: "Cut" }],
        edges: [],
        startNodes: ["cut"],
        endNodes: ["cut"],
        stepModels: [createStep({ stepId: "cut", ctMinutes: 10, leadTimeMinutes: null })]
    });
    const analysis = buildWasteAnalysis(model, model.inputDefaults, createOutput(model, { cut: null }));
    const row = analysis.stepRows[0];
    assert.equal(row.usedLtFallback, true);
    assert.equal(row.usedCtFallback, false);
    assert.equal(row.comparisonLtMinutes, 10);
    assert.equal(row.wasteMinutes, 0);
    assert.equal(analysis.summary.fallbackCount, 1);
});
run("missing CT falls back to LT and both-missing raises a blocking error", () => {
    const model = createModel({
        nodes: [
            { id: "lt_only", label: "LT Only" },
            { id: "missing", label: "Missing" }
        ],
        edges: [],
        startNodes: ["lt_only", "missing"],
        endNodes: ["lt_only", "missing"],
        stepModels: [
            createStep({ stepId: "lt_only", ctMinutes: null, leadTimeMinutes: 25 }),
            createStep({ stepId: "missing", ctMinutes: null, leadTimeMinutes: null })
        ]
    });
    const analysis = buildWasteAnalysis(model, model.inputDefaults, createOutput(model, { lt_only: 25, missing: null }));
    const ltOnly = analysis.stepRows.find((row) => row.stepId === "lt_only");
    const missing = analysis.stepRows.find((row) => row.stepId === "missing");
    assert.equal(ltOnly?.usedCtFallback, true);
    assert.equal(ltOnly?.comparisonCtMinutes, 25);
    assert.equal(ltOnly?.wasteMinutes, 0);
    assert.equal(missing?.missingBoth, true);
    assert.equal(analysis.hasBlockingErrors, true);
    assert.ok(analysis.validations.some((validation) => validation.code === "waste-time-missing"));
});
run("LT greater than CT creates waste while LT below CT is warned and floored", () => {
    const model = createModel({
        nodes: [
            { id: "wait", label: "Wait" },
            { id: "tight", label: "Tight" }
        ],
        edges: [],
        startNodes: ["wait", "tight"],
        endNodes: ["wait", "tight"],
        stepModels: [
            createStep({ stepId: "wait", ctMinutes: 10, leadTimeMinutes: 40 }),
            createStep({ stepId: "tight", ctMinutes: 20, leadTimeMinutes: 15 })
        ]
    });
    const analysis = buildWasteAnalysis(model, model.inputDefaults, createOutput(model, { wait: 40, tight: 15 }));
    const wait = analysis.stepRows.find((row) => row.stepId === "wait");
    const tight = analysis.stepRows.find((row) => row.stepId === "tight");
    assertClose(wait?.wasteMinutes ?? null, 30);
    assertClose(wait?.wastePct ?? null, 0.75);
    assert.equal(tight?.wasteMinutes, 0);
    assert.equal(tight?.ltBelowCt, true);
    assert.ok(analysis.validations.some((validation) => validation.code === "waste-lt-below-ct"));
});
run("parallel branch totals are weighted by routed demand instead of naive summation", () => {
    const model = createModel({
        nodes: [
            { id: "entry", label: "Entry" },
            { id: "branch_a", label: "Branch A" },
            { id: "branch_b", label: "Branch B" }
        ],
        edges: [
            { from: "entry", to: "branch_a", probability: 0.25 },
            { from: "entry", to: "branch_b", probability: 0.75 }
        ],
        startNodes: ["entry"],
        endNodes: ["branch_a", "branch_b"],
        stepModels: [
            createStep({ stepId: "entry", ctMinutes: 5, leadTimeMinutes: 5 }),
            createStep({ stepId: "branch_a", ctMinutes: 10, leadTimeMinutes: 30 }),
            createStep({ stepId: "branch_b", ctMinutes: 20, leadTimeMinutes: 80 })
        ]
    });
    const analysis = buildWasteAnalysis(model, model.inputDefaults, createOutput(model, { entry: 5, branch_a: 30, branch_b: 80 }));
    assertClose(analysis.summary.totalLeadTimeMinutes, 72.5);
    assertClose(analysis.summary.totalTouchTimeMinutes, 22.5);
    assertClose(analysis.summary.totalWasteMinutes, 50);
});
run("scenario LT overrides change waste without changing throughput, and CT multipliers change the benchmark", () => {
    const model = createModel({
        nodes: [{ id: "step_a", label: "Step A" }],
        edges: [],
        startNodes: ["step_a"],
        endNodes: ["step_a"],
        stepModels: [createStep({ stepId: "step_a", ctMinutes: 10, leadTimeMinutes: 10 })]
    });
    const baseScenario = { ...model.inputDefaults };
    const ltScenario = { ...model.inputDefaults, step_step_a_leadTimeMinutes: 40 };
    const ctScenario = { ...model.inputDefaults, step_step_a_ctMultiplier: 2 };
    const baseOutput = createBottleneckForecastOutput(model, baseScenario, 0);
    const ltOutput = createBottleneckForecastOutput(model, ltScenario, 0);
    const ctOutput = createBottleneckForecastOutput(model, ctScenario, 0);
    const baseAnalysis = buildWasteAnalysis(model, baseScenario, baseOutput);
    const ltAnalysis = buildWasteAnalysis(model, ltScenario, ltOutput);
    const ctAnalysis = buildWasteAnalysis(model, ctScenario, ctOutput);
    assertClose(Number(baseOutput.globalMetrics.forecastThroughput), Number(ltOutput.globalMetrics.forecastThroughput));
    assert.ok((ltAnalysis.summary.totalWasteMinutes ?? 0) > (baseAnalysis.summary.totalWasteMinutes ?? 0));
    assertClose(ctAnalysis.stepRows[0]?.comparisonCtMinutes ?? null, 20);
});
run("CSV exports include summary and step waste fields", () => {
    const model = createModel({
        nodes: [{ id: "step_a", label: "Step A" }],
        edges: [],
        startNodes: ["step_a"],
        endNodes: ["step_a"],
        stepModels: [createStep({ stepId: "step_a", label: "Step A", ctMinutes: 10, leadTimeMinutes: 25 })]
    });
    const analysis = buildWasteAnalysis(model, model.inputDefaults, createOutput(model, { step_a: 25 }));
    const summaryCsv = buildWasteSummaryCsv(analysis);
    const stepCsv = buildWasteStepCsv(analysis);
    assert.match(summaryCsv, /Scenario Label,Weighted Total Lead Time Minutes/);
    assert.match(stepCsv, /Step Name,Comparison LT Minutes,Comparison CT Minutes/);
    assert.match(stepCsv, /Step A,25,10,15,0\.6,0\.4,1,25,10,15,no,no,no,no/);
});
