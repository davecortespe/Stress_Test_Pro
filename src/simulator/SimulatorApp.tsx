import { useRef, type CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import { DashboardHeader } from "../components/DashboardHeader";
import { ParameterSidebar } from "../components/ParameterSidebar";
import { QuickStartGuideDialog } from "../components/QuickStartGuideDialog";
import { SaveScenarioModal } from "../components/SaveScenarioModal";
import { ScenarioLibraryPanel } from "../components/ScenarioLibraryPanel";
import { StepInspector } from "../components/StepInspector";
import type { SimulatorResultsMode } from "../types/contracts";
import { useScenarioComparison } from "./useScenarioComparison";
import { useScenarioFiles } from "./useScenarioFiles";
import { useSimulatorScenarioWorkflow } from "./useSimulatorScenarioWorkflow";
import { useScenarioSession } from "./useScenarioSession";
import { EXECUTIVE_PDF_URL } from "./simulatorConfig";
import { useParameterRail } from "./useParameterRail";
import { SimulatorResultsStage } from "./SimulatorResultsStage";
import { useSimulatorDerivedState } from "./useSimulatorDerivedState";
import { useSimulatorModelData } from "./useSimulatorModelData";
import { useSimulatorUiState } from "./useSimulatorUiState";
import "./simulator.css";

const DEFAULT_RESULTS_MODE: SimulatorResultsMode = "flow";

export default function SimulatorApp() {
  const location = useLocation();
  const scenarioFileInputRef = useRef<HTMLInputElement | null>(null);

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
    applyChangesAndStart,
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
    pendingComparisonSlotRef,
    inspectorStepId,
    inspectorAnchor,
    appNotice,
    pdfAvailability,
    resultsMode,
    isScenarioLibraryOpen,
    isQuickStartGuideOpen,
    isSaveModalOpen,
    saveModalDefaultName,
    multiRowWarning,
    setInspectorStepId,
    setInspectorAnchor,
    setResultsMode,
    setIsScenarioLibraryOpen,
    setIsQuickStartGuideOpen,
    setIsSaveModalOpen,
    setSaveModalDefaultName,
    setMultiRowWarning,
    showNotice,
    closeInspector
  } = useSimulatorUiState({
    initialSearch: location.search,
    defaultResultsMode: DEFAULT_RESULTS_MODE,
    executivePdfUrl: EXECUTIVE_PDF_URL
  });

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

  const { slotA, slotB, readyToCompare, assignEntry, clearSlot, swapSlots, clearAll } =
    useScenarioComparison();

  const isReportMode = resultsMode !== "flow";
  const {
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
    flowReferenceLabel
  } = useSimulatorDerivedState({
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
  });

  const {
    exitCompareIfActive,
    handleOpenAndLoad,
    handleChooseFileForSlot,
    handleLoadRecentFile,
    handleAssignRecentToSlot,
    handleOpenCompareTwoFiles,
    openSaveRunModal,
    handleSaveModalConfirm,
    handleOpenComparisonReport,
    handleCompareSelectedFiles,
    handleFallbackFileImport
  } = useSimulatorScenarioWorkflow({
    baselineScenario,
    dashboardConfig,
    currentResultsMode: resultsMode,
    slotA,
    slotB,
    readyToCompare,
    pinnedEntries,
    resolvedStepScenario,
    currentSavedMetrics,
    defaultResultsMode: DEFAULT_RESULTS_MODE,
    pendingComparisonSlotRef,
    openScenarioFile,
    importScenarioFile,
    saveCurrentRun,
    loadScenario,
    assignEntry,
    clearAll,
    closeInspector,
    showNotice,
    setResultsMode,
    setIsScenarioLibraryOpen,
    setIsSaveModalOpen,
    setSaveModalDefaultName,
    setMultiRowWarning
  });

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

  const applyInspectorChangesAndStart = () => {
    applyChangesAndStart();
    closeInspector();
  };

  const openExecutivePdf = () => {
    if (pdfAvailability === false) {
      showNotice(
        "error",
        "Executive PDF is not available yet. Rerun npm run refresh:forecast:active or npm run export:pdf-report first."
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
          isRunComplete={isRunComplete}
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
            onOpenComparisonReport={handleOpenComparisonReport}
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
          onApplyResume={applyInspectorChangesAndStart}
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
          onCompare={handleCompareSelectedFiles}
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
                The other {Math.max(0, multiRowWarning.importedCount - 1)} runs were added to Recent
                Runs so you can open them and resave each one as its own file.
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
            if (!file) {
              return;
            }
            await handleFallbackFileImport(file);
          }}
        />
      </div>
    </div>
  );
}
