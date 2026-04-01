import { useEffect, useRef, useState } from "react";
import type { SimulatorResultsMode } from "../types/contracts";
import type { ExportNotice } from "./simulatorConfig";

const RESULTS_MODE_OPTIONS = new Set<SimulatorResultsMode>([
  "flow",
  "diagnosis",
  "kaizen",
  "throughput",
  "waste",
  "assumptions",
  "compare"
]);

function getInitialResultsMode(
  search: string,
  defaultResultsMode: SimulatorResultsMode
): SimulatorResultsMode {
  const params = new URLSearchParams(search);
  const requestedView = params.get("view");
  if (requestedView && RESULTS_MODE_OPTIONS.has(requestedView as SimulatorResultsMode)) {
    return requestedView as SimulatorResultsMode;
  }
  return defaultResultsMode;
}

interface UseSimulatorUiStateInput {
  initialSearch: string;
  defaultResultsMode: SimulatorResultsMode;
  executivePdfUrl: string;
}

export function useSimulatorUiState({
  initialSearch,
  defaultResultsMode,
  executivePdfUrl
}: UseSimulatorUiStateInput) {
  const pendingComparisonSlotRef = useRef<"A" | "B" | null>(null);
  const [inspectorStepId, setInspectorStepId] = useState<string | null>(null);
  const [inspectorAnchor, setInspectorAnchor] = useState<{ x: number; y: number } | null>(null);
  const [appNotice, setAppNotice] = useState<ExportNotice | null>(null);
  const [pdfAvailability, setPdfAvailability] = useState<boolean | null>(null);
  const [resultsMode, setResultsMode] = useState<SimulatorResultsMode>(() =>
    getInitialResultsMode(initialSearch, defaultResultsMode)
  );
  const [isScenarioLibraryOpen, setIsScenarioLibraryOpen] = useState(false);
  const [isQuickStartGuideOpen, setIsQuickStartGuideOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalDefaultName, setSaveModalDefaultName] = useState("");
  const [multiRowWarning, setMultiRowWarning] = useState<{
    rowCount: number;
    firstName: string;
    importedCount: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const checkExecutivePdf = async () => {
      try {
        const response = await fetch(executivePdfUrl, {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/pdf" }
        });
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
        if (!cancelled) {
          setPdfAvailability(response.ok && contentType.includes("pdf"));
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
  }, [executivePdfUrl]);

  const showNotice = (tone: ExportNotice["tone"], text: string) => {
    setAppNotice({ tone, text });
  };

  const closeInspector = () => {
    setInspectorStepId(null);
    setInspectorAnchor(null);
  };

  return {
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
  };
}