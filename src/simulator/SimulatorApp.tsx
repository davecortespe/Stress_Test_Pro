import { useMemo, useRef, useState } from "react";
import { DashboardHeader } from "../components/DashboardHeader";
import { GraphCanvas } from "../components/GraphCanvas";
import { KpiRow } from "../components/KpiRow";
import { OperationalDiagnosisCard } from "../components/OperationalDiagnosisCard";
import { ParameterSidebar } from "../components/ParameterSidebar";
import { ScenarioLibraryPanel } from "../components/ScenarioLibraryPanel";
import { StepInspector } from "../components/StepInspector";
import { ThroughputAnalysisPanel } from "../components/ThroughputAnalysisPanel";
import { WasteAnalysisPanel } from "../components/WasteAnalysisPanel";
import { createBottleneckForecastOutput } from "../lib/bottleneckForecast";
import {
  buildOperationalDiagnosis
} from "../lib/operationalDiagnosis";
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
    clearCurrentScenario,
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
  const operationalDiagnosis = useMemo(
    () => buildOperationalDiagnosis(forecastModel, output, committedScenario),
    [forecastModel, output, committedScenario]
  );
  const throughputAnalysis = useMemo(
    () => buildThroughputAnalysis(forecastModel, masterData, committedScenario, output),
    [forecastModel, masterData, committedScenario, output]
  );
  const wasteAnalysis = useMemo(
    () => buildWasteAnalysis(forecastModel, committedScenario, output),
    [forecastModel, committedScenario, output]
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
    clearCurrentScenario();
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
      : resultsMode === "waste"
        ? wasteKpis
        : dashboardConfig.kpis;
  const resolvedStepScenario = useMemo(
    () => buildResolvedStepScenario(forecastModel.stepModels, committedScenario, inspectorDefaultsByStepId),
    [committedScenario, forecastModel.stepModels, inspectorDefaultsByStepId]
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

    return output.globalMetrics;
  }, [output.globalMetrics, resultsMode, throughputAnalysis.summary, wasteAnalysis.summary]);

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
          title={dashboardConfig.appTitle}
          subtitle={dashboardConfig.subtitle ?? "Fast bottleneck forecast cockpit"}
          resultsMode={resultsMode}
          isPaused={isPaused}
          hasStagedChanges={hasStagedChanges}
          simElapsedHours={simElapsedHours}
          simHorizonHours={simHorizonHours}
          scenarioCount={libraryEntries.length}
          speedMultiplier={speedMultiplier}
          onResultsModeChange={setResultsMode}
          onSpeedChange={(speed) => setSpeedMultiplier(speed)}
          onStartPause={startPauseWithInspectorReset}
          onReset={resetSimulationView}
          onOpenLibraryCsv={openScenarioLibraryCsv}
          onSaveCurrentScenario={saveCommittedScenarioToLibrary}
          onToggleScenarioLibrary={() => setIsScenarioLibraryOpen(true)}
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

        <KpiRow kpis={activeKpis} metrics={activeMetrics} />

        <div className="content-shell">
          <aside className="left-rail">
            <ParameterSidebar
              groups={boundParameterGroups}
              scenario={activeScenario}
              editable
              onChange={updateScenarioValue}
            />
          </aside>

          <main className="center-stage">
            {resultsMode === "flow" ? (
              <GraphCanvas
                graph={forecastModel.graph}
                output={output}
                nodeCardFields={dashboardConfig.nodeCardFields}
                showProbabilities={dashboardConfig.graphStyle?.showProbabilities ?? true}
                animateEdges={dashboardConfig.graphStyle?.edgeAnimation !== "none" && !isPaused}
                resetViewSignal={resetViewSignal}
                onNodeDoubleClick={(nodeId, anchor) => openStepInspector(nodeId, anchor)}
              />
            ) : null}

            {resultsMode === "diagnosis" ? (
              <OperationalDiagnosisCard diagnosis={operationalDiagnosis} />
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
