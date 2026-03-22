import type { KaizenFishboneCategory, KaizenOpportunity, KaizenReportResult } from "../types/contracts";

interface KaizenReportPanelProps {
  report: KaizenReportResult;
  onOpenPdf: () => void;
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

function confidenceLabel(confidence: KaizenReportResult["confidence"]): string {
  if (confidence === "high") {
    return "High";
  }
  if (confidence === "medium") {
    return "Medium";
  }
  return "Low";
}

function confidenceTone(confidence: KaizenReportResult["confidence"]): "good" | "warning" | "danger" {
  if (confidence === "high") {
    return "good";
  }
  if (confidence === "medium") {
    return "warning";
  }
  return "danger";
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

function opportunityTone(opportunity: KaizenOpportunity): "good" | "warning" | "danger" {
  if (opportunity.confidence === "low" || opportunity.score >= 8.5) {
    return "danger";
  }
  if (opportunity.score >= 6) {
    return "warning";
  }
  return "good";
}

function summarizeMissingSignals(signals: string[]): string {
  if (signals.length === 0) {
    return "No material gaps noted";
  }
  if (signals.length === 1) {
    return "1 model input needs validation";
  }
  return `${signals.length} model inputs need validation`;
}

export function KaizenReportPanel({ report, onOpenPdf }: KaizenReportPanelProps) {
  const topActions = report.topOpportunities.slice(0, 3);
  const bannerTone = confidenceTone(report.confidence);
  const missingSignalsText = report.missingSignals.length > 0 ? report.missingSignals.join(", ") : "None noted";
  const missingSignalsSummary = summarizeMissingSignals(report.missingSignals);

  return (
    <section className="kaizen-panel">
      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Kaizen Report</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>

      <section className={`kaizen-status-banner tone-${bannerTone}`}>
        <div className="kaizen-status-main">
          <div className="kaizen-status-line">
            <span className={`diagnosis-state-pill tone-${bannerTone}`}>Kaizen</span>
            <p>Fishbone root cause audit</p>
          </div>
          <h2>{report.headline}</h2>
          <p className="kaizen-banner-summary">{report.practitionerSummary}</p>
          <div className="kaizen-banner-metrics">
            <span>Primary constraint: {report.primaryConstraint}</span>
            <span>Leading path: {report.kpiSummary.fishboneFocus}</span>
            <span>Top audit score: {formatScore(report.kpiSummary.topOpportunityScore)}</span>
          </div>
        </div>
        <div className="kaizen-banner-confidence">
          <button type="button" className="secondary" onClick={onOpenPdf}>
            Open Executive PDF
          </button>
          <div className="kaizen-banner-confidence-block">
            <span>Confidence</span>
            <strong>{confidenceLabel(report.confidence)}</strong>
            <p>{missingSignalsSummary}</p>
          </div>
        </div>
      </section>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Recommended Actions</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>

      <section className="kaizen-action-band">
        <div className="kaizen-action-band-copy">
          <h3>Recommended next moves</h3>
          <p>{clampSentences(report.selectionBasis, 2)}</p>
        </div>
        <div className="kaizen-priority-grid">
          {topActions.map((opportunity) => (
            <article
              key={`${opportunity.rank}-${opportunity.title}`}
              className={`kaizen-priority-card tone-${opportunityTone(opportunity)} category-${opportunity.fishboneCategory}`}
            >
              <div className="kaizen-priority-header">
                <div>
                  <p className="kaizen-rank">Priority {opportunity.rank}</p>
                  <h4>{opportunity.title}</h4>
                </div>
                <div className="kaizen-score-badge">
                  <span>Score</span>
                  <strong>{formatScore(opportunity.score)}</strong>
                </div>
              </div>
              <div className="kaizen-priority-meta">
                <span>{opportunity.stepName}</span>
                <span>{opportunity.fishboneCategory}</span>
                <span>Confidence: {confidenceLabel(opportunity.confidence)}</span>
              </div>
              <div className="kaizen-priority-detail">
                <h5>Why now</h5>
                <p>{clampSentences(opportunity.rationale, 2)}</p>
              </div>
              <div className="kaizen-priority-detail">
                <h5>Expected effect</h5>
                <p>{clampSentences(opportunity.expectedImpact, 2)}</p>
              </div>
              <div className="kaizen-priority-detail">
                <h5>Recommended move</h5>
                <p>{clampSentences(opportunity.recommendedEvent, 2)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Audit Framing</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>

      <div className="kaizen-framing-grid">
        <article className="kaizen-framing-card">
          <h3>Constraint read</h3>
          <p>{clampSentences(report.headline, 2)}</p>
        </article>
        <article className="kaizen-framing-card">
          <h3>Ranking logic</h3>
          <p>{clampSentences(report.selectionBasis, 2)}</p>
        </article>
      </div>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Fishbone Evidence</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>

      <article className="throughput-table-card kaizen-evidence-shell">
        <h3>5M diagnostic audit</h3>
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
                    <strong>{formatUnits(category.metrics.wipQty, 1)} pcs</strong>
                  </div>
                  <div>
                    <span>{signal.label}</span>
                    <strong>{signal.value}</strong>
                  </div>
                </div>

                <div className="kaizen-audit-section">
                  <h5>Observed condition</h5>
                  <p>{clampSentences(category.observedCondition, 2)}</p>
                </div>

                <div className="kaizen-audit-section">
                  <h5>Cause and effect</h5>
                  <p>{clampSentences(category.causeEffectChain, 2)}</p>
                </div>

                <div className="kaizen-audit-section">
                  <h5>Audit checks</h5>
                  <ul className="kaizen-check-list">
                    {category.auditChecks.slice(0, 3).map((check) => (
                      <li key={check.check}>
                        <strong>{check.check}</strong>
                        <span>Source: {check.source}</span>
                        <span>Pass: {check.successSignal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="kaizen-audit-section">
                  <h5>Targeted fixes</h5>
                  <ul className="kaizen-audit-list">
                    {category.targetedFixes.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="kaizen-audit-section">
                  <h5>Expected impact</h5>
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
                      <strong>{confidenceLabel(category.confidence)}</strong>
                    </div>
                  </div>
                  <p className="kaizen-impact-note">{clampSentences(category.expectedImpact.stabilityEffect, 2)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </article>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Confidence Note</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>

      <footer className="kaizen-confidence-footer">
        <strong>Confidence: {confidenceLabel(report.confidence)}.</strong>{" "}
        {report.missingSignals.length > 0
          ? `Missing or weak signals: ${missingSignalsText}.`
          : "No material missing signals noted in the current audit set."}
      </footer>
    </section>
  );
}
