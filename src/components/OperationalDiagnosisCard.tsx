import type { OperationalDiagnosis } from "../types/contracts";

interface OperationalDiagnosisCardProps {
  diagnosis: OperationalDiagnosis;
}

function TitleCaseStatus(status: OperationalDiagnosis["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function OperationalDiagnosisCard({ diagnosis }: OperationalDiagnosisCardProps) {
  return (
    <section className={`diagnosis-card diagnosis-${diagnosis.status}`}>
      <div className="diagnosis-header">
        <div>
          <p className="diagnosis-eyebrow">Operational Diagnosis</p>
          <h2>{TitleCaseStatus(diagnosis.status)}</h2>
        </div>
        <div className="diagnosis-confidence">
          <span>Confidence</span>
          <strong>{diagnosis.confidence}</strong>
        </div>
      </div>

      <div className="diagnosis-grid">
        <article>
          <h3>System Status</h3>
          <p>{diagnosis.statusSummary}</p>
        </article>
        <article>
          <h3>Primary Constraint</h3>
          <p>{diagnosis.primaryConstraint}</p>
        </article>
        <article>
          <h3>Constraint Mechanism</h3>
          <p>{diagnosis.constraintMechanism}</p>
        </article>
        <article>
          <h3>Downstream Effects</h3>
          <p>{diagnosis.downstreamEffects}</p>
        </article>
        <article>
          <h3>Economic Interpretation</h3>
          <p>{diagnosis.economicInterpretation}</p>
        </article>
        <article>
          <h3>Recommended Action</h3>
          <p>{diagnosis.recommendedAction}</p>
        </article>
      </div>

      <article className="diagnosis-scenario">
        <h3>Scenario Guidance</h3>
        <p>{diagnosis.scenarioGuidance}</p>
      </article>

      <div className="diagnosis-opportunity">
        <h3>AI Opportunity Lens</h3>
        <ul>
          <li>
            <strong>Data already exists but is underused:</strong> {diagnosis.aiOpportunityLens.dataAlreadyExists}
          </li>
          <li>
            <strong>Manual but pattern-based decisions:</strong>{" "}
            {diagnosis.aiOpportunityLens.manualPatternDecisions}
          </li>
          <li>
            <strong>Backward-looking vs predictive gap:</strong> {diagnosis.aiOpportunityLens.predictiveGap}
          </li>
          <li>
            <strong>Tribal knowledge / email as database:</strong> {diagnosis.aiOpportunityLens.tribalKnowledge}
          </li>
          <li>
            <strong>Visibility gaps causing profit leakage:</strong> {diagnosis.aiOpportunityLens.visibilityGap}
          </li>
        </ul>
      </div>

      <p className="diagnosis-confidence-note">{diagnosis.confidenceNote}</p>
    </section>
  );
}
