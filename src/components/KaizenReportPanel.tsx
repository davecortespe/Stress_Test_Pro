import type { KaizenFishboneCategory, KaizenReportResult } from "../types/contracts";

interface KaizenReportPanelProps {
  report: KaizenReportResult;
}

function formatScore(score: number): string {
  return score.toFixed(1);
}

function formatPct(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }
  return `${(value * 100).toFixed(0)}%`;
}

function formatMinutes(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }
  return `${value.toFixed(1)} min`;
}

function formatUnits(value: number | null | undefined, digits = 1): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }
  return value.toFixed(digits);
}

function confidenceTone(confidence: KaizenReportResult["confidence"]): string {
  if (confidence === "high") {
    return "efficiency-high";
  }
  if (confidence === "medium") {
    return "efficiency-medium";
  }
  return "efficiency-low";
}

function categorySignal(category: KaizenFishboneCategory): { label: string; value: string } {
  if (category.key === "machine") {
    return {
      label: "Downtime",
      value: `${formatUnits(category.metrics.downtimePct, 0)}%`
    };
  }
  if (category.key === "method") {
    return {
      label: "Changeover",
      value: formatMinutes(category.metrics.changeoverPenaltyMinutes)
    };
  }
  if (category.key === "material") {
    return {
      label: "Queue Risk",
      value: formatPct(category.metrics.queueRisk)
    };
  }
  if (category.key === "measurement") {
    return {
      label: "Variation",
      value: formatUnits(category.metrics.variabilityCv, 2)
    };
  }
  return {
    label: "Operators",
    value: formatUnits(category.metrics.workerCount, 0)
  };
}

export function KaizenReportPanel({ report }: KaizenReportPanelProps) {
  return (
    <section className="throughput-panel kaizen-panel">
      <div className="throughput-toolbar">
        <div>
          <p className="throughput-eyebrow">Fishbone Root Cause Audit</p>
          <h2>{report.scenarioLabel}</h2>
          <p className="throughput-meta">{report.practitionerSummary}</p>
        </div>
        <div className="throughput-toolbar-actions">
          <div className={`efficiency-badge ${confidenceTone(report.confidence)}`}>
            <span>Confidence</span>
            <strong>{report.confidence}</strong>
          </div>
          <div className="efficiency-badge">
            <span>Top Audit Score</span>
            <strong>{formatScore(report.kpiSummary.topOpportunityScore)}</strong>
          </div>
        </div>
      </div>

      <div className="throughput-summary-shell">
        <article className="throughput-hero-card">
          <h3>Constraint Read</h3>
          <dl>
            <div>
              <dt>Primary constraint</dt>
              <dd>{report.primaryConstraint}</dd>
            </div>
            <div>
              <dt>Strongest audit path</dt>
              <dd>{report.kpiSummary.fishboneFocus}</dd>
            </div>
            <div>
              <dt>First step to verify</dt>
              <dd>{report.kpiSummary.topOpportunity}</dd>
            </div>
            <div>
              <dt>Missing signals</dt>
              <dd>{report.kpiSummary.missingSignalsCount}</dd>
            </div>
          </dl>
        </article>

        <article className="throughput-insights-card">
          <h3>Audit Framing</h3>
          <div className="throughput-insights-grid">
            <article className="throughput-insight">
              <h4>Mechanism</h4>
              <p>{report.headline}</p>
            </article>
            <article className="throughput-insight">
              <h4>Ranking logic</h4>
              <p>{report.selectionBasis}</p>
            </article>
          </div>
        </article>
      </div>

      <article className="throughput-table-card">
        <h3>5M Diagnostic Audit</h3>
        <div className="kaizen-fishbone-grid">
          {report.fishboneCategories.map((category) => {
            const signal = categorySignal(category);
            return (
              <article key={category.key} className={`kaizen-fishbone-card category-${category.key}`}>
                <div className="kaizen-fishbone-header">
                  <div>
                    <p className="throughput-eyebrow">{category.label}</p>
                    <h4>{category.focusStep}</h4>
                  </div>
                  <strong>{formatScore(category.priorityScore)}</strong>
                </div>

                <div className="kaizen-audit-metrics">
                  <div>
                    <span>Utilization</span>
                    <strong>{formatPct(category.metrics.utilization)}</strong>
                  </div>
                  <div>
                    <span>Queue Delay</span>
                    <strong>{formatMinutes(category.metrics.queueDelayMinutes)}</strong>
                  </div>
                  <div>
                    <span>WIP</span>
                    <strong>{formatUnits(category.metrics.wipQty, 1)}</strong>
                  </div>
                  <div>
                    <span>{signal.label}</span>
                    <strong>{signal.value}</strong>
                  </div>
                </div>

                <div className="kaizen-audit-section">
                  <h5>Observed Condition</h5>
                  <p>{category.observedCondition}</p>
                </div>

                <div className="kaizen-audit-section">
                  <h5>Failure Modes</h5>
                  <ul className="kaizen-audit-list">
                    {category.failureModes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="kaizen-audit-section">
                  <h5>Cause And Effect</h5>
                  <p>{category.causeEffectChain}</p>
                </div>

                <div className="kaizen-audit-section">
                  <h5>Audit Checks</h5>
                  <ul className="kaizen-check-list">
                    {category.auditChecks.map((check) => (
                      <li key={check.check}>
                        <strong>{check.check}</strong>
                        <span>Source: {check.source}</span>
                        <span>Pass: {check.successSignal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="kaizen-audit-section">
                  <h5>Targeted Fixes</h5>
                  <ul className="kaizen-audit-list">
                    {category.targetedFixes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="kaizen-audit-section">
                  <h5>Expected Impact</h5>
                  <div className="kaizen-impact-grid">
                    <div>
                      <span>Queue</span>
                      <strong>{formatMinutes(category.expectedImpact.queueReductionMinutes)}</strong>
                    </div>
                    <div>
                      <span>Lead Time</span>
                      <strong>{formatMinutes(category.expectedImpact.leadTimeReductionMinutes)}</strong>
                    </div>
                    <div>
                      <span>Throughput</span>
                      <strong>
                        {typeof category.expectedImpact.throughputGainUnitsPerHour === "number"
                          ? `${category.expectedImpact.throughputGainUnitsPerHour.toFixed(2)} /hr`
                          : "--"}
                      </strong>
                    </div>
                    <div>
                      <span>Confidence</span>
                      <strong>{category.confidence}</strong>
                    </div>
                  </div>
                  <p className="kaizen-impact-note">{category.expectedImpact.stabilityEffect}</p>
                </div>
              </article>
            );
          })}
        </div>
      </article>

      {report.missingSignals.length > 0 ? (
        <section className="throughput-validations">
          <h3>Missing Information</h3>
          <ul>
            {report.missingSignals.map((signal) => (
              <li key={signal} className="validation-warning">
                {signal}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
