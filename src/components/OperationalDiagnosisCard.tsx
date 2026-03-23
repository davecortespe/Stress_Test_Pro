import { useRef, useLayoutEffect } from "react";
import type { OperationalDiagnosis } from "../types/contracts";

interface OperationalDiagnosisCardProps {
  diagnosis: OperationalDiagnosis;
  metrics: Record<string, number | string>;
}

function TitleCaseStatus(status: OperationalDiagnosis["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
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

function readNumber(metrics: Record<string, number | string>, key: string): number | null {
  const value = metrics[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function statusTone(status: OperationalDiagnosis["status"]): "danger" | "warning" | "good" {
  if (status === "stable") {
    return "good";
  }
  if (status === "stressed") {
    return "warning";
  }
  return "danger";
}

function confidenceLabel(confidence: OperationalDiagnosis["confidence"]): string {
  if (confidence === "high") {
    return "High";
  }
  if (confidence === "medium") {
    return "Medium";
  }
  return "Low";
}

const HEADLINE_FONT_STEPS = [32, 28, 24, 20];

export function OperationalDiagnosisCard({ diagnosis, metrics }: OperationalDiagnosisCardProps) {
  const pressure = readNumber(metrics, "bottleneckIndex");
  const totalWip = readNumber(metrics, "totalWipQty");
  const totalLeadTimeMinutes = readNumber(metrics, "totalLeadTimeMinutes");
  const totalCompletedLots = readNumber(metrics, "totalCompletedOutputPieces");
  const waitShare = readNumber(metrics, "waitSharePct");
  const bannerTone = statusTone(diagnosis.status);

  // Confidence — deduplicated single-sentence format
  const uniqueFields = [...new Set(diagnosis.missingFields)];
  const confidenceSentence =
    uniqueFields.length > 0
      ? `Confidence: ${confidenceLabel(diagnosis.confidence)}. Key inputs incomplete — missing: ${uniqueFields.join(", ")}.`
      : `Confidence: ${confidenceLabel(diagnosis.confidence)}.`;

  // Output rate health color
  const outputRateColor =
    diagnosis.outputRatePerHour >= diagnosis.demandRatePerHour
      ? "var(--ls-color-success)"
      : "var(--ls-color-danger)";

  // Headline dynamic font scaling
  const headlineRef = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const el = headlineRef.current;
    if (!el) return;
    for (const size of HEADLINE_FONT_STEPS) {
      el.style.fontSize = `${size}px`;
      const lineH = parseFloat(getComputedStyle(el).lineHeight) || size * 1.15;
      if (el.scrollHeight <= lineH * 2 + 4) break;
    }
  }, [diagnosis.primaryConstraint]);
  const kpis = [
    {
      label: "Forecast Output / hr",
      value: `${formatNumber(diagnosis.outputRatePerHour, 1)} units/hr`,
      reference: `Target: >= ${formatNumber(diagnosis.demandRatePerHour, 1)} units/hr`,
      tone:
        diagnosis.outputRatePerHour >= diagnosis.demandRatePerHour
          ? "good"
          : diagnosis.outputRatePerHour >= diagnosis.demandRatePerHour * 0.85
            ? "warning"
            : "danger"
    },
    {
      label: "Constraint Pressure",
      value: `${formatNumber((pressure ?? 0) * 100, 0)}% pressure`,
      reference: "Threshold: < 85% preferred",
      tone: pressure == null ? "neutral" : pressure >= 0.95 ? "danger" : pressure >= 0.85 ? "warning" : "good"
    },
    {
      label: "WIP Load",
      value: `${formatNumber(totalWip ?? 0, 0)} pcs`,
      reference: "Threshold: < 750 pcs preferred",
      tone: totalWip == null ? "neutral" : totalWip >= 1500 ? "danger" : totalWip >= 750 ? "warning" : "good"
    },
    {
      label: "Weighted Lead Time",
      value: `${formatNumber(totalLeadTimeMinutes ?? 0, 0)} min`,
      reference: waitShare != null ? `Delay share: ${formatNumber(waitShare * 100, 0)}%` : "Unit: weighted minutes",
      tone: waitShare == null ? "neutral" : waitShare >= 0.6 ? "danger" : waitShare >= 0.35 ? "warning" : "good"
    },
    {
      label: "Total Completed Lots",
      value: `${formatNumber(totalCompletedLots ?? 0, 1)} pcs`,
      reference: "Unit: cumulative completed pcs",
      tone: "neutral"
    }
  ] as const;
  const opportunityCards = [
    {
      title: "Data already exists but is underused",
      description: diagnosis.aiOpportunityLens.dataAlreadyExists
    },
    {
      title: "Manual but pattern-based decisions",
      description: diagnosis.aiOpportunityLens.manualPatternDecisions
    },
    {
      title: "Backward-looking vs predictive gap",
      description: diagnosis.aiOpportunityLens.predictiveGap
    },
    {
      title: "Tribal knowledge / email as database",
      description: diagnosis.aiOpportunityLens.tribalKnowledge
    },
    {
      title: "Visibility gaps causing profit leakage",
      description: diagnosis.aiOpportunityLens.visibilityGap
    }
  ];

  return (
    <section className={`diagnosis-card diagnosis-${diagnosis.status}`}>
      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">KPI Strip</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>
      <div className="diagnosis-kpi-strip">
        {kpis.map((kpi) => (
          <article key={kpi.label} className={`diagnosis-kpi-card tone-${kpi.tone}`}>
            <h3>{kpi.label}</h3>
            <strong>{kpi.value}</strong>
            <p>{kpi.reference}</p>
          </article>
        ))}
      </div>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Status Banner</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>
      <section className={`diagnosis-status-banner tone-${bannerTone}`}>
        <div className="diagnosis-status-main">
          <div className="diagnosis-status-line">
            <span className={`diagnosis-state-pill tone-${bannerTone}`}>{TitleCaseStatus(diagnosis.status)}</span>
            <p>System diagnosis</p>
          </div>
          <h2 ref={headlineRef}>{clampSentences(diagnosis.primaryConstraint, 1)}</h2>
          <p className="diagnosis-banner-summary">{clampSentences(diagnosis.constraintMechanism, 1)}</p>
          <div className="diagnosis-banner-metrics">
            <span style={{ color: "var(--ls-color-text-muted)" }}>
              Input rate: {formatNumber(diagnosis.demandRatePerHour, 1)} units/hr
            </span>
            <span style={{ color: outputRateColor }}>
              Output rate: {formatNumber(diagnosis.outputRatePerHour, 1)} units/hr
            </span>
          </div>
        </div>
        <div className="diagnosis-banner-confidence">
          <span>Confidence</span>
          <strong>{confidenceLabel(diagnosis.confidence)}</strong>
          <p>{uniqueFields.length > 0 ? `Missing: ${uniqueFields.join(", ")}` : "All key inputs present."}</p>
        </div>
      </section>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Recommended Action</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>
      <section className="diagnosis-action-band">
        <h3>Recommended next move</h3>
        <p>{clampSentences(diagnosis.recommendedAction, 3)}</p>
      </section>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Diagnostic Breakdown</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>
      <div className="diagnosis-grid diagnosis-breakdown-grid">
        <article>
          <h3>System Status</h3>
          <p>{clampSentences(diagnosis.statusSummary, 3)}</p>
        </article>
        <article>
          <h3>Primary Constraint</h3>
          <p>{clampSentences(diagnosis.primaryConstraint, 3)}</p>
        </article>
        <article>
          <h3>Constraint Mechanism</h3>
          <p>{clampSentences(diagnosis.constraintMechanism, 3)}</p>
        </article>
        <article>
          <h3>Downstream Effects</h3>
          <p>{clampSentences(diagnosis.downstreamEffects, 3)}</p>
        </article>
        <article>
          <h3>Economic Interpretation</h3>
          <p>{clampSentences(diagnosis.economicInterpretation, 3)}</p>
        </article>
      </div>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Scenario Guidance</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>
      <article className="diagnosis-scenario">
        <h3>Scenario Guidance</h3>
        <p>{diagnosis.scenarioGuidance}</p>
      </article>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">AI Opportunity Lens</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>
      <div className="diagnosis-opportunity-grid">
        {opportunityCards.map((card, i) => (
          <article
            key={card.title}
            className={[
              "diagnosis-opportunity-card",
              i === opportunityCards.length - 1 && opportunityCards.length % 2 === 1
                ? "diagnosis-opportunity-card--summary"
                : ""
            ].filter(Boolean).join(" ")}
          >
            <h3>{card.title}</h3>
            <p>{clampSentences(card.description, 2)}</p>
          </article>
        ))}
      </div>

      <div className="diagnosis-section-head">
        <p className="diagnosis-eyebrow">Confidence Note</p>
        <span className="diagnosis-section-rule" aria-hidden="true" />
      </div>
      <footer className="diagnosis-confidence-footer">
        {confidenceSentence}
      </footer>
    </section>
  );
}
