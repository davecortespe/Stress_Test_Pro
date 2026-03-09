import { useMemo, useState } from "react";
import type { ScenarioLibraryEntry, ScenarioLibraryIssue } from "../types/contracts";

interface ScenarioLibraryPanelProps {
  isOpen: boolean;
  libraryName: string | null;
  lastLoadedAt: string | null;
  entries: ScenarioLibraryEntry[];
  issues: ScenarioLibraryIssue[];
  currentScenarioId: string | null;
  selectedScenarioId: string | null;
  onSelectScenario: (scenarioId: string | null) => void;
  onOpenCsv: () => void;
  onSaveCurrent: () => void;
  onLoadScenario: (scenarioId: string) => void;
  onClose: () => void;
}

function formatSavedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

export function ScenarioLibraryPanel({
  isOpen,
  libraryName,
  lastLoadedAt,
  entries,
  issues,
  currentScenarioId,
  selectedScenarioId,
  onSelectScenario,
  onOpenCsv,
  onSaveCurrent,
  onLoadScenario,
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
            <h2>{libraryName ?? "No library file open"}</h2>
            <p className="library-meta">
              {lastLoadedAt ? `Loaded ${formatSavedAt(lastLoadedAt)}` : "Open or create a CSV library to persist scenarios."}
            </p>
          </div>
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="library-toolbar">
          <button type="button" className="secondary" onClick={onOpenCsv}>
            Open CSV
          </button>
          <button type="button" className="primary" onClick={onSaveCurrent}>
            Save Current
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

        <div className="library-table-shell">
          <table className="throughput-table library-table">
            <thead>
              <tr>
                <th>Scenario name</th>
                <th>Saved at</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => {
                  const isLoaded = currentScenarioId === entry.scenarioId;
                  const isSelected = selectedScenarioId === entry.scenarioId;
                  return (
                    <tr
                      key={entry.scenarioId}
                      className={isSelected ? "is-selected" : ""}
                      onClick={() => onSelectScenario(entry.scenarioId)}
                    >
                      <th>{entry.scenarioName}</th>
                      <td>{formatSavedAt(entry.savedAt)}</td>
                      <td>{isLoaded ? <span className="library-loaded-badge">Loaded</span> : "Saved"}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary"
                          onClick={(event) => {
                            event.stopPropagation();
                            onLoadScenario(entry.scenarioId);
                          }}
                        >
                          Load
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="library-empty-state">
                    No scenarios available in the current library.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
