import type { WasteAnalysisResult, WasteSummaryRow } from "../types/contracts";

interface WasteAnalysisPanelProps {
  analysis: WasteAnalysisResult;
  onExportSummaryCsv: () => void;
  onExportStepCsv: () => void;
}

function formatValue(row: WasteSummaryRow): string {
  if (row.value === null || row.value === undefined || row.value === "") {
    return "--";
  }
  if (typeof row.value === "string") {
    return row.value;
  }
  if (row.format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: row.decimals ?? 2,
      maximumFractionDigits: row.decimals ?? 2
    }).format(row.value);
  }
  if (row.format === "percent") {
    return `${(row.value * 100).toFixed(row.decimals ?? 1)}%`;
  }
  if (row.format === "duration") {
    return `${row.value.toFixed(row.decimals ?? 2)} min`;
  }
  return row.value.toFixed(row.decimals ?? 2);
}

function formatFlags(flags: {
  usedCtFallback: boolean;
  usedLtFallback: boolean;
  missingBoth: boolean;
  ltBelowCt: boolean;
}): string {
  const values: string[] = [];
  if (flags.usedCtFallback) {
    values.push("CT<-LT");
  }
  if (flags.usedLtFallback) {
    values.push("LT<-CT");
  }
  if (flags.missingBoth) {
    values.push("Missing");
  }
  if (flags.ltBelowCt) {
    values.push("LT<CT");
  }
  return values.length > 0 ? values.join(", ") : "OK";
}

function clampSentences(text: string, maxSentences: number): string {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= maxSentences) {
    return text;
  }
  return parts.slice(0, maxSentences).join(" ");
}

function warningTone(warningCount: number): "good" | "warning" {
  return warningCount > 0 ? "warning" : "good";
}

export function WasteAnalysisPanel({
  analysis,
  onExportSummaryCsv,
  onExportStepCsv
}: WasteAnalysisPanelProps) {
  const bannerTone = warningTone(analysis.summary.warningCount);
  const topActions = analysis.insights.slice(0, 3);
  const validationSummary =
    analysis.validations.length > 0 ? `${analysis.validations.length} checks need review` : "No blocking data checks";

  return (
    <section className="throughput-panel waste-report-panel">
      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Waste Analysis</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>

      <section className={`report-status-banner tone-${bannerTone}`}>
        <div className="report-status-main">
          <div className="report-status-line">
            <span className={`diagnosis-state-pill tone-${bannerTone}`}>Waste Analysis</span>
            <p>Delay and friction view</p>
          </div>
          <h2>{analysis.summary.topWasteStep} is the largest visible source of modeled delay and hidden flow loss.</h2>
          <p className="report-banner-summary">
            Total elapsed time is {formatValue({ key: "lt", label: "", value: analysis.summary.totalLeadTimeMinutes, format: "duration" })}, while hands-on work is only{" "}
            {formatValue({ key: "ct", label: "", value: analysis.summary.totalTouchTimeMinutes, format: "duration" })}.
          </p>
          <div className="report-banner-metrics">
            <span>Total waste: {formatValue({ key: "waste", label: "", value: analysis.summary.totalWasteMinutes, format: "duration" })}</span>
            <span>Waste share: {formatValue({ key: "waste-pct", label: "", value: analysis.summary.totalWastePct, format: "percent", decimals: 1 })}</span>
            <span>Top waste step: {analysis.summary.topWasteStep}</span>
          </div>
        </div>
        <div className="report-banner-aside">
          <div className="report-banner-actions">
            <button type="button" className="secondary" onClick={onExportSummaryCsv}>
              Export Summary CSV
            </button>
            <button type="button" className="secondary" onClick={onExportStepCsv}>
              Export Step Waste CSV
            </button>
          </div>
          <div className="report-banner-aside-block">
            <span>Warnings</span>
            <strong>{analysis.summary.warningCount}</strong>
            <p>{validationSummary}</p>
          </div>
        </div>
      </section>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Recommended Actions</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>

      <section className="report-action-band">
        <div className="report-action-band-copy">
          <h3>Recommended next moves</h3>
          <p>Start where delay is structurally compounding, then separate true touch time from queue, handoff, and fallback artifacts before chasing local optimizations.</p>
        </div>
        <div className="report-priority-grid">
          {topActions.map((insight, index) => (
            <article key={`${insight.finding}-${index}`} className={`report-priority-card tone-${bannerTone}`}>
              <div className="report-priority-header">
                <div>
                  <p className="kaizen-rank">Priority {index + 1}</p>
                  <h4>{insight.finding}</h4>
                </div>
              </div>
              <div className="report-priority-detail">
                <h5>Why this matters</h5>
                <p>{clampSentences(insight.impactEstimate, 2)}</p>
              </div>
              <div className="report-priority-detail">
                <h5>Recommended move</h5>
                <p>{clampSentences(insight.recommendedAction, 2)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Decision Framing</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>

      <div className="report-framing-grid">
        <article className="report-framing-card">
          <h3>Total elapsed time</h3>
          <p>{formatValue({ key: "lt", label: "", value: analysis.summary.totalLeadTimeMinutes, format: "duration" })}</p>
        </article>
        <article className="report-framing-card">
          <h3>Total touch time</h3>
          <p>{formatValue({ key: "ct", label: "", value: analysis.summary.totalTouchTimeMinutes, format: "duration" })}</p>
        </article>
        <article className="report-framing-card">
          <h3>Total delay time</h3>
          <p>{formatValue({ key: "waste", label: "", value: analysis.summary.totalWasteMinutes, format: "duration" })}</p>
        </article>
        <article className="report-framing-card">
          <h3>Value-add ratio</h3>
          <p>{formatValue({ key: "va-ratio", label: "", value: analysis.summary.valueAddRatio, format: "percent", decimals: 1 })}</p>
        </article>
      </div>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Evidence Tables</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>

      <div className="throughput-table-grid">
        <article className="throughput-table-card">
          <h3>Key numbers</h3>
          <div className="throughput-table-scroll">
            <table className="throughput-table">
              <tbody>
                {analysis.summaryRows.map((row) => (
                  <tr key={row.key}>
                    <th>{row.label}</th>
                    <td>{formatValue(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="throughput-table-card">
          <h3>Delay by step</h3>
          <div className="throughput-table-scroll">
            <table className="throughput-table throughput-steps-table">
              <thead>
                <tr>
                  <th>Step name</th>
                  <th>LT</th>
                  <th>CT</th>
                  <th>Waste</th>
                  <th>Delay %</th>
                  <th>Value work %</th>
                  <th>Flow share</th>
                  <th>Weighted delay</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {analysis.stepRows.map((row) => (
                  <tr key={row.stepId}>
                    <th>{row.stepName}</th>
                    <td>{formatValue({ key: `${row.stepId}-lt`, label: "", value: row.comparisonLtMinutes, format: "duration" })}</td>
                    <td>{formatValue({ key: `${row.stepId}-ct`, label: "", value: row.comparisonCtMinutes, format: "duration" })}</td>
                    <td>{formatValue({ key: `${row.stepId}-waste`, label: "", value: row.wasteMinutes, format: "duration" })}</td>
                    <td>{formatValue({ key: `${row.stepId}-waste-pct`, label: "", value: row.wastePct, format: "percent", decimals: 1 })}</td>
                    <td>{formatValue({ key: `${row.stepId}-va-pct`, label: "", value: row.valueAddPct, format: "percent", decimals: 1 })}</td>
                    <td>{formatValue({ key: `${row.stepId}-weight`, label: "", value: row.routeWeight, format: "number", decimals: 3 })}</td>
                    <td>{formatValue({ key: `${row.stepId}-weighted-waste`, label: "", value: row.weightedWasteMinutes, format: "duration" })}</td>
                    <td>{formatFlags(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Confidence Note</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>
      <footer className="report-note-footer">
        {analysis.validations.length > 0
          ? `Check before use: ${analysis.validations.map((validation) => validation.message).join(" ")}`
          : `Model fallbacks used: ${analysis.summary.fallbackCount}. No blocking waste validation issues were flagged in the current run.`}
      </footer>
    </section>
  );
}
