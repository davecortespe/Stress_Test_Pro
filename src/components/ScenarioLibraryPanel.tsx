import { useMemo, useState } from "react";
import type { ScenarioLibraryEntry, ScenarioLibraryIssue } from "../types/contracts";

type ComparisonSlot = "A" | "B";

interface ScenarioLibraryPanelProps {
  isOpen: boolean;
  libraryName: string | null;
  lastLoadedAt: string | null;
  entries: ScenarioLibraryEntry[];
  issues: ScenarioLibraryIssue[];
  currentScenarioId: string | null;
  selectedScenarioId: string | null;
  comparisonIds: [string | null, string | null];
  onSelectScenario: (scenarioId: string | null) => void;
  onOpenCsv: () => void;
  onSaveCurrent: () => void;
  onLoadScenario: (scenarioId: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
  onAssignEntry: (slot: ComparisonSlot, id: string) => void;
  onClearSlot: (slot: ComparisonSlot) => void;
  onSwapEntries: () => void;
  onClearComparison: () => void;
  onCompare: () => void;
  onClose: () => void;
}

function formatSavedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function formatMetricValue(value: number | string | undefined, suffix = ""): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "number") {
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
  }
  return String(value);
}

export function ScenarioLibraryPanel({
  isOpen,
  libraryName,
  lastLoadedAt,
  entries,
  issues,
  currentScenarioId,
  selectedScenarioId,
  comparisonIds,
  onSelectScenario,
  onOpenCsv,
  onSaveCurrent,
  onLoadScenario,
  onDeleteScenario,
  onAssignEntry,
  onClearSlot,
  onSwapEntries,
  onClearComparison,
  onCompare,
  onClose
}: ScenarioLibraryPanelProps) {
  const [searchValue, setSearchValue] = useState("");

  const filteredEntries = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (query.length === 0) {
      return entries;
    }
    return entries.filter((entry) => {
      return (
        entry.scenarioName.toLowerCase().includes(query) ||
        entry.savedAt.toLowerCase().includes(query) ||
        entry.scenarioId.toLowerCase().includes(query)
      );
    });
  }, [entries, searchValue]);

  const selectedEntry = selectedScenarioId
    ? entries.find((entry) => entry.scenarioId === selectedScenarioId) ?? null
    : null;
  const slotAEntry = comparisonIds[0]
    ? entries.find((entry) => entry.scenarioId === comparisonIds[0]) ?? null
    : null;
  const slotBEntry = comparisonIds[1]
    ? entries.find((entry) => entry.scenarioId === comparisonIds[1]) ?? null
    : null;
  const readyToCompare = !!slotAEntry && !!slotBEntry;

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="library-shell"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="library-panel">
        <div className="library-header">
          <div>
            <p className="library-eyebrow">Scenario Library</p>
            <h2>{libraryName ?? "In-session scenarios"}</h2>
            <p className="library-meta">
              {lastLoadedAt
                ? `Loaded ${formatSavedAt(lastLoadedAt)}`
                : "Save scenarios into a CSV library so you can reopen, compare, and replace them across sessions."}
            </p>
          </div>
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="library-toolbar">
          <button type="button" className="secondary" onClick={onOpenCsv}>
            Open Library File
          </button>
          <button type="button" className="primary" onClick={onSaveCurrent}>
            Save Current Scenario
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => selectedScenarioId && onLoadScenario(selectedScenarioId)}
            disabled={!selectedScenarioId}
          >
            Load Selected
          </button>
          <input
            type="search"
            value={searchValue}
            placeholder="Search scenarios"
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>

        {issues.length > 0 ? (
          <section className="library-issues">
            <h3>Library Warnings</h3>
            <ul>
              {issues.map((issue, index) => (
                <li key={`${issue.message}-${index}`} className={`validation-${issue.severity}`}>
                  {issue.message}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {entries.length > 0 && (
          <section className="library-compare-builder">
            <div className="library-compare-builder-top">
              <div>
                <p className="library-compare-builder-label">Comparison Set</p>
                <h3>Choose Scenario A and Scenario B explicitly</h3>
                <p className="library-compare-builder-copy">
                  Use the row buttons below to set or replace either slot. Once both are filled, open the side-by-side comparison.
                </p>
              </div>
              <div className="library-compare-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={onSwapEntries}
                  disabled={!readyToCompare}
                >
                  Swap A / B
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={onClearComparison}
                  disabled={!slotAEntry && !slotBEntry}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="primary library-compare-cta"
                  onClick={() => {
                    onCompare();
                    onClose();
                  }}
                  disabled={!readyToCompare}
                >
                  Compare A vs B
                </button>
              </div>
            </div>

            <div className="library-compare-slots">
              <div className={`library-slot-card ${slotAEntry ? "is-filled" : "is-empty"}`}>
                <div className="library-slot-card-top">
                  <span className="lib-slot lib-slot-filled">A</span>
                  <span className="library-slot-title">Scenario A</span>
                </div>
                {slotAEntry ? (
                  <>
                    <strong className="library-slot-name">{slotAEntry.scenarioName}</strong>
                    <span className="library-slot-meta">{formatSavedAt(slotAEntry.savedAt)}</span>
                    <button type="button" className="library-slot-clear" onClick={() => onClearSlot("A")}>
                      Remove A
                    </button>
                  </>
                ) : (
                  <span className="library-slot-empty-copy">Choose the baseline or current reference case.</span>
                )}
              </div>
              <div className={`library-slot-card ${slotBEntry ? "is-filled" : "is-empty"}`}>
                <div className="library-slot-card-top">
                  <span className="lib-slot lib-slot-filled">B</span>
                  <span className="library-slot-title">Scenario B</span>
                </div>
                {slotBEntry ? (
                  <>
                    <strong className="library-slot-name">{slotBEntry.scenarioName}</strong>
                    <span className="library-slot-meta">{formatSavedAt(slotBEntry.savedAt)}</span>
                    <button type="button" className="library-slot-clear" onClick={() => onClearSlot("B")}>
                      Remove B
                    </button>
                  </>
                ) : (
                  <span className="library-slot-empty-copy">Choose the alternative you want to test against A.</span>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="library-table-shell">
          <table className="throughput-table library-table">
            <thead>
              <tr>
                <th className="lib-slot-col">Pick</th>
                <th>Scenario name</th>
                <th>Constraint</th>
                <th>Output / hr</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => {
                  const slotLabel =
                    comparisonIds[0] === entry.scenarioId
                      ? "A"
                      : comparisonIds[1] === entry.scenarioId
                        ? "B"
                        : "";
                  const isLoaded = currentScenarioId === entry.scenarioId;
                  const isSelected = selectedScenarioId === entry.scenarioId;
                  const isPinned = !!slotLabel;
                  return (
                    <tr
                      key={entry.scenarioId}
                      className={`library-row ${isPinned ? "is-pinned" : ""} ${isSelected ? "is-selected" : ""}`}
                      onClick={() => onSelectScenario(entry.scenarioId)}
                    >
                      <td className="lib-slot-col">
                        <span className={`lib-slot ${isPinned ? "lib-slot-filled" : "lib-slot-empty"}`}>
                          {slotLabel}
                        </span>
                      </td>
                      <th>
                        <span className="library-scenario-name">{entry.scenarioName}</span>
                        {entry.note ? (
                          <span className="library-scenario-note" title={entry.note}>
                            {entry.note}
                          </span>
                        ) : null}
                        <div className="library-row-badges">
                          {isLoaded ? <span className="library-loaded-badge">Active</span> : null}
                          {isSelected ? <span className="library-selected-badge">Selected</span> : null}
                        </div>
                      </th>
                      <td className="library-metric-cell">
                        {entry.savedMetrics ? entry.savedMetrics.activeConstraintName : "—"}
                      </td>
                      <td className="library-metric-cell">
                        {entry.savedMetrics
                          ? formatMetricValue(entry.savedMetrics.forecastThroughput, " /hr")
                          : "—"}
                      </td>
                      <td className="library-row-actions" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="secondary library-slot-btn" onClick={() => onAssignEntry("A", entry.scenarioId)}>
                          Set A
                        </button>
                        <button type="button" className="secondary library-slot-btn" onClick={() => onAssignEntry("B", entry.scenarioId)}>
                          Set B
                        </button>
                        <button type="button" className="secondary" onClick={() => onLoadScenario(entry.scenarioId)}>
                          Load
                        </button>
                        <button
                          type="button"
                          className="library-delete-btn"
                          aria-label={`Delete ${entry.scenarioName}`}
                          onClick={() => {
                            if (window.confirm(`Delete "${entry.scenarioName}"?`)) {
                              onDeleteScenario(entry.scenarioId);
                            }
                          }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="library-empty-state">
                    No scenarios saved yet. Click "Save Current Scenario" to capture this run.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedEntry ? (
          <p className="library-selection-note">
            Selected: <strong>{selectedEntry.scenarioName}</strong>. Use <strong>Load Selected</strong> to reopen it, or <strong>Set A</strong> / <strong>Set B</strong> to compare it.
          </p>
        ) : (
          <p className="library-selection-note">
            Tip: click any row once to select it for loading, then use <strong>Set A</strong> or <strong>Set B</strong> when you want it in the comparison set.
          </p>
        )}
      </section>
    </div>
  );
}
