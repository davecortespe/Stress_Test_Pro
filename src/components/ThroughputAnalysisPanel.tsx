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

export function ThroughputAnalysisPanel({
  analysis,
  onExportSummaryCsv,
  onExportStepCsv
}: ThroughputAnalysisPanelProps) {
  const grandTotal = totalStepCost(analysis.stepRows);

  return (
    <section className="throughput-panel">
      <div className="throughput-toolbar">
        <div>
          <p className="throughput-eyebrow">Throughput Analysis</p>
          <h2>{analysis.scenarioLabel}</h2>
          <p className="throughput-meta">
            {analysis.productFamilyLabel ? `Product family: ${analysis.productFamilyLabel}` : "Current scenario"}
          </p>
        </div>
        <div className="throughput-toolbar-actions">
          <button
            type="button"
            className="secondary"
            onClick={onExportSummaryCsv}
            disabled={analysis.hasBlockingErrors}
          >
            Export Summary CSV
          </button>
          <button type="button" className="secondary" onClick={onExportStepCsv}>
            Export Step Costs CSV
          </button>
          <div className={`efficiency-badge efficiency-${analysis.efficiencyStatus}`}>
            <span>Efficiency</span>
            <strong>{analysis.efficiencyLabel}</strong>
          </div>
        </div>
      </div>

      {analysis.validations.length > 0 ? (
        <section className="throughput-validations">
          <h3>Validation</h3>
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
          <h3>Bottleneck Leverage</h3>
          <dl>
            <div>
              <dt>Primary bottleneck</dt>
              <dd>{analysis.summary.primaryBottleneck}</dd>
            </div>
            <div>
              <dt>Next bottleneck</dt>
              <dd>{analysis.summary.nextBottleneck}</dd>
            </div>
            <div>
              <dt>Estimated gain</dt>
              <dd>{formatValue({ key: "estimatedGainUnits", label: "", value: analysis.summary.estimatedGainUnits, format: "number", decimals: 3 })}</dd>
            </div>
            <div>
              <dt>Estimated gain dollars</dt>
              <dd>{formatValue({ key: "estimatedGainDollars", label: "", value: analysis.summary.estimatedGainDollars, format: "currency" })}</dd>
            </div>
          </dl>
        </article>

        <article className="throughput-insights-card">
          <h3>Insights / Actions</h3>
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
          <h3>Summary Analysis</h3>
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
          <h3>Step-Level Cost Breakdown</h3>
          <div className="throughput-table-scroll">
            <table className="throughput-table throughput-steps-table">
              <thead>
                <tr>
                  <th>Step name</th>
                  <th>Material cost / unit</th>
                  <th>Labor rate / hr</th>
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
        <h3>P&amp;L Report</h3>
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
    </section>
  );
}
