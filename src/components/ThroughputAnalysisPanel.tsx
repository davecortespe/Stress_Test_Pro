import type { ThroughputAnalysisResult, ThroughputSummaryRow } from "../types/contracts";

interface ThroughputAnalysisPanelProps {
  analysis: ThroughputAnalysisResult;
  onExportSummaryCsv: () => void;
  onExportStepCsv: () => void;
}

function formatValue(row: ThroughputSummaryRow): string {
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

function totalStepCost(stepRows: ThroughputAnalysisResult["stepRows"]): number | null {
  if (stepRows.some((row) => row.totalStepCost === null)) {
    return null;
  }
  return stepRows.reduce((sum, row) => sum + (row.totalStepCost ?? 0), 0);
}

function formatCurrency(value: number | null | undefined): string {
  return formatValue({ key: "currency", label: "", value: value ?? null, format: "currency" });
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

function efficiencyTone(status: ThroughputAnalysisResult["efficiencyStatus"]): "good" | "warning" | "danger" {
  if (status === "high") {
    return "good";
  }
  if (status === "medium") {
    return "warning";
  }
  return "danger";
}

function efficiencyLabel(status: ThroughputAnalysisResult["efficiencyStatus"]): string {
  if (status === "high") {
    return "High";
  }
  if (status === "medium") {
    return "Medium";
  }
  return "Low";
}

export function ThroughputAnalysisPanel({
  analysis,
  onExportSummaryCsv,
  onExportStepCsv
}: ThroughputAnalysisPanelProps) {
  const grandTotal = totalStepCost(analysis.stepRows);
  const bannerTone = efficiencyTone(analysis.efficiencyStatus);
  const topActions = analysis.insights.slice(0, 3);
  const validationSummary =
    analysis.validations.length > 0 ? `${analysis.validations.length} checks need review` : "No blocking data checks";

  return (
    <section className="throughput-panel throughput-report-panel">
      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Throughput &amp; Economics</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>

      <section className={`report-status-banner tone-${bannerTone}`}>
        <div className="report-status-main">
          <div className="report-status-line">
            <span className={`diagnosis-state-pill tone-${bannerTone}`}>Throughput &amp; Economics</span>
            <p>Economic constraint view</p>
          </div>
          <h2>
            {analysis.summary.primaryBottleneck} is the current economic constraint; relieving it unlocks the fastest
            output and margin gain.
          </h2>
          <p className="report-banner-summary">
            {analysis.productFamilyLabel ? `Product family: ${analysis.productFamilyLabel}. ` : ""}
            Current throughput is {formatValue({ key: "current", label: "", value: analysis.summary.currentThroughput, format: "number", decimals: 2 })} /hr and the modeled improved state is{" "}
            {formatValue({ key: "improved", label: "", value: analysis.summary.improvedThroughput, format: "number", decimals: 2 })} /hr.
          </p>
          <div className="report-banner-metrics">
            <span>Primary bottleneck: {analysis.summary.primaryBottleneck}</span>
            <span>Next bottleneck: {analysis.summary.nextBottleneck}</span>
            <span>Estimated gain: {formatValue({ key: "gain", label: "", value: analysis.summary.estimatedGainDollars, format: "currency" })}</span>
          </div>
        </div>
        <div className="report-banner-aside">
          <div className="report-banner-actions">
            <button type="button" className="secondary" onClick={onExportSummaryCsv} disabled={analysis.hasBlockingErrors}>
              Export Summary CSV
            </button>
            <button type="button" className="secondary" onClick={onExportStepCsv}>
              Export Step Costs CSV
            </button>
          </div>
          <div className="report-banner-aside-block">
            <span>Efficiency</span>
            <strong>{efficiencyLabel(analysis.efficiencyStatus)}</strong>
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
          <p>Use the highest-value constraint relief first, then confirm what becomes limiting next before funding broader changes.</p>
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
                <h5>Economic impact</h5>
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
          <h3>Throughput leverage</h3>
          <p>
            More output if fixed: {formatValue({ key: "estimatedGainUnits", label: "", value: analysis.summary.estimatedGainUnits, format: "number", decimals: 3 })} units/hr.
          </p>
        </article>
        <article className="report-framing-card">
          <h3>TOC throughput / unit</h3>
          <p>{formatValue({ key: "toc", label: "", value: analysis.summary.tocThroughputPerUnit, format: "currency" })}</p>
        </article>
        <article className="report-framing-card">
          <h3>TOC / bottleneck minute</h3>
          <p>{formatValue({ key: "toc-minute", label: "", value: analysis.summary.tocThroughputPerBottleneckMinute, format: "currency" })}</p>
        </article>
        <article className="report-framing-card">
          <h3>Fully loaded profit / unit</h3>
          <p>{formatValue({ key: "profit-unit", label: "", value: analysis.summary.fullyLoadedProfitPerUnit, format: "currency" })}</p>
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
          <h3>Cost by step</h3>
          <div className="throughput-table-scroll">
            <table className="throughput-table throughput-steps-table">
              <thead>
                <tr>
                  <th>Step name</th>
                  <th>Material cost / unit</th>
                  <th>Labor rate / hr</th>
                  <th>Added FTEs</th>
                  <th>Added FTE labor / unit</th>
                  <th>Labor cost / unit</th>
                  <th>Equipment rate / hr</th>
                  <th>Equipment cost / unit</th>
                  <th>Total step cost / unit</th>
                </tr>
              </thead>
              <tbody>
                {analysis.stepRows.map((row) => (
                  <tr key={row.stepId}>
                    <th>{row.stepName}</th>
                    <td>{formatValue({ key: `${row.stepId}-material`, label: "", value: row.materialCost, format: "currency" })}</td>
                    <td>{formatValue({ key: `${row.stepId}-labor-rate`, label: "", value: row.laborRatePerHour, format: "currency" })}</td>
                    <td>{formatValue({ key: `${row.stepId}-added-fte`, label: "", value: row.addedFteCount, format: "number", decimals: 0 })}</td>
                    <td>{formatValue({ key: `${row.stepId}-added-fte-cost`, label: "", value: row.addedFteLaborCostPerUnit, format: "currency" })}</td>
                    <td>{formatValue({ key: `${row.stepId}-labor-unit`, label: "", value: row.laborCostPerUnit, format: "currency" })}</td>
                    <td>{formatValue({ key: `${row.stepId}-equipment-rate`, label: "", value: row.equipmentRatePerHour, format: "currency" })}</td>
                    <td>{formatValue({ key: `${row.stepId}-equipment-unit`, label: "", value: row.equipmentCostPerUnit, format: "currency" })}</td>
                    <td>{formatValue({ key: `${row.stepId}-total`, label: "", value: row.totalStepCost, format: "currency" })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <td colSpan={6}>
                    {formatValue({ key: "grand-total", label: "", value: grandTotal, format: "currency" })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </article>
      </div>

      <article className="throughput-table-card">
        <h3>Money summary</h3>
        <div className="throughput-table-scroll">
          <table className="throughput-table">
            <thead>
              <tr>
                <th>Line item</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {analysis.profitLossRows.map((row) => (
                <tr key={row.key}>
                  <th>{row.label}</th>
                  <td>{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Confidence Note</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>
      <footer className="report-note-footer">
        {analysis.validations.length > 0
          ? `Check before use: ${analysis.validations.map((validation) => validation.message).join(" ")}`
          : "No blocking throughput validation issues were flagged in the current model run."}
      </footer>
    </section>
  );
}
