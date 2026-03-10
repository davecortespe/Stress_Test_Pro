import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createBottleneckForecastOutput, createConstraintForecast } from "../src/lib/bottleneckForecast.js";
import { buildPortableRunnerSource } from "../src/lib/exportScenarioBundle.js";
function assertClose(actual, expected, epsilon = 1e-6) {
    assert.ok(typeof actual === "number", `Expected numeric value close to ${expected}, received ${actual}`);
    assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be within ${epsilon} of ${expected}`);
}
async function run(name, fn) {
    await fn();
    console.log(`ok - ${name}`);
}
function createSingleStepModel() {
    return {
        version: "test",
        generatedAt: "2026-03-10T00:00:00.000Z",
        metadata: {
            name: "Single Step",
            units: "per-hour",
            mode: "constraint-forecast-non-des"
        },
        graph: {
            nodes: [{ id: "step_a", label: "Step A", type: "process" }],
            edges: [],
            startNodes: ["step_a"],
            endNodes: ["step_a"]
        },
        inputs: [],
        inputDefaults: {
            demandRatePerHour: 1,
            demandMultiplier: 1,
            mixProfile: "balanced",
            staffingMultiplier: 1,
            equipmentMultiplier: 1,
            unplannedDowntimePct: 0,
            ctMultiplier: 1,
            setupPenaltyMultiplier: 1,
            variabilityMultiplier: 1,
            simulationHorizonHours: "24",
            activeShiftCount: "1",
            bottleneckReliefUnits: 0,
            sellingPricePerUnit: 100
        },
        stepModels: [
            {
                stepId: "step_a",
                label: "Step A",
                equipmentType: null,
                workerCount: 1,
                parallelProcedures: 1,
                effectiveUnits: 1,
                ctMinutes: 60,
                changeoverMinutes: null,
                changeoverPenaltyPerUnitMinutes: 0,
                leadTimeMinutes: 0,
                variabilityCv: 0.18,
                effectiveCtMinutes: 60,
                effectiveCapacityPerHour: 1,
                baseline: {
                    demandRatePerHour: 1,
                    utilization: 1,
                    headroom: 0,
                    queueRisk: 1,
                    bottleneckIndex: 1,
                    status: "critical"
                }
            }
        ],
        baseline: {
            demandRatePerHour: 1,
            lineCapacityPerHour: 1,
            bottleneckStepId: "step_a",
            globalMetrics: {
                totalLeadTimeMinutes: 60
            },
            nodeMetrics: {}
        },
        assumptions: []
    };
}
function createMalformedEndNodeModel() {
    const stepTemplate = {
        equipmentType: null,
        workerCount: 1,
        parallelProcedures: 1,
        effectiveUnits: 1,
        ctMinutes: 1,
        changeoverMinutes: null,
        changeoverPenaltyPerUnitMinutes: 0,
        leadTimeMinutes: 0,
        variabilityCv: 0.18,
        effectiveCtMinutes: 1,
        effectiveCapacityPerHour: 60,
        baseline: {
            demandRatePerHour: 1,
            utilization: 0.1,
            headroom: 0.9,
            queueRisk: 0,
            bottleneckIndex: 0,
            status: "healthy"
        }
    };
    return {
        version: "test",
        generatedAt: "2026-03-10T00:00:00.000Z",
        metadata: {
            name: "Malformed End Node Model",
            units: "per-hour",
            mode: "constraint-forecast-non-des"
        },
        graph: {
            nodes: [
                { id: "A", label: "A", type: "process" },
                { id: "B", label: "B", type: "process" },
                { id: "C", label: "C", type: "process" }
            ],
            edges: [
                { from: "A", to: "B", probability: 1 },
                { from: "B", to: "C", probability: 1 }
            ],
            startNodes: ["A"],
            endNodes: ["B", "C"]
        },
        inputs: [],
        inputDefaults: {
            demandRatePerHour: 1,
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
            sellingPricePerUnit: 10
        },
        stepModels: [
            { stepId: "A", label: "A", ...stepTemplate },
            { stepId: "B", label: "B", ...stepTemplate },
            { stepId: "C", label: "C", ...stepTemplate }
        ],
        baseline: {
            demandRatePerHour: 1,
            lineCapacityPerHour: 60,
            bottleneckStepId: "A",
            globalMetrics: {
                totalLeadTimeMinutes: 0
            },
            nodeMetrics: {}
        },
        assumptions: []
    };
}
await run("runtime utilization stays saturated across off-shift horizons", () => {
    const model = createSingleStepModel();
    const output = createBottleneckForecastOutput(model, model.inputDefaults, 24);
    const node = output.nodeMetrics.step_a;
    assert.ok((node.utilization ?? 0) > 0.95, `Expected utilization to stay high, received ${node.utilization}`);
    assert.ok((node.queueDepth ?? 0) > 0, `Expected queue to build, received ${node.queueDepth}`);
});
await run("lead time uses calendar capacity for queue delay under partial shifts", () => {
    const model = createSingleStepModel();
    const output = createBottleneckForecastOutput(model, model.inputDefaults, 24);
    const node = output.nodeMetrics.step_a;
    const expectedLeadTime = 60 + (((node.queueDepth ?? 0) / Math.max(0.001, node.capacityPerHour ?? 0)) * 60);
    assertClose(node.leadTimeMinutes ?? null, expectedLeadTime);
});
await run("terminal completion ignores malformed end nodes with outgoing edges", () => {
    const model = createMalformedEndNodeModel();
    const output = createBottleneckForecastOutput(model, model.inputDefaults, 2);
    assertClose(Number(output.globalMetrics.totalCompletedOutputPieces), output.nodeMetrics.C.completedQty ?? 0);
});
await run("portable export runner matches app constraint forecast under shift limits", async () => {
    const model = createSingleStepModel();
    const scenario = { ...model.inputDefaults };
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "forecast-runner-"));
    try {
        fs.writeFileSync(path.join(tempDir, "compiled_forecast_model.json"), JSON.stringify(model, null, 2));
        fs.writeFileSync(path.join(tempDir, "scenario_committed.json"), JSON.stringify(scenario, null, 2));
        const runnerPath = path.join(tempDir, "run_forecast.mjs");
        fs.writeFileSync(runnerPath, buildPortableRunnerSource());
        const originalArgv = process.argv.slice();
        const originalWrite = process.stdout.write.bind(process.stdout);
        let stdout = "";
        process.argv = [process.execPath, runnerPath, "--path", tempDir, "--json"];
        process.stdout.write = ((chunk) => {
            stdout += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
            return true;
        });
        try {
            await import(`${pathToFileURL(runnerPath).href}?t=${Date.now()}`);
        }
        finally {
            process.argv = originalArgv;
            process.stdout.write = originalWrite;
        }
        const json = JSON.parse(stdout);
        const forecast = createConstraintForecast(model, scenario);
        assertClose(json.globalKpis.throughputPerHour, forecast.baseline.throughput);
        assertClose(json.topConstrainedSteps[0]?.capacityPerHour ?? null, forecast.baseline.stepEvals.step_a?.calendarCapacityPerHour ?? 0);
    }
    finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});
