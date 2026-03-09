import { useState } from "react";
import {
  createScenarioLibraryContext,
  parseScenarioLibrary,
  serializeScenarioLibrary,
  upsertScenarioLibraryEntry
} from "../lib/scenarioCsv";
import type {
  ScenarioLibraryEntry,
  ScenarioLibraryFileContext,
  ScenarioLibraryIssue
} from "../types/contracts";
import type { ScenarioState } from "./scenarioState";

interface WritableFileStreamLike {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
}

interface FileHandleLike {
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<WritableFileStreamLike>;
}

declare global {
  interface Window {
    showOpenFilePicker?: (options?: {
      multiple?: boolean;
      excludeAcceptAllOption?: boolean;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileHandleLike[]>;
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      excludeAcceptAllOption?: boolean;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileHandleLike>;
  }
}

interface SaveScenarioResult {
  mode: "file" | "download" | "cancelled";
  csvText?: string;
  fileName?: string;
  savedEntry?: ScenarioLibraryEntry;
}

interface UseScenarioLibraryInput {
  scenarioColumns: string[];
  appTitle: string;
  modelName: string;
}

interface UseScenarioLibraryResult {
  libraryEntries: ScenarioLibraryEntry[];
  selectedScenarioId: string | null;
  currentScenarioId: string | null;
  activeCsvHandle: FileHandleLike | null;
  libraryName: string | null;
  lastLoadedAt: string | null;
  issues: ScenarioLibraryIssue[];
  openLibrary: () => Promise<"opened" | "fallback" | "cancelled">;
  importLibraryFile: (file: File) => Promise<void>;
  saveCurrentScenario: (scenario: ScenarioState, scenarioName: string) => Promise<SaveScenarioResult>;
  loadScenarioEntry: (scenarioId: string) => ScenarioState | null;
  clearCurrentScenario: () => void;
  setSelectedScenarioId: (scenarioId: string | null) => void;
}

function createTimestampName(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `Scenario ${year}-${month}-${day} ${hours}:${minutes}`;
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase() || "scenario_library";
}

function toCsvFileName(value: string): string {
  const sanitized = sanitizeFileName(value).replace(/\.csv$/i, "");
  return `${sanitized}.csv`;
}

function createScenarioId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readHandleText(handle: FileHandleLike): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

async function writeHandleText(handle: FileHandleLike, contents: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(contents);
  await writable.close();
}

export function useScenarioLibrary({
  scenarioColumns,
  appTitle,
  modelName
}: UseScenarioLibraryInput): UseScenarioLibraryResult {
  const [libraryEntries, setLibraryEntries] = useState<ScenarioLibraryEntry[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null);
  const [activeCsvHandle, setActiveCsvHandle] = useState<FileHandleLike | null>(null);
  const [libraryName, setLibraryName] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [issues, setIssues] = useState<ScenarioLibraryIssue[]>([]);

  const context: ScenarioLibraryFileContext = createScenarioLibraryContext(appTitle, modelName);

  const loadLibraryText = async (
    csvText: string,
    sourceName: string,
    handle: FileHandleLike | null
  ): Promise<void> => {
    const parsed = parseScenarioLibrary(csvText, scenarioColumns);
    setLibraryEntries(parsed.entries);
    setIssues(parsed.issues);
    setActiveCsvHandle(handle);
    setLibraryName(sourceName);
    setLastLoadedAt(new Date().toISOString());
    setSelectedScenarioId(null);
    setCurrentScenarioId((current) =>
      current && parsed.entries.some((entry) => entry.scenarioId === current) ? current : null
    );
  };

  const openLibrary = async (): Promise<"opened" | "fallback" | "cancelled"> => {
    if (typeof window === "undefined" || typeof window.showOpenFilePicker !== "function") {
      return "fallback";
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        excludeAcceptAllOption: false,
        types: [
          {
            description: "Scenario Library CSV",
            accept: {
              "text/csv": [".csv"]
            }
          }
        ]
      });

      if (!handle) {
        return "cancelled";
      }

      await loadLibraryText(await readHandleText(handle), handle.name, handle);
      return "opened";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      throw error;
    }
  };

  const importLibraryFile = async (file: File): Promise<void> => {
    await loadLibraryText(await file.text(), file.name, null);
  };

  const saveCurrentScenario = async (
    scenario: ScenarioState,
    scenarioName: string
  ): Promise<SaveScenarioResult> => {
    const normalizedName = scenarioName.trim() || createTimestampName();
    const savedAt = new Date().toISOString();
    const entry: ScenarioLibraryEntry = {
      scenarioId: currentScenarioId ?? createScenarioId(),
      scenarioName: normalizedName,
      savedAt,
      scenario: { ...scenario }
    };
    const nextEntries = upsertScenarioLibraryEntry(libraryEntries, entry);
    const csvText = serializeScenarioLibrary(nextEntries, context, scenarioColumns);
    const defaultFileName = toCsvFileName(libraryName ?? appTitle);

    setLibraryEntries(nextEntries);
    setIssues([]);
    setCurrentScenarioId(entry.scenarioId);
    setSelectedScenarioId(entry.scenarioId);

    if (activeCsvHandle) {
      await writeHandleText(activeCsvHandle, csvText);
      setLibraryName(activeCsvHandle.name);
      return {
        mode: "file",
        savedEntry: entry
      };
    }

    if (typeof window !== "undefined" && typeof window.showSaveFilePicker === "function") {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultFileName,
          excludeAcceptAllOption: false,
          types: [
            {
              description: "Scenario Library CSV",
              accept: {
                "text/csv": [".csv"]
              }
            }
          ]
        });
        await writeHandleText(handle, csvText);
        setActiveCsvHandle(handle);
        setLibraryName(handle.name);
        return {
          mode: "file",
          savedEntry: entry
        };
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return {
            mode: "cancelled"
          };
        }
      }
    }

    setLibraryName(defaultFileName);
    return {
      mode: "download",
      csvText,
      fileName: defaultFileName,
      savedEntry: entry
    };
  };

  const loadScenarioEntry = (scenarioId: string): ScenarioState | null => {
    const entry = libraryEntries.find((item) => item.scenarioId === scenarioId);
    if (!entry) {
      return null;
    }
    setSelectedScenarioId(scenarioId);
    setCurrentScenarioId(scenarioId);
    return { ...entry.scenario };
  };

  const clearCurrentScenario = () => {
    setCurrentScenarioId(null);
  };

  return {
    libraryEntries,
    selectedScenarioId,
    currentScenarioId,
    activeCsvHandle,
    libraryName,
    lastLoadedAt,
    issues,
    openLibrary,
    importLibraryFile,
    saveCurrentScenario,
    loadScenarioEntry,
    clearCurrentScenario,
    setSelectedScenarioId
  };
}
