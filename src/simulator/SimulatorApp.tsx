import { useEffect, useMemo, useRef, useState } from "react";
import { AssumptionsReportPanel } from "../components/AssumptionsReportPanel";
import { DashboardHeader } from "../components/DashboardHeader";
import { GraphCanvas } from "../components/GraphCanvas";
import { KaizenReportPanel } from "../components/KaizenReportPanel";
import { KpiRow } from "../components/KpiRow";
import { OperationalDiagnosisCard } from "../components/OperationalDiagnosisCard";
import { ParameterSidebar } from "../components/ParameterSidebar";
import { ScenarioLibraryPanel } from "../components/ScenarioLibraryPanel";
import { StepInspector } from "../components/StepInspector";
import { ThroughputAnalysisPanel } from "../components/ThroughputAnalysisPanel";
import { WasteAnalysisPanel } from "../components/WasteAnalysisPanel";
import { buildAssumptionsReport } from "../lib/assumptionsReport";
import { createBottleneckForecastOutput } from "../lib/bottleneckForecast";
import {
  buildOperationalDiagnosis
} from "../lib/operationalDiagnosis";
import { buildKaizenReport } from "../lib/kaizenReport";
import {
  buildThroughputAnalysis,
  buildThroughputStepCsv,
  buildThroughputSummaryCsv
} from "../lib/throughputAnalysis";
import {
  buildWasteAnalysis,
  buildWasteStepCsv,
  buildWasteSummaryCsv
} from "../lib/wasteAnalysis";
import type {
  CompiledForecastModel,
  DashboardConfig,
  KpiConfig,
  MasterData,
  SimulatorResultsMode
} from "../types/contracts";
import compiledForecastModelJson from "../../models/active/compiled_forecast_model.json";
import masterDataJson from "../../models/active/master_data.json";
import dashboardConfigJson from "../../models/dashboard_config.json";
import {
  bindParameterGroupsToForecast,
  buildResolvedStepScenario,
  buildScenarioLibraryStepColumns,
  buildInspectorValues,
  getDefaultScenario
} from "./scenarioState";
import { getExportBundleData, getStartupScenarioOverride } from "./runtimeData";
import { useScenarioLibrary } from "./useScenarioLibrary";
import { useScenarioSession } from "./useScenarioSession";
import "./simulator.css";

interface ExportNotice {
  tone: "success" | "error";
  text: string;
}

const RESULTS_MODE_LABELS: Record<SimulatorResultsMode, string> = {
  flow: "Live Flow Map",
  diagnosis: "Operational Diagnosis",
  kaizen: "Fishbone Audit",
  throughput: "Throughput Economics",
  waste: "Waste Analysis",
  assumptions: "Assumptions Review"
};

const throughputKpis: KpiConfig[] = [
  {
    key: "tocThroughputPerUnit",
    label: "TOC Throughput / Unit",
    format: "currency",
    decimals: 2
  },
  {
    key: "fullyLoadedProfitPerUnit",
    label: "Fully Loaded Profit / Unit",
    format: "currency",
    decimals: 2
  },
  {
    key: "tocThroughputPerBottleneckMinute",
    label: "TOC / Bottleneck Min",
    format: "currency",
    decimals: 2
  },
  {
    key: "estimatedGainPercent",
    label: "Estimated Gain %",
    format: "percent",
    decimals: 1
  }
];

const wasteKpis: KpiConfig[] = [
  {
    key: "totalLeadTimeMinutes",
    label: "Weighted LT",
    format: "duration",
    decimals: 1
  },
  {
    key: "totalTouchTimeMinutes",
    label: "Weighted CT",
    format: "duration",
    decimals: 1
  },
  {
    key: "totalWasteMinutes",
    label: "Weighted Waste",
    format: "duration",
    decimals: 1
  },
  {
    key: "totalWastePct",
    label: "Waste %",
    format: "percent",
    decimals: 1
  },
  {
    key: "topWasteStep",
    label: "Top Waste Step",
    format: "text"
  }
];

const kaizenKpis: KpiConfig[] = [
  {
    key: "topOpportunity",
    label: "Top Kaizen Focus",
    format: "text"
  },
  {
    key: "topOpportunityScore",
    label: "Event Score",
    format: "number",
    decimals: 1
  },
  {
    key: "fishboneFocus",
    label: "Fishbone Focus",
    format: "text"
  },
  {
    key: "opportunityCount",
    label: "Top Events",
    format: "number",
    decimals: 0
  },
  {
    key: "missingSignalsCount",
    label: "Missing Signals",
    format: "number",
    decimals: 0
  }
];

const assumptionsKpis: KpiConfig[] = [
  {
    key: "trustLevel",
    label: "Trust Level",
    helpText: "Overall confidence based on how many important inputs were assumed or defaulted.",
    format: "text"
  },
  {
    key: "totalAssumptions",
    label: "Assumptions Logged",
    helpText: "Total number of documented assumptions in the current model.",
    format: "number",
    decimals: 0
  },
  {
    key: "needsReview",
    label: "Need Review",
    helpText: "Assumptions that could materially change the conclusion if they are wrong.",
    format: "number",
    decimals: 0
  },
  {
    key: "priorityChecks",
    label: "Priority Checks",
    helpText: "Best confirmations to collect before using the report for bigger decisions.",
    format: "number",
    decimals: 0
  }
];

function downloadTextFile(fileName: string, contents: string, mimeType = "text/plain;charset=utf-8"): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function SimulatorApp() {
  const libraryFileInputRef = useRef<HTMLInputElement | null>(null);
  const exportBundleData = useMemo(() => getExportBundleData(), []);

  const dashboardConfig = (exportBundleData?.dashboardConfig ?? dashboardConfigJson) as DashboardConfig;
  const forecastModel = (exportBundleData?.compiledForecastModel ?? compiledForecastModelJson) as CompiledForecastModel;
  const masterData = (exportBundleData?.masterData ?? masterDataJson) as MasterData;
  const boundParameterGroups = useMemo(
    () => bindParameterGroupsToForecast(dashboardConfig.parameterGroups, forecastModel),
    [dashboardConfig, forecastModel]
  );

  const startupScenarioOverride = useMemo(
    () => getStartupScenarioOverride(exportBundleData),
    [exportBundleData]
  );

  const baselineScenario = useMemo(
    () => ({
      ...getDefaultScenario(boundParameterGroups, forecastModel.inputDefaults),
      ...(startupScenarioOverride ?? {})
    }),
    [boundParameterGroups, forecastModel, startupScenarioOverride]
  );
  const scenarioLibraryColumns = useMemo(
    () => buildScenarioLibraryStepColumns(forecastModel.stepModels),
    [forecastModel.stepModels]
  );
  const simulationHorizonField = useMemo(
    () =>
      boundParameterGroups
        .flatMap((group) => group.fields)
        .find((field) => field.key === "simulationHorizonHours"),
    [boundParameterGroups]
  );
  const sidebarParameterGroups = useMemo(
    () =>
      boundParameterGroups
        .map((group) => ({
          ...group,
          fields: group.fields.filter((field) => field.key !== "simulationHorizonHours")
        }))
        .filter((group) => group.fields.length > 0),
    [boundParameterGroups]
  );

  const {
    committedScenario,
    activeScenario,
    hasStagedChanges,
    isPaused,
    speedMultiplier,
    simElapsedHours,
    simHorizonHours,
    resetViewSignal,
    setSpeedMultiplier,
    updateScenarioValue,
    updateStepField,
    discardStepOverrides,
    loadScenario,
    toggleStartPause,
    resetSimulation
  } = useScenarioSession({ baselineScenario });
  const [inspectorStepId, setInspectorStepId] = useState<string | null>(null);
  const [inspectorAnchor, setInspectorAnchor] = useState<{ x: number; y: number } | null>(null);
  const [appNotice, setAppNotice] = useState<ExportNotice | null>(null);
  const [resultsMode, setResultsMode] = useState<SimulatorResultsMode>("flow");
  const [isScenarioLibraryOpen, setIsScenarioLibraryOpen] = useState(false);
  const [isParameterRailOpen, setIsParameterRailOpen] = useState(true);
  const {
    libraryEntries,
    selectedScenarioId,
    currentScenarioId,
    libraryName,
    lastLoadedAt,
    issues: libraryIssues,
    openLibrary,
    importLibraryFile,
    saveCurrentScenario,
    loadScenarioEntry,
    setSelectedScenarioId
  } = useScenarioLibrary({
    scenarioColumns: scenarioLibraryColumns,
    appTitle: dashboardConfig.appTitle,
    modelName: forecastModel.metadata.name
  });

  const output = useMemo(
    () => createBottleneckForecastOutput(forecastModel, committedScenario, simElapsedHours),
    [forecastModel, committedScenario, simElapsedHours]
  );
  const wasRunningRef = useRef(false);
  const [operationalDiagnosis, setOperationalDiagnosis] = useState(() =>
    buildOperationalDiagnosis(forecastModel, output, committedScenario)
  );

  // Refresh diagnosis once a run stops (or is paused) rather than every simulation tick.
  useEffect(() => {
    if (!isPaused) {
      wasRunningRef.current = true;
      return;
    }

    if (wasRunningRef.current) {
      setOperationalDiagnosis(buildOperationalDiagnosis(forecastModel, output, committedScenario));
      wasRunningRef.current = false;
    }
  }, [isPaused, forecastModel, output, committedScenario]);

  // Also refresh diagnosis for committed baseline changes outside of active runs (reset/load/startup).
  useEffect(() => {
    if (isPaused && simElapsedHours <= 1e-6) {
      setOperationalDiagnosis(buildOperationalDiagnosis(forecastModel, output, committedScenario));
    }
  }, [isPaused, simElapsedHours, forecastModel, output, committedScenario]);

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
  const flowViewportStorageKey = useMemo(
    () => `${forecastModel.metadata.name ?? dashboardConfig.appTitle}-flow-viewport-v4`,
    [dashboardConfig.appTitle, forecastModel.metadata.name]
  );
  const assumptionsReport = useMemo(
    () => buildAssumptionsReport(forecastModel),
    [forecastModel]
  );

  const inspectorStep = useMemo(
    () => forecastModel.stepModels.find((step) => step.stepId === inspectorStepId) ?? null,
    [forecastModel, inspectorStepId]
  );
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

  const openStepInspector = (nodeId: string, anchor: { x: number; y: number }) => {
    setInspectorStepId(nodeId);
    setInspectorAnchor(anchor);
  };

  const startPauseWithInspectorReset = () => {
    toggleStartPause();
    setInspectorStepId(null);
    setInspectorAnchor(null);
  };

  const resetSimulationView = () => {
    resetSimulation();
    setInspectorStepId(null);
    setInspectorAnchor(null);
  };

  const inspectorValues = useMemo(
    () =>
      buildInspectorValues(
        inspectorStep,
        activeScenario,
        inspectorStep ? inspectorDefaultsByStepId.get(inspectorStep.stepId) : undefined
      ),
    [activeScenario, inspectorDefaultsByStepId, inspectorStep]
  );
  const activeKpis =
    resultsMode === "throughput"
      ? throughputKpis
      : resultsMode === "kaizen"
        ? kaizenKpis
        : resultsMode === "assumptions"
          ? assumptionsKpis
          : resultsMode === "waste"
            ? wasteKpis
          : dashboardConfig.kpis;
  const isFlowMode = resultsMode === "flow";
  const simProgressPct = useMemo(() => {
    if (!Number.isFinite(simHorizonHours) || simHorizonHours <= 0) {
      return 0;
    }
    const ratio = simElapsedHours / simHorizonHours;
    return Math.max(0, Math.min(100, ratio * 100));
  }, [simElapsedHours, simHorizonHours]);
  const resolvedStepScenario = useMemo(
    () => buildResolvedStepScenario(forecastModel.stepModels, committedScenario, inspectorDefaultsByStepId),
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
  const activeMetrics = useMemo(() => {
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

    if (resultsMode === "kaizen") {
      return kaizenMetrics;
    }

    if (resultsMode === "assumptions") {
      return assumptionsMetrics;
    }

    return output.globalMetrics;
  }, [
    assumptionsMetrics,
    kaizenMetrics,
    output.globalMetrics,
    resultsMode,
    throughputAnalysis.summary,
    wasteAnalysis.summary
  ]);
  const flowOverlayKpis = useMemo<KpiConfig[]>(
    () => [
      {
        key: "forecastThroughput",
        label: "Forecast Output / hr",
        helpText: "Estimated completed output rate per hour under the current scenario settings and elapsed-time state.",
        format: "number",
        decimals: 1
      },
      {
        key: "bottleneckIndex",
        label: "Constraint Pressure",
        helpText: "Constraint pressure score (0-100%). Higher values mean tighter capacity and higher risk of flow breakage.",
        format: "percent",
        decimals: 0
      },
      {
        key: "totalWipQty",
        label: "WIP Load",
        helpText: "Total work-in-process currently in the system (queue plus in-process load across all steps).",
        format: "number",
        decimals: 0
      },
      {
        key: "totalCompletedOutputPieces",
        label: "Total Completed Lots",
        helpText: "Cumulative completed lots produced by the flow at the current elapsed time.",
        format: "number",
        decimals: 1
      }
    ],
    []
  );

  const openScenarioLibraryCsv = async () => {
    try {
      const result = await openLibrary();
      if (result === "fallback") {
        libraryFileInputRef.current?.click();
        return;
      }
      if (result === "opened") {
        setAppNotice({
          tone: "success",
          text: `Loaded scenario library${libraryName ? `: ${libraryName}` : "."}`
        });
        setIsScenarioLibraryOpen(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scenario library could not be opened.";
      setAppNotice({
        tone: "error",
        text: `Library open failed: ${message}`
      });
    }
  };

  const saveCommittedScenarioToLibrary = async () => {
    const defaultName = `Scenario ${new Date().toLocaleString()}`;
    const promptedName = window.prompt("Scenario name", defaultName);
    if (promptedName === null) {
      return;
    }

    try {
      const result = await saveCurrentScenario(resolvedStepScenario, promptedName);
      if (result.mode === "cancelled") {
        return;
      }
      if (result.mode === "download" && result.csvText && result.fileName) {
        downloadTextFile(result.fileName, result.csvText, "text/csv;charset=utf-8");
      }
      setAppNotice({
        tone: "success",
        text:
          result.mode === "download"
            ? `Scenario saved. Downloaded library CSV: ${result.fileName}`
            : `Scenario saved to library${libraryName ? `: ${libraryName}` : "."}`
      });
      setIsScenarioLibraryOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scenario library save failed.";
      setAppNotice({
        tone: "error",
        text: `Library save failed: ${message}`
      });
    }
  };

  const loadScenarioFromLibrary = (scenarioId: string) => {
    const scenario = loadScenarioEntry(scenarioId);
    if (!scenario) {
      setAppNotice({
        tone: "error",
        text: "Selected scenario could not be loaded."
      });
      return;
    }
    loadScenario({
      ...baselineScenario,
      ...scenario
    });
    setInspectorStepId(null);
    setInspectorAnchor(null);
    setIsScenarioLibraryOpen(false);
    const entry = libraryEntries.find((item) => item.scenarioId === scenarioId);
    setAppNotice({
      tone: "success",
      text: `Loaded scenario: ${entry?.scenarioName ?? scenarioId}`
    });
  };

  return (
    <div className="simulator-page">
      <div className="app-shell">
        <DashboardHeader
          brandLabel="LeanStorming Operational Stress Labs"
          title={dashboardConfig.appTitle}
          subtitle={dashboardConfig.subtitle ?? "Fast bottleneck forecast cockpit"}
          primaryConstraint={operationalDiagnosis.primaryConstraint}
          statusSummary={operationalDiagnosis.statusSummary}
          recommendedAction={operationalDiagnosis.recommendedAction}
          diagnosisStatus={operationalDiagnosis.status}
          resultsMode={resultsMode}
          isPaused={isPaused}
          hasStagedChanges={hasStagedChanges}
          simElapsedHours={simElapsedHours}
          simHorizonHours={simHorizonHours}
          simHorizonValue={activeScenario.simulationHorizonHours ?? simHorizonHours}
          simHorizonOptions={simulationHorizonField?.options ?? []}
          simProgressPct={simProgressPct}
          scenarioCount={libraryEntries.length}
          speedMultiplier={speedMultiplier}
          onResultsModeChange={setResultsMode}
          onSpeedChange={(speed) => setSpeedMultiplier(speed)}
          onStartPause={startPauseWithInspectorReset}
          onReset={resetSimulationView}
          onSaveCurrentScenario={saveCommittedScenarioToLibrary}
          onToggleScenarioLibrary={() => setIsScenarioLibraryOpen((current) => !current)}
          onFocusConstraint={() => setResultsMode("diagnosis")}
          onSimHorizonChange={(value) => updateScenarioValue("simulationHorizonHours", value)}
        />

        {isPaused && hasStagedChanges ? (
          <div className={`pause-banner ${hasStagedChanges ? "has-changes" : "no-changes"}`}>
            Paused - edits staged
          </div>
        ) : null}

        {appNotice ? (
          <div className={`export-banner ${appNotice.tone === "error" ? "is-error" : "is-success"}`}>
            {appNotice.text}
          </div>
        ) : null}

        <div className={`content-shell ${isParameterRailOpen ? "rail-open" : "rail-collapsed"}`}>
          <aside className="left-rail">
            <ParameterSidebar
              groups={sidebarParameterGroups}
              scenario={activeScenario}
              editable
              isRailOpen={isParameterRailOpen}
              onToggleRail={() => setIsParameterRailOpen((current) => !current)}
              onChange={updateScenarioValue}
            />
          </aside>

          <main className={`center-stage ${isFlowMode ? "center-stage-flow" : ""}`}>
            {!isFlowMode ? (
              <>
                <div className="stage-toolbar">
                  <div className="stage-title-block">
                    <p className="stage-eyebrow">Primary Workspace</p>
                    <h2>{RESULTS_MODE_LABELS[resultsMode]}</h2>
                  </div>
                  <div className="stage-toolbar-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setIsParameterRailOpen((current) => !current)}
                    >
                      {isParameterRailOpen ? "Hide Parameters" : "Show Parameters"}
                    </button>
                  </div>
                </div>
                <KpiRow
                  kpis={activeKpis}
                  metrics={activeMetrics}
                  featuredKey={activeKpis[0]?.key}
                  variant="compact"
                />
              </>
            ) : null}
            {resultsMode === "flow" ? (
              <div className="flow-stage-shell">
                <KpiRow
                  kpis={flowOverlayKpis}
                  metrics={output.globalMetrics}
                  featuredKey={flowOverlayKpis[0]?.key}
                  variant="overlay"
                />
                <GraphCanvas
                  graph={forecastModel.graph}
                  output={output}
                  nodeCardFields={dashboardConfig.nodeCardFields}
                  showProbabilities={dashboardConfig.graphStyle?.showProbabilities ?? true}
                  animateEdges={dashboardConfig.graphStyle?.edgeAnimation !== "none" && !isPaused}
                  resetViewSignal={resetViewSignal}
                  viewportStorageKey={flowViewportStorageKey}
                  parameterToggleLabel={isParameterRailOpen ? "Hide Parameters" : "Show Parameters"}
                  onParameterToggle={() => setIsParameterRailOpen((current) => !current)}
                  onNodeDoubleClick={(nodeId, anchor) => openStepInspector(nodeId, anchor)}
                />
              </div>
            ) : null}

            {resultsMode === "diagnosis" ? (
              <OperationalDiagnosisCard diagnosis={operationalDiagnosis} />
            ) : null}

            {resultsMode === "kaizen" ? (
              <KaizenReportPanel report={kaizenReport} />
            ) : null}

            {resultsMode === "throughput" ? (
              <ThroughputAnalysisPanel
                analysis={{
                  ...throughputAnalysis,
                  scenarioLabel: throughputAnalysis.scenarioLabel || dashboardConfig.appTitle
                }}
                onExportSummaryCsv={() =>
                  downloadTextFile(
                    "throughput-analysis-summary.csv",
                    buildThroughputSummaryCsv(throughputAnalysis),
                    "text/csv;charset=utf-8"
                  )
                }
                onExportStepCsv={() =>
                  downloadTextFile(
                    "throughput-analysis-step-costs.csv",
                    buildThroughputStepCsv(throughputAnalysis),
                    "text/csv;charset=utf-8"
                  )
                }
              />
            ) : null}

            {resultsMode === "waste" ? (
              <WasteAnalysisPanel
                analysis={{
                  ...wasteAnalysis,
                  scenarioLabel: wasteAnalysis.scenarioLabel || dashboardConfig.appTitle
                }}
                onExportSummaryCsv={() =>
                  downloadTextFile(
                    "waste-analysis-summary.csv",
                    buildWasteSummaryCsv(wasteAnalysis),
                    "text/csv;charset=utf-8"
                  )
                }
                onExportStepCsv={() =>
                  downloadTextFile(
                    "waste-analysis-steps.csv",
                    buildWasteStepCsv(wasteAnalysis),
                    "text/csv;charset=utf-8"
                  )
                }
              />
            ) : null}

            {resultsMode === "assumptions" ? (
              <AssumptionsReportPanel report={assumptionsReport} />
            ) : null}
          </main>
        </div>

        <StepInspector
          isOpen={!!inspectorStep && !!inspectorValues}
          isPaused={isPaused}
          stepLabel={inspectorStep?.label ?? ""}
          anchor={inspectorAnchor}
          values={
            inspectorValues ?? {
              capacityUnits: 1,
              ctBaseline: 1,
              ctMultiplier: 1,
              downtimePct: 0,
              leadTimeMinutes: 0,
              materialCostPerUnit: 0,
              laborRatePerHour: 0,
              equipmentRatePerHour: 0
            }
          }
          onChange={(field, value) => {
            if (!inspectorStep) {
              return;
            }
            updateStepField(inspectorStep.stepId, field, value);
          }}
          onDiscard={() => {
            if (!inspectorStep) {
              return;
            }
            discardStepOverrides(inspectorStep.stepId);
          }}
          onStage={() => {
            setInspectorStepId(null);
            setInspectorAnchor(null);
          }}
          onApplyResume={startPauseWithInspectorReset}
          onClose={() => {
            setInspectorStepId(null);
            setInspectorAnchor(null);
          }}
        />

        <ScenarioLibraryPanel
          isOpen={isScenarioLibraryOpen}
          libraryName={libraryName}
          lastLoadedAt={lastLoadedAt}
          entries={libraryEntries}
          issues={libraryIssues}
          currentScenarioId={currentScenarioId}
          selectedScenarioId={selectedScenarioId}
          onSelectScenario={setSelectedScenarioId}
          onOpenCsv={openScenarioLibraryCsv}
          onSaveCurrent={saveCommittedScenarioToLibrary}
          onLoadScenario={loadScenarioFromLibrary}
          onClose={() => setIsScenarioLibraryOpen(false)}
        />

        <input
          ref={libraryFileInputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            if (!file) {
              return;
            }
            try {
              await importLibraryFile(file);
              setAppNotice({
                tone: "success",
                text: `Loaded scenario library: ${file.name}`
              });
              setIsScenarioLibraryOpen(true);
            } catch (error) {
              const message = error instanceof Error ? error.message : "Scenario library could not be read.";
              setAppNotice({
                tone: "error",
                text: `Library open failed: ${message}`
              });
            }
          }}
        />
      </div>
    </div>
  );
}
