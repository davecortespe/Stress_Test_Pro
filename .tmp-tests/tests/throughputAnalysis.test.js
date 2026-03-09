import assert from "node:assert/strict";
import { createBottleneckForecastOutput } from "../src/lib/bottleneckForecast.js";
import { buildThroughputAnalysis, buildThroughputStepCsv, buildThroughputSummaryCsv } from "../src/lib/throughputAnalysis.js";
function assertClose(actual, expected, epsilon = 1e-9) {
    assert.ok(typeof actual === "number", `Expected numeric value close to ${expected}, received ${actual}`);
    assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be within ${epsilon} of ${expected}`);
}
function createModel() {
    return {
        version: "test",
        generatedAt: "2026-03-09T00:00:00.000Z",
        metadata: {
            name: "Fixture Scenario",
            units: "per-hour",
            mode: "constraint-forecast-non-des"
        },
        graph: {
            nodes: [
                { id: "cut", label: "Cut", type: "process" },
                { id: "pack", label: "Pack", type: "process" }
            ],
            edges: [{ from: "cut", to: "pack", probability: 1 }],
            startNodes: ["cut"],
            endNodes: ["pack"]
        },
        inputs: [],
        inputDefaults: {
            demandRatePerHour: 10,
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
            bottleneckReliefUnits: 1,
            sellingPricePerUnit: 100
        },
        stepModels: [
            {
                stepId: "cut",
                label: "Cut",
                equipmentType: "cut_station",
                workerCount: 1,
                parallelProcedures: 1,
                effectiveUnits: 1,
                ctMinutes: 10,
                changeoverMinutes: null,
                changeoverPenaltyPerUnitMinutes: 0,
                leadTimeMinutes: 0,
                variabilityCv: 0.18,
                effectiveCtMinutes: 10,
                effectiveCapacityPerHour: 6,
                baseline: {
                    demandRatePerHour: 10,
                    utilization: 1,
                    headroom: 0,
                    queueRisk: 1,
                    bottleneckIndex: 1,
                    status: "critical"
                }
            },
            {
                stepId: "pack",
                label: "Pack",
                equipmentType: "pack_station",
                workerCount: 1,
                parallelProcedures: 1,
                effectiveUnits: 1,
                ctMinutes: 6,
                changeoverMinutes: null,
                changeoverPenaltyPerUnitMinutes: 0,
                leadTimeMinutes: 0,
                variabilityCv: 0.18,
                effectiveCtMinutes: 6,
                effectiveCapacityPerHour: 10,
                baseline: {
                    demandRatePerHour: 10,
                    utilization: 1,
                    headroom: 0,
                    queueRisk: 0.5,
                    bottleneckIndex: 0.5,
                    status: "risk"
                }
            }
        ],
        baseline: {
            demandRatePerHour: 10,
            lineCapacityPerHour: 6,
            bottleneckStepId: "cut",
            globalMetrics: {
                totalLeadTimeMinutes: 0
            },
            nodeMetrics: {}
        },
        assumptions: []
    };
}
function createMasterData() {
    return {
        products: [{ productId: "A100", family: "A", sellingPricePerUnit: 100 }],
        equipment: [],
        processing: [
            {
                stepId: "cut",
                equipmentType: "cut_station",
                productKey: "*",
                materialCostPerUnit: 15,
                laborRatePerHour: 8,
                equipmentRatePerHour: 3
            },
            {
                stepId: "pack",
                equipmentType: "pack_station",
                productKey: "*",
                materialCostPerUnit: 5,
                laborRatePerHour: 4,
                equipmentRatePerHour: 2
            }
        ],
        economicsDefaults: {
            sellingPricePerUnit: 100
        }
    };
}
function run(name, fn) {
    fn();
    console.log(`ok - ${name}`);
}
run("buildThroughputAnalysis computes costs, leverage, and low-efficiency status", () => {
    const model = createModel();
    const masterData = createMasterData();
    const scenario = {
        ...model.inputDefaults,
        sellingPricePerUnit: 100
    };
    const output = createBottleneckForecastOutput(model, scenario, 0);
    const analysis = buildThroughputAnalysis(model, masterData, scenario, output);
    const expectedLaborCostPerUnit = (8 * 10) / 60 + (4 * 6) / 60;
    const expectedEquipmentCostPerUnit = (3 * 10) / 60 + (2 * 6) / 60;
    const completedUnits = Number(output.globalMetrics.totalCompletedOutputPieces);
    assert.equal(analysis.hasBlockingErrors, false);
    assert.equal(analysis.summary.materialCostPerUnit, 20);
    assertClose(analysis.summary.laborCostPerUnit, expectedLaborCostPerUnit);
    assertClose(analysis.summary.equipmentCostPerUnit, expectedEquipmentCostPerUnit);
    assert.equal(analysis.summary.tocThroughputPerUnit, 80);
    assertClose(analysis.summary.fullyLoadedProfitPerUnit, 100 - 20 - expectedLaborCostPerUnit - expectedEquipmentCostPerUnit);
    assert.equal(analysis.summary.primaryBottleneck, "Cut");
    assert.equal(analysis.summary.nextBottleneck, "Pack");
    assert.equal(analysis.summary.efficiencyStatus, "low");
    assert.equal(analysis.profitLossRows[0]?.label, "Total transfer price");
    assertClose(analysis.profitLossRows[0]?.total ?? null, (analysis.summary.sellingPrice ?? 0) * completedUnits);
    assertClose(analysis.profitLossRows[4]?.total ?? null, (analysis.summary.fullyLoadedProfitPerUnit ?? 0) * completedUnits);
    assertClose(analysis.stepRows.reduce((sum, row) => sum + (row.totalStepCost ?? 0), 0), (analysis.summary.materialCostPerUnit ?? 0) +
        (analysis.summary.laborCostPerUnit ?? 0) +
        (analysis.summary.equipmentCostPerUnit ?? 0));
});
run("scenario step-cost overrides take precedence over master-data defaults", () => {
    const model = createModel();
    const masterData = createMasterData();
    const scenario = {
        ...model.inputDefaults,
        sellingPricePerUnit: 100,
        step_cut_materialCostPerUnit: 30,
        step_pack_laborRatePerHour: 9
    };
    const output = createBottleneckForecastOutput(model, scenario, 0);
    const analysis = buildThroughputAnalysis(model, masterData, scenario, output);
    assert.equal(analysis.summary.materialCostPerUnit, 35);
    assertClose(analysis.summary.laborCostPerUnit, (8 * 10) / 60 + (9 * 6) / 60);
});
run("missing selling price blocks analysis while missing costs use app defaults", () => {
    const model = createModel();
    const masterData = {
        ...createMasterData(),
        economicsDefaults: {
            sellingPricePerUnit: null
        },
        processing: [
            {
                stepId: "cut",
                equipmentType: "cut_station",
                productKey: "*",
                materialCostPerUnit: null,
                laborRatePerHour: null,
                equipmentRatePerHour: null
            },
            {
                stepId: "pack",
                equipmentType: "pack_station",
                productKey: "*",
                materialCostPerUnit: null,
                laborRatePerHour: null,
                equipmentRatePerHour: null
            }
        ]
    };
    const scenario = {
        ...model.inputDefaults,
        sellingPricePerUnit: 0
    };
    const output = createBottleneckForecastOutput(model, scenario, 0);
    const analysis = buildThroughputAnalysis(model, masterData, scenario, output);
    assert.equal(analysis.hasBlockingErrors, true);
    assert.ok(analysis.validations.some((validation) => validation.code === "selling-price-missing"));
    assert.equal(analysis.summary.materialCostPerUnit, 0);
    assert.equal(analysis.summary.laborCostPerUnit, 8);
    assert.equal(analysis.summary.equipmentCostPerUnit, 5.333333333333333);
});
run("profit and loss totals sum known costs and floor transfer-price lots", () => {
    const model = createModel();
    const masterData = {
        ...createMasterData(),
        processing: [
            {
                stepId: "cut",
                equipmentType: "cut_station",
                productKey: "*",
                materialCostPerUnit: null,
                laborRatePerHour: 8,
                equipmentRatePerHour: null
            },
            {
                stepId: "pack",
                equipmentType: "pack_station",
                productKey: "*",
                materialCostPerUnit: 5,
                laborRatePerHour: 4,
                equipmentRatePerHour: 2
            }
        ]
    };
    const scenario = {
        ...model.inputDefaults,
        sellingPricePerUnit: 100
    };
    const output = createBottleneckForecastOutput(model, scenario, 0);
    output.globalMetrics.totalCompletedOutputPieces = 1.5;
    const analysis = buildThroughputAnalysis(model, masterData, scenario, output);
    assertClose(analysis.profitLossRows[0]?.total ?? null, 100);
    assertClose(analysis.profitLossRows[1]?.total ?? null, 7.5);
    assertClose(analysis.profitLossRows[2]?.total ?? null, ((8 * 10) / 60 + (4 * 6) / 60) * 1.5);
    assertClose(analysis.profitLossRows[3]?.total ?? null, (((20 * 10) / 60) + ((2 * 6) / 60)) * 1.5);
    assertClose(analysis.profitLossRows[4]?.total ?? null, 100 - 7.5 - (((8 * 10) / 60 + (4 * 6) / 60) * 1.5) - ((((20 * 10) / 60) + ((2 * 6) / 60)) * 1.5));
});
run("CSV builders include the expected summary and step fields", () => {
    const model = createModel();
    const masterData = createMasterData();
    const scenario = {
        ...model.inputDefaults,
        sellingPricePerUnit: 100
    };
    const output = createBottleneckForecastOutput(model, scenario, 0);
    const analysis = buildThroughputAnalysis(model, masterData, scenario, output);
    const summaryCsv = buildThroughputSummaryCsv(analysis);
    const stepCsv = buildThroughputStepCsv(analysis);
    assert.match(summaryCsv, /Scenario Label,Product Family,Transfer Price/);
    assert.match(summaryCsv, /Fixture Scenario,A,100/);
    assert.match(stepCsv, /Step Name,Material Cost Per Unit,Labor Rate Per Hour,Labor Cost Per Unit,Equipment Rate Per Hour,Equipment Cost Per Unit,Total Step Cost Per Unit,Missing Costs/);
    assert.match(stepCsv, /Cut,15,8,1\.3333333333333333,3,0\.5,16\.833333333333332,no/);
});
