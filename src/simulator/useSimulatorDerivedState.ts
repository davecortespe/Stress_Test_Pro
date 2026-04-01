import { useMemo } from "react";
import { buildAssumptionsReport } from "../lib/assumptionsReport";
import { createBottleneckForecastOutput } from "../lib/bottleneckForecast";
import { buildKaizenReport } from "../lib/kaizenReport";
import { buildThroughputAnalysis } from "../lib/throughputAnalysis";
import { buildWasteAnalysis } from "../lib/wasteAnalysis";
import type {
  CompiledForecastModel,
  DashboardConfig,
  ForecastGlobalMetrics,
  KpiConfig,
  MasterData,
  ScenarioLibraryEntry,
  ScenarioSavedMetrics,
  SimulatorResultsMode
} from "../types/contracts";
import {
  buildInspectorValues,
  buildResolvedStepScenario,
  type ScenarioState
} from "./scenarioState";
import {
  assumptionsKpis,
  kaizenKpis,
  throughputKpis,
  wasteKpis
} from "./simulatorConfig";
import { useOperationalDiagnosis } from "./useOperationalDiagnosis";

interface UseSimulatorDerivedStateInput {
  forecastModel: CompiledForecastModel;
  masterData: MasterData;
  dashboardConfig: DashboardConfig;
  committedScenario: ScenarioState;
  activeScenario: ScenarioState;
  simElapsedHours: number;
  simHorizonHours: number;
  isPaused: boolean;
  inspectorStepId: string | null;
  resultsMode: SimulatorResultsMode;
  slotA: ScenarioLibraryEntry | null;
  slotB: ScenarioLibraryEntry | null;
  baselineScenario: ScenarioState;
}

type ActiveMetrics = ForecastGlobalMetrics | Record<string, number | string | undefined>;

export function useSimulatorDerivedState({
  forecastModel,
  masterData,
  dashboardConfig,
  committedScenario,
  activeScenario,
  simElapsedHours,
  simHorizonHours,
  isPaused,
  inspectorStepId,
  resultsMode,
  slotA,
  slotB,
  baselineScenario
}: UseSimulatorDerivedStateInput) {
  const output = useMemo(
    () => createBottleneckForecastOutput(forecastModel, committedScenario, simElapsedHours),
    [forecastModel, committedScenario, simElapsedHours]
  );

  const operationalDiagnosis = useOperationalDiagnosis({
    forecastModel,
    output,
    committedScenario,
    isPaused,
    simElapsedHours
  });

  const throughputAnalysis = useMemo(
    () => buildThroughputAnalysis(forecastModel, masterData, committedScenario, output),
    [forecastModel, masterData, committedScenario, output]
  );
  const wasteAnalysis = useMemo(
    () => buildWasteAnalysis(forecastModel, committedScenario, output),
    [forecastModel, committedScenario, output]
  );
  const kaizenReport = useMemo(
    () => buildKaizenReport(forecastModel, committedScenario, output),
    [forecastModel, committedScenario, output]
  );
  const assumptionsReport = useMemo(() => buildAssumptionsReport(forecastModel), [forecastModel]);

  const inspectorDefaultsByStepId = useMemo(
    () =>
      new Map(
        (masterData.processing ?? []).map((row) => [
          row.stepId,
          {
            materialCostPerUnit: row.materialCostPerUnit ?? null,
            laborRatePerHour: row.laborRatePerHour ?? null,
            equipmentRatePerHour: row.equipmentRatePerHour ?? null
          }
        ])
      ),
    [masterData]
  );

  const inspectorStep = useMemo(
    () => forecastModel.stepModels.find((step) => step.stepId === inspectorStepId) ?? null,
    [forecastModel.stepModels, inspectorStepId]
  );

  const inspectorValues = useMemo(
    () =>
      buildInspectorValues(
        inspectorStep,
        activeScenario,
        inspectorStep ? inspectorDefaultsByStepId.get(inspectorStep.stepId) : undefined
      ),
    [activeScenario, inspectorDefaultsByStepId, inspectorStep]
  );

  const resolvedStepScenario = useMemo(
    () =>
      buildResolvedStepScenario(
        forecastModel.stepModels,
        committedScenario,
        inspectorDefaultsByStepId
      ),
    [committedScenario, forecastModel.stepModels, inspectorDefaultsByStepId]
  );

  const kaizenMetrics = useMemo<Record<string, number | string>>(
    () => ({
      topOpportunity: kaizenReport.kpiSummary.topOpportunity,
      topOpportunityScore: kaizenReport.kpiSummary.topOpportunityScore,
      opportunityCount: kaizenReport.kpiSummary.opportunityCount,
      fishboneFocus: kaizenReport.kpiSummary.fishboneFocus,
      missingSignalsCount: kaizenReport.kpiSummary.missingSignalsCount
    }),
    [kaizenReport.kpiSummary]
  );

  const assumptionsMetrics = useMemo<Record<string, number | string>>(
    () => ({
      trustLevel: assumptionsReport.trustLevel,
      totalAssumptions: assumptionsReport.counts.total,
      needsReview: assumptionsReport.counts.warning + assumptionsReport.counts.blocker,
      priorityChecks: assumptionsReport.priorityChecks.length
    }),
    [assumptionsReport]
  );

  const currentSavedMetrics = useMemo<ScenarioSavedMetrics>(
    () => ({
      forecastThroughput: output.globalMetrics.forecastThroughput ?? 0,
      bottleneckIndex: output.globalMetrics.bottleneckIndex ?? 0,
      totalWipQty: output.globalMetrics.totalWipQty ?? 0,
      totalCompletedOutputPieces: output.globalMetrics.totalCompletedOutputPieces ?? 0,
      activeConstraintName: operationalDiagnosis.primaryConstraint,
      weightedLeadTimeMinutes: wasteAnalysis.summary.totalLeadTimeMinutes ?? 0,
      tocThroughputPerUnit: throughputAnalysis.summary.tocThroughputPerUnit ?? "Blocked"
    }),
    [
      operationalDiagnosis.primaryConstraint,
      output.globalMetrics,
      throughputAnalysis.summary,
      wasteAnalysis.summary
    ]
  );

  const activeKpis = useMemo<KpiConfig[]>(() => {
    if (resultsMode === "throughput") return throughputKpis;
    if (resultsMode === "kaizen") return kaizenKpis;
    if (resultsMode === "assumptions") return assumptionsKpis;
    if (resultsMode === "waste") return wasteKpis;
    return dashboardConfig.kpis;
  }, [dashboardConfig.kpis, resultsMode]);

  const activeMetrics = useMemo<ActiveMetrics>(() => {
    if (resultsMode === "throughput") {
      return {
        tocThroughputPerUnit: throughputAnalysis.summary.tocThroughputPerUnit ?? "Blocked",
        fullyLoadedProfitPerUnit: throughputAnalysis.summary.fullyLoadedProfitPerUnit ?? "Blocked",
        tocThroughputPerBottleneckMinute:
          throughputAnalysis.summary.tocThroughputPerBottleneckMinute ?? "Blocked",
        estimatedGainPercent: throughputAnalysis.summary.estimatedGainPercent ?? "Blocked"
      };
    }
    if (resultsMode === "waste") {
      return {
        totalLeadTimeMinutes: wasteAnalysis.summary.totalLeadTimeMinutes ?? 0,
        totalTouchTimeMinutes: wasteAnalysis.summary.totalTouchTimeMinutes ?? 0,
        totalWasteMinutes: wasteAnalysis.summary.totalWasteMinutes ?? 0,
        totalWastePct: wasteAnalysis.summary.totalWastePct ?? 0,
        topWasteStep: wasteAnalysis.summary.topWasteStep || "n/a"
      };
    }
    if (resultsMode === "kaizen") return kaizenMetrics;
    if (resultsMode === "assumptions") return assumptionsMetrics;
    return output.globalMetrics;
  }, [
    assumptionsMetrics,
    kaizenMetrics,
    output.globalMetrics,
    resultsMode,
    throughputAnalysis.summary,
    wasteAnalysis.summary
  ]);

  const simProgressPct = useMemo(() => {
    if (!Number.isFinite(simHorizonHours) || simHorizonHours <= 0) return 0;
    return Math.max(0, Math.min(100, (simElapsedHours / simHorizonHours) * 100));
  }, [simElapsedHours, simHorizonHours]);

  const isRunComplete = useMemo(
    () => isPaused && simElapsedHours >= simHorizonHours - 1e-6,
    [isPaused, simElapsedHours, simHorizonHours]
  );

  const pinnedEntries = useMemo(() => {
    return [slotA, slotB]
      .filter((entry): entry is ScenarioLibraryEntry => entry !== null)
      .map((entry) => {
        if (entry.savedMetrics) {
          return entry;
        }
        const reScenario = { ...baselineScenario, ...entry.scenario };
        const reOutput = createBottleneckForecastOutput(forecastModel, reScenario, simHorizonHours);
        const reThroughput = buildThroughputAnalysis(forecastModel, masterData, reScenario, reOutput);
        const reWaste = buildWasteAnalysis(forecastModel, reScenario, reOutput);
        const reBottleneckStep = forecastModel.stepModels.find(
          (step) => reOutput.nodeMetrics[step.stepId]?.bottleneckFlag
        );
        return {
          ...entry,
          savedMetrics: {
            forecastThroughput: reOutput.globalMetrics.forecastThroughput ?? 0,
            bottleneckIndex: reOutput.globalMetrics.bottleneckIndex ?? 0,
            totalWipQty: reOutput.globalMetrics.totalWipQty ?? 0,
            totalCompletedOutputPieces: reOutput.globalMetrics.totalCompletedOutputPieces ?? 0,
            activeConstraintName: reBottleneckStep?.label ?? "—",
            weightedLeadTimeMinutes: reWaste.summary.totalLeadTimeMinutes ?? 0,
            tocThroughputPerUnit: reThroughput.summary.tocThroughputPerUnit ?? "Blocked"
          }
        };
      });
  }, [slotA, slotB, baselineScenario, forecastModel, masterData, simHorizonHours]);

  const flowReferenceMetrics = useMemo<Record<string, number> | undefined>(() => {
    const baseline = pinnedEntries[0]?.savedMetrics;
    if (!baseline) {
      return undefined;
    }
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(baseline)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        result[key] = value;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }, [pinnedEntries]);

  return {
    output,
    operationalDiagnosis,
    throughputAnalysis,
    wasteAnalysis,
    kaizenReport,
    assumptionsReport,
    inspectorStep,
    inspectorValues,
    resolvedStepScenario,
    currentSavedMetrics,
    activeKpis,
    activeMetrics,
    simProgressPct,
    isRunComplete,
    pinnedEntries,
    flowReferenceMetrics,
    flowReferenceLabel: pinnedEntries[0]?.scenarioName
  };
}