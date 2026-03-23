import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import { DashboardHeader } from "../components/DashboardHeader";
import { ParameterSidebar } from "../components/ParameterSidebar";
import { QuickStartGuideDialog } from "../components/QuickStartGuideDialog";
import { SaveScenarioModal } from "../components/SaveScenarioModal";
import { ScenarioLibraryPanel } from "../components/ScenarioLibraryPanel";
import { StepInspector } from "../components/StepInspector";
import { buildAssumptionsReport } from "../lib/assumptionsReport";
import { createBottleneckForecastOutput } from "../lib/bottleneckForecast";
import { openComparisonExecutiveReportWindow } from "../lib/comparisonExecutiveReport";
import { buildKaizenReport } from "../lib/kaizenReport";
import {
  buildThroughputAnalysis
} from "../lib/throughputAnalysis";
import {
  buildWasteAnalysis
} from "../lib/wasteAnalysis";
import type { SimulatorResultsMode } from "../types/contracts";
import {
  buildInspectorValues,
  buildResolvedStepScenario
} from "./scenarioState";
import { useScenarioComparison } from "./useScenarioComparison";
import { useScenarioLibrary } from "./useScenarioLibrary";
import { useScenarioSession } from "./useScenarioSession";
import {
  assumptionsKpis,
  downloadTextFile,
  ExportNotice,
  EXECUTIVE_PDF_URL,
  kaizenKpis,
  throughputKpis,
  wasteKpis
} from "./simulatorConfig";
import { useOperationalDiagnosis } from "./useOperationalDiagnosis";
import { useParameterRail } from "./useParameterRail";
import { SimulatorResultsStage } from "./SimulatorResultsStage";
import { useSimulatorModelData } from "./useSimulatorModelData";
import "./simulator.css";

const DEFAULT_RESULTS_MODE: SimulatorResultsMode = "flow";
const RESULTS_MODE_OPTIONS = new Set<SimulatorResultsMode>([
  "flow",
  "diagnosis",
  "kaizen",
  "throughput",
  "waste",
  "assumptions",
  "compare"
]);

function getInitialResultsMode(search: string): SimulatorResultsMode {
  const params = new URLSearchParams(search);
  const requestedView = params.get("view");
  if (requestedView && RESULTS_MODE_OPTIONS.has(requestedView as SimulatorResultsMode)) {
    return requestedView as SimulatorResultsMode;
  }
  return DEFAULT_RESULTS_MODE;
}

export default function SimulatorApp() {
  const location = useLocation();
  const libraryFileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    dashboardConfig,
    forecastModel,
    masterData,
    baselineScenario,
    simulationHorizonField,
    sidebarParameterGroups,
    scenarioLibraryColumns,
    flowViewportStorageKey
  } = useSimulatorModelData();
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
  const {
    isParameterRailOpen,
    parameterRailWidth,
    parameterRailMinWidth,
    parameterRailMaxWidth,
    toggleParameterRail,
    setParameterRailWidth
  } = useParameterRail();

  const {
    comparisonIds,
    pinnedIds,
    assignEntry,
    clearSlot,
    clearPinned,
    swapEntries,
    pruneEntries
  } = useScenarioComparison();

  const [inspectorStepId, setInspectorStepId] = useState<string | null>(null);
  const [inspectorAnchor, setInspectorAnchor] = useState<{ x: number; y: number } | null>(null);
  const [appNotice, setAppNotice] = useState<ExportNotice | null>(null);
  const [pdfAvailability, setPdfAvailability] = useState<boolean | null>(null);
  const [resultsMode, setResultsMode] = useState<SimulatorResultsMode>(() =>
    getInitialResultsMode(location.search)
  );
  const [isScenarioLibraryOpen, setIsScenarioLibraryOpen] = useState(false);
  const [isQuickStartGuideOpen, setIsQuickStartGuideOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalDefaultName, setSaveModalDefaultName] = useState("");
  const isReportMode = resultsMode !== "flow";

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
    deleteScenarioEntry,
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
  const assumptionsReport = useMemo(
    () => buildAssumptionsReport(forecastModel),
    [forecastModel]
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
  const activeKpis = useMemo(() => {
    if (resultsMode === "throughput") {
      return throughputKpis;
    }
    if (resultsMode === "kaizen") {
      return kaizenKpis;
    }
    if (resultsMode === "assumptions") {
      return assumptionsKpis;
    }
    if (resultsMode === "waste") {
      return wasteKpis;
    }
    return dashboardConfig.kpis;
  }, [dashboardConfig.kpis, resultsMode]);
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
  const simProgressPct = useMemo(() => {
    if (!Number.isFinite(simHorizonHours) || simHorizonHours <= 0) {
      return 0;
    }
    const ratio = simElapsedHours / simHorizonHours;
    return Math.max(0, Math.min(100, ratio * 100));
  }, [simElapsedHours, simHorizonHours]);

  const pinnedEntries = useMemo(() => {
    return pinnedIds
      .map((id) => {
        const entry = libraryEntries.find((e) => e.scenarioId === id);
        if (!entry) return undefined;
        if (entry.savedMetrics) return entry;
        // Entry was saved before metric capture — recompute from stored scenario
        const reScenario = { ...baselineScenario, ...entry.scenario };
        const reOutput = createBottleneckForecastOutput(forecastModel, reScenario, simHorizonHours);
        const reThroughput = buildThroughputAnalysis(forecastModel, masterData, reScenario, reOutput);
        const reWaste = buildWasteAnalysis(forecastModel, reScenario, reOutput);
        const reBottleneckStep = forecastModel.stepModels.find(
          (s) => reOutput.nodeMetrics[s.stepId]?.bottleneckFlag
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
      })
      .filter((e): e is NonNullable<typeof e> => e !== undefined);
  }, [pinnedIds, libraryEntries, forecastModel, masterData, baselineScenario, simHorizonHours]);

  const flowReferenceMetrics = useMemo<Record<string, number> | undefined>(() => {
    const baseline = pinnedEntries[0]?.savedMetrics;
    if (!baseline) return undefined;
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(baseline)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        result[k] = v;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }, [pinnedEntries]);

  const flowReferenceLabel = pinnedEntries[0]?.scenarioName;

  useEffect(() => {
    pruneEntries(libraryEntries.map((entry) => entry.scenarioId));
  }, [libraryEntries, pruneEntries]);

  useEffect(() => {
    let cancelled = false;

    const checkExecutivePdf = async () => {
      try {
        const response = await fetch(EXECUTIVE_PDF_URL, {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/pdf" }
        });
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
        const isPdf = response.ok && contentType.includes("pdf");
        if (!cancelled) {
          setPdfAvailability(isPdf);
        }
      } catch {
        if (!cancelled) {
          setPdfAvailability(false);
        }
      }
    };

    void checkExecutivePdf();
    return () => {
      cancelled = true;
    };
  }, []);

  const exitCompareIfActive = () => {
    if (resultsMode === "compare") {
      setResultsMode(DEFAULT_RESULTS_MODE);
      clearPinned();
      showNotice("success", "Comparison cleared — save this run to compare again.");
    }
  };

  const closeInspector = () => {
    setInspectorStepId(null);
    setInspectorAnchor(null);
  };

  const showNotice = (tone: ExportNotice["tone"], text: string) => {
    setAppNotice({ tone, text });
  };

  const openStepInspector = (nodeId: string, anchor: { x: number; y: number }) => {
    setInspectorStepId(nodeId);
    setInspectorAnchor(anchor);
  };

  const startPauseWithInspectorReset = () => {
    toggleStartPause();
    closeInspector();
  };

  const resetSimulationView = () => {
    resetSimulation();
    setResultsMode(DEFAULT_RESULTS_MODE);
    closeInspector();
  };

  const openScenarioLibraryCsv = async () => {
    try {
      const result = await openLibrary();
      if (result.mode === "fallback") {
        libraryFileInputRef.current?.click();
        return;
      }
      if (result.mode === "opened") {
        showNotice("success", `Loaded scenario library: ${result.libraryName}`);
        setIsScenarioLibraryOpen(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scenario library could not be opened.";
      showNotice("error", `Library open failed: ${message}`);
    }
  };

  const buildTimestampName = () => {
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "short" });
    const day = now.getDate();
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `Run · ${month} ${day} · ${time}`;
  };

  const deduplicateName = (name: string): string => {
    const existing = new Set(libraryEntries.map((e) => e.scenarioName));
    if (!existing.has(name)) return name;
    let i = 2;
    while (existing.has(`${name} (${i})`)) i++;
    return `${name} (${i})`;
  };

  const saveCommittedScenarioToLibrary = () => {
    setSaveModalDefaultName(buildTimestampName());
    setIsSaveModalOpen(true);
  };

  const handleSaveModalConfirm = async (name: string) => {
    setIsSaveModalOpen(false);
    const finalName = deduplicateName(name);
    const savedMetrics = {
      forecastThroughput: output.globalMetrics.forecastThroughput ?? 0,
      bottleneckIndex: output.globalMetrics.bottleneckIndex ?? 0,
      totalWipQty: output.globalMetrics.totalWipQty ?? 0,
      totalCompletedOutputPieces: output.globalMetrics.totalCompletedOutputPieces ?? 0,
      activeConstraintName: operationalDiagnosis.primaryConstraint,
      weightedLeadTimeMinutes: wasteAnalysis.summary.totalLeadTimeMinutes ?? 0,
      tocThroughputPerUnit: throughputAnalysis.summary.tocThroughputPerUnit ?? "Blocked"
    };

    try {
      const result = await saveCurrentScenario(resolvedStepScenario, finalName, undefined, savedMetrics);
      if (result.mode === "cancelled") return;
      if (result.mode === "download" && result.csvText && result.fileName) {
        downloadTextFile(result.fileName, result.csvText, "text/csv;charset=utf-8");
        showNotice("success", `Scenario saved. Library downloaded to: ${result.fileName}`);
      } else {
        showNotice("success", `Scenario "${finalName}" saved to ${result.libraryName ?? "library"}.`);
      }
      setIsScenarioLibraryOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scenario library save failed.";
      showNotice("error", `Library save failed: ${message}`);
    }
  };

  const openExecutivePdf = () => {
    if (pdfAvailability === false) {
      showNotice("error", "Executive PDF is not available yet. Rerun npm run export:pdf-report first.");
      return;
    }

    const absoluteUrl = new URL(EXECUTIVE_PDF_URL, window.location.origin).toString();
    window.open(absoluteUrl, "_blank", "noopener,noreferrer");
    showNotice("success", "Opened the latest executive PDF report.");
  };

  const openComparisonReport = () => {
    if (pinnedEntries.length < 2) {
      showNotice("error", "Select Scenario A and Scenario B first.");
      return;
    }
    const opened = openComparisonExecutiveReportWindow({
      entryA: pinnedEntries[0],
      entryB: pinnedEntries[1],
      parameterGroups: dashboardConfig.parameterGroups,
      operationName: dashboardConfig.appTitle
    });
    if (!opened) {
      showNotice("error", "Comparison report pop-up was blocked by the browser.");
      return;
    }
    showNotice("success", "Opened the live comparison executive report. Use Print / Save PDF in the new window if you need a PDF copy.");
  };

  const exportComparisonJson = () => {
    if (pinnedEntries.length < 2) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      snapshots: pinnedEntries.map((entry) => ({
        scenarioId: entry.scenarioId,
        scenarioName: entry.scenarioName,
        note: entry.note ?? null,
        savedAt: entry.savedAt,
        metrics: entry.savedMetrics ?? null,
        scenario: entry.scenario
      }))
    };
    downloadTextFile(
      "scenario_comparisons.json",
      JSON.stringify(payload, null, 2),
      "application/json"
    );
    showNotice("success", "Downloaded scenario_comparisons.json — move it to models/active/ then run export:pdf-report.");
  };

  const loadScenarioFromLibrary = (scenarioId: string) => {
    const scenario = loadScenarioEntry(scenarioId);
    if (!scenario) {
      showNotice("error", "Selected scenario could not be loaded.");
      return;
    }

    loadScenario({
      ...baselineScenario,
      ...scenario
    });
    setResultsMode(DEFAULT_RESULTS_MODE);
    closeInspector();
    setIsScenarioLibraryOpen(false);

    const entry = libraryEntries.find((item) => item.scenarioId === scenarioId);
    showNotice("success", `Loaded scenario: ${entry?.scenarioName ?? scenarioId}`);
  };

  return (
    <div className={`simulator-page ${isReportMode ? "reports-layout" : "flow-layout"}`}>
      <div className={`app-shell ${isReportMode ? "reports-layout" : "flow-layout"}`}>
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
          onSpeedChange={setSpeedMultiplier}
          onStartPause={startPauseWithInspectorReset}
          onReset={resetSimulationView}
          onSaveCurrentScenario={saveCommittedScenarioToLibrary}
          onOpenExecutivePdf={openExecutivePdf}
          onOpenQuickStartGuide={() => setIsQuickStartGuideOpen(true)}
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

        <div
          className={`content-shell ${isParameterRailOpen ? "rail-open" : "rail-collapsed"} ${
            isReportMode ? "reports-layout" : "flow-layout"
          }`}
          style={{ "--parameter-rail-width": `${parameterRailWidth}px` } as CSSProperties}
        >
          <aside className="left-rail">
            <ParameterSidebar
              groups={sidebarParameterGroups}
              scenario={activeScenario}
              editable
              isRailOpen={isParameterRailOpen}
              railWidth={parameterRailWidth}
              minRailWidth={parameterRailMinWidth}
              maxRailWidth={parameterRailMaxWidth}
              onToggleRail={toggleParameterRail}
              onRailWidthChange={setParameterRailWidth}
              onChange={(key, value) => {
                exitCompareIfActive();
                updateScenarioValue(key, value);
              }}
            />
          </aside>

          <SimulatorResultsStage
            resultsMode={resultsMode}
            isParameterRailOpen={isParameterRailOpen}
            activeKpis={activeKpis}
            activeMetrics={activeMetrics}
            output={output}
            forecastModel={forecastModel}
            dashboardConfig={dashboardConfig}
            isPaused={isPaused}
            resetViewSignal={resetViewSignal}
            flowViewportStorageKey={flowViewportStorageKey}
            operationalDiagnosis={operationalDiagnosis}
            kaizenReport={kaizenReport}
            throughputAnalysis={throughputAnalysis}
            wasteAnalysis={wasteAnalysis}
            assumptionsReport={assumptionsReport}
            pinnedEntries={pinnedEntries}
            scenarioCount={libraryEntries.length}
            flowReferenceMetrics={flowReferenceMetrics}
            flowReferenceLabel={flowReferenceLabel}
            onToggleParameterRail={toggleParameterRail}
            onOpenStepInspector={openStepInspector}
            onOpenExecutivePdf={openExecutivePdf}
            onOpenComparisonReport={openComparisonReport}
            onOpenScenarioLibrary={() => setIsScenarioLibraryOpen(true)}
            onSwapComparison={swapEntries}
            onClearComparison={clearPinned}
          />
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
          onStage={closeInspector}
          onApplyResume={startPauseWithInspectorReset}
          onClose={closeInspector}
        />

        <ScenarioLibraryPanel
          isOpen={isScenarioLibraryOpen}
          libraryName={libraryName}
          lastLoadedAt={lastLoadedAt}
          entries={libraryEntries}
          issues={libraryIssues}
          currentScenarioId={currentScenarioId}
          selectedScenarioId={selectedScenarioId}
          comparisonIds={comparisonIds}
          onSelectScenario={setSelectedScenarioId}
          onOpenCsv={openScenarioLibraryCsv}
          onSaveCurrent={saveCommittedScenarioToLibrary}
          onLoadScenario={loadScenarioFromLibrary}
          onDeleteScenario={deleteScenarioEntry}
          onAssignEntry={assignEntry}
          onClearSlot={clearSlot}
          onSwapEntries={swapEntries}
          onClearComparison={clearPinned}
          onCompare={() => setResultsMode("compare")}
          onClose={() => setIsScenarioLibraryOpen(false)}
        />

        <SaveScenarioModal
          isOpen={isSaveModalOpen}
          defaultName={saveModalDefaultName}
          libraryName={libraryName}
          onConfirm={handleSaveModalConfirm}
          onCancel={() => setIsSaveModalOpen(false)}
        />

        <QuickStartGuideDialog
          isOpen={isQuickStartGuideOpen}
          onClose={() => setIsQuickStartGuideOpen(false)}
          onOpenExecutivePdf={openExecutivePdf}
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
              showNotice("success", `Loaded scenario library: ${file.name}`);
              setIsScenarioLibraryOpen(true);
            } catch (error) {
              const message = error instanceof Error ? error.message : "Scenario library could not be read.";
              showNotice("error", `Library open failed: ${message}`);
            }
          }}
        />
      </div>
    </div>
  );
}
