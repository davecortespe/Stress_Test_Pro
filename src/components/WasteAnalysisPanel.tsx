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

export function WasteAnalysisPanel({
  analysis,
  onExportSummaryCsv,
  onExportStepCsv
}: WasteAnalysisPanelProps) {
  return (
    <section className="throughput-panel">
      <div className="throughput-toolbar">
        <div>
          <p className="throughput-eyebrow">Waste Analysis</p>
          <h2>{analysis.scenarioLabel}</h2>
          <p className="throughput-meta">LT is total elapsed time. CT is hands-on work time.</p>
        </div>
        <div className="throughput-toolbar-actions">
          <button type="button" className="secondary" onClick={onExportSummaryCsv}>
            Export Summary CSV
          </button>
          <button type="button" className="secondary" onClick={onExportStepCsv}>
            Export Step Waste CSV
          </button>
          <div className={`efficiency-badge ${analysis.summary.warningCount > 0 ? "efficiency-medium" : "efficiency-high"}`}>
            <span>Warnings</span>
            <strong>{analysis.summary.warningCount}</strong>
          </div>
        </div>
      </div>

      {analysis.validations.length > 0 ? (
        <section className="throughput-validations">
          <h3>Check Before Use</h3>
          <ul>
            {analysis.validations.map((validation) => (
              <li
                key={`${validation.code}-${validation.stepId ?? validation.metricKey ?? ""}`}
                className={`validation-${validation.severity}`}
              >
                {validation.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="throughput-summary-shell">
        <article className="throughput-hero-card">
          <h3>Delay Vs Touch Time</h3>
          <dl>
            <div>
              <dt>Total elapsed time</dt>
              <dd>{formatValue({ key: "lt", label: "", value: analysis.summary.totalLeadTimeMinutes, format: "duration" })}</dd>
            </div>
            <div>
              <dt>Total hands-on time</dt>
              <dd>{formatValue({ key: "ct", label: "", value: analysis.summary.totalTouchTimeMinutes, format: "duration" })}</dd>
            </div>
            <div>
              <dt>Total delay time</dt>
              <dd>{formatValue({ key: "waste", label: "", value: analysis.summary.totalWasteMinutes, format: "duration" })}</dd>
            </div>
            <div>
              <dt>Biggest delay step</dt>
              <dd>{analysis.summary.topWasteStep}</dd>
            </div>
          </dl>
        </article>

        <article className="throughput-insights-card">
          <h3>What To Do</h3>
          <div className="throughput-insights-grid">
            {analysis.insights.map((insight, index) => (
              <article key={`${insight.finding}-${index}`} className="throughput-insight">
                <h4>{insight.finding}</h4>
                <p>{insight.impactEstimate}</p>
                <p>{insight.recommendedAction}</p>
              </article>
            ))}
          </div>
        </article>
      </div>

      <div className="throughput-table-grid">
        <article className="throughput-table-card">
          <h3>Key Numbers</h3>
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
          <h3>Delay By Step</h3>
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
    </section>
  );
}
