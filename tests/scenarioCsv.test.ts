import assert from "node:assert/strict";
import {
  buildScenarioLibraryColumns,
  createScenarioLibraryContext,
  mergeScenarioRowWithBaseline,
  parseScenarioLibrary,
  serializeScenarioLibrary,
  upsertScenarioLibraryEntry
} from "../src/lib/scenarioCsv.ts";
import type { ScenarioLibraryEntry } from "../src/types/contracts.ts";

function run(name: string, fn: () => void): void {
  fn();
  console.log(`ok - ${name}`);
}

const baselineScenario = {
  step_cut_ctBaseline: 10,
  step_cut_materialCostPerUnit: 0,
  step_pack_capacityUnits: 2
};
const scenarioColumns = [
  "step_cut_ctBaseline",
  "step_cut_materialCostPerUnit",
  "step_pack_capacityUnits"
];

run("buildScenarioLibraryColumns is deterministic", () => {
  assert.deepEqual(buildScenarioLibraryColumns(scenarioColumns), [
    "schemaVersion",
    "scenarioId",
    "scenarioName",
    "savedAt",
    "appTitle",
    "modelName",
    "step_cut_ctBaseline",
    "step_cut_materialCostPerUnit",
    "step_pack_capacityUnits",
    "savedForecastThroughput",
    "savedBottleneckIndex",
    "savedTotalWipQty",
    "savedTotalCompletedOutputPieces",
    "savedActiveConstraintName",
    "savedWeightedLeadTimeMinutes",
    "savedTocThroughputPerUnit"
  ]);
});

run("serialize and parse scenario library round-trip mixed values", () => {
  const entries: ScenarioLibraryEntry[] = [
    {
      scenarioId: "scenario-1",
      scenarioName: "Baseline",
      savedAt: "2026-03-09T12:00:00.000Z",
      scenario: {
        step_cut_ctBaseline: 8.5,
        step_cut_materialCostPerUnit: 4,
        step_pack_capacityUnits: 5
      }
    }
  ];
  const csv = serializeScenarioLibrary(
    entries,
    createScenarioLibraryContext("Ops App", "Model A"),
    scenarioColumns
  );
  const parsed = parseScenarioLibrary(csv, scenarioColumns);

  assert.equal(parsed.issues.filter((issue) => issue.severity === "error").length, 0);
  assert.equal(parsed.entries.length, 1);
  assert.equal(parsed.entries[0]?.scenario.step_cut_ctBaseline, 8.5);
  assert.equal(parsed.entries[0]?.scenario.step_cut_materialCostPerUnit, 4);
  assert.equal(parsed.entries[0]?.scenario.step_pack_capacityUnits, 5);
});

run("empty cells fall back to baseline and unknown columns are ignored", () => {
  const csv = [
    "schemaVersion,scenarioId,scenarioName,savedAt,appTitle,modelName,step_cut_ctBaseline,demandMultiplier,unknownColumn",
    "2,scenario-2,Partial,2026-03-09T13:00:00.000Z,Ops App,Model A,12,1.4,ignored"
  ].join("\n");
  const parsed = parseScenarioLibrary(csv, scenarioColumns);

  assert.equal(parsed.entries.length, 1);
  assert.equal(parsed.entries[0]?.scenario.step_cut_ctBaseline, 12);
  assert.equal(parsed.entries[0]?.scenario.demandMultiplier, undefined);
  assert.ok(parsed.issues.some((issue) => issue.column === "unknownColumn"));
  assert.ok(parsed.issues.some((issue) => issue.column === "demandMultiplier"));
});

run("mergeScenarioRowWithBaseline overlays only defined values", () => {
  assert.deepEqual(
    mergeScenarioRowWithBaseline(
      {
        step_cut_ctBaseline: 12,
        step_pack_capacityUnits: undefined
      },
      baselineScenario
    ),
    {
      step_cut_ctBaseline: 12,
      step_cut_materialCostPerUnit: 0,
      step_pack_capacityUnits: 2
    }
  );
});

run("upsertScenarioLibraryEntry updates existing rows and appends new ones", () => {
  const baseEntry: ScenarioLibraryEntry = {
    scenarioId: "scenario-1",
    scenarioName: "Baseline",
    savedAt: "2026-03-09T12:00:00.000Z",
    scenario: { ...baselineScenario }
  };
  const updated = upsertScenarioLibraryEntry([baseEntry], {
    ...baseEntry,
    scenarioName: "Baseline Updated"
  });
  const appended = upsertScenarioLibraryEntry(updated, {
    scenarioId: "scenario-2",
    scenarioName: "Second",
    savedAt: "2026-03-09T13:00:00.000Z",
    scenario: { ...baselineScenario, step_pack_capacityUnits: 6 }
  });

  assert.equal(updated.length, 1);
  assert.equal(updated[0]?.scenarioName, "Baseline Updated");
  assert.equal(appended.length, 2);
  assert.equal(appended[1]?.scenarioId, "scenario-2");
});
