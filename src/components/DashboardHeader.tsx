interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  resultsMode: "flow" | "diagnosis" | "throughput";
  isPaused: boolean;
  hasStagedChanges: boolean;
  isExporting: boolean;
  simElapsedHours: number;
  simHorizonHours: number;
  speedMultiplier: 1 | 2 | 5 | 10 | 50 | 200;
  onResultsModeChange: (mode: "flow" | "diagnosis" | "throughput") => void;
  onSpeedChange: (speed: 1 | 2 | 5 | 10 | 50 | 200) => void;
  onStartPause: () => void;
  onReset: () => void;
  onExport: () => void;
}

export function DashboardHeader({
  title,
  subtitle,
  resultsMode,
  isPaused,
  hasStagedChanges,
  isExporting,
  simElapsedHours,
  simHorizonHours,
  speedMultiplier,
  onResultsModeChange,
  onSpeedChange,
  onStartPause,
  onReset,
  onExport
}: DashboardHeaderProps) {
  return (
    <header className="header-shell">
      <div className="header-left">
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
        <div className="header-controls">
          <button className="primary" onClick={onStartPause}>
            {isPaused ? "Start" : "Pause"}
          </button>
          <button className="secondary" onClick={onReset}>
            Reset
          </button>
          <button className="secondary save-scenario-btn" onClick={onExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export Scenario"}
          </button>
          <div className="results-mode-group" role="group" aria-label="results panel mode">
            {[
              { key: "flow", label: "FLOW MAP" },
              { key: "diagnosis", label: "DIAGNOSIS" },
              { key: "throughput", label: "THROUGHPUT" }
            ].map((mode) => (
              <button
                key={mode.key}
                type="button"
                className={`secondary mode-toggle-btn ${resultsMode === mode.key ? "is-active" : ""}`}
                onClick={() =>
                  onResultsModeChange(mode.key as "flow" | "diagnosis" | "throughput")
                }
                aria-pressed={resultsMode === mode.key}
              >
                {mode.label}
              </button>
            ))}
          </div>
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
      <div className="header-right">
        <div className="status-strip" aria-label="simulation status">
          <div className="status-chip timer-chip is-active">
            <span className="status-chip-label">Sim Time</span>
            <span className="status-chip-value">
              {simElapsedHours.toFixed(2)} / {simHorizonHours} h
            </span>
          </div>
          <div className="speed-group" role="group" aria-label="simulation speed">
            {[1, 2, 5, 10, 50, 200].map((speed) => (
              <button
                key={speed}
                type="button"
                className={`speed-pill ${speedMultiplier === speed ? "is-active" : ""}`}
                onClick={() => onSpeedChange(speed as 1 | 2 | 5 | 10 | 50 | 200)}
              >
                x{speed}
              </button>
            ))}
          </div>
          <div className="status-chip">
            <span className="status-chip-value">Scenarios 0</span>
          </div>
        </div>
      </div>
    </header>
  );
}
