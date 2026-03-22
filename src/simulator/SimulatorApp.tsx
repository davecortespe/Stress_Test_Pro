import { useMemo, useRef, useState, type CSSProperties } from "react";
import { DashboardHeader } from "../components/DashboardHeader";
import { ParameterSidebar } from "../components/ParameterSidebar";
import { ScenarioLibraryPanel } from "../components/ScenarioLibraryPanel";
import { StepInspector } from "../components/StepInspector";
import { buildAssumptionsReport } from "../lib/assumptionsReport";
import { createBottleneckForecastOutput } from "../lib/bottleneckForecast";
import { buildKaizenReport } from "../lib/kaizenReport";
import {
  buildThroughputAnalysis
} from "../lib/throughputAnalysis";
import {
  buildWasteAnalysis
} from "../lib/wasteAnalysis";
import consultingReportSpecJson from "../../models/active/consulting_report_export.json";
import type { SimulatorResultsMode } from "../types/contracts";
import {
  buildInspectorValues,
  buildResolvedStepScenario
} from "./scenarioState";
import { useScenarioLibrary } from "./useScenarioLibrary";
import { useScenarioSession } from "./useScenarioSession";
import {
  assumptionsKpis,
  downloadTextFile,
  ExportNotice,
  KAIZEN_PDF_URL,
  kaizenKpis,
  throughputKpis,
  wasteKpis
} from "./simulatorConfig";
import { useOperationalDiagnosis } from "./useOperationalDiagnosis";
import { useParameterRail } from "./useParameterRail";
import { SimulatorResultsStage } from "./SimulatorResultsStage";
import { useSimulatorModelData } from "./useSimulatorModelData";
import "./simulator.css";

function buildFileSafeBaseName(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

export default function SimulatorApp() {
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
      showNotice(
        "success",
        result.mode === "download"
          ? `Scenario saved. Downloaded library CSV: ${result.fileName}`
          : `Scenario saved to library${result.libraryName ? `: ${result.libraryName}` : "."}`
      );
      setIsScenarioLibraryOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scenario library save failed.";
      showNotice("error", `Library save failed: ${message}`);
    }
  };

  const openKaizenPdf = () => {
    window.open(KAIZEN_PDF_URL, "_blank", "noopener,noreferrer");
    showNotice(
      "success",
      "Opened the latest Kaizen PDF report. If it looks stale, rerun npm run export:pdf-report first."
    );
  };

  const exportConsultingReport = async () => {
    const reportBase = `${buildFileSafeBaseName(dashboardConfig.appTitle, "consulting-report")}-consulting-report`;
    const mdUrl = new URL("../../models/active/consulting_report_export.md", import.meta.url);
    const htmlUrl = new URL("../../models/active/consulting_report_export.html", import.meta.url);

    try {
      const [mdResponse, htmlResponse] = await Promise.all([fetch(mdUrl), fetch(htmlUrl)]);
      if (!mdResponse.ok || !htmlResponse.ok) {
        throw new Error("Consulting report assets could not be loaded.");
      }
      const [mdText, htmlText] = await Promise.all([mdResponse.text(), htmlResponse.text()]);
      downloadTextFile(`${reportBase}.json`, `${JSON.stringify(consultingReportSpecJson, null, 2)}\n`);
      downloadTextFile(`${reportBase}.md`, mdText);
      downloadTextFile(`${reportBase}.html`, htmlText, "text/html;charset=utf-8");
      showNotice("success", `Exported consulting report package: ${reportBase}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Consulting report export failed.";
      showNotice("error", `Consulting report export failed: ${message}`);
    }
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
    closeInspector();
    setIsScenarioLibraryOpen(false);

    const entry = libraryEntries.find((item) => item.scenarioId === scenarioId);
    showNotice("success", `Loaded scenario: ${entry?.scenarioName ?? scenarioId}`);
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
          onSpeedChange={setSpeedMultiplier}
          onStartPause={startPauseWithInspectorReset}
          onReset={resetSimulationView}
          onSaveCurrentScenario={saveCommittedScenarioToLibrary}
          onExportConsultingReport={exportConsultingReport}
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
          className={`content-shell ${isParameterRailOpen ? "rail-open" : "rail-collapsed"}`}
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
              onChange={updateScenarioValue}
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
            onToggleParameterRail={toggleParameterRail}
            onOpenStepInspector={openStepInspector}
            onOpenKaizenPdf={openKaizenPdf}
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
