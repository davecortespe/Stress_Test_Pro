import { useState } from "react";
import type { OperationalSystemStatus, SelectOption, SimulatorResultsMode } from "../types/contracts";
import type { SpeedMultiplier } from "../simulator/scenarioState";

const SPEED_OPTIONS: Array<{ value: SpeedMultiplier; label: string; hint?: string }> = [
  { value: 1, label: "x1" },
  { value: 2, label: "x2" },
  { value: 5, label: "x5" },
  { value: 100, label: "x100" },
  { value: 200, label: "x200" },
  { value: 1000, label: "x1000", hint: "Rapid replay for long horizons." }
];

const RESULTS_MODES: Array<{ key: SimulatorResultsMode; label: string; description: string }> = [
  {
    key: "flow",
    label: "Flow",
    description: "Shows the live step-by-step flow, where work is piling up, and which step is acting as the bottleneck right now."
  },
  {
    key: "diagnosis",
    label: "Diagnosis",
    description: "Explains what is breaking, why it is happening, what it causes downstream, and the best move to stabilize the system."
  },
  {
    key: "kaizen",
    label: "Kaizen",
    description: "Highlights the strongest improvement opportunities, likely root causes, and where a Kaizen event can make the biggest difference."
  },
  {
    key: "throughput",
    label: "Throughput",
    description: "Shows how the current bottleneck affects output, cost, and profit so you can see where added capacity creates the most value."
  },
  {
    key: "waste",
    label: "Waste",
    description: "Compares lead time with touch time to show where delay and non-value-added time are building up across the flow."
  },
  {
    key: "assumptions",
    label: "Assumptions",
    description: "Shows which inputs were estimated or defaulted so end users can quickly see how much to trust the current report."
  }
];

interface DashboardHeaderProps {
  brandLabel?: string;
  title: string;
  subtitle: string;
  primaryConstraint: string;
  statusSummary: string;
  recommendedAction: string;
  diagnosisStatus: OperationalSystemStatus;
  resultsMode: SimulatorResultsMode;
  isPaused: boolean;
  hasStagedChanges: boolean;
  simElapsedHours: number;
  simHorizonHours: number;
  simHorizonValue: number | string;
  simHorizonOptions: Array<string | SelectOption>;
  simProgressPct: number;
  scenarioCount: number;
  speedMultiplier: SpeedMultiplier;
  onResultsModeChange: (mode: SimulatorResultsMode) => void;
  onSpeedChange: (speed: SpeedMultiplier) => void;
  onStartPause: () => void;
  onReset: () => void;
  onSaveCurrentScenario: () => void;
  onOpenExecutivePdf: () => void;
  onOpenQuickStartGuide: () => void;
  onToggleScenarioLibrary: () => void;
  onFocusConstraint: () => void;
  onSimHorizonChange: (value: string) => void;
}

function getOptionValue(option: string | SelectOption): string {
  return typeof option === "string" ? option : option.value;
}

function getOptionLabel(option: string | SelectOption): string {
  return typeof option === "string" ? option : option.label;
}

export function DashboardHeader({
  brandLabel = "LeanStorming Operational Stress Labs",
  title,
  subtitle,
  primaryConstraint,
  statusSummary,
  recommendedAction,
  diagnosisStatus,
  resultsMode,
  isPaused,
  hasStagedChanges,
  simElapsedHours,
  simHorizonHours,
  simHorizonValue,
  simHorizonOptions,
  simProgressPct,
  scenarioCount,
  speedMultiplier,
  onResultsModeChange,
  onSpeedChange,
  onStartPause,
  onReset,
  onSaveCurrentScenario,
  onOpenExecutivePdf,
  onOpenQuickStartGuide,
  onToggleScenarioLibrary,
  onFocusConstraint,
  onSimHorizonChange
}: DashboardHeaderProps) {
  const [isRecommendedMoveOpen, setIsRecommendedMoveOpen] = useState(true);
  const [resetPending, setResetPending] = useState(false);

  return (
    <header className="header-shell">
      <div className="header-top-row">
        <div className="header-title-block">
          <p className="brand-mark">{brandLabel}</p>
          <h1>{title}</h1>
          {subtitle.trim().length > 0 ? <p className="subtitle">{subtitle}</p> : null}
        </div>
        <div className="header-meta-row" aria-label="simulation status">
          <div className="header-guide-slot">
            <button type="button" className="secondary hero-guide-btn" onClick={onOpenQuickStartGuide}>
              Quick Start Guide
            </button>
          </div>
          <div className="status-chip timer-chip is-active">
            <div className="timer-chip-main">
              <span className="status-chip-label">Sim Time</span>
              <span className="status-chip-value">
                {simElapsedHours.toFixed(2)} / {simHorizonHours} h
              </span>
            </div>
            <label className="timer-chip-horizon">
              <span className="timer-chip-horizon-label">Horizon</span>
              <select
                value={String(simHorizonValue)}
                onChange={(event) => onSimHorizonChange(event.target.value)}
                disabled={!isPaused}
                aria-label="Simulation horizon"
              >
                {simHorizonOptions.map((option) => (
                  <option key={getOptionValue(option)} value={getOptionValue(option)}>
                    {getOptionLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <div className="timer-chip-progress">
              <div
                className="sim-progress-track"
                role="progressbar"
                aria-label="Simulation progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={simProgressPct}
              >
                <span className="sim-progress-fill" style={{ width: `${simProgressPct}%` }} />
              </div>
              <span className="timer-chip-progress-pct">{simProgressPct.toFixed(1)}%</span>
            </div>
          </div>
          <div className={`live-pill ${isPaused ? "is-paused" : "is-live"}`}>
            <span className="dot" />
            {isPaused ? "Paused" : "Live"}
          </div>
          <button type="button" className="status-chip scenario-chip-button" onClick={onToggleScenarioLibrary}>
            <span className="scenario-chip-add" aria-hidden="true">+</span>
            <span className="status-chip-label">Scenarios</span>
            <span className="status-chip-value">{scenarioCount}</span>
          </button>
        </div>
      </div>

      <section className="header-control-card actions-card actions-card-promoted" aria-label="actions">
        <p className="header-control-label">Simulation</p>
        <div className="actions-toolbar-row">
          <div className="header-controls actions-grid actions-grid-compact">
            <button className="primary" onClick={onStartPause}>
              {isPaused ? "Start" : "Pause"}
            </button>
            <button
              className={`secondary${resetPending ? " is-confirming" : ""}`}
              onClick={resetPending ? () => { onReset(); setResetPending(false); } : () => setResetPending(true)}
              onBlur={() => setResetPending(false)}
            >
              {resetPending ? "Confirm reset?" : "Reset Time"}
            </button>
            <button type="button" className="secondary" onClick={onSaveCurrentScenario}>
              Save Scenario
            </button>
            <button type="button" className="secondary export-report-btn" onClick={onOpenExecutivePdf}>
              Open Executive PDF
            </button>
          </div>
          <div className="actions-inline-meta">
            <div className="speed-inline-group" role="group" aria-label="simulation speed">
              <span className="header-subsection-label">Playback</span>
              <div className="speed-group speed-group-compact">
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
          </div>
        </div>
      </section>

      <div className="header-bottom-row header-bottom-row-promoted">
        <section className="decision-card decision-card-compact" aria-label="recommended action">
          <div className="decision-card-top">
            <div>
              <p className="header-control-label">Recommended move</p>
              <h2>{primaryConstraint}</h2>
            </div>
            <div className="decision-card-top-actions">
              <div className={`decision-status status-${diagnosisStatus}`}>
                {diagnosisStatus.charAt(0).toUpperCase() + diagnosisStatus.slice(1)}
              </div>
              <button
                type="button"
                className="decision-more-toggle"
                onClick={() => setIsRecommendedMoveOpen((current) => !current)}
                aria-expanded={isRecommendedMoveOpen}
              >
                {isRecommendedMoveOpen ? "▲ Hide" : "▼ Details"}
              </button>
            </div>
          </div>
          {isRecommendedMoveOpen ? (
            <>
              <p className="decision-summary">{statusSummary}</p>
              <div className="decision-action-row">
                <p className="decision-action-copy">{recommendedAction}</p>
                <div className="decision-actions">
                  <button type="button" className="primary" onClick={onFocusConstraint}>
                    Focus constraint
                  </button>
                  {isPaused && hasStagedChanges ? (
                    <div className={`staged-chip ${hasStagedChanges ? "has-changes" : "no-changes"}`}>
                      Staged changes
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </section>

        <div className="header-control-card">
          <p className="header-control-label">View</p>
          <div className="results-mode-group" aria-label="results panel mode">
            {RESULTS_MODES.map((mode) => (
              <div key={mode.key} className="results-mode-item">
                <button
                  type="button"
                  className={`secondary mode-toggle-btn ${resultsMode === mode.key ? "is-active" : ""}`}
                  onClick={() => onResultsModeChange(mode.key)}
                  aria-pressed={resultsMode === mode.key}
                  title={mode.description}
                >
                  <span className="mode-toggle-label">{mode.label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
