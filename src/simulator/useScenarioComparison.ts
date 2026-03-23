/**
 * useScenarioComparison
 *
 * Manages the two comparison slots (A and B).
 *
 * Slots hold full ScenarioLibraryEntry objects loaded from individual files.
 * There is no backing library array — each slot is independently set by the
 * user choosing a file. Comparison state is intentionally NOT persisted; the
 * user re-selects files each session, which reinforces the file-first mental model.
 */

import { useCallback, useState } from "react";
import type { ScenarioLibraryEntry } from "../types/contracts";

export type ComparisonSlot = "A" | "B";

export interface UseScenarioComparisonResult {
  slotA: ScenarioLibraryEntry | null;
  slotB: ScenarioLibraryEntry | null;
  /** True only when both slots are filled. */
  readyToCompare: boolean;
  /**
   * Assign an entry to a slot. If the same entry (by scenarioId) is already in
   * the other slot, that slot is cleared to prevent comparing a run to itself.
   */
  assignEntry: (slot: ComparisonSlot, entry: ScenarioLibraryEntry) => void;
  clearSlot: (slot: ComparisonSlot) => void;
  /** Swap A ↔ B atomically. */
  swapSlots: () => void;
  clearAll: () => void;
}

export function useScenarioComparison(): UseScenarioComparisonResult {
  // Single tuple keeps swap atomic — no stale-closure risk.
  const [[slotA, slotB], setSlots] = useState<
    [ScenarioLibraryEntry | null, ScenarioLibraryEntry | null]
  >([null, null]);

  const assignEntry = useCallback(
    (slot: ComparisonSlot, entry: ScenarioLibraryEntry): void => {
      setSlots(([a, b]) => {
        if (slot === "A") {
          // Clear B if it already holds the same run (can't compare to itself)
          return [entry, b?.scenarioId === entry.scenarioId ? null : b];
        } else {
          // Clear A if it already holds the same run
          return [a?.scenarioId === entry.scenarioId ? null : a, entry];
        }
      });
    },
    []
  );

  const clearSlot = useCallback((slot: ComparisonSlot): void => {
    setSlots(([a, b]) => (slot === "A" ? [null, b] : [a, null]));
  }, []);

  const swapSlots = useCallback((): void => {
    setSlots(([a, b]) => [b, a]);
  }, []);

  const clearAll = useCallback((): void => {
    setSlots([null, null]);
  }, []);

  return {
    slotA,
    slotB,
    readyToCompare: slotA !== null && slotB !== null,
    assignEntry,
    clearSlot,
    swapSlots,
    clearAll
  };
}
