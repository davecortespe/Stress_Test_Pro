import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  createBottleneckForecastOutput,
  createConstraintForecast
} from "../src/lib/bottleneckForecast.ts";
import { buildPortableRunnerSource } from "../src/lib/exportScenarioBundle.ts";
import type { CompiledForecastModel } from "../src/types/contracts.ts";

function assertClose(actual: number | null, expected: number, epsilon = 1e-6): void {
  assert.ok(typeof actual === "number", `Expected numeric value close to ${expected}, received ${actual}`);
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be within ${epsilon} of ${expected}`);
}

async function run(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  console.log(`ok - ${name}`);
}

function createSingleStepModel(): CompiledForecastModel {
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

function createMalformedEndNodeModel(): CompiledForecastModel {
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
      status: "healthy" as const
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

function createSerialModel(stepIds: string[], ctMinutes: number[], demandRatePerHour: number): CompiledForecastModel {
  const nodes = stepIds.map((stepId) => ({ id: stepId, label: stepId, type: "process" }));
  const edges = stepIds.slice(0, -1).map((stepId, index) => ({
    from: stepId,
    to: stepIds[index + 1],
    probability: 1
  }));
  const lineCapacityPerHour = Math.min(...ctMinutes.map((value) => 60 / value));

  return {
    version: "test",
    generatedAt: "2026-03-10T00:00:00.000Z",
    metadata: {
      name: "Serial Model",
      units: "per-hour",
      mode: "constraint-forecast-non-des"
    },
    graph: {
      nodes,
      edges,
      startNodes: stepIds.length > 0 ? [stepIds[0]] : [],
      endNodes: stepIds.length > 0 ? [stepIds[stepIds.length - 1]] : []
    },
    inputs: [],
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
      activeShiftCount: "3",
      bottleneckReliefUnits: 0,
      sellingPricePerUnit: 10
    },
    stepModels: stepIds.map((stepId, index) => ({
      stepId,
      label: stepId,
      equipmentType: null,
      workerCount: 1,
      parallelProcedures: 1,
      effectiveUnits: 1,
      ctMinutes: ctMinutes[index],
      changeoverMinutes: null,
      changeoverPenaltyPerUnitMinutes: 0,
      leadTimeMinutes: 0,
      variabilityCv: 0.18,
      effectiveCtMinutes: ctMinutes[index],
      effectiveCapacityPerHour: 60 / ctMinutes[index],
      baseline: {
        demandRatePerHour,
        utilization: demandRatePerHour / (60 / ctMinutes[index]),
        headroom: Math.max(0, 1 - demandRatePerHour / (60 / ctMinutes[index])),
        queueRisk: 0,
        bottleneckIndex: 0,
        status: "healthy" as const
      }
    })),
    baseline: {
      demandRatePerHour,
      lineCapacityPerHour,
      bottleneckStepId: stepIds[0] ?? null,
      globalMetrics: {
        totalLeadTimeMinutes: ctMinutes.reduce((sum, value) => sum + value, 0)
      },
      nodeMetrics: {}
    },
    assumptions: []
  };
}

function createReworkLoopModel(): CompiledForecastModel {
  return {
    ...createSerialModel(["A", "B", "C"], [6, 6, 6], 8),
    metadata: {
      name: "Rework Loop",
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
        { from: "B", to: "A", probability: 0.2 },
        { from: "B", to: "C", probability: 0.8 }
      ],
      startNodes: ["A"],
      endNodes: ["C"]
    }
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

  assertClose(
    Number(output.globalMetrics.totalCompletedOutputPieces),
    output.nodeMetrics.C.completedQty ?? 0
  );
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
    process.stdout.write = ((chunk: string | Uint8Array) => {
      stdout += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
      return true;
    }) as typeof process.stdout.write;

    try {
      await import(`${pathToFileURL(runnerPath).href}?t=${Date.now()}`);
    } finally {
      process.argv = originalArgv;
      process.stdout.write = originalWrite;
    }

    const json = JSON.parse(stdout);
    const forecast = createConstraintForecast(model, scenario);

    assertClose(json.globalKpis.throughputPerHour, forecast.baseline.throughput);
    assertClose(
      json.topConstrainedSteps[0]?.capacityPerHour ?? null,
      forecast.baseline.stepEvals.step_a?.calendarCapacityPerHour ?? 0
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

await run("long horizon keeps balanced steps below forced saturation", () => {
  const model = createSerialModel(["A", "B", "C", "D", "E"], [6, 6, 6, 6, 6], 7);
  const scenario = { ...model.inputDefaults, simulationHorizonHours: "720" };
  const output = createBottleneckForecastOutput(model, scenario, 720);

  for (const metrics of Object.values(output.nodeMetrics)) {
    assert.ok((metrics.bottleneckIndex ?? 0) < 1, `Expected long-horizon score below 1, received ${metrics.bottleneckIndex}`);
    assert.notEqual(metrics.status, "critical", "Balanced 70% line should not force critical status at long horizon");
  }
});

await run("bottleneck flag stays independent from status under light load", () => {
  const model = createSerialModel(["A", "B", "C"], [6, 6, 6], 3);
  const output = createBottleneckForecastOutput(model, model.inputDefaults, 24);
  const flagged = Object.values(output.nodeMetrics).find((metrics) => metrics.bottleneckFlag);

  assert.ok(flagged, "Expected one bottleneck flag");
  assert.equal(flagged?.status, "healthy");
});

await run("processed quantity is pass-through while completed quantity is terminal-only", () => {
  const model = createSerialModel(["A", "B", "C"], [6, 6, 6], 8);
  const output = createBottleneckForecastOutput(model, model.inputDefaults, 8);

  assert.ok((output.nodeMetrics.A.processedQty ?? 0) > 0, "Expected upstream processed quantity");
  assert.equal(output.nodeMetrics.A.completedQty ?? 0, 0, "Upstream step should not report terminal completions");
  assert.ok((output.nodeMetrics.C.completedQty ?? 0) > 0, "Terminal step should report completions");
});

await run("rework loop visit factors solve to convergent values and emit a warning", () => {
  const model = createReworkLoopModel();
  const forecast = createConstraintForecast(model, model.inputDefaults);

  assert.ok(forecast.warnings.length > 0, "Expected rework warning");
  assertClose(forecast.visitFactors.A ?? null, 1.25, 1e-3);
  assertClose(forecast.visitFactors.B ?? null, 1.25, 1e-3);
});

await run("zero demand produces zero throughput and zero queue", () => {
  const model = createSerialModel(["A", "B", "C"], [6, 6, 6], 8);
  const scenario = { ...model.inputDefaults, demandMultiplier: 0 };
  const output = createBottleneckForecastOutput(model, scenario, 24);

  assertClose(Number(output.globalMetrics.forecastThroughput), 0, 1e-9);
  assertClose(Number(output.globalMetrics.totalCompletedOutputPieces), 0, 1e-9);
  for (const metrics of Object.values(output.nodeMetrics)) {
    assertClose(metrics.utilization ?? null, 0, 1e-9);
    assertClose(metrics.queueDepth ?? null, 0, 1e-9);
  }
});

await run("brittleness stays runtime-only when relief bottleneck differs analytically", () => {
  const model = createSerialModel(["A", "B", "C"], [12, 7.5, 6], 7);
  const scenario = { ...model.inputDefaults, bottleneckReliefUnits: 1 };
  const forecast = createConstraintForecast(model, scenario);
  const output = createBottleneckForecastOutput(model, scenario, 1);
  const runtimeBottleneckId =
    Object.entries(output.nodeMetrics).find(([, metrics]) => metrics.bottleneckFlag)?.[0] ?? null;

  assert.equal(runtimeBottleneckId, "A");
  assert.equal(forecast.relief.bottleneckStepId, "B");

  const knownNodes = Object.values(output.nodeMetrics).filter((step) => step.utilization !== null);
  const topScore = Number(output.globalMetrics.bottleneckIndex);
  const secondScore =
    [...knownNodes]
      .map((step) => step.bottleneckIndex ?? 0)
      .sort((a, b) => b - a)[1] ?? 0;
  const margin = Math.max(0, topScore - secondScore);
  const nearSatCount = knownNodes.filter((step) => (step.utilization ?? 0) >= 0.9).length;
  const cascadePressure = knownNodes.length > 0 ? nearSatCount / knownNodes.length : 0;
  const avgQueueRisk =
    knownNodes.reduce((sum, step) => sum + (step.queueRisk ?? 0), 0) / Math.max(1, knownNodes.length);
  const wipPressure = Math.max(
    0,
    Math.min(1, Number(output.globalMetrics.totalWipQty) / Math.max(1, 24 * model.stepModels.length * 10))
  );
  const expectedBrittleness = Math.max(
    0,
    Math.min(
      1,
      0.48 * topScore +
        0.18 * avgQueueRisk +
        0.16 * cascadePressure +
        0.18 * wipPressure +
        (margin < 0.08 ? 0.06 : 0) -
        margin * 0.3
    )
  );

  assertClose(Number(output.globalMetrics.brittleness), expectedBrittleness, 1e-9);
});
