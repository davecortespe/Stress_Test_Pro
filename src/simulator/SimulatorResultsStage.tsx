import { AssumptionsReportPanel } from "../components/AssumptionsReportPanel";
import { GraphCanvas } from "../components/GraphCanvas";
import { KaizenReportPanel } from "../components/KaizenReportPanel";
import { KpiRow } from "../components/KpiRow";
import { OperationalDiagnosisCard } from "../components/OperationalDiagnosisCard";
import { ThroughputAnalysisPanel } from "../components/ThroughputAnalysisPanel";
import { WasteAnalysisPanel } from "../components/WasteAnalysisPanel";
import { buildThroughputStepCsv, buildThroughputSummaryCsv } from "../lib/throughputAnalysis";
import { buildWasteStepCsv, buildWasteSummaryCsv } from "../lib/wasteAnalysis";
import type {
  AssumptionsReportResult,
  CompiledForecastModel,
  DashboardConfig,
  ForecastGlobalMetrics,
  KaizenReportResult,
  KpiConfig,
  OperationalDiagnosis,
  ScenarioLibraryEntry,
  SimulationOutput,
  SimulatorResultsMode,
  ThroughputAnalysisResult,
  WasteAnalysisResult
} from "../types/contracts";
import { downloadTextFile, flowOverlayKpis, RESULTS_MODE_LABELS } from "./simulatorConfig";
import { ScenarioCompareStage } from "./ScenarioCompareStage";

interface SimulatorResultsStageProps {
  resultsMode: SimulatorResultsMode;
  isParameterRailOpen: boolean;
  activeKpis: KpiConfig[];
  activeMetrics: ForecastGlobalMetrics | Record<string, number | string | undefined>;
  output: SimulationOutput;
  forecastModel: CompiledForecastModel;
  dashboardConfig: DashboardConfig;
  isPaused: boolean;
  resetViewSignal: number;
  flowViewportStorageKey: string;
  operationalDiagnosis: OperationalDiagnosis;
  kaizenReport: KaizenReportResult;
  throughputAnalysis: ThroughputAnalysisResult;
  wasteAnalysis: WasteAnalysisResult;
  assumptionsReport: AssumptionsReportResult;
  pinnedEntries: ScenarioLibraryEntry[];
  scenarioCount: number;
  flowReferenceMetrics?: Record<string, number>;
  flowReferenceLabel?: string;
  onToggleParameterRail: () => void;
  onOpenStepInspector: (nodeId: string, anchor: { x: number; y: number }) => void;
  onOpenExecutivePdf: () => void;
  onOpenComparisonReport: () => void;
  onOpenScenarioFiles: () => void;
  onSwapComparison: () => void;
  onClearComparison: () => void;
}

export function SimulatorResultsStage({
  resultsMode,
  isParameterRailOpen,
  activeKpis,
  activeMetrics,
  output,
  forecastModel,
  dashboardConfig,
  isPaused,
  resetViewSignal,
  flowViewportStorageKey,
  operationalDiagnosis,
  kaizenReport,
  throughputAnalysis,
  wasteAnalysis,
  assumptionsReport,
  pinnedEntries,
  scenarioCount,
  flowReferenceMetrics,
  flowReferenceLabel,
  onToggleParameterRail,
  onOpenStepInspector,
  onOpenExecutivePdf,
  onOpenComparisonReport,
  onOpenScenarioFiles,
  onSwapComparison,
  onClearComparison
}: SimulatorResultsStageProps) {
  const isFlowMode = resultsMode === "flow";
  const usesStandaloneReportShell =
    resultsMode === "diagnosis" ||
    resultsMode === "kaizen" ||
    resultsMode === "throughput" ||
    resultsMode === "waste" ||
    resultsMode === "compare";

  return (
    <main className={`center-stage ${isFlowMode ? "center-stage-flow" : "reports-mode"}`}>
      {!isFlowMode && !usesStandaloneReportShell ? (
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
                onClick={onToggleParameterRail}
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
            referenceMetrics={flowReferenceMetrics}
            referenceLabel={flowReferenceLabel}
          />
          <GraphCanvas
            graph={forecastModel.graph}
            output={output}
            nodeCardFields={dashboardConfig.nodeCardFields}
            showProbabilities={dashboardConfig.graphStyle?.showProbabilities ?? true}
            animateEdges={dashboardConfig.graphStyle?.edgeAnimation !== "none" && !isPaused}
            isPaused={isPaused}
            resetViewSignal={resetViewSignal}
            viewportStorageKey={flowViewportStorageKey}
            parameterToggleLabel={isParameterRailOpen ? "Hide Parameters" : "Show Parameters"}
            onParameterToggle={onToggleParameterRail}
            onNodeDoubleClick={onOpenStepInspector}
          />
        </div>
      ) : null}

      {resultsMode === "diagnosis" ? (
        <OperationalDiagnosisCard diagnosis={operationalDiagnosis} metrics={output.globalMetrics} />
      ) : null}

      {resultsMode === "kaizen" ? (
        <KaizenReportPanel report={kaizenReport} onOpenPdf={onOpenExecutivePdf} />
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

      {resultsMode === "compare" ? (
        <ScenarioCompareStage
          isParameterRailOpen={isParameterRailOpen}
          pinnedEntries={pinnedEntries}
          scenarioCount={scenarioCount}
          dashboardConfig={dashboardConfig}
          onOpenComparisonReport={onOpenComparisonReport}
          onToggleParameterRail={onToggleParameterRail}
          onOpenScenarioFiles={onOpenScenarioFiles}
          onSwapComparison={onSwapComparison}
          onClearComparison={onClearComparison}
        />
      ) : null}
    </main>
  );
}
