import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { openComparisonExecutiveReportWindow } from "../lib/comparisonExecutiveReport";
import type {
  DashboardConfig,
  RecentFileRecord,
  ScenarioLibraryEntry,
  ScenarioSavedMetrics,
  SimulatorResultsMode
} from "../types/contracts";
import type { OpenFileResult, SaveRunResult } from "./useScenarioFiles";
import { downloadTextFile, type ExportNotice } from "./simulatorConfig";
import type { ScenarioState } from "./scenarioState";

interface UseSimulatorScenarioWorkflowInput {
  baselineScenario: ScenarioState;
  dashboardConfig: DashboardConfig;
  currentResultsMode: SimulatorResultsMode;
  slotA: ScenarioLibraryEntry | null;
  slotB: ScenarioLibraryEntry | null;
  readyToCompare: boolean;
  pinnedEntries: ScenarioLibraryEntry[];
  resolvedStepScenario: ScenarioState;
  currentSavedMetrics: ScenarioSavedMetrics;
  defaultResultsMode: SimulatorResultsMode;
  pendingComparisonSlotRef: MutableRefObject<"A" | "B" | null>;
  openScenarioFile: (opts?: { setAsActiveRun?: boolean }) => Promise<OpenFileResult>;
  importScenarioFile: (file: File) => Promise<OpenFileResult>;
  saveCurrentRun: (
    scenario: ScenarioState,
    name: string,
    savedMetrics?: ScenarioSavedMetrics
  ) => Promise<SaveRunResult>;
  loadScenario: (scenario: ScenarioState) => void;
  assignEntry: (slot: "A" | "B", entry: ScenarioLibraryEntry) => void;
  clearAll: () => void;
  closeInspector: () => void;
  showNotice: (tone: ExportNotice["tone"], text: string) => void;
  setResultsMode: Dispatch<SetStateAction<SimulatorResultsMode>>;
  setIsScenarioLibraryOpen: Dispatch<SetStateAction<boolean>>;
  setIsSaveModalOpen: Dispatch<SetStateAction<boolean>>;
  setSaveModalDefaultName: Dispatch<SetStateAction<string>>;
  setMultiRowWarning: Dispatch<
    SetStateAction<{
      rowCount: number;
      firstName: string;
      importedCount: number;
    } | null>
  >;
}

function buildTimestampName(): string {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" });
  const day = now.getDate();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return `Run · ${month} ${day} · ${time}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useSimulatorScenarioWorkflow({
  baselineScenario,
  dashboardConfig,
  currentResultsMode,
  slotA,
  slotB,
  readyToCompare,
  pinnedEntries,
  resolvedStepScenario,
  currentSavedMetrics,
  defaultResultsMode,
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
}: UseSimulatorScenarioWorkflowInput) {
  const handleMultiRowResult = (result: NonNullable<OpenFileResult>) => {
    if (result.multiRowWarning) {
      setMultiRowWarning(result.multiRowWarning);
    }
  };

  const loadScenarioEntry = (entry: ScenarioLibraryEntry) => {
    loadScenario({ ...baselineScenario, ...entry.scenario });
    setResultsMode(defaultResultsMode);
    closeInspector();
    setIsScenarioLibraryOpen(false);
    showNotice("success", `Loaded: ${entry.scenarioName}`);
  };

  const isDuplicateComparisonEntry = (slot: "A" | "B", scenarioId: string) => {
    const otherEntry = slot === "A" ? slotB : slotA;
    return otherEntry?.scenarioId === scenarioId;
  };

  const exitCompareIfActive = () => {
    if (currentResultsMode === "compare") {
      setResultsMode(defaultResultsMode);
      clearAll();
      showNotice("success", "Comparison cleared — save this run to compare again.");
    }
  };

  const handleOpenAndLoad = async () => {
    try {
      pendingComparisonSlotRef.current = null;
      const result = await openScenarioFile({ setAsActiveRun: true });
      if (!result) {
        return;
      }
      handleMultiRowResult(result);
      loadScenarioEntry(result.entry);
    } catch (error) {
      showNotice("error", `Open failed: ${getErrorMessage(error, "Could not open file.")}`);
    }
  };

  const handleChooseFileForSlot = async (slot: "A" | "B") => {
    try {
      pendingComparisonSlotRef.current = slot;
      const result = await openScenarioFile({ setAsActiveRun: false });
      pendingComparisonSlotRef.current = null;
      if (!result) {
        return;
      }
      handleMultiRowResult(result);
      if (isDuplicateComparisonEntry(slot, result.entry.scenarioId)) {
        showNotice("warning", "That run is already in the other comparison slot.");
        return;
      }
      assignEntry(slot, result.entry);
    } catch (error) {
      pendingComparisonSlotRef.current = null;
      showNotice("error", `Open failed: ${getErrorMessage(error, "Could not open file.")}`);
    }
  };

  const handleLoadRecentFile = (record: RecentFileRecord) => {
    loadScenarioEntry(record);
  };

  const handleAssignRecentToSlot = (slot: "A" | "B", record: RecentFileRecord) => {
    if (isDuplicateComparisonEntry(slot, record.scenarioId)) {
      showNotice("warning", "That run is already in the other comparison slot.");
      return;
    }
    assignEntry(slot, record);
  };

  const handleOpenCompareTwoFiles = () => {
    if (readyToCompare) {
      setResultsMode("compare");
      return;
    }
    setIsScenarioLibraryOpen(true);
  };

  const openSaveRunModal = () => {
    setSaveModalDefaultName(buildTimestampName());
    setIsSaveModalOpen(true);
  };

  const handleSaveModalConfirm = async (name: string) => {
    setIsSaveModalOpen(false);
    try {
      const result = await saveCurrentRun(resolvedStepScenario, name, currentSavedMetrics);
      if (result.mode === "cancelled") {
        return;
      }
      if (result.mode === "download") {
        downloadTextFile(result.fileName, result.csvText, "text/csv;charset=utf-8");
        showNotice("success", `Run saved. Downloaded to: ${result.fileName}`);
      } else {
        showNotice("success", `Run "${name}" saved to ${result.runName}.`);
      }
      setIsScenarioLibraryOpen(true);
    } catch (error) {
      showNotice("error", `Save failed: ${getErrorMessage(error, "Save failed.")}`);
    }
  };

  const handleOpenComparisonReport = () => {
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

  const handleCompareSelectedFiles = () => {
    setResultsMode("compare");
    setIsScenarioLibraryOpen(false);
  };

  const handleFallbackFileImport = async (file: File) => {
    try {
      const slot = pendingComparisonSlotRef.current;
      pendingComparisonSlotRef.current = null;

      const result = await importScenarioFile(file);
      if (!result) {
        return;
      }
      handleMultiRowResult(result);

      if (slot) {
        if (isDuplicateComparisonEntry(slot, result.entry.scenarioId)) {
          showNotice("warning", "That run is already in the other comparison slot.");
          return;
        }
        assignEntry(slot, result.entry);
        return;
      }

      loadScenarioEntry(result.entry);
    } catch (error) {
      showNotice("error", `Open failed: ${getErrorMessage(error, "Could not read file.")}`);
    }
  };

  return {
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
  };
}