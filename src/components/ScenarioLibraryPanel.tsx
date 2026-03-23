import type { RecentFileRecord, ScenarioLibraryEntry, ScenarioLibraryIssue } from "../types/contracts";

type ComparisonSlot = "A" | "B";

interface ScenarioLibraryPanelProps {
  isOpen: boolean;
  activeRunName: string | null;
  issues: ScenarioLibraryIssue[];
  slotA: ScenarioLibraryEntry | null;
  slotB: ScenarioLibraryEntry | null;
  recentFiles: RecentFileRecord[];
  readyToCompare: boolean;
  onSaveCurrentRun: () => void;
  onOpenAndLoad: () => void;
  onChooseFileForSlot: (slot: ComparisonSlot) => void;
  onLoadRecentFile: (record: RecentFileRecord) => void;
  onAssignRecentToSlot: (slot: ComparisonSlot, record: RecentFileRecord) => void;
  onClearSlot: (slot: ComparisonSlot) => void;
  onSwapSlots: () => void;
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

function isStale(savedAt: string): boolean {
  const parsed = new Date(savedAt);
  if (Number.isNaN(parsed.getTime())) return false;
  const ageDays = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays > 30;
}

function SlotCard({
  slot,
  entry,
  onChooseFile,
  onClear
}: {
  slot: ComparisonSlot;
  entry: ScenarioLibraryEntry | null;
  onChooseFile: () => void;
  onClear: () => void;
}) {
  return (
    <div className={`library-slot-card ${entry ? "is-filled" : "is-empty"}`}>
      <div className="library-slot-card-top">
        <span className={`lib-slot ${entry ? "lib-slot-filled" : "lib-slot-empty"}`}>{slot}</span>
        <span className="library-slot-title">
          {entry ? entry.scenarioName : `Choose File ${slot}`}
        </span>
      </div>
      {entry ? (
        <>
          <span className="library-slot-meta">{formatSavedAt(entry.savedAt)}</span>
          <div className="library-slot-actions">
            <button type="button" className="secondary library-slot-btn" onClick={onChooseFile}>
              Change File
            </button>
            <button type="button" className="library-delete-btn" onClick={onClear} aria-label={`Clear slot ${slot}`}>
              ×
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="secondary library-slot-choose-btn" onClick={onChooseFile}>
          Choose File {slot}
        </button>
      )}
    </div>
  );
}

export function ScenarioLibraryPanel({
  isOpen,
  activeRunName,
  issues,
  slotA,
  slotB,
  recentFiles,
  readyToCompare,
  onSaveCurrentRun,
  onOpenAndLoad,
  onChooseFileForSlot,
  onLoadRecentFile,
  onAssignRecentToSlot,
  onClearSlot,
  onSwapSlots,
  onClearComparison,
  onCompare,
  onClose
}: ScenarioLibraryPanelProps) {
  if (!isOpen) {
    return null;
  }

  const hasAnySlot = slotA !== null || slotB !== null;

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
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="library-header">
          <div>
            <p className="library-eyebrow">Saved Runs</p>
            <h2>Scenario Files</h2>
            <p className="library-meta">
              {activeRunName
                ? `Last saved: ${activeRunName}`
                : "Save this run to a file so you can reopen or compare it later."}
            </p>
          </div>
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="library-toolbar">
          <button type="button" className="primary" onClick={onSaveCurrentRun}>
            Save Current Run
          </button>
          <button type="button" className="secondary" onClick={onOpenAndLoad}>
            Open Scenario File
          </button>
        </div>

        {/* ── Issues banner ───────────────────────────────────────────────── */}
        {issues.length > 0 && (
          <section className="library-issues">
            <ul>
              {issues.map((issue, index) => (
                <li key={`${issue.message}-${index}`} className={`validation-${issue.severity}`}>
                  {issue.message}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Comparison section ──────────────────────────────────────────── */}
        <section className="library-compare-builder">
          <div className="library-compare-builder-top">
            <div>
              <p className="library-compare-builder-label">Comparison</p>
              <h3>Compare any two saved runs</h3>
              <p className="library-compare-builder-copy">
                Choose any two saved runs to compare. You can also load a recent run into a slot below.
              </p>
            </div>
            <div className="library-compare-actions">
              <button
                type="button"
                className="secondary"
                onClick={onSwapSlots}
                disabled={!readyToCompare}
                title="Swap A / B"
              >
                Swap A / B
              </button>
              <button
                type="button"
                className="secondary"
                onClick={onClearComparison}
                disabled={!hasAnySlot}
              >
                Clear Comparison
              </button>
              <button
                type="button"
                className="primary library-compare-cta"
                onClick={() => {
                  onCompare();
                  onClose();
                }}
                disabled={!readyToCompare}
                title={readyToCompare ? undefined : "Choose File B to compare"}
              >
                Compare Selected Files
              </button>
            </div>
          </div>

          <div className="library-compare-slots">
            <SlotCard
              slot="A"
              entry={slotA}
              onChooseFile={() => onChooseFileForSlot("A")}
              onClear={() => onClearSlot("A")}
            />
            <SlotCard
              slot="B"
              entry={slotB}
              onChooseFile={() => onChooseFileForSlot("B")}
              onClear={() => onClearSlot("B")}
            />
          </div>
        </section>

        {/* ── Recent Runs ─────────────────────────────────────────────────── */}
        <section className="library-recent-section">
          <div className="library-recent-header">
            <h3>Recent Runs</h3>
            <p className="library-recent-note">
              These are shortcuts — open the file to reload from disk.
            </p>
          </div>

          {recentFiles.length > 0 ? (
            <ul className="library-recent-list">
              {recentFiles.map((record) => {
                const stale = isStale(record.savedAt);
                const inSlotA = slotA?.scenarioId === record.scenarioId;
                const inSlotB = slotB?.scenarioId === record.scenarioId;
                return (
                  <li key={record.scenarioId} className="library-recent-card">
                    <div className="library-recent-card-info">
                      <strong className="library-recent-name">{record.scenarioName}</strong>
                      <span className={`library-recent-date ${stale ? "is-stale" : ""}`}>
                        {formatSavedAt(record.savedAt)}
                        {stale && <span className="library-stale-badge"> · may be stale</span>}
                      </span>
                      {record.fileName && (
                        <span className="library-recent-filename">{record.fileName}</span>
                      )}
                      {(inSlotA || inSlotB) && (
                        <span className="library-loaded-badge">
                          In slot {inSlotA ? "A" : "B"}
                        </span>
                      )}
                    </div>
                    <div className="library-recent-card-actions">
                      <button
                        type="button"
                        className="secondary library-slot-btn"
                        onClick={() => onLoadRecentFile(record)}
                      >
                        Open Run
                      </button>
                      <button
                        type="button"
                        className="secondary library-slot-btn"
                        onClick={() => onAssignRecentToSlot("A", record)}
                        disabled={inSlotA}
                      >
                        Use as A
                      </button>
                      <button
                        type="button"
                        className="secondary library-slot-btn"
                        onClick={() => onAssignRecentToSlot("B", record)}
                        disabled={inSlotB}
                      >
                        Use as B
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="library-empty-state">
              No recent runs yet. Save a run to see it here.
            </p>
          )}
        </section>
      </section>
    </div>
  );
}
