interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  canToggleDiagnosis: boolean;
  isPaused: boolean;
  isDiagnosisVisible: boolean;
  hasStagedChanges: boolean;
  isExporting: boolean;
  simElapsedHours: number;
  simHorizonHours: number;
  speedMultiplier: 1 | 2 | 5 | 10 | 50 | 200;
  onToggleDiagnosis: () => void;
  onSpeedChange: (speed: 1 | 2 | 5 | 10 | 50 | 200) => void;
  onStartPause: () => void;
  onReset: () => void;
  onExport: () => void;
}

export function DashboardHeader({
  title,
  subtitle,
  canToggleDiagnosis,
  isPaused,
  isDiagnosisVisible,
  hasStagedChanges,
  isExporting,
  simElapsedHours,
  simHorizonHours,
  speedMultiplier,
  onToggleDiagnosis,
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
          {canToggleDiagnosis ? (
            <button
              type="button"
              className={`secondary mode-toggle-btn ${isDiagnosisVisible ? "is-active" : ""}`}
              onClick={onToggleDiagnosis}
              aria-pressed={isDiagnosisVisible}
            >
              {isDiagnosisVisible ? "HIDE DIAGNOSIS" : "SHOW DIAGNOSIS"}
            </button>
          ) : null}
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
