/**
 * useScenarioFiles
 *
 * Manages the file-first scenario workflow:
 *   - Each saved run is its own individual CSV file (1 header row + 1 data row).
 *   - Opening a file sets it as the active save target (silent re-saves after the first).
 *   - Recent runs are stored in localStorage as convenience shortcuts only.
 *     Files on disk are the source of truth — localStorage data may be stale.
 *
 * This hook replaces useScenarioLibrary, which treated all runs as rows in a single
 * shared library file. There is no longer a shared library or a "libraryEntries" array.
 */

import { useCallback, useState } from "react";
import {
  createScenarioLibraryContext,
  parseScenarioLibrary,
  serializeSingleScenario
} from "../lib/scenarioCsv";
import type {
  RecentFileRecord,
  ScenarioLibraryEntry,
  ScenarioLibraryFileContext,
  ScenarioLibraryIssue,
  ScenarioSavedMetrics
} from "../types/contracts";
import type { ScenarioState } from "./scenarioState";

// ── File System Access API shims ─────────────────────────────────────────────

interface WritableFileStreamLike {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
}

interface FileHandleLike {
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<WritableFileStreamLike>;
}

// These augment the global Window interface; merging is safe if useScenarioLibrary
// is still loaded during the transition period (Phase I removes that file).
declare global {
  interface Window {
    showOpenFilePicker?: (options?: {
      multiple?: boolean;
      excludeAcceptAllOption?: boolean;
      types?: Array<{ description?: string; accept: Record<string, string[]> }>;
    }) => Promise<FileHandleLike[]>;
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      excludeAcceptAllOption?: boolean;
      types?: Array<{ description?: string; accept: Record<string, string[]> }>;
    }) => Promise<FileHandleLike>;
  }
}

// ── Public types ─────────────────────────────────────────────────────────────

export type SaveRunResult =
  | { mode: "file"; runName: string; savedEntry: ScenarioLibraryEntry }
  | { mode: "download"; csvText: string; fileName: string; savedEntry: ScenarioLibraryEntry }
  | { mode: "cancelled" };

export type OpenFileResult =
  | {
      entry: ScenarioLibraryEntry;
      /** Set when the file contained more than one row (old library format). */
      multiRowWarning?: { rowCount: number; firstName: string };
    }
  | null;

export interface UseScenarioFilesResult {
  /** Filename of the active save target, or null if the run has never been saved. */
  activeRunName: string | null;
  /** Parse-time issues from the last openScenarioFile / importScenarioFile call. */
  issues: ScenarioLibraryIssue[];
  /**
   * Last 10 saved/opened runs, newest first.
   * Shortcuts only — do not treat as authoritative state.
   */
  recentFiles: RecentFileRecord[];
  saveCurrentRun: (
    scenario: ScenarioState,
    name: string,
    savedMetrics?: ScenarioSavedMetrics
  ) => Promise<SaveRunResult>;
  /**
   * Opens a file picker → reads a scenario file.
   * When `setAsActiveRun` is true (default), the opened file becomes the new
   * save target so the next "Save Current Run" writes back to it.
   * Pass `setAsActiveRun: false` when opening a file only for comparison —
   * the active run handle is left unchanged.
   */
  openScenarioFile: (opts?: { setAsActiveRun?: boolean }) => Promise<OpenFileResult>;
  /** Fallback path for browsers without File System Access API. */
  importScenarioFile: (file: File) => Promise<OpenFileResult>;
  /** Call when starting a fresh unsaved run so the next save prompts the picker. */
  clearActiveHandle: () => void;
}

interface UseScenarioFilesInput {
  scenarioColumns: string[];
  appTitle: string;
  modelName: string;
  /**
   * Called when openScenarioFile() is invoked but File System Access API is unavailable.
   * The caller should then trigger a hidden <input type="file"> click and pass the File
   * to importScenarioFile().
   */
  onNeedFallbackOpen?: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RECENT_FILES_KEY = "stp_recent_scenario_files";
const RECENT_FILES_MAX = 10;

// ── Private utilities ─────────────────────────────────────────────────────────

function createTimestampName(date = new Date()): string {
  const y = date.getFullYear();
  const mo = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  const h = `${date.getHours()}`.padStart(2, "0");
  const mi = `${date.getMinutes()}`.padStart(2, "0");
  return `Run ${y}-${mo}-${d} ${h}:${mi}`;
}

function sanitizeFileName(value: string): string {
  return (
    value
      .replace(/[^a-z0-9._-]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase() || "scenario_run"
  );
}

function toCsvFileName(value: string): string {
  return `${sanitizeFileName(value).replace(/\.csv$/i, "")}.csv`;
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

function loadRecentFromStorage(): RecentFileRecord[] {
  try {
    const raw = localStorage.getItem(RECENT_FILES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentFileRecord[]) : [];
  } catch {
    return [];
  }
}

function persistRecent(records: RecentFileRecord[]): void {
  try {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage failures silently
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useScenarioFiles({
  scenarioColumns,
  appTitle,
  modelName,
  onNeedFallbackOpen
}: UseScenarioFilesInput): UseScenarioFilesResult {
  const [activeRunHandle, setActiveRunHandle] = useState<FileHandleLike | null>(null);
  const [activeRunName, setActiveRunName] = useState<string | null>(null);
  const [issues, setIssues] = useState<ScenarioLibraryIssue[]>([]);
  // Recent runs are shortcuts only. Files on disk are the source of truth.
  const [recentFiles, setRecentFiles] = useState<RecentFileRecord[]>(loadRecentFromStorage);

  const context: ScenarioLibraryFileContext = createScenarioLibraryContext(appTitle, modelName);

  // ── Internal helpers ────────────────────────────────────────────────────────

  const addToRecent = useCallback((entry: ScenarioLibraryEntry, fileName?: string): void => {
    setRecentFiles((prev) => {
      const deduped = prev.filter((r) => r.scenarioId !== entry.scenarioId);
      const next: RecentFileRecord[] = [{ ...entry, fileName }, ...deduped].slice(
        0,
        RECENT_FILES_MAX
      );
      persistRecent(next);
      return next;
    });
  }, []);

  const parseAndReturn = useCallback(
    (csvText: string, fileName: string): OpenFileResult => {
      const parsed = parseScenarioLibrary(csvText, scenarioColumns);
      setIssues(parsed.issues);

      if (parsed.entries.length === 0) {
        setIssues([{ severity: "error", message: `No valid run found in "${fileName}".` }]);
        return null;
      }

      const entry = parsed.entries[0];
      addToRecent(entry, fileName);

      if (parsed.entries.length > 1) {
        return {
          entry,
          multiRowWarning: { rowCount: parsed.entries.length, firstName: entry.scenarioName }
        };
      }

      return { entry };
    },
    [scenarioColumns, addToRecent]
  );

  // ── saveCurrentRun ──────────────────────────────────────────────────────────

  const saveCurrentRun = async (
    scenario: ScenarioState,
    name: string,
    savedMetrics?: ScenarioSavedMetrics
  ): Promise<SaveRunResult> => {
    const normalizedName = name.trim() || createTimestampName();
    const entry: ScenarioLibraryEntry = {
      scenarioId: createScenarioId(),
      scenarioName: normalizedName,
      savedAt: new Date().toISOString(),
      scenario: { ...scenario },
      savedMetrics
    };
    const csvText = serializeSingleScenario(entry, context, scenarioColumns);
    const defaultFileName = toCsvFileName(normalizedName);

    // Already have an open file handle — write silently, no picker
    if (activeRunHandle) {
      await writeHandleText(activeRunHandle, csvText);
      const runName = activeRunHandle.name;
      addToRecent(entry, runName);
      return { mode: "file", runName, savedEntry: entry };
    }

    // First save — show the save-file picker
    if (typeof window !== "undefined" && typeof window.showSaveFilePicker === "function") {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultFileName,
          excludeAcceptAllOption: false,
          types: [{ description: "Saved Run CSV", accept: { "text/csv": [".csv"] } }]
        });
        await writeHandleText(handle, csvText);
        setActiveRunHandle(handle);
        setActiveRunName(handle.name);
        addToRecent(entry, handle.name);
        return { mode: "file", runName: handle.name, savedEntry: entry };
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return { mode: "cancelled" };
        }
        throw error;
      }
    }

    // Fallback: browser download (File System Access API unavailable)
    setActiveRunName(defaultFileName);
    addToRecent(entry, defaultFileName);
    return { mode: "download", csvText, fileName: defaultFileName, savedEntry: entry };
  };

  // ── openScenarioFile ────────────────────────────────────────────────────────

  const openScenarioFile = async (
    opts: { setAsActiveRun?: boolean } = {}
  ): Promise<OpenFileResult> => {
    const { setAsActiveRun = true } = opts;

    if (typeof window === "undefined" || typeof window.showOpenFilePicker !== "function") {
      // Signal caller to trigger hidden <input type="file">
      onNeedFallbackOpen?.();
      return null;
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        excludeAcceptAllOption: false,
        types: [{ description: "Saved Run CSV", accept: { "text/csv": [".csv"] } }]
      });
      if (!handle) return null;

      // Only update the save target when opening for simulation, not for comparison
      if (setAsActiveRun) {
        setActiveRunHandle(handle);
        setActiveRunName(handle.name);
      }

      const text = await readHandleText(handle);
      return parseAndReturn(text, handle.name);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return null; // User cancelled — no state change
      }
      throw error;
    }
  };

  // ── importScenarioFile ──────────────────────────────────────────────────────

  const importScenarioFile = async (file: File): Promise<OpenFileResult> => {
    // Fallback path: no writable handle available for imported files
    setActiveRunHandle(null);
    setActiveRunName(file.name);
    const text = await file.text();
    return parseAndReturn(text, file.name);
  };

  // ── clearActiveHandle ───────────────────────────────────────────────────────

  const clearActiveHandle = useCallback((): void => {
    setActiveRunHandle(null);
    setActiveRunName(null);
  }, []);

  // ── Return ──────────────────────────────────────────────────────────────────

  return {
    activeRunName,
    issues,
    recentFiles,
    saveCurrentRun,
    openScenarioFile,
    importScenarioFile,
    clearActiveHandle
  };
}
