import { ScenarioComparisonTable } from "../components/ScenarioComparisonTable";
import { ScenarioParamDiffTable } from "../components/ScenarioParamDiffTable";
import type { DashboardConfig, ScenarioLibraryEntry } from "../types/contracts";
import { COMPARISON_METRIC_CONFIGS } from "./simulatorConfig";

interface ScenarioCompareStageProps {
  isParameterRailOpen: boolean;
  pinnedEntries: ScenarioLibraryEntry[];
  scenarioCount: number;
  dashboardConfig: DashboardConfig;
  onOpenComparisonReport: () => void;
  onToggleParameterRail: () => void;
  onOpenScenarioFiles: () => void;
  onSwapComparison: () => void;
  onClearComparison: () => void;
}

function formatScenarioSavedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function ScenarioCompareStage({
  isParameterRailOpen,
  pinnedEntries,
  scenarioCount,
  dashboardConfig,
  onOpenComparisonReport,
  onToggleParameterRail,
  onOpenScenarioFiles,
  onSwapComparison,
  onClearComparison
}: ScenarioCompareStageProps) {
  return (
    <div className="compare-stage-shell">
      <div className="stage-toolbar compare-stage-toolbar">
        <div className="stage-title-block">
          <p className="stage-eyebrow">Scenario Analysis</p>
          <h2>Scenario Compare</h2>
        </div>
        <div className="stage-toolbar-actions">
          {pinnedEntries.length === 2 ? (
            <button type="button" className="primary" onClick={onOpenComparisonReport}>
              Open Comparison Report
            </button>
          ) : null}
          <button type="button" className="secondary" onClick={onToggleParameterRail}>
            {isParameterRailOpen ? "Hide Parameters" : "Show Parameters"}
          </button>
        </div>
      </div>

      {pinnedEntries.length === 2 ? (
        <>
          <div className="compare-edit-bar">
            <div className="compare-edit-copy">
              <span className="compare-edit-label">Comparison Set</span>
              <span className="compare-edit-help">
                Open the scenario library to replace A or B without losing the current compare view.
              </span>
            </div>
            <div className="compare-edit-slot compare-edit-slot-card">
              <span className="compare-col-slot compare-col-slot-a">A</span>
              <div className="compare-edit-slot-copy">
                <span className="compare-edit-name">{pinnedEntries[0].scenarioName}</span>
                <span className="compare-edit-meta">{formatScenarioSavedAt(pinnedEntries[0].savedAt)}</span>
              </div>
            </div>
            <span className="compare-edit-vs">vs.</span>
            <div className="compare-edit-slot compare-edit-slot-card">
              <span className="compare-col-slot compare-col-slot-b">B</span>
              <div className="compare-edit-slot-copy">
                <span className="compare-edit-name">{pinnedEntries[1].scenarioName}</span>
                <span className="compare-edit-meta">{formatScenarioSavedAt(pinnedEntries[1].savedAt)}</span>
              </div>
            </div>
            <div className="compare-edit-actions">
              <button type="button" className="compare-edit-change" onClick={onOpenScenarioFiles}>
                Open Saved Runs
              </button>
              <button type="button" className="compare-edit-change" onClick={onSwapComparison}>
                Swap A / B
              </button>
              <button type="button" className="compare-edit-clear" onClick={onClearComparison}>
                Clear
              </button>
            </div>
          </div>
          <ScenarioComparisonTable
            entryA={pinnedEntries[0]}
            entryB={pinnedEntries[1]}
            metricConfigs={COMPARISON_METRIC_CONFIGS}
          />
          <ScenarioParamDiffTable
            entryA={pinnedEntries[0]}
            entryB={pinnedEntries[1]}
            parameterGroups={dashboardConfig.parameterGroups}
          />
        </>
      ) : (
        <div className="compare-empty-state">
          <p className="compare-empty-title">How to compare two runs</p>
          <ol className="compare-empty-steps">
            <li className={scenarioCount >= 1 ? "step-done" : ""}>
              <span className="step-num">1</span>
              <span>
                Run a simulation, then click <strong>Save Current Run</strong> in the toolbar above.
                Give it a name like <em>"Baseline"</em>.
                {scenarioCount >= 1 ? <span className="step-check"> ✓ {scenarioCount} saved</span> : null}
              </span>
            </li>
            <li className={scenarioCount >= 2 ? "step-done" : ""}>
              <span className="step-num">2</span>
              <span>
                Change a parameter (e.g. add a relief unit), then save again as <em>"With relief"</em>.
                {scenarioCount >= 2 ? <span className="step-check"> ✓ ready</span> : null}
              </span>
            </li>
            <li>
              <span className="step-num">3</span>
              <span>
                Click <strong>Compare Two Files</strong> in the toolbar, choose <strong>File A</strong> and <strong>File B</strong>, then hit <strong>Compare Selected Files</strong>.
              </span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}