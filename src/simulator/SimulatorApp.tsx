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
import { buildThroughputAnalysis } from "../lib/throughputAnalysis";
import { buildWasteAnalysis } from "../lib/wasteAnalysis";
import type { RecentFileRecord, ScenarioLibraryEntry, SimulatorResultsMode } from "../types/contracts";
import { buildInspectorValues, buildResolvedStepScenario } from "./scenarioState";
import { useScenarioComparison } from "./useScenarioComparison";
import { useScenarioFiles } from "./useScenarioFiles";
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
  // Fallback file input for browsers without File System Access API
  const scenarioFileInputRef = useRef<HTMLInputElement | null>(null);
  // Tracks whether the fallback input was triggered for a slot assignment (vs. load)
  const pendingSlotRef = useRef<"A" | "B" | null>(null);

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

  // ── File-based scenario state ───────────────────────────────────────────────
  const {
    activeRunName,
    issues: fileIssues,
    recentFiles,
    saveCurrentRun,
    openScenarioFile,
    importScenarioFile
  } = useScenarioFiles({
    scenarioColumns: scenarioLibraryColumns,
    appTitle: dashboardConfig.appTitle,
    modelName: forecastModel.metadata.name,
    onNeedFallbackOpen: () => scenarioFileInputRef.current?.click()
  });

  // ── Comparison state ────────────────────────────────────────────────────────
  // Slots hold full entries — no library lookup needed.
  const { slotA, slotB, readyToCompare, assignEntry, clearSlot, swapSlots, clearAll } =
    useScenarioComparison();

  // ── UI state ────────────────────────────────────────────────────────────────
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
  // Multi-row CSV warning modal (old library format detected)
  const [multiRowWarning, setMultiRowWarning] = useState<{
    rowCount: number;
    firstName: string;
  } | null>(null);

  const isReportMode = resultsMode !== "flow";

  // ── Analyses ────────────────────────────────────────────────────────────────
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
  const activeKpis = useMemo(() => {
    if (resultsMode === "throughput") return throughputKpis;
    if (resultsMode === "kaizen") return kaizenKpis;
    if (resultsMode === "assumptions") return assumptionsKpis;
    if (resultsMode === "waste") return wasteKpis;
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

  // pinnedEntries: derived directly from slots — no library lookup needed.
  // Falls back to metric recomputation for entries opened from old files without savedMetrics.
  const pinnedEntries = useMemo(() => {
    return [slotA, slotB]
      .filter((e): e is ScenarioLibraryEntry => e !== null)
      .map((entry) => {
        if (entry.savedMetrics) return entry;
        // Old file opened without savedMetrics — recompute from stored scenario params
        const reScenario = { ...baselineScenario, ...entry.scenario };
        const reOutput = createBottleneckForecastOutput(forecastModel, reScenario, simHorizonHours);
        const reThroughput = buildThroughputAnalysis(
          forecastModel,
          masterData,
          reScenario,
          reOutput
        );
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
      });
  }, [slotA, slotB, baselineScenario, forecastModel, masterData, simHorizonHours]);

  const flowReferenceMetrics = useMemo<Record<string, number> | undefined>(() => {
    const baseline = pinnedEntries[0]?.savedMetrics;
    if (!baseline) return undefined;
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(baseline)) {
      if (typeof v === "number" && Number.isFinite(v)) result[k] = v;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }, [pinnedEntries]);

  const flowReferenceLabel = pinnedEntries[0]?.scenarioName;

  // ── PDF check ───────────────────────────────────────────────────────────────
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
        if (!cancelled) setPdfAvailability(response.ok && contentType.includes("pdf"));
      } catch {
        if (!cancelled) setPdfAvailability(false);
      }
    };
    void checkExecutivePdf();
    return () => { cancelled = true; };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const showNotice = (tone: ExportNotice["tone"], text: string) => {
    setAppNotice({ tone, text });
  };

  const closeInspector = () => {
    setInspectorStepId(null);
    setInspectorAnchor(null);
  };

  const exitCompareIfActive = () => {
    if (resultsMode === "compare") {
      setResultsMode(DEFAULT_RESULTS_MODE);
      clearAll();
      showNotice("success", "Comparison cleared — save this run to compare again.");
    }
  };

  const buildTimestampName = () => {
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "short" });
    const day = now.getDate();
    const time = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    return `Run · ${month} ${day} · ${time}`;
  };

  const handleMultiRowResult = (result: NonNullable<Awaited<ReturnType<typeof openScenarioFile>>>) => {
    if (result.multiRowWarning) {
      setMultiRowWarning(result.multiRowWarning);
    }
  };

  // ── Scenario file actions ───────────────────────────────────────────────────

  /** Open a file and load it into the simulator (the opened file becomes the save target). */
  const handleOpenAndLoad = async () => {
    try {
      const result = await openScenarioFile({ setAsActiveRun: true });
      if (!result) return;
      handleMultiRowResult(result);
      loadScenario({ ...baselineScenario, ...result.entry.scenario });
      setResultsMode(DEFAULT_RESULTS_MODE);
      closeInspector();
      setIsScenarioLibraryOpen(false);
      showNotice("success", `Loaded: ${result.entry.scenarioName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not open file.";
      showNotice("error", `Open failed: ${message}`);
    }
  };

  /**
   * Open a file picker and assign the result to a comparison slot.
   * Does NOT load into the simulator and does NOT change the active save target.
   */
  const handleChooseFileForSlot = async (slot: "A" | "B") => {
    try {
      const result = await openScenarioFile({ setAsActiveRun: false });
      if (!result) return;
      handleMultiRowResult(result);
      const otherEntry = slot === "A" ? slotB : slotA;
      if (otherEntry?.scenarioId === result.entry.scenarioId) {
        showNotice("warning", "That run is already in the other comparison slot.");
        return;
      }
      assignEntry(slot, result.entry);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not open file.";
      showNotice("error", `Open failed: ${message}`);
    }
  };

  /** Load a recent run into the simulator (does NOT change the active save target). */
  const handleLoadRecentFile = (record: RecentFileRecord) => {
    loadScenario({ ...baselineScenario, ...record.scenario });
    setResultsMode(DEFAULT_RESULTS_MODE);
    closeInspector();
    setIsScenarioLibraryOpen(false);
    showNotice("success", `Loaded: ${record.scenarioName}`);
  };

  /** Assign a recent run to a comparison slot (does NOT load into simulator). */
  const handleAssignRecentToSlot = (slot: "A" | "B", record: RecentFileRecord) => {
    const otherEntry = slot === "A" ? slotB : slotA;
    if (otherEntry?.scenarioId === record.scenarioId) {
      showNotice("warning", "That run is already in the other comparison slot.");
      return;
    }
    assignEntry(slot, record);
  };

  /** Open the compare view if both slots are filled; otherwise open the panel. */
  const handleOpenCompareTwoFiles = () => {
    if (readyToCompare) {
      setResultsMode("compare");
    } else {
      setIsScenarioLibraryOpen(true);
    }
  };

  // ── Save actions ────────────────────────────────────────────────────────────
  const openSaveRunModal = () => {
    setSaveModalDefaultName(buildTimestampName());
    setIsSaveModalOpen(true);
  };

  const handleSaveModalConfirm = async (name: string) => {
    setIsSaveModalOpen(false);
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
      const result = await saveCurrentRun(resolvedStepScenario, name, savedMetrics);
      if (result.mode === "cancelled") return;
      if (result.mode === "download") {
        downloadTextFile(result.fileName, result.csvText, "text/csv;charset=utf-8");
        showNotice("success", `Run saved. Downloaded to: ${result.fileName}`);
      } else {
        showNotice("success", `Run "${name}" saved to ${result.runName}.`);
      }
      setIsScenarioLibraryOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed.";
      showNotice("error", `Save failed: ${message}`);
    }
  };

  // ── Other actions ───────────────────────────────────────────────────────────
  const startPauseWithInspectorReset = () => {
    toggleStartPause();
    closeInspector();
  };

  const resetSimulationView = () => {
    resetSimulation();
    setResultsMode(DEFAULT_RESULTS_MODE);
    closeInspector();
  };

  const openExecutivePdf = () => {
    if (pdfAvailability === false) {
      showNotice(
        "error",
        "Executive PDF is not available yet. Rerun npm run export:pdf-report first."
      );
      return;
    }
    window.open(
      new URL(EXECUTIVE_PDF_URL, window.location.origin).toString(),
      "_blank",
      "noopener,noreferrer"
    );
    showNotice("success", "Opened the latest executive PDF report.");
  };

  const openComparisonReport = () => {
    if (pinnedEntries.length < 2) {
      showNotice("error", "Choose File A and File B before opening the comparison report.");
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
    showNotice(
      "success",
      "Opened the live comparison executive report. Use Print / Save PDF in the new window if you need a PDF copy."
    );
  };


  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={`simulator-page ${isReportMode ? "reports-layout" : "flow-layout"}`}>
      <div className={`app-shell ${isReportMode ? "reports-layout" : "flow-layout"}`}>
        <DashboardHeader
          brandLabel="Leanstorming Operational Stress Labs"
          title={dashboardConfig.appTitle}
          subtitle={dashboardConfig.subtitle}
          primaryConstraint={operationalDiagnosis.constraintStepName}
          statusSummary={operationalDiagnosis.shortStatusSummary}
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
          scenarioCount={recentFiles.length}
          speedMultiplier={speedMultiplier}
          onResultsModeChange={setResultsMode}
          onSpeedChange={setSpeedMultiplier}
          onStartPause={startPauseWithInspectorReset}
          onReset={resetSimulationView}
          onSaveCurrentScenario={openSaveRunModal}
          onOpenRun={handleOpenAndLoad}
          onCompareTwoFiles={handleOpenCompareTwoFiles}
          onOpenExecutivePdf={openExecutivePdf}
          onOpenQuickStartGuide={() => setIsQuickStartGuideOpen(true)}
          onToggleScenarioLibrary={() => setIsScenarioLibraryOpen((c) => !c)}
          onFocusConstraint={() => setResultsMode("diagnosis")}
          onSimHorizonChange={(value) => updateScenarioValue("simulationHorizonHours", value)}
        />

        {appNotice ? (
          <div
            className={`export-banner ${appNotice.tone === "error" ? "is-error" : appNotice.tone === "warning" ? "is-warning" : "is-success"}`}
          >
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
            scenarioCount={recentFiles.length}
            flowReferenceMetrics={flowReferenceMetrics}
            flowReferenceLabel={flowReferenceLabel}
            onToggleParameterRail={toggleParameterRail}
            onOpenStepInspector={(nodeId, anchor) => {
              setInspectorStepId(nodeId);
              setInspectorAnchor(anchor);
            }}
            onOpenExecutivePdf={openExecutivePdf}
            onOpenComparisonReport={openComparisonReport}
            onOpenScenarioFiles={() => setIsScenarioLibraryOpen(true)}
            onSwapComparison={swapSlots}
            onClearComparison={clearAll}
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
            if (!inspectorStep) return;
            updateStepField(inspectorStep.stepId, field, value);
          }}
          onDiscard={() => {
            if (!inspectorStep) return;
            discardStepOverrides(inspectorStep.stepId);
          }}
          onStage={closeInspector}
          onApplyResume={startPauseWithInspectorReset}
          onClose={closeInspector}
        />

        {/* Saved Runs panel ─────────────────────────────────────────────── */}
        <ScenarioLibraryPanel
          isOpen={isScenarioLibraryOpen}
          activeRunName={activeRunName}
          issues={fileIssues}
          slotA={slotA}
          slotB={slotB}
          recentFiles={recentFiles}
          readyToCompare={readyToCompare}
          onSaveCurrentRun={openSaveRunModal}
          onOpenAndLoad={handleOpenAndLoad}
          onChooseFileForSlot={handleChooseFileForSlot}
          onLoadRecentFile={handleLoadRecentFile}
          onAssignRecentToSlot={handleAssignRecentToSlot}
          onClearSlot={clearSlot}
          onSwapSlots={swapSlots}
          onClearComparison={clearAll}
          onCompare={() => {
            setResultsMode("compare");
            setIsScenarioLibraryOpen(false);
          }}
          onClose={() => setIsScenarioLibraryOpen(false)}
        />

        <SaveScenarioModal
          isOpen={isSaveModalOpen}
          defaultName={saveModalDefaultName}
          onConfirm={handleSaveModalConfirm}
          onCancel={() => setIsSaveModalOpen(false)}
        />

        <QuickStartGuideDialog
          isOpen={isQuickStartGuideOpen}
          onClose={() => setIsQuickStartGuideOpen(false)}
          onOpenExecutivePdf={openExecutivePdf}
        />

        {/* Multi-row CSV warning modal (old library format) ────────────── */}
        {multiRowWarning ? (
          <div className="library-shell" onClick={() => setMultiRowWarning(null)}>
            <section
              className="library-panel"
              style={{ width: "min(460px, 100%)", height: "auto", padding: "28px 24px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="library-eyebrow" style={{ marginBottom: 8 }}>
                Warning
              </p>
              <h2 style={{ margin: "0 0 14px" }}>Multiple Runs in File</h2>
              <p style={{ margin: "0 0 10px" }}>
                This file contains{" "}
                <strong>{multiRowWarning.rowCount} saved runs</strong> (old library format). Only
                the first run — <strong>"{multiRowWarning.firstName}"</strong> — was loaded.
              </p>
              <p style={{ margin: "0 0 20px", color: "var(--ink-muted)" }}>
                To use the others, save them individually as separate files.
              </p>
              <button
                type="button"
                className="primary"
                onClick={() => setMultiRowWarning(null)}
              >
                OK
              </button>
            </section>
          </div>
        ) : null}

        {/* Fallback file input for browsers without File System Access API */}
        <input
          ref={scenarioFileInputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;

            try {
              const slot = pendingSlotRef.current;
              pendingSlotRef.current = null;

              const result = await importScenarioFile(file);
              if (!result) return;

              if (result.multiRowWarning) setMultiRowWarning(result.multiRowWarning);

              if (slot) {
                // Was triggered by handleChooseFileForSlot
                const otherEntry = slot === "A" ? slotB : slotA;
                if (otherEntry?.scenarioId === result.entry.scenarioId) {
                  showNotice("warning", "That run is already in the other comparison slot.");
                  return;
                }
                assignEntry(slot, result.entry);
              } else {
                // Was triggered by handleOpenAndLoad
                loadScenario({ ...baselineScenario, ...result.entry.scenario });
                setResultsMode(DEFAULT_RESULTS_MODE);
                closeInspector();
                setIsScenarioLibraryOpen(false);
                showNotice("success", `Loaded: ${result.entry.scenarioName}`);
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : "Could not read file.";
              showNotice("error", `Open failed: ${message}`);
            }
          }}
        />
      </div>
    </div>
  );
}
