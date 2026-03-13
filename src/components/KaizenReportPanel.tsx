import type {
  KaizenFishboneCategory,
  KaizenOpportunity,
  KaizenReportResult
} from "../types/contracts";

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

function categoryLabel(category: KaizenOpportunity["fishboneCategory"] | KaizenFishboneCategory["key"]): string {
  switch (category) {
    case "manpower":
      return "Manpower";
    case "machine":
      return "Machine";
    case "method":
      return "Method";
    case "material":
      return "Material / Information";
    case "measurement":
      return "Measurement";
    default:
      return "Kaizen";
  }
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

export function KaizenReportPanel({ report }: KaizenReportPanelProps) {
  return (
    <section className="throughput-panel kaizen-panel">
      <div className="throughput-toolbar">
        <div>
          <p className="throughput-eyebrow">Kaizen Report</p>
          <h2>{report.scenarioLabel}</h2>
          <p className="throughput-meta">{report.practitionerSummary}</p>
        </div>
        <div className="throughput-toolbar-actions">
          <div className={`efficiency-badge ${confidenceTone(report.confidence)}`}>
            <span>Confidence</span>
            <strong>{report.confidence}</strong>
          </div>
          <div className="efficiency-badge">
            <span>Top Event Score</span>
            <strong>{formatScore(report.kpiSummary.topOpportunityScore)}</strong>
          </div>
        </div>
      </div>

      <div className="throughput-summary-shell">
        <article className="throughput-hero-card">
          <h3>Quick Read</h3>
          <dl>
            <div>
              <dt>Main bottleneck</dt>
              <dd>{report.primaryConstraint}</dd>
            </div>
            <div>
              <dt>Best first Kaizen</dt>
              <dd>{report.topOpportunities[0]?.title ?? "n/a"}</dd>
            </div>
            <div>
              <dt>Main cause area</dt>
              <dd>{report.kpiSummary.fishboneFocus}</dd>
            </div>
            <div>
              <dt>Missing inputs</dt>
              <dd>{report.kpiSummary.missingSignalsCount}</dd>
            </div>
          </dl>
        </article>

        <article className="throughput-insights-card">
          <h3>What This Means</h3>
          <div className="throughput-insights-grid">
            <article className="throughput-insight">
              <h4>Summary</h4>
              <p>{report.headline}</p>
            </article>
            <article className="throughput-insight">
              <h4>Why These Were Picked</h4>
              <p>{report.selectionBasis}</p>
            </article>
          </div>
        </article>
      </div>

      <article className="throughput-table-card">
        <h3>Fishbone Diagram (5M)</h3>
        <div className="kaizen-fishbone-grid">
          {report.fishboneCategories.map((category) => (
            <article key={category.key} className={`kaizen-fishbone-card category-${category.key}`}>
              <div className="kaizen-fishbone-header">
                <p className="throughput-eyebrow">{category.label}</p>
                <strong>{formatScore(category.priorityScore)}</strong>
              </div>
              <h4>{category.headline}</h4>
              <ul>
                {category.likelyCauses.map((cause) => (
                  <li key={cause}>{cause}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </article>

      <article className="throughput-table-card">
        <h3>Top 5 Kaizen Opportunities</h3>
        <div className="kaizen-opportunity-grid">
          {report.topOpportunities.map((opportunity) => (
            <article
              key={`${opportunity.fishboneCategory}-${opportunity.stepId ?? "system"}`}
              className={`kaizen-opportunity-card category-${opportunity.fishboneCategory}`}
            >
              <div className="kaizen-opportunity-header">
                <div>
                  <p className="kaizen-rank">Event {opportunity.rank}</p>
                  <h4>{opportunity.title}</h4>
                </div>
                <div className="kaizen-score-badge">
                  <span>{categoryLabel(opportunity.fishboneCategory)}</span>
                  <strong>{formatScore(opportunity.score)}</strong>
                </div>
              </div>

              <p className="kaizen-copy">{opportunity.rationale}</p>

              <div className="kaizen-evidence-grid">
                <div>
                  <span>Busy</span>
                  <strong>{formatPct(opportunity.evidence.utilization)}</strong>
                </div>
                <div>
                  <span>Queue</span>
                  <strong>{formatPct(opportunity.evidence.queueRisk)}</strong>
                </div>
                <div>
                  <span>Delay</span>
                  <strong>{formatMinutes(opportunity.evidence.leadTimeMinutes)}</strong>
                </div>
                <div>
                  <span>Pressure</span>
                  <strong>{typeof opportunity.evidence.bottleneckIndex === "number" ? opportunity.evidence.bottleneckIndex.toFixed(2) : "--"}</strong>
                </div>
              </div>

              <div className="kaizen-detail-block">
                <h5>Why This Is Happening</h5>
                <p>{opportunity.likelyRootCause}</p>
              </div>
              <div className="kaizen-detail-block">
                <h5>What Gets Better</h5>
                <p>{opportunity.expectedImpact}</p>
              </div>
              <div className="kaizen-detail-block">
                <h5>Suggested Kaizen Event</h5>
                <p>{opportunity.recommendedEvent}</p>
              </div>
            </article>
          ))}
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
