import { useCallback, useState } from "react";

type ComparisonSlot = "A" | "B";

interface UseScenarioComparisonResult {
  comparisonIds: [string | null, string | null];
  pinnedIds: string[];
  pinEntry: (id: string) => void;
  assignEntry: (slot: ComparisonSlot, id: string) => void;
  unpinEntry: (id: string) => void;
  clearSlot: (slot: ComparisonSlot) => void;
  clearPinned: () => void;
  swapEntries: () => void;
  pruneEntries: (validIds: string[]) => void;
  isPinned: (id: string) => boolean;
  getSlotForEntry: (id: string) => ComparisonSlot | null;
}

export function useScenarioComparison(): UseScenarioComparisonResult {
  const [comparisonIds, setComparisonIds] = useState<[string | null, string | null]>([null, null]);

  const pinEntry = useCallback((id: string) => {
    setComparisonIds((current) => {
      if (current[0] === id || current[1] === id) {
        return current;
      }
      if (!current[0]) {
        return [id, current[1]];
      }
      if (!current[1]) {
        return [current[0], id];
      }
      return [current[0], id];
    });
  }, []);

  const assignEntry = useCallback((slot: ComparisonSlot, id: string) => {
    setComparisonIds((current) => {
      const next: [string | null, string | null] = [...current];
      const targetIndex = slot === "A" ? 0 : 1;
      const otherIndex = targetIndex === 0 ? 1 : 0;
      if (next[targetIndex] === id) {
        return current;
      }
      if (next[otherIndex] === id) {
        next[otherIndex] = null;
      }
      next[targetIndex] = id;
      return next;
    });
  }, []);

  const unpinEntry = useCallback((id: string) => {
    setComparisonIds((current) => [
      current[0] === id ? null : current[0],
      current[1] === id ? null : current[1]
    ]);
  }, []);

  const clearSlot = useCallback((slot: ComparisonSlot) => {
    setComparisonIds((current) => {
      if (slot === "A") {
        return [null, current[1]];
      }
      return [current[0], null];
    });
  }, []);

  const clearPinned = useCallback(() => setComparisonIds([null, null]), []);

  const swapEntries = useCallback(() => {
    setComparisonIds((current) => [current[1], current[0]]);
  }, []);

  const pruneEntries = useCallback((validIds: string[]) => {
    const validSet = new Set(validIds);
    setComparisonIds((current) => {
      const kept = current.filter((id): id is string => !!id && validSet.has(id));
      return [kept[0] ?? null, kept[1] ?? null];
    });
  }, []);

  const pinnedIds = comparisonIds.filter((id): id is string => !!id);
  const isPinned = (id: string) => pinnedIds.includes(id);
  const getSlotForEntry = (id: string): ComparisonSlot | null => {
    if (comparisonIds[0] === id) return "A";
    if (comparisonIds[1] === id) return "B";
    return null;
  };

  return {
    comparisonIds,
    pinnedIds,
    pinEntry,
    assignEntry,
    unpinEntry,
    clearSlot,
    clearPinned,
    swapEntries,
    pruneEntries,
    isPinned,
    getSlotForEntry
  };
}
