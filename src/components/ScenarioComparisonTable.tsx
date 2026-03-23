import type { ScenarioLibraryEntry } from "../types/contracts";
import { formatValue } from "../lib/formatValue";
import type { ComparisonMetricConfig, MetricDeltaDirection } from "../simulator/simulatorConfig";

interface ScenarioComparisonTableProps {
  entryA: ScenarioLibraryEntry;
  entryB: ScenarioLibraryEntry;
  metricConfigs: ComparisonMetricConfig[];
}

// ── Static metadata ─────────────────────────────────────────────────

const METRIC_SUBTITLES: Record<string, string> = {
  forecastThroughput: "capacity delivered",
  totalWipQty: "congestion in system",
  weightedLeadTimeMinutes: "total response delay",
  bottleneckIndex: "strain on bottleneck",
  activeConstraintName: "current limiting step"
};

const METRIC_TOOLTIPS: Record<string, string> = {
  forecastThroughput: "Units completed per hour — the primary flow rate. Higher is better. Lower output = less capacity delivered to demand.",
  bottleneckIndex: "Bottleneck saturation (0–100%). Lower is better. Above 90% risks system collapse under variability.",
  totalWipQty: "Work-in-process units in the system. Lower is better — excess WIP stretches lead time and hides quality issues.",
  weightedLeadTimeMinutes: "Flow-weighted average time from entry to completion. Lower is better. Longer lead time = slower customer response.",
  totalCompletedOutputPieces: "Total lots completed over the simulation horizon. Higher is better.",
  tocThroughputPerUnit: "Theory of Constraints throughput per unit (Revenue − Direct Variable Cost). Higher is better.",
  activeConstraintName: "The step with the highest saturation — the system's current bottleneck. A migrated constraint means prior improvement actions may no longer unlock throughput."
};

const PRIMARY_METRIC_KEYS = new Set([
  "forecastThroughput", "bottleneckIndex", "totalWipQty",
  "weightedLeadTimeMinutes", "activeConstraintName"
]);

const EXEC_CARD_KEYS = ["forecastThroughput", "totalWipQty", "weightedLeadTimeMinutes", "bottleneckIndex"];

// ── Delta helpers ───────────────────────────────────────────────────

function getMetricValue(entry: ScenarioLibraryEntry, key: string): number | string {
  if (!entry.savedMetrics) return "—";
  const raw = (entry.savedMetrics as unknown as Record<string, number | string>)[key];
  return raw ?? "—";
}

function getDeltaTone(delta: number, direction: MetricDeltaDirection): "positive" | "negative" | "neutral" {
  if (Math.abs(delta) < 1e-9) return "neutral";
  if (direction === "higher_better") return delta > 0 ? "positive" : "negative";
  if (direction === "lower_better") return delta < 0 ? "positive" : "negative";
  return "neutral";
}

interface DeltaResult {
  text: string;
  pctText: string;
  tone: "positive" | "negative" | "neutral" | "migrated";
  numericDelta: number | null;
}

function computeDelta(
  valA: number | string,
  valB: number | string,
  config: ComparisonMetricConfig
): DeltaResult {
  if (config.direction === "neutral") {
    const same = String(valA) === String(valB);
    return { text: same ? "—" : "migrated", pctText: "", tone: same ? "neutral" : "migrated", numericDelta: null };
  }
  if (typeof valA !== "number" || typeof valB !== "number") {
    return { text: "—", pctText: "", tone: "neutral", numericDelta: null };
  }
  const delta = valB - valA;
  const tone = getDeltaTone(delta, config.direction);
  const sign = delta > 0 ? "+" : "";

  let text: string;
  if (config.format === "percent") {
    text = `${sign}${(delta * 100).toFixed(config.decimals)}%`;
  } else if (config.format === "currency") {
    const abs = Math.abs(delta);
    text = `${delta < 0 ? "-$" : "+$"}${abs.toFixed(config.decimals)}`;
  } else if (config.format === "duration") {
    text = `${sign}${delta.toFixed(config.decimals)} min`;
  } else {
    text = `${sign}${delta.toFixed(config.decimals)}`;
  }

  let pctText = "";
  if (valA !== 0) {
    const pct = ((delta / Math.abs(valA)) * 100).toFixed(1);
    pctText = `${delta > 0 ? "+" : ""}${pct}%`;
  }

  return { text, pctText, tone, numericDelta: delta };
}

function getToneIcon(tone: "positive" | "negative" | "neutral" | "migrated"): string {
  if (tone === "positive") return "▲";
  if (tone === "negative") return "▼";
  if (tone === "migrated") return "◆";
  return "—";
}

function getToneWord(tone: "positive" | "negative" | "neutral" | "migrated"): string {
  if (tone === "positive") return "better";
  if (tone === "negative") return "worse";
  if (tone === "migrated") return "migrated";
  return "unchanged";
}

function formatSavedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Verdict & action plan ───────────────────────────────────────────

type VerdictTone = "recommend" | "neutral";

interface VerdictResult {
  chipLabel: string;
  tone: VerdictTone;
  recommendedEntry: "A" | "B" | null;
  confidence: "strong" | "slight" | "none";
  score: number;
}

function computeVerdict(entryA: ScenarioLibraryEntry, entryB: ScenarioLibraryEntry): VerdictResult {
  const m = entryA.savedMetrics;
  const n = entryB.savedMetrics;
  if (!m || !n) return { chipLabel: "Insufficient data", tone: "neutral", recommendedEntry: null, confidence: "none", score: 0 };

  let score = 0;

  const tA = typeof m.forecastThroughput === "number" ? m.forecastThroughput : null;
  const tB = typeof n.forecastThroughput === "number" ? n.forecastThroughput : null;
  if (tA !== null && tB !== null) {
    if (tB > tA + 0.05) score += 2;
    else if (tB < tA - 0.05) score -= 2;
  }

  const wA = typeof m.totalWipQty === "number" ? m.totalWipQty : null;
  const wB = typeof n.totalWipQty === "number" ? n.totalWipQty : null;
  if (wA !== null && wB !== null) {
    if (wB < wA - 1) score += 1;
    else if (wB > wA + 1) score -= 1;
  }

  const lA = typeof m.weightedLeadTimeMinutes === "number" ? m.weightedLeadTimeMinutes : null;
  const lB = typeof n.weightedLeadTimeMinutes === "number" ? n.weightedLeadTimeMinutes : null;
  if (lA !== null && lB !== null) {
    if (lB < lA - 1) score += 1;
    else if (lB > lA + 1) score -= 1;
  }

  if (score >= 3) return { chipLabel: "Recommend Scenario B", tone: "recommend", recommendedEntry: "B", confidence: "strong", score };
  if (score >= 1) return { chipLabel: "Scenario B has the advantage", tone: "recommend", recommendedEntry: "B", confidence: "slight", score };
  if (score <= -3) return { chipLabel: "Recommend Scenario A", tone: "recommend", recommendedEntry: "A", confidence: "strong", score };
  if (score <= -1) return { chipLabel: "Scenario A has the advantage", tone: "recommend", recommendedEntry: "A", confidence: "slight", score };
  return { chipLabel: "No clear advantage", tone: "neutral", recommendedEntry: null, confidence: "none", score };
}

interface ActionPlan {
  recLetter: "A" | "B";
  recName: string;
  reasons: string[];
  nextStep: string;
}

function generateActionPlan(
  entryA: ScenarioLibraryEntry,
  entryB: ScenarioLibraryEntry,
  verdict: VerdictResult,
  deltas: Record<string, { valA: number | string; valB: number | string } & DeltaResult>,
  constraintMigrated: boolean,
  constraintA: string,
  constraintB: string
): ActionPlan | null {
  if (!verdict.recommendedEntry) return null;
  const rec = verdict.recommendedEntry;
  const recEntry = rec === "A" ? entryA : entryB;
  const reasons: string[] = [];

  const tDelta = deltas.forecastThroughput?.numericDelta ?? null;
  const wDelta = deltas.totalWipQty?.numericDelta ?? null;
  const lDelta = deltas.weightedLeadTimeMinutes?.numericDelta ?? null;

  // For A wins, all deltas are negative (B worse), so we flip signs in the label
  const sign = rec === "B" ? 1 : -1;

  if (tDelta !== null && Math.abs(tDelta) > 0.05) {
    const dir = sign * tDelta > 0 ? "higher" : "lower";
    if (dir === "higher") reasons.push(`higher output (+${(sign * tDelta).toFixed(2)}/hr)`);
  }
  if (wDelta !== null && Math.abs(wDelta) > 1) {
    if (sign * wDelta < 0) reasons.push(`lower WIP (${(sign * wDelta).toFixed(0)} units)`);
  }
  if (lDelta !== null && Math.abs(lDelta) > 1) {
    if (sign * lDelta < 0) reasons.push(`shorter lead time`);
  }

  if (reasons.length === 0) reasons.push("better overall operational metrics");

  let nextStep: string;
  if (constraintMigrated) {
    nextStep = `The active bottleneck has shifted from "${constraintA}" to "${constraintB}". Re-target improvement actions to the new constraint — prior fixes on the old step may no longer increase throughput.`;
  } else if (rec === "B") {
    nextStep = `Adopt Scenario B (${recEntry.scenarioName}) as the new operational baseline. Continue iterating improvements against this configuration.`;
  } else {
    nextStep = `Retain Scenario A (${recEntry.scenarioName}). The changes tested in Scenario B did not improve operational performance — explore a different improvement lever.`;
  }

  return { recLetter: rec, recName: recEntry.scenarioName, reasons, nextStep };
}

function generateNarrative(entryA: ScenarioLibraryEntry, entryB: ScenarioLibraryEntry): string {
  const m = entryA.savedMetrics;
  const n = entryB.savedMetrics;
  if (!m || !n) return "";

  const tA = typeof m.forecastThroughput === "number" ? m.forecastThroughput : null;
  const tB = typeof n.forecastThroughput === "number" ? n.forecastThroughput : null;
  const wA = typeof m.totalWipQty === "number" ? m.totalWipQty : null;
  const wB = typeof n.totalWipQty === "number" ? n.totalWipQty : null;
  const lA = typeof m.weightedLeadTimeMinutes === "number" ? m.weightedLeadTimeMinutes : null;
  const lB = typeof n.weightedLeadTimeMinutes === "number" ? n.weightedLeadTimeMinutes : null;
  const constraintMigrated = m.activeConstraintName !== n.activeConstraintName;

  const improvements: string[] = [];
  const degradations: string[] = [];

  if (tA !== null && tB !== null) {
    if (tB > tA + 0.05) improvements.push("output improved");
    else if (tB < tA - 0.05) degradations.push("output dropped");
  }
  if (wA !== null && wB !== null) {
    if (wB < wA - 1) improvements.push("WIP reduced");
    else if (wB > wA + 1) degradations.push("WIP increased");
  }
  if (lA !== null && lB !== null) {
    if (lB < lA - 1) improvements.push("lead time improved");
    else if (lB > lA + 1) degradations.push("lead time worsened");
  }

  const isThroughputBetter = tA !== null && tB !== null && tB > tA + 0.05;
  const isThroughputWorse  = tA !== null && tB !== null && tB < tA - 0.05;

  let verdict: string;
  if (isThroughputBetter && improvements.length >= degradations.length) {
    verdict = "Scenario B outperforms Scenario A.";
  } else if (isThroughputWorse || degradations.length > improvements.length) {
    verdict = "Scenario B underperforms Scenario A.";
  } else if (improvements.length === 0 && degradations.length === 0) {
    verdict = "No meaningful difference detected between these two runs.";
  } else {
    verdict = "Scenario B shows mixed results compared to Scenario A.";
  }

  const allFindings = [
    ...degradations.map(d => d.charAt(0).toUpperCase() + d.slice(1)),
    ...improvements.map(i => i.charAt(0).toUpperCase() + i.slice(1))
  ];

  let narrative = verdict;
  if (allFindings.length > 0) narrative += ` ${allFindings.join(", ")}.`;
  if (constraintMigrated) narrative += " The active constraint shifted — operational improvement focus must be re-evaluated.";

  return narrative;
}

// ── Sub-components ──────────────────────────────────────────────────

interface ExecKpiCardProps {
  metricKey: string;
  label: string;
  valueA: string;
  valueB: string;
  deltaText: string;
  pctText: string;
  tone: "positive" | "negative" | "neutral" | "migrated";
  tooltip: string;
}

function ExecKpiCard({ metricKey, label, valueA, valueB, deltaText, pctText, tone, tooltip }: ExecKpiCardProps) {
  const subtitle = METRIC_SUBTITLES[metricKey];
  return (
    <div className={`exec-kpi-card exec-kpi-tone-${tone}`} title={tooltip}>
      <div className="exec-kpi-header">
        <p className="exec-kpi-label">{label}</p>
        {subtitle && <p className="exec-kpi-subtitle">{subtitle}</p>}
      </div>
      <div className="exec-kpi-ab-row">
        <span className="exec-kpi-slot">
          <span className="exec-badge exec-badge-a">A</span>
          <span className="exec-kpi-val exec-kpi-val-a">{valueA}</span>
        </span>
        <span className="exec-kpi-arrow">→</span>
        <span className="exec-kpi-slot">
          <span className="exec-badge exec-badge-b">B</span>
          <span className="exec-kpi-val exec-kpi-val-b">{valueB}</span>
        </span>
      </div>
      <div className={`exec-kpi-signal exec-signal-${tone}`}>
        <span className="exec-signal-icon">{getToneIcon(tone)}</span>
        <span className="exec-signal-delta">{deltaText}</span>
        {pctText && tone !== "neutral" && <span className="exec-signal-pct">({pctText})</span>}
        <span className="exec-signal-word">{getToneWord(tone)}</span>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────

export function ScenarioComparisonTable({ entryA, entryB, metricConfigs }: ScenarioComparisonTableProps) {
  const deltas = metricConfigs.reduce((acc, config) => {
    const valA = getMetricValue(entryA, config.key);
    const valB = getMetricValue(entryB, config.key);
    acc[config.key] = { valA, valB, ...computeDelta(valA, valB, config) };
    return acc;
  }, {} as Record<string, { valA: number | string; valB: number | string } & DeltaResult>);

  const constraintA = entryA.savedMetrics?.activeConstraintName ?? "—";
  const constraintB = entryB.savedMetrics?.activeConstraintName ?? "—";
  const constraintMigrated = !!entryA.savedMetrics && !!entryB.savedMetrics && constraintA !== constraintB;

  const verdict   = computeVerdict(entryA, entryB);
  const narrative = generateNarrative(entryA, entryB);
  const actionPlan = generateActionPlan(entryA, entryB, verdict, deltas, constraintMigrated, constraintA, constraintB);

  const constraintTone = constraintMigrated ? "migrated" : "neutral";

  return (
    <div className="compare-report-shell">

      {/* ── Executive Summary Band ─────────────────────────────────── */}
      <div className="exec-summary-band">
        <div className="exec-summary-header">
          <div className="exec-scenarios-block">
            <p className="exec-summary-eyebrow">Scenario Comparison · Key Outcomes</p>
            <div className="exec-scenario-labels">
              <div className="exec-scenario-label">
                <span className="exec-badge exec-badge-a">A</span>
                <div className="exec-scenario-text">
                  <span className="exec-scenario-role">Scenario A</span>
                  <span className="exec-scenario-name">{entryA.scenarioName}</span>
                  <span className="exec-scenario-ts">{formatSavedAt(entryA.savedAt)}</span>
                </div>
              </div>
              <span className="exec-vs-divider">vs.</span>
              <div className="exec-scenario-label">
                <span className="exec-badge exec-badge-b">B</span>
                <div className="exec-scenario-text">
                  <span className="exec-scenario-role">Scenario B</span>
                  <span className="exec-scenario-name">{entryB.scenarioName}</span>
                  <span className="exec-scenario-ts">{formatSavedAt(entryB.savedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`exec-verdict-chip exec-verdict-${verdict.tone}`}>
            <span className="exec-verdict-label">{verdict.chipLabel}</span>
            {verdict.recommendedEntry && (
              <span className="exec-verdict-badge">
                <span className={`exec-badge exec-badge-${verdict.recommendedEntry.toLowerCase()}`}>
                  {verdict.recommendedEntry}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="exec-kpi-row">
          {EXEC_CARD_KEYS.map((key) => {
            const config = metricConfigs.find(c => c.key === key);
            if (!config) return null;
            const d = deltas[key];
            const fmtA = typeof d.valA === "number" ? formatValue(d.valA, config.format, config.decimals) : String(d.valA);
            const fmtB = typeof d.valB === "number" ? formatValue(d.valB, config.format, config.decimals) : String(d.valB);
            return (
              <ExecKpiCard
                key={key}
                metricKey={key}
                label={config.label}
                valueA={fmtA}
                valueB={fmtB}
                deltaText={d.text}
                pctText={d.pctText}
                tone={d.tone}
                tooltip={METRIC_TOOLTIPS[key] ?? ""}
              />
            );
          })}

          {/* Constraint card */}
          <div
            className={`exec-kpi-card exec-kpi-card-constraint exec-kpi-tone-${constraintTone}`}
            title={METRIC_TOOLTIPS.activeConstraintName}
          >
            <div className="exec-kpi-header">
              <p className="exec-kpi-label">Active Constraint</p>
              <p className="exec-kpi-subtitle">{METRIC_SUBTITLES.activeConstraintName}</p>
            </div>
            <div className="exec-constraint-vals">
              <span className="exec-constraint-row">
                <span className="exec-badge exec-badge-a">A</span>
                <span className="exec-constraint-name exec-kpi-val-a">{constraintA}</span>
              </span>
              <span className="exec-constraint-row">
                <span className="exec-badge exec-badge-b">B</span>
                <span className="exec-constraint-name exec-kpi-val-b">{constraintB}</span>
              </span>
            </div>
            <div className={`exec-kpi-signal exec-signal-${constraintTone}`}>
              <span className="exec-signal-icon">{getToneIcon(constraintTone)}</span>
              <span className="exec-signal-word">{constraintMigrated ? "migrated" : "same step"}</span>
            </div>
          </div>
        </div>

        {/* Narrative */}
        {narrative && (
          <div className="exec-narrative">
            <span className="exec-narrative-icon" aria-hidden="true">◎</span>
            <p className="exec-narrative-text">{narrative}</p>
          </div>
        )}
      </div>

      {/* ── Recommended Action Panel ───────────────────────────────── */}
      {actionPlan && (
        <div className="exec-action-panel">
          <p className="exec-action-eyebrow">Decision Guidance</p>
          <div className="exec-action-grid">
            <div className="exec-action-item">
              <span className="exec-action-key">Recommended</span>
              <span className="exec-action-val exec-action-scenario">
                <span className={`exec-badge exec-badge-${actionPlan.recLetter.toLowerCase()}`}>
                  {actionPlan.recLetter}
                </span>
                <strong>{actionPlan.recName}</strong>
              </span>
            </div>
            <div className="exec-action-item">
              <span className="exec-action-key">Why</span>
              <span className="exec-action-val">{actionPlan.reasons.join(", ")}</span>
            </div>
            <div className="exec-action-item">
              <span className="exec-action-key">Next step</span>
              <span className="exec-action-val">{actionPlan.nextStep}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Constraint Migration Callout ───────────────────────────── */}
      {constraintMigrated && (
        <div className="constraint-migration-callout">
          <div className="callout-badge-wrap">
            <span className="callout-badge">!</span>
          </div>
          <div className="callout-body">
            <strong className="callout-title">Constraint migrated — re-target action plan</strong>
            <p className="callout-detail">
              The active bottleneck shifted from <em>"{constraintA}"</em> to <em>"{constraintB}"</em>.{" "}
              Prior improvement actions targeting the old constraint may no longer unlock throughput.
              Operational priority must shift to the new limiting step.
            </p>
          </div>
        </div>
      )}

      {/* ── Detailed Comparison Table ──────────────────────────────── */}
      <div className="compare-table-section">
        <p className="compare-table-section-label">Decision Evidence</p>
        <div className="compare-table-shell">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="compare-metric-col">Metric</th>
                <th className="compare-scenario-col">
                  <div className="compare-col-header">
                    <span className="compare-col-slot compare-col-slot-a">A</span>
                    <span>
                      <span className="compare-col-name">{entryA.scenarioName}</span>
                      <span className="compare-col-date">{formatSavedAt(entryA.savedAt)}</span>
                    </span>
                  </div>
                </th>
                <th className="compare-scenario-col">
                  <div className="compare-col-header">
                    <span className="compare-col-slot compare-col-slot-b">B</span>
                    <span>
                      <span className="compare-col-name">{entryB.scenarioName}</span>
                      <span className="compare-col-date">{formatSavedAt(entryB.savedAt)}</span>
                    </span>
                  </div>
                </th>
                <th className="compare-delta-col">Delta (B − A)</th>
              </tr>
            </thead>
            <tbody>
              {metricConfigs.map((config, idx) => {
                const d = deltas[config.key];
                const isPrimary = PRIMARY_METRIC_KEYS.has(config.key);
                const fmtA = typeof d.valA === "number" ? formatValue(d.valA, config.format, config.decimals) : String(d.valA);
                const fmtB = typeof d.valB === "number" ? formatValue(d.valB, config.format, config.decimals) : String(d.valB);
                return (
                  <tr
                    key={config.key}
                    className={`compare-row ${isPrimary ? "compare-row-primary" : "compare-row-secondary"} ${idx % 2 === 0 ? "compare-row-even" : "compare-row-odd"}`}
                    title={METRIC_TOOLTIPS[config.key] ?? ""}
                  >
                    <td className="compare-metric-label">
                      <span className="compare-metric-name">{config.label}</span>
                      {METRIC_SUBTITLES[config.key] && (
                        <span className="compare-metric-hint">{METRIC_SUBTITLES[config.key]}</span>
                      )}
                    </td>
                    <td className="compare-value-cell">{fmtA}</td>
                    <td className="compare-value-cell compare-value-b">{fmtB}</td>
                    <td className={`compare-delta-cell delta-tone-${d.tone}`}>
                      <span className="delta-icon">{getToneIcon(d.tone)}</span>
                      <span className="delta-value">{d.text}</span>
                      {d.pctText && d.tone !== "neutral" && (
                        <span className="delta-pct">{d.pctText}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="compare-delta-legend">
            <span className="compare-legend-item compare-legend-positive">▲ improvement</span>
            <span className="compare-legend-item compare-legend-negative">▼ degradation</span>
            <span className="compare-legend-item compare-legend-migrated">◆ constraint migrated</span>
            <span className="compare-legend-item compare-legend-neutral">— no change</span>
          </div>
        </div>
      </div>

      {(!entryA.savedMetrics || !entryB.savedMetrics) && (
        <p className="compare-missing-metrics-notice">
          One or more scenarios were saved before metric capture was added. Re-save to enable full comparison.
        </p>
      )}
    </div>
  );
}
