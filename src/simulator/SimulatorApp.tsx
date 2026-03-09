import { useMemo, useState } from "react";
import { DashboardHeader } from "../components/DashboardHeader";
import { GraphCanvas } from "../components/GraphCanvas";
import { KpiRow } from "../components/KpiRow";
import { OperationalDiagnosisCard } from "../components/OperationalDiagnosisCard";
import { ParameterSidebar } from "../components/ParameterSidebar";
import { StepInspector } from "../components/StepInspector";
import { ThroughputAnalysisPanel } from "../components/ThroughputAnalysisPanel";
import { createBottleneckForecastOutput } from "../lib/bottleneckForecast";
import { exportScenarioBundleToLocalFolder } from "../lib/exportScenarioBundle";
import {
  buildOperationalDiagnosis,
  formatOperationalDiagnosisMarkdown
} from "../lib/operationalDiagnosis";
import {
  buildThroughputAnalysis,
  buildThroughputStepCsv,
  buildThroughputSummaryCsv
} from "../lib/throughputAnalysis";
import type {
  CompiledForecastModel,
  DashboardConfig,
  KpiConfig,
  MasterData
} from "../types/contracts";
import compiledForecastModelJson from "../../models/active/compiled_forecast_model.json";
import masterDataJson from "../../models/active/master_data.json";
import vsmGraphJson from "../../models/active/vsm_graph.json";
import dashboardConfigJson from "../../models/dashboard_config.json";
import {
  bindParameterGroupsToForecast,
  buildInspectorValues,
  getDefaultScenario,
  type ScenarioState
} from "./scenarioState";
import { getExportBundleData, getStartupScenarioOverride } from "./runtimeData";
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
  const exportBundleData = useMemo(() => getExportBundleData(), []);

  const dashboardConfig = (exportBundleData?.dashboardConfig ?? dashboardConfigJson) as DashboardConfig;
  const forecastModel = (exportBundleData?.compiledForecastModel ?? compiledForecastModelJson) as CompiledForecastModel;
  const masterData = (exportBundleData?.masterData ?? masterDataJson) as MasterData;
  const vsmGraph = exportBundleData?.vsmGraph ?? vsmGraphJson;
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
    toggleStartPause,
    resetSimulation
  } = useScenarioSession({ baselineScenario });
  const [inspectorStepId, setInspectorStepId] = useState<string | null>(null);
  const [inspectorAnchor, setInspectorAnchor] = useState<{ x: number; y: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<ExportNotice | null>(null);
  const [resultsMode, setResultsMode] = useState<"flow" | "diagnosis" | "throughput">("flow");

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

  const inspectorStep = useMemo(
    () => forecastModel.stepModels.find((step) => step.stepId === inspectorStepId) ?? null,
    [forecastModel, inspectorStepId]
  );
  const processingByStepId = useMemo(
    () => new Map((masterData.processing ?? []).map((row) => [row.stepId, row])),
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

  const exportCommittedScenario = async () => {
    const defaultName = "Tablet_Manufacturing";
    const promptedName = window.prompt("Scenario export name (optional)", defaultName);
    if (promptedName === null) {
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportScenarioBundleToLocalFolder({
        name: promptedName.trim().length > 0 ? promptedName : defaultName,
        includeMetrics: true,
        dashboardConfig,
        vsmGraph,
        masterData,
        compiledForecastModel: forecastModel,
        scenarioCommitted: committedScenario,
        resultMetrics: {
          globalMetrics: output.globalMetrics,
          nodeMetrics: output.nodeMetrics as Record<string, unknown>
        },
        operationalDiagnosis,
        operationalDiagnosisMarkdown: formatOperationalDiagnosisMarkdown(operationalDiagnosis)
      });
      setExportNotice({
        tone: "success",
        text: `Exported bundle: ${result.exportPath}`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown export error";
      setExportNotice({
        tone: "error",
        text: `Export failed: ${message}`
      });
    } finally {
      setIsExporting(false);
    }
  };
  const inspectorValues = useMemo(
    () =>
      buildInspectorValues(inspectorStep, activeScenario, inspectorStep ? processingByStepId.get(inspectorStep.stepId) : undefined),
    [activeScenario, inspectorStep, processingByStepId]
  );
  const activeKpis = resultsMode === "throughput" ? throughputKpis : dashboardConfig.kpis;
  const activeMetrics = useMemo(() => {
    if (resultsMode !== "throughput") {
      return output.globalMetrics;
    }

    return {
      tocThroughputPerUnit: throughputAnalysis.summary.tocThroughputPerUnit ?? "Blocked",
      fullyLoadedProfitPerUnit: throughputAnalysis.summary.fullyLoadedProfitPerUnit ?? "Blocked",
      tocThroughputPerBottleneckMinute:
        throughputAnalysis.summary.tocThroughputPerBottleneckMinute ?? "Blocked",
      estimatedGainPercent: throughputAnalysis.summary.estimatedGainPercent ?? "Blocked"
    };
  }, [output.globalMetrics, resultsMode, throughputAnalysis.summary]);

  return (
    <div className="simulator-page">
      <div className="app-shell">
        <DashboardHeader
          title={dashboardConfig.appTitle}
          subtitle={dashboardConfig.subtitle ?? "Fast bottleneck forecast cockpit"}
          resultsMode={resultsMode}
          isPaused={isPaused}
          hasStagedChanges={hasStagedChanges}
          isExporting={isExporting}
          simElapsedHours={simElapsedHours}
          simHorizonHours={simHorizonHours}
          speedMultiplier={speedMultiplier}
          onResultsModeChange={setResultsMode}
          onSpeedChange={(speed) => setSpeedMultiplier(speed)}
          onStartPause={startPauseWithInspectorReset}
          onReset={resetSimulationView}
          onExport={exportCommittedScenario}
        />

        {isPaused && hasStagedChanges ? (
          <div className={`pause-banner ${hasStagedChanges ? "has-changes" : "no-changes"}`}>
            Paused - edits staged
          </div>
        ) : null}

        {exportNotice ? (
          <div className={`export-banner ${exportNotice.tone === "error" ? "is-error" : "is-success"}`}>
            {exportNotice.text}
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
      </div>
    </div>
  );
}
