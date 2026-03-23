import type { AssumptionsReportResult } from "../types/contracts";

interface AssumptionsReportPanelProps {
  report: AssumptionsReportResult;
}

function trustTone(level: AssumptionsReportResult["trustLevel"]): string {
  if (level === "high") {
    return "efficiency-high";
  }
  if (level === "medium") {
    return "efficiency-medium";
  }
  return "efficiency-low";
}

function severityLabel(severity: "info" | "warning" | "blocker"): string {
  if (severity === "blocker") {
    return "High impact";
  }
  if (severity === "warning") {
    return "Needs review";
  }
  return "FYI";
}

export function AssumptionsReportPanel({ report }: AssumptionsReportPanelProps) {
  return (
    <section className="throughput-panel assumptions-panel">
      <div className="throughput-toolbar">
        <div>
          <p className="throughput-eyebrow">Model Assumptions</p>
          <h2>{report.scenarioLabel}</h2>
          <p className="throughput-meta">{report.summary}</p>
        </div>
        <div className="throughput-toolbar-actions">
          <div className={`efficiency-badge ${trustTone(report.trustLevel)}`}>
            <span>Trust Level</span>
            <strong>{report.trustLevel}</strong>
          </div>
          <div className="efficiency-badge">
            <span>Open Checks</span>
            <strong>{report.priorityChecks.length}</strong>
          </div>
        </div>
      </div>

      <div className="throughput-summary-shell">
        <article className="throughput-hero-card">
          <h3>Quick Read</h3>
          <dl>
            <div>
              <dt>Overall message</dt>
              <dd>{report.headline}</dd>
            </div>
            <div>
              <dt>Total assumptions</dt>
              <dd>{report.counts.total}</dd>
            </div>
            <div>
              <dt>Needs review</dt>
              <dd>{report.counts.warning + report.counts.blocker}</dd>
            </div>
            <div>
              <dt>Safe use today</dt>
              <dd>{report.safeToUseFor[0] ?? "General internal review"}</dd>
            </div>
          </dl>
        </article>

        <article className="throughput-insights-card">
          <h3>How To Use This</h3>
          <div className="throughput-insights-grid">
            <article className="throughput-insight">
              <h4>Safe To Use For</h4>
              <ul className="assumptions-list">
                {report.safeToUseFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="throughput-insight">
              <h4>Use Caution For</h4>
              <ul className="assumptions-list">
                {report.useCautionFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="throughput-insight">
              <h4>Verify First</h4>
              <ul className="assumptions-list">
                {report.priorityChecks.length > 0 ? (
                  report.priorityChecks.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>No urgent checks are open.</li>
                )}
              </ul>
            </article>
          </div>
        </article>
      </div>

      <article className="throughput-table-card assumptions-table-card">
        <h3>Current Model Assumptions</h3>
        <div className="assumptions-card-grid">
          {report.items.map((item) => (
            <article key={item.id} className={`assumption-card severity-${item.severity}`}>
              <div className="assumption-card-header">
                <div>
                  <p className="throughput-eyebrow">{item.category}</p>
                  <h4>{item.title}</h4>
                </div>
                <span className={`assumption-severity severity-${item.severity}`}>{severityLabel(item.severity)}</span>
              </div>
              <p>{item.plainLanguage}</p>
              <div className="kaizen-detail-block">
                <h5>Why it matters</h5>
                <p>{item.whyItMatters}</p>
              </div>
              <div className="kaizen-detail-block">
                <h5>What to check</h5>
                <p>{item.recommendedCheck}</p>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
