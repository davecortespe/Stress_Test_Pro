import type { SimulatorResultsMode } from "../types/contracts";
import type { SpeedMultiplier } from "../simulator/scenarioState";

const SPEED_OPTIONS: Array<{ value: SpeedMultiplier; label: string; hint?: string }> = [
  { value: 1, label: "x1" },
  { value: 2, label: "x2" },
  { value: 5, label: "x5" },
  { value: 50, label: "x50" },
  { value: 200, label: "x200" },
  { value: 1440, label: "5s/mo", hint: "Run a 720-hour horizon in about 5 seconds." }
];

const RESULTS_MODES: Array<{ key: SimulatorResultsMode; label: string; description: string }> = [
  {
    key: "flow",
    label: "FLOW MAP",
    description: "Shows the live step-by-step flow, where work is piling up, and which step is acting as the bottleneck right now."
  },
  {
    key: "diagnosis",
    label: "DIAGNOSIS",
    description: "Explains what is breaking, why it is happening, what it causes downstream, and the best move to stabilize the system."
  },
  {
    key: "kaizen",
    label: "KAIZEN",
    description: "Highlights the strongest improvement opportunities, likely root causes, and where a Kaizen event can make the biggest difference."
  },
  {
    key: "throughput",
    label: "THROUGHPUT",
    description: "Shows how the current bottleneck affects output, cost, and profit so you can see where added capacity creates the most value."
  },
  {
    key: "waste",
    label: "WASTE",
    description: "Compares lead time with touch time to show where delay and non-value-added time are building up across the flow."
  }
];

interface DashboardHeaderProps {
  brandLabel?: string;
  title: string;
  subtitle: string;
  resultsMode: SimulatorResultsMode;
  isPaused: boolean;
  hasStagedChanges: boolean;
  simElapsedHours: number;
  simHorizonHours: number;
  simProgressPct: number;
  scenarioCount: number;
  speedMultiplier: SpeedMultiplier;
  onResultsModeChange: (mode: SimulatorResultsMode) => void;
  onSpeedChange: (speed: SpeedMultiplier) => void;
  onStartPause: () => void;
  onReset: () => void;
  onOpenLibraryCsv: () => void;
  onSaveCurrentScenario: () => void;
  onToggleScenarioLibrary: () => void;
}

export function DashboardHeader({
  brandLabel = "LeanStorming Operational Stress Labs",
  title,
  subtitle,
  resultsMode,
  isPaused,
  hasStagedChanges,
  simElapsedHours,
  simHorizonHours,
  simProgressPct,
  scenarioCount,
  speedMultiplier,
  onResultsModeChange,
  onSpeedChange,
  onStartPause,
  onReset,
  onOpenLibraryCsv,
  onSaveCurrentScenario,
  onToggleScenarioLibrary
}: DashboardHeaderProps) {
  return (
    <header className="header-shell">
      <div className="header-left">
        <div className="header-title-block">
          <p className="brand-mark">{brandLabel}</p>
          <h1>{title}</h1>
          {subtitle.trim().length > 0 ? <p className="subtitle">{subtitle}</p> : null}
        </div>
        <div className="header-toolbar">
          <div className="header-control-card actions-card">
            <p className="header-control-label">Actions</p>
            <div className="header-controls actions-grid">
              <button className="primary" onClick={onStartPause}>
                {isPaused ? "Start" : "Pause"}
              </button>
              <button className="secondary" onClick={onReset}>
                Reset Time
              </button>
              <button type="button" className="secondary" onClick={onOpenLibraryCsv}>
                Import Library CSV
              </button>
              <button type="button" className="secondary" onClick={onSaveCurrentScenario}>
                Save Scenario
              </button>
            </div>
            <div className="actions-meta-row">
              <div className="header-control-subsection compact speed-subsection">
                <p className="header-subsection-label">Playback</p>
                <div className="speed-group" role="group" aria-label="simulation speed">
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed.value}
                      type="button"
                      className={`speed-pill ${speedMultiplier === speed.value ? "is-active" : ""}`}
                      onClick={() => onSpeedChange(speed.value)}
                      title={speed.hint}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="header-control-subsection compact state-subsection">
                <p className="header-subsection-label">State</p>
                <div className="header-state-group">
                  <div className={`live-pill ${isPaused ? "is-paused" : "is-live"}`}>
                    <span className="dot" />
                    {isPaused ? "Paused" : "Live"}
                  </div>
                  {isPaused && hasStagedChanges ? (
                    <div className={`staged-chip ${hasStagedChanges ? "has-changes" : "no-changes"}`}>
                      Staged changes
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="header-control-card">
            <p className="header-control-label">View</p>
            <div className="results-mode-group" role="group" aria-label="results panel mode">
              {RESULTS_MODES.map((mode) => (
                <div key={mode.key} className="results-mode-item">
                  <button
                    type="button"
                    className={`secondary mode-toggle-btn ${resultsMode === mode.key ? "is-active" : ""}`}
                    onClick={() => onResultsModeChange(mode.key)}
                    aria-pressed={resultsMode === mode.key}
                    aria-describedby={`results-mode-help-${mode.key}`}
                  >
                    <span className="mode-toggle-label">{mode.label}</span>
                    <span className="mode-toggle-info" aria-hidden="true">
                      i
                    </span>
                  </button>
                  <div id={`results-mode-help-${mode.key}`} className="results-mode-tooltip" role="tooltip">
                    {mode.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="header-right">
        <div className="status-strip" aria-label="simulation status">
          <div className="status-block">
            <p className="header-control-label">Simulation</p>
            <div className="status-chip timer-chip is-active">
              <span className="status-chip-label">Sim Time</span>
              <span className="status-chip-value">
                {simElapsedHours.toFixed(2)} / {simHorizonHours} h
              </span>
            </div>
            <div className="sim-progress" aria-label="simulation progress">
              <div className="sim-progress-meta">
                <span>Progress</span>
                <strong>{simProgressPct.toFixed(1)}%</strong>
              </div>
              <div className="sim-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={simProgressPct}>
                <span className="sim-progress-fill" style={{ width: `${simProgressPct}%` }} />
              </div>
            </div>
          </div>
          <div className="status-block">
            <p className="header-control-label">Library</p>
            <button type="button" className="status-chip scenario-chip-button" onClick={onToggleScenarioLibrary}>
              <span className="status-chip-value">Scenarios {scenarioCount}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
