import { AssumptionsReportPanel } from "../components/AssumptionsReportPanel";
import { ScenarioComparisonTable } from "../components/ScenarioComparisonTable";
import { ScenarioParamDiffTable } from "../components/ScenarioParamDiffTable";
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
  KaizenReportResult,
  KpiConfig,
  OperationalDiagnosis,
  ScenarioLibraryEntry,
  SimulationOutput,
  SimulatorResultsMode,
  ThroughputAnalysisResult,
  WasteAnalysisResult
} from "../types/contracts";
import { COMPARISON_METRIC_CONFIGS, downloadTextFile, flowOverlayKpis, RESULTS_MODE_LABELS } from "./simulatorConfig";

function formatScenarioSavedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

interface SimulatorResultsStageProps {
  resultsMode: SimulatorResultsMode;
  isParameterRailOpen: boolean;
  activeKpis: KpiConfig[];
  activeMetrics: Record<string, number | string>;
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
  onOpenScenarioLibrary: () => void;
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
  onOpenScenarioLibrary,
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
        <div className="compare-stage-shell">
          <div className="stage-toolbar compare-stage-toolbar">
            <div className="stage-title-block">
              <p className="stage-eyebrow">Scenario Analysis</p>
              <h2>Scenario Compare</h2>
            </div>
            <div className="stage-toolbar-actions">
              {pinnedEntries.length === 2 && (
                <button type="button" className="primary" onClick={onOpenComparisonReport}>
                  Open Comparison Report
                </button>
              )}
              <button type="button" className="secondary" onClick={onToggleParameterRail}>
                {isParameterRailOpen ? "Hide Parameters" : "Show Parameters"}
              </button>
            </div>
          </div>

          {pinnedEntries.length === 2 ? (
            <>
              {/* Compact edit bar — just for swapping selections */}
              <div className="compare-edit-bar">
                <div className="compare-edit-copy">
                  <span className="compare-edit-label">Comparison Set</span>
                  <span className="compare-edit-help">
                    Open the scenario library to replace A or B without losing the current compare view.
                  </span>
                </div>
                <div className="compare-edit-slot compare-edit-slot-card">
                  <span className="compare-col-slot compare-col-slot-a">A</span>
                  <div className="compare-edit-slot-copy">
                    <span className="compare-edit-name">{pinnedEntries[0].scenarioName}</span>
                    <span className="compare-edit-meta">{formatScenarioSavedAt(pinnedEntries[0].savedAt)}</span>
                  </div>
                </div>
                <span className="compare-edit-vs">vs.</span>
                <div className="compare-edit-slot compare-edit-slot-card">
                  <span className="compare-col-slot compare-col-slot-b">B</span>
                  <div className="compare-edit-slot-copy">
                    <span className="compare-edit-name">{pinnedEntries[1].scenarioName}</span>
                    <span className="compare-edit-meta">{formatScenarioSavedAt(pinnedEntries[1].savedAt)}</span>
                  </div>
                </div>
                <div className="compare-edit-actions">
                  <button type="button" className="compare-edit-change" onClick={onOpenScenarioLibrary}>
                    Change Scenarios
                  </button>
                  <button type="button" className="compare-edit-change" onClick={onSwapComparison}>
                    Swap A / B
                  </button>
                  <button type="button" className="compare-edit-clear" onClick={onClearComparison}>
                    Clear
                  </button>
                </div>
              </div>
              <ScenarioComparisonTable
                entryA={pinnedEntries[0]}
                entryB={pinnedEntries[1]}
                metricConfigs={COMPARISON_METRIC_CONFIGS}
              />
              <ScenarioParamDiffTable
                entryA={pinnedEntries[0]}
                entryB={pinnedEntries[1]}
                parameterGroups={dashboardConfig.parameterGroups}
              />
            </>
          ) : (
            <div className="compare-empty-state">
              <p className="compare-empty-title">How to compare scenarios</p>
              <ol className="compare-empty-steps">
                <li className={scenarioCount >= 1 ? "step-done" : ""}>
                  <span className="step-num">1</span>
                  <span>
                    Run a simulation, then click <strong>Save Scenario</strong> in the toolbar above.
                    Give it a name like <em>"Baseline"</em>.
                    {scenarioCount >= 1 && <span className="step-check"> ✓ {scenarioCount} saved</span>}
                  </span>
                </li>
                <li className={scenarioCount >= 2 ? "step-done" : ""}>
                  <span className="step-num">2</span>
                  <span>
                    Change a parameter (e.g. add a relief unit), then save again as <em>"With relief"</em>.
                    {scenarioCount >= 2 && <span className="step-check"> ✓ ready</span>}
                  </span>
                </li>
                <li>
                  <span className="step-num">3</span>
                  <span>
                    Click <strong>+ SCENARIOS {scenarioCount}</strong> (top right) to open the library.
                    Use <strong>Set A</strong> and <strong>Set B</strong> on the saved runs you want, then hit <strong>Compare A vs B</strong>.
                  </span>
                </li>
              </ol>
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}
