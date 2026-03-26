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

const RESULTS_MODES: Array<{
  key: SimulatorResultsMode;
  shortLabel: string;
  description: string;
}> = [
  {
    key: "flow",
    shortLabel: "Flow",
    description:
      "Shows the live step-by-step flow, where work is piling up, and which step is acting as the bottleneck right now."
  },
  {
    key: "diagnosis",
    shortLabel: "Diagnosis",
    description:
      "Explains what is breaking, why it is happening, what it causes downstream, and the best move to stabilize the system."
  },
  {
    key: "kaizen",
    shortLabel: "Priorities",
    description:
      "Highlights the strongest improvement opportunities, likely root causes, and where the first focused improvement effort can make the biggest difference."
  },
  {
    key: "throughput",
    shortLabel: "Throughput",
    description:
      "Shows how the current bottleneck affects output, cost, and profit so you can see where added capacity creates the most value."
  },
  {
    key: "waste",
    shortLabel: "Waste",
    description:
      "Compares lead time with touch time to show where delay and non-value-added time are building up across the flow."
  },
  {
    key: "assumptions",
    shortLabel: "Assumptions",
    description:
      "Shows which inputs were estimated or defaulted so end users can quickly see how much to trust the current report."
  },
  {
    key: "compare",
    shortLabel: "Compare",
    description: "Side-by-side delta table for two saved scenarios - shows which metrics improved, degraded, or stayed the same."
  }
];

interface DashboardHeaderProps {
  brandLabel?: string;
  title: string;
  subtitle?: string;
  primaryConstraint: string;
  statusSummary: string;
  recommendedAction: string;
  diagnosisStatus: OperationalSystemStatus;
  resultsMode: SimulatorResultsMode;
  isPaused: boolean;
  hasStagedChanges: boolean;
  simElapsedHours: number;
  simHorizonHours: number;
  isRunComplete: boolean;
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
  onOpenRun: () => void;
  onCompareTwoFiles: () => void;
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
  brandLabel = "Leanstorming Operational Stress Labs",
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
  isRunComplete,
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
  onOpenRun,
  onCompareTwoFiles,
  onOpenExecutivePdf,
  onOpenQuickStartGuide,
  onToggleScenarioLibrary,
  onFocusConstraint,
  onSimHorizonChange
}: DashboardHeaderProps) {
  const [resetPending, setResetPending] = useState(false);

  return (
    <header className="header-shell">
      <div className="cmd-topline">
        <div className="cmd-brand-block">
          <p className="cmd-brand">{brandLabel}</p>
          <h1 className="cmd-title">{title}</h1>
          {subtitle ? <p className="cmd-subtitle">{subtitle}</p> : null}
        </div>
        <div className="cmd-utils">
          <button type="button" className="secondary cmd-btn cmd-util" onClick={onOpenExecutivePdf}>
            Executive Report
          </button>
          <button type="button" className="secondary cmd-btn cmd-util" onClick={onOpenQuickStartGuide}>
            Instruction Guide
          </button>
        </div>
      </div>

      <div className="cmd-cards">
        <section className="cmd-card cmd-card-sim">
          <p className="cmd-card-label">Simulation</p>
          <div className="cmd-sim-strip">
            <div className="cmd-status" aria-label="Simulation status">
              <div className={`cmd-live-dot ${isPaused ? "is-paused" : "is-live"}`}>
                <span className="dot" />
                <span>{isPaused ? "Paused" : "Live"}</span>
              </div>
              {isRunComplete ? (
                <span className="cmd-run-badge" aria-label="Run complete">
                  Run Complete
                </span>
              ) : null}
              <span className="cmd-time">
                {simElapsedHours.toFixed(2)}
                <span className="cmd-time-sep"> / </span>
                {simHorizonHours}h
              </span>
              <label className="cmd-horizon">
                <select
                  value={String(simHorizonValue)}
                  onChange={(e) => onSimHorizonChange(e.target.value)}
                  disabled={!isPaused}
                  aria-label="Simulation horizon"
                >
                  {simHorizonOptions.map((opt) => (
                    <option key={getOptionValue(opt)} value={getOptionValue(opt)}>
                      {getOptionLabel(opt)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="cmd-progress-shell">
                <div
                  className="cmd-progress-track"
                  role="progressbar"
                  aria-label="Simulation progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={simProgressPct}
                >
                  <span className="cmd-progress-fill" style={{ width: `${simProgressPct}%` }} />
                </div>
                <span className="cmd-pct">{simProgressPct.toFixed(0)}%</span>
              </div>
            </div>

            <div className="cmd-run">
              <button type="button" className="primary cmd-btn cmd-start-btn" onClick={onStartPause}>
                {isPaused ? "Start" : "Pause"}
              </button>
              <button
                type="button"
                className={`secondary cmd-btn cmd-reset-btn${resetPending ? " is-confirming" : ""}`}
                onClick={
                  resetPending
                    ? () => {
                        onReset();
                        setResetPending(false);
                      }
                    : () => setResetPending(true)
                }
                onBlur={() => setResetPending(false)}
              >
                {resetPending ? "Confirm?" : "Reset"}
              </button>
              <div className="cmd-speed" role="group" aria-label="Playback speed">
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
        </section>

        <section className="cmd-card cmd-card-analysis">
          <p className="cmd-card-label">Analysis</p>
          <div className="cmd-card-body cmd-card-body-row" role="tablist" aria-label="Analysis view">
            {RESULTS_MODES.map((mode) => (
              <button
                key={mode.key}
                role="tab"
                type="button"
                className={`tab-btn ${resultsMode === mode.key ? "is-active" : ""}`}
                onClick={() => onResultsModeChange(mode.key)}
                aria-pressed={resultsMode === mode.key}
                title={mode.description}
              >
                {mode.shortLabel}
              </button>
            ))}
          </div>
        </section>

        <section className="cmd-card cmd-card-runs">
          <p className="cmd-card-label">Runs</p>
          <div className="cmd-card-body cmd-card-body-row">
            <button type="button" className="secondary cmd-btn cmd-pill-btn" onClick={onSaveCurrentScenario}>
              Save Run
            </button>
            <button type="button" className="secondary cmd-btn cmd-pill-btn" onClick={onOpenRun}>
              Open Run
            </button>
            <button type="button" className="secondary cmd-btn cmd-pill-btn" onClick={onCompareTwoFiles}>
              Compare
            </button>
            <button
              type="button"
              className="secondary cmd-btn cmd-saved-count"
              onClick={onToggleScenarioLibrary}
              title="View saved runs"
              aria-label={`Saved runs: ${scenarioCount}`}
            >
              {scenarioCount}
            </button>
          </div>
        </section>
      </div>

      <div className={`insight-strip status-${diagnosisStatus}`}>
        <button
          type="button"
          className="insight-label insight-label-btn"
          onClick={onFocusConstraint}
          title={recommendedAction}
          aria-label={`Focus constraint: ${recommendedAction}`}
        >
          CONSTRAINT
        </button>
        <span className="insight-pipe" aria-hidden="true">
          |
        </span>
        <strong className="insight-name">{primaryConstraint}</strong>
        <span className="insight-pipe" aria-hidden="true">
          |
        </span>
        <span className={`insight-badge status-${diagnosisStatus}`}>{diagnosisStatus.toUpperCase()}</span>
        <span className="insight-pipe" aria-hidden="true">
          |
        </span>
        <span className="insight-summary" title={recommendedAction}>
          {statusSummary}
        </span>
        {isPaused && hasStagedChanges ? <span className="insight-staged">Staged changes</span> : null}
      </div>
    </header>
  );
}
