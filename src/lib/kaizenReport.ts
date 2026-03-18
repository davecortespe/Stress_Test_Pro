import { createConstraintForecast } from "./bottleneckForecast";
import { stepScenarioKey, toNumber, type ScenarioState } from "../simulator/scenarioState";
import type {
  CompiledForecastModel,
  KaizenFishboneCategory,
  KaizenFishboneCategoryKey,
  KaizenOpportunity,
  KaizenReportResult,
  SimulationOutput
} from "../types/contracts";

interface StepFact {
  stepId: string;
  stepName: string;
  utilization: number | null;
  queueRisk: number | null;
  bottleneckIndex: number | null;
  leadTimeMinutes: number | null;
  explicitLeadTimeMinutes: number | null;
  queueDelayMinutes: number | null;
  wipQty: number | null;
  variabilityCv: number;
  changeoverPenaltyMinutes: number;
  workerCount: number;
  effectiveUnits: number | null;
  headroom: number | null;
  downtimePct: number;
  missingCt: boolean;
  missingLeadTime: boolean;
  assumptionCount: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pct(value: number | null | undefined, digits = 0): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }
  return `${(value * 100).toFixed(digits)}%`;
}

function fixed(value: number | null | undefined, digits = 1): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }
  return value.toFixed(digits);
}

function minutes(value: number | null | undefined, digits = 1): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }
  return `${value.toFixed(digits)} min`;
}

function confidenceForStep(fact: StepFact): "high" | "medium" | "low" {
  if (fact.missingCt && fact.missingLeadTime) {
    return "low";
  }
  if (fact.missingCt || fact.missingLeadTime || fact.assumptionCount > 1) {
    return "medium";
  }
  return "high";
}

function categoryLabel(category: KaizenFishboneCategoryKey): string {
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

function normalizedStepAssumptionCount(model: CompiledForecastModel, stepId: string, stepName: string): number {
  const loweredId = stepId.toLowerCase();
  const loweredName = stepName.toLowerCase();
  return model.assumptions.reduce((count, assumption) => {
    const text = assumption.text.toLowerCase();
    return text.includes(loweredId) || text.includes(loweredName) ? count + 1 : count;
  }, 0);
}

function buildMissingSignals(model: CompiledForecastModel): string[] {
  const signals: string[] = [];

  model.stepModels.forEach((step) => {
    if (step.ctMinutes === null) {
      signals.push(`${step.label}: process time is missing.`);
    }
    if (step.leadTimeMinutes === null) {
      signals.push(`${step.label}: wait or lead-time data is missing.`);
    }
  });

  model.assumptions.forEach((assumption) => {
    if (assumption.severity === "warning" || assumption.severity === "blocker") {
      signals.push(assumption.text);
    }
  });

  return signals.slice(0, 8);
}

function buildStepFacts(
  model: CompiledForecastModel,
  scenario: ScenarioState,
  output: SimulationOutput
): StepFact[] {
  const constraint = createConstraintForecast(model, scenario);
  const globalDowntimePct = clamp(toNumber(scenario.unplannedDowntimePct, 7), 0, 95);

  return model.stepModels.map((step) => {
    const baselineEval = constraint.baseline.stepEvals[step.stepId];
    const nodeMetrics = output.nodeMetrics[step.stepId];
    const stepDowntimePct = clamp(
      toNumber(scenario[stepScenarioKey(step.stepId, "downtimePct")], globalDowntimePct),
      0,
      95
    );

    return {
      stepId: step.stepId,
      stepName: step.label,
      utilization: nodeMetrics?.utilization ?? baselineEval?.utilization ?? null,
      queueRisk: nodeMetrics?.queueRisk ?? baselineEval?.queueRisk ?? null,
      bottleneckIndex: nodeMetrics?.bottleneckIndex ?? baselineEval?.bottleneckIndex ?? null,
      leadTimeMinutes: nodeMetrics?.leadTimeMinutes ?? baselineEval?.stepLeadTimeMinutes ?? null,
      explicitLeadTimeMinutes: baselineEval?.explicitLeadTimeMinutes ?? null,
      queueDelayMinutes: baselineEval?.queueDelayMinutes ?? null,
      wipQty: nodeMetrics?.wipQty ?? baselineEval?.wipQty ?? null,
      variabilityCv: step.variabilityCv ?? 0,
      changeoverPenaltyMinutes: Math.max(0, step.changeoverPenaltyPerUnitMinutes ?? 0),
      workerCount: Math.max(1, step.workerCount ?? 1),
      effectiveUnits: baselineEval?.effectiveUnits ?? step.effectiveUnits ?? null,
      headroom: nodeMetrics?.headroom ?? baselineEval?.headroom ?? null,
      downtimePct: stepDowntimePct,
      missingCt: step.ctMinutes === null,
      missingLeadTime: step.leadTimeMinutes === null,
      assumptionCount: normalizedStepAssumptionCount(model, step.stepId, step.label)
    };
  });
}

function maxKnown(values: Array<number | null | undefined>, fallback = 1): number {
  const maxValue = values.reduce<number>((max, value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return max;
    }
    return Math.max(max, value);
  }, 0);
  return maxValue > 0 ? maxValue : fallback;
}

function normalized(value: number | null | undefined, maxValue: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || maxValue <= 0) {
    return 0;
  }
  return clamp(value / maxValue, 0, 1);
}

function opportunityScoreByCategory(category: KaizenFishboneCategoryKey, fact: StepFact, maxima: {
  maxLeadTime: number;
  maxExplicitLeadTime: number;
  maxWip: number;
  maxVariability: number;
  maxChangeover: number;
}): number {
  const util = clamp(fact.utilization ?? 0, 0, 1.25) / 1.25;
  const queue = clamp(fact.queueRisk ?? 0, 0, 1);
  const bottleneck = clamp(fact.bottleneckIndex ?? 0, 0, 1);
  const headroomLoss = 1 - clamp(fact.headroom ?? 0, 0, 1);
  const leadTime = normalized(fact.leadTimeMinutes, maxima.maxLeadTime);
  const explicitLead = normalized(fact.explicitLeadTimeMinutes, maxima.maxExplicitLeadTime);
  const wip = normalized(fact.wipQty, maxima.maxWip);
  const variability = normalized(fact.variabilityCv, maxima.maxVariability);
  const changeover = normalized(fact.changeoverPenaltyMinutes, maxima.maxChangeover);
  const downtime = clamp(fact.downtimePct / 100, 0, 1);
  const staffingComplexity = clamp(fact.workerCount / 5, 0, 1);
  const lowUnitPenalty =
    typeof fact.effectiveUnits === "number" && Number.isFinite(fact.effectiveUnits)
      ? clamp(1 / Math.max(1, fact.effectiveUnits), 0, 1)
      : 0.5;
  const measurementGap = clamp(
    (fact.missingCt ? 0.55 : 0) + (fact.missingLeadTime ? 0.35 : 0) + Math.min(0.25, fact.assumptionCount * 0.08),
    0,
    1
  );

  if (category === "manpower") {
    return 100 * (0.36 * bottleneck + 0.24 * util + 0.16 * queue + 0.14 * headroomLoss + 0.10 * staffingComplexity);
  }
  if (category === "machine") {
    return 100 * (0.34 * downtime + 0.30 * bottleneck + 0.16 * queue + 0.12 * lowUnitPenalty + 0.08 * wip);
  }
  if (category === "method") {
    return 100 * (0.28 * queue + 0.24 * leadTime + 0.20 * bottleneck + 0.16 * changeover + 0.12 * wip);
  }
  if (category === "material") {
    return 100 * (0.38 * explicitLead + 0.24 * leadTime + 0.18 * queue + 0.12 * wip + 0.08 * bottleneck);
  }
  return 100 * (0.38 * measurementGap + 0.24 * variability + 0.18 * queue + 0.12 * leadTime + 0.08 * bottleneck);
}

function fallbackFact(facts: StepFact[], primaryConstraint: string): StepFact {
  return (
    facts.find((fact) => fact.stepName === primaryConstraint) ??
    facts[0]
  );
}

function topFactForCategory(
  category: KaizenFishboneCategoryKey,
  facts: StepFact[],
  maxima: {
    maxLeadTime: number;
    maxExplicitLeadTime: number;
    maxWip: number;
    maxVariability: number;
    maxChangeover: number;
  },
  primaryConstraint: string
): { fact: StepFact; score: number } {
  const ranked = facts
    .map((fact) => ({
      fact,
      score: opportunityScoreByCategory(category, fact, maxima)
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0] ?? { fact: fallbackFact(facts, primaryConstraint), score: 0 };
}

function buildOpportunity(
  category: KaizenFishboneCategoryKey,
  fact: StepFact,
  score: number,
  primaryConstraint: string
): KaizenOpportunity {
  const baseEvidence = {
    utilization: fact.utilization,
    queueRisk: fact.queueRisk,
    bottleneckIndex: fact.bottleneckIndex,
    leadTimeMinutes: fact.leadTimeMinutes,
    wipQty: fact.wipQty,
    downtimePct: fact.downtimePct,
    variabilityCv: fact.variabilityCv
  };

  if (category === "manpower") {
    return {
      rank: 0,
      fishboneCategory: category,
      stepId: fact.stepId,
      stepName: fact.stepName,
      title: `Rebalance staffing and standard work at ${fact.stepName}`,
      score,
      rationale: `${fact.stepName} is very busy at ${pct(fact.utilization)} utilization, has ${pct(fact.queueRisk)} queue pressure, and has very little extra capacity left.`,
      likelyRootCause: "The work may not be balanced well across people, and the team may be relying too much on workarounds instead of a clear standard process.",
      expectedImpact: `If this step is easier to staff and run, the line should have more breathing room around ${primaryConstraint}.`,
      recommendedEvent: `Run a Kaizen event at ${fact.stepName} focused on staffing balance, cross-training, clearer roles, and better handoffs.`,
      confidence: confidenceForStep(fact),
      evidence: baseEvidence
    };
  }

  if (category === "machine") {
    return {
      rank: 0,
      fishboneCategory: category,
      stepId: fact.stepId,
      stepName: fact.stepName,
      title: `Stabilize reliability and usable capacity at ${fact.stepName}`,
      score,
      rationale: `${fact.stepName} is losing time to downtime and is already under heavy pressure, so every interruption quickly turns into more waiting.`,
      likelyRootCause: "The step may be stopping too often, taking too long to recover, or not having enough usable capacity when demand peaks.",
      expectedImpact: "Better uptime here should reduce queue build-up and make the rest of the line more stable.",
      recommendedEvent: `Run a Kaizen event at ${fact.stepName} focused on downtime causes, faster recovery, and small capacity fixes.`,
      confidence: confidenceForStep(fact),
      evidence: baseEvidence
    };
  }

  if (category === "method") {
    return {
      rank: 0,
      fishboneCategory: category,
      stepId: fact.stepId,
      stepName: fact.stepName,
      title: `Compress queue, sequencing, and flow method at ${fact.stepName}`,
      score,
      rationale: `${fact.stepName} has long delay, high queue pressure, and extra setup drag, which usually means the way work is flowing is creating waste.`,
      likelyRootCause: "The step may be batching too much, sequencing work poorly, or using different methods depending on who is working.",
      expectedImpact: "Cleaning up the work method here should lower WIP, shorten delay, and reduce downstream disruption.",
      recommendedEvent: `Run a Kaizen event at ${fact.stepName} focused on flow rules, WIP limits, setup reduction, and simpler sequencing.`,
      confidence: confidenceForStep(fact),
      evidence: baseEvidence
    };
  }

  if (category === "material") {
    return {
      rank: 0,
      fishboneCategory: category,
      stepId: fact.stepId,
      stepName: fact.stepName,
      title: `Improve input readiness before ${fact.stepName}`,
      score,
      rationale: `${fact.stepName} is spending too much time waiting for needed inputs, and WIP is piling up around it.`,
      likelyRootCause: "Work may be getting released before materials, information, approvals, or prep work are fully ready.",
      expectedImpact: "Better readiness should reduce waiting before work starts and lower the amount of work stuck in the queue.",
      recommendedEvent: `Run a Kaizen event around ${fact.stepName} to improve release rules, readiness checks, and input completeness.`,
      confidence: confidenceForStep(fact),
      evidence: baseEvidence
    };
  }

  return {
    rank: 0,
    fishboneCategory: category,
    stepId: fact.stepId,
    stepName: fact.stepName,
    title: `Tighten measurement and trigger discipline at ${fact.stepName}`,
    score,
    rationale: `${fact.stepName} has uneven performance and some missing assumptions, so it is hard to tell early when the step is starting to slip.`,
    likelyRootCause: "The team may not have clear enough signals for queue growth, variation, and when to step in.",
    expectedImpact: "Better measurement should help the team spot problems sooner and make future Kaizen work more accurate.",
    recommendedEvent: `Run a Kaizen event at ${fact.stepName} to improve daily control signals, trigger points, and reason codes.`,
    confidence: confidenceForStep(fact),
    evidence: baseEvidence
  };
}

function impactFactorByCategory(category: KaizenFishboneCategoryKey): {
  queue: number;
  leadTime: number;
  throughput: number;
  stabilityEffect: string;
} {
  switch (category) {
    case "manpower":
      return {
        queue: 0.24,
        leadTime: 0.12,
        throughput: 0.58,
        stabilityEffect: "Reduces staffing-driven queue spikes and handoff starvation."
      };
    case "machine":
      return {
        queue: 0.28,
        leadTime: 0.14,
        throughput: 0.62,
        stabilityEffect: "Removes stop-start behavior that keeps the bottleneck pinned."
      };
    case "method":
      return {
        queue: 0.3,
        leadTime: 0.18,
        throughput: 0.52,
        stabilityEffect: "Cuts bunching, re-sequencing, and migration between near-constraints."
      };
    case "material":
      return {
        queue: 0.22,
        leadTime: 0.16,
        throughput: 0.42,
        stabilityEffect: "Reduces blocked waiting and keeps work release synchronized to readiness."
      };
    case "measurement":
      return {
        queue: 0.14,
        leadTime: 0.08,
        throughput: 0.24,
        stabilityEffect: "Improves early intervention so queues are corrected before they cascade."
      };
    default:
      return {
        queue: 0.2,
        leadTime: 0.1,
        throughput: 0.3,
        stabilityEffect: "Improves control around the active constraint."
      };
  }
}

function roundMetric(value: number | null, digits = 1): number | null {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function buildObservedCondition(category: KaizenFishboneCategoryKey, fact: StepFact): string {
  if (category === "manpower") {
    return `${fact.stepName} is running at ${pct(fact.utilization)} utilization with ${minutes(fact.queueDelayMinutes)} of queue delay, ${fixed(fact.wipQty, 1)} units of WIP, and ${fact.workerCount} modeled operators. Headroom is ${pct(fact.headroom)}.`;
  }
  if (category === "machine") {
    return `${fact.stepName} is carrying ${pct(fact.utilization)} utilization with ${fixed(fact.downtimePct, 0)}% downtime, ${fixed(fact.effectiveUnits, 1)} effective units, ${minutes(fact.queueDelayMinutes)} of queue delay, and ${fixed(fact.wipQty, 1)} units of WIP.`;
  }
  if (category === "method") {
    return `${fact.stepName} shows ${minutes(fact.changeoverPenaltyMinutes)} of changeover drag per unit, ${minutes(fact.queueDelayMinutes)} of queue delay, ${minutes(fact.leadTimeMinutes)} total lead time, and ${pct(fact.queueRisk)} queue risk.`;
  }
  if (category === "material") {
    return `${fact.stepName} is carrying ${minutes(fact.explicitLeadTimeMinutes)} of explicit wait before work can move, ${fixed(fact.wipQty, 1)} units of WIP, ${minutes(fact.queueDelayMinutes)} of queue delay, and ${pct(fact.queueRisk)} queue risk.`;
  }
  return `${fact.stepName} is showing ${fixed(fact.variabilityCv, 2)} variation, ${pct(fact.queueRisk)} queue risk, ${minutes(fact.leadTimeMinutes)} lead time, and ${fact.assumptionCount} open assumptions${fact.missingCt || fact.missingLeadTime ? " with missing time signals" : ""}.`;
}

function buildFailureModes(category: KaizenFishboneCategoryKey, fact: StepFact): string[] {
  if (category === "manpower") {
    return [
      `Hourly staffing is likely misaligned to arrival peaks, so ${fact.stepName} falls behind during the surge window.`,
      fact.workerCount <= 1
        ? `${fact.stepName} is exposed to single-operator dependence; breaks, coaching, or rework immediately turn into queue growth.`
        : `${fact.stepName} likely has cross-training or role-balance gaps; work waits for the right person instead of flowing.`,
      "Handoff and standard-work differences are probably adding hidden cycle-time loss at the constraint."
    ];
  }
  if (category === "machine") {
    return [
      `Short uptime losses at ${fact.stepName} are likely removing the small amount of capacity margin that still exists.`,
      `Recovery after stops is likely too slow for a step with only ${fixed(fact.effectiveUnits, 1)} effective units.`,
      "The bottleneck is probably experiencing minor stops, changeover stalls, or equipment readiness delays that do not show up as one large failure."
    ];
  }
  if (category === "method") {
    return [
      `Batching and sequencing rules are likely forcing work to wait before ${fact.stepName} can process it.`,
      `Setup discipline is likely weak enough that ${minutes(fact.changeoverPenaltyMinutes)} of changeover drag is converting directly into queue growth.`,
      "Supervisors are probably fighting the queue with expedites instead of a stable release and WIP rule."
    ];
  }
  if (category === "material") {
    return [
      `Jobs are likely being released before material, paperwork, approvals, or upstream prep are fully ready.`,
      `Input shortages or information gaps are likely causing stop-start flow at ${fact.stepName} rather than steady feed.`,
      "Queue is probably being created by readiness failures upstream, not only by local process speed."
    ];
  }
  return [
    "Queue growth is likely being detected too late because reason codes, trigger thresholds, or live control charts are weak or missing.",
    fact.missingCt || fact.missingLeadTime
      ? "Critical time signals are missing, so the team is likely debating symptoms instead of confirming the actual mechanism."
      : "Signals may exist, but the floor likely does not have a tight trigger for when to intervene before the queue runs away.",
    "Variation is high enough that average metrics are hiding the moment the line becomes unstable."
  ];
}

function buildCauseEffectChain(
  category: KaizenFishboneCategoryKey,
  fact: StepFact,
  primaryConstraintLabel: string,
  isDirectConstraint: boolean
): string {
  const constraintPhrase = isDirectConstraint
    ? `${fact.stepName} stays pinned as the system bottleneck`
    : `${fact.stepName} feeds instability into ${primaryConstraintLabel}, which keeps the system bottleneck from recovering`;

  if (category === "manpower") {
    return `When coverage or role balance slips at ${fact.stepName}, effective service rate drops below arrivals. Queue delay rises to ${minutes(fact.queueDelayMinutes)} and WIP builds to ${fixed(fact.wipQty, 1)} units, so ${constraintPhrase}.`;
  }
  if (category === "machine") {
    return `Each uptime loss at ${fact.stepName} removes capacity from a step already running at ${pct(fact.utilization)} utilization. Because there are only ${fixed(fact.effectiveUnits, 1)} effective units, even short stops expand the queue quickly and ${constraintPhrase}.`;
  }
  if (category === "method") {
    return `Changeovers, batching, and weak release rules add non-value time before units clear ${fact.stepName}. That inflates queue delay to ${minutes(fact.queueDelayMinutes)}, stretches lead time to ${minutes(fact.leadTimeMinutes)}, and ${constraintPhrase}.`;
  }
  if (category === "material") {
    return `If work reaches ${fact.stepName} before inputs are ready, the step alternates between waiting and surging. That creates hidden starvation and then queue spikes, which leaves ${fixed(fact.wipQty, 1)} units trapped in front of the bottleneck and ${constraintPhrase}.`;
  }
  return `Without timely signals, the floor reacts after queue growth is already visible instead of when variation first appears. The line then carries ${pct(fact.queueRisk)} queue risk and ${minutes(fact.leadTimeMinutes)} lead time before anyone intervenes, so ${constraintPhrase}.`;
}

function buildAuditChecks(
  category: KaizenFishboneCategoryKey,
  fact: StepFact
): KaizenFishboneCategory["auditChecks"] {
  if (category === "manpower") {
    return [
      {
        check: `Compare scheduled versus actual headcount by hour at ${fact.stepName} for the last 5 shifts.`,
        source: "shift roster, time clock, labor-move log",
        successSignal: "Peak arrival windows have full coverage and no repeated break or absence gaps."
      },
      {
        check: `Observe one full cycle at ${fact.stepName} and count wait-for-person events, handoffs, and role interruptions.`,
        source: "floor observation, supervisor notes",
        successSignal: "Operators can complete the cycle without waiting for another person or role approval."
      },
      {
        check: `Review cross-training and relief coverage for ${fact.stepName}.`,
        source: "skills matrix, relief assignment sheet",
        successSignal: "At least one trained backup can cover the constraint during breaks, meetings, and troubleshooting."
      }
    ];
  }
  if (category === "machine") {
    return [
      {
        check: `Pull stop logs for ${fact.stepName} and sort downtime by cause and duration.`,
        source: "downtime log, CMMS, machine event history",
        successSignal: "Top stop causes and recovery times are known by shift and by operator."
      },
      {
        check: `Verify actual available units versus planned units at ${fact.stepName}.`,
        source: "equipment schedule, maintenance status board",
        successSignal: "All modeled units are truly available during the peak load window."
      },
      {
        check: `Watch two recoveries from a stop and time restart-to-first-good-unit.`,
        source: "floor observation, line lead timing",
        successSignal: "Recovery is repeatable and does not create extended restart lag."
      }
    ];
  }
  if (category === "method") {
    return [
      {
        check: `Review the actual dispatching and batching rule used at ${fact.stepName} during the last 3 shifts.`,
        source: "schedule board, ERP/MES queue, supervisor notes",
        successSignal: "Work is sequenced by a stable rule instead of repeated expedites."
      },
      {
        check: `Time changeovers and compare actual versus standard at ${fact.stepName}.`,
        source: "setup log, observation sheet",
        successSignal: "Changeover loss is within standard and not drifting by team or product family."
      },
      {
        check: `Measure queue age in front of ${fact.stepName}, not just queue count.`,
        source: "WIP board, timestamps in system",
        successSignal: "Older jobs are not repeatedly bypassed while new work is released."
      }
    ];
  }
  if (category === "material") {
    return [
      {
        check: `Audit the last 10 jobs released to ${fact.stepName} for missing materials, paperwork, approvals, or prep.`,
        source: "job packet, ERP/MES release record, traveler",
        successSignal: "Jobs are released only when all required inputs are complete."
      },
      {
        check: `Compare explicit wait before ${fact.stepName} with upstream completion timestamps.`,
        source: "system timestamps, staging log",
        successSignal: "Upstream completion and downstream readiness are synchronized, with no repeated hold time."
      },
      {
        check: `Walk the queue physically and confirm whether queued work is truly ready to run.`,
        source: "floor observation, material staging area",
        successSignal: "Queued jobs are executable now, not waiting on hidden readiness issues."
      }
    ];
  }
  return [
    {
      check: `Verify whether ${fact.stepName} has live queue, WIP, downtime, and variation triggers visible to the floor.`,
      source: "tier board, dashboard, shift huddle sheet",
      successSignal: "The team can see the queue turning bad before the bottleneck is fully saturated."
    },
    {
      check: `Review the last 5 escalations and confirm whether the first signal was measured or anecdotal.`,
      source: "escalation log, supervisor notes",
      successSignal: "Most interventions are triggered by data, not by late visual backlog discovery."
    },
    {
      check: `Close missing CT/LT assumptions tied to ${fact.stepName}.`,
      source: "VSM data set, time study, ERP/MES timestamps",
      successSignal: "The constraint mechanism can be explained with measured times instead of defaults."
    }
  ];
}

function buildTargetedFixes(category: KaizenFishboneCategoryKey, fact: StepFact): string[] {
  if (category === "manpower") {
    return [
      `Move one trained operator-equivalent into ${fact.stepName} during the peak arrival window before adding broader labor.`,
      `Standardize the handoff at ${fact.stepName} so the operator does not wait on role clarification or approvals.`,
      "Create explicit relief coverage for breaks, troubleshooting, and short absences at the constraint."
    ];
  }
  if (category === "machine") {
    return [
      `Attack the top downtime cause at ${fact.stepName} first and shorten restart-to-first-good-unit.`,
      `Protect one unit at ${fact.stepName} from non-critical interruptions during the peak queue window.`,
      "Pre-stage tools, parts, and settings so minor stops do not become extended capacity loss."
    ];
  }
  if (category === "method") {
    return [
      `Enforce one dispatch rule into ${fact.stepName} and stop re-prioritizing unless the reason is explicit.`,
      `Reduce setup loss at ${fact.stepName} with prep-offline work and family sequencing.`,
      "Set a local WIP cap and queue-age trigger so the line cannot flood the constraint unchecked."
    ];
  }
  if (category === "material") {
    return [
      `Gate release into ${fact.stepName} on material and information readiness, not calendar promise alone.`,
      `Add a short pre-release check for missing paperwork, approvals, or prep that currently creates hidden waiting.`,
      "Separate not-ready jobs from runnable jobs so the queue only contains executable work."
    ];
  }
  return [
    `Add live trigger points for queue age, queue depth, and downtime at ${fact.stepName}.`,
    "Require one reason code whenever work is expedited around the constraint so the true mechanism becomes visible.",
    "Close the highest-impact missing time signals before the next improvement event."
  ];
}

function buildExpectedImpact(
  category: KaizenFishboneCategoryKey,
  fact: StepFact,
  score: number,
  primaryConstraintId: string,
  forecast: ReturnType<typeof createConstraintForecast>
): KaizenFishboneCategory["expectedImpact"] {
  const categoryFactor = impactFactorByCategory(category);
  const isDirectConstraint = fact.stepId === primaryConstraintId;
  const severityFactor = clamp(score / 100, 0.45, 1);
  const relationshipFactor = isDirectConstraint ? 1 : 0.78;
  const recoverableThroughput = Math.max(
    forecast.relief.throughput - forecast.baseline.throughput,
    forecast.baseline.lineDemand - forecast.baseline.throughput,
    forecast.baseline.throughput * 0.03,
    0.1
  );

  return {
    queueReductionMinutes:
      fact.queueDelayMinutes === null
        ? null
        : roundMetric(
            fact.queueDelayMinutes * categoryFactor.queue * severityFactor * relationshipFactor,
            1
          ),
    leadTimeReductionMinutes:
      fact.leadTimeMinutes === null
        ? null
        : roundMetric(
            fact.leadTimeMinutes * categoryFactor.leadTime * severityFactor * relationshipFactor,
            1
          ),
    throughputGainUnitsPerHour: roundMetric(
      recoverableThroughput * categoryFactor.throughput * severityFactor * relationshipFactor,
      2
    ),
    stabilityEffect: categoryFactor.stabilityEffect
  };
}

function buildFishboneCategory(
  category: KaizenFishboneCategoryKey,
  fact: StepFact,
  score: number,
  primaryConstraintId: string,
  primaryConstraintLabel: string,
  forecast: ReturnType<typeof createConstraintForecast>
): KaizenFishboneCategory {
  return {
    key: category,
    label: categoryLabel(category),
    focusStep: fact.stepName,
    priorityScore: score,
    observedCondition: buildObservedCondition(category, fact),
    failureModes: buildFailureModes(category, fact),
    causeEffectChain: buildCauseEffectChain(
      category,
      fact,
      primaryConstraintLabel,
      fact.stepId === primaryConstraintId
    ),
    auditChecks: buildAuditChecks(category, fact),
    targetedFixes: buildTargetedFixes(category, fact),
    expectedImpact: buildExpectedImpact(category, fact, score, primaryConstraintId, forecast),
    confidence: confidenceForStep(fact),
    metrics: {
      utilization: fact.utilization,
      queueRisk: fact.queueRisk,
      queueDelayMinutes: fact.queueDelayMinutes,
      leadTimeMinutes: fact.leadTimeMinutes,
      wipQty: fact.wipQty,
      downtimePct: fact.downtimePct,
      variabilityCv: fact.variabilityCv,
      changeoverPenaltyMinutes: fact.changeoverPenaltyMinutes,
      workerCount: fact.workerCount,
      effectiveUnits: fact.effectiveUnits,
      bottleneckIndex: fact.bottleneckIndex
    }
  };
}

export function buildKaizenReport(
  model: CompiledForecastModel,
  scenario: ScenarioState,
  output: SimulationOutput
): KaizenReportResult {
  const facts = buildStepFacts(model, scenario, output);
  const forecast = createConstraintForecast(model, scenario);
  const primaryConstraintId =
    Object.entries(output.nodeMetrics).find(([, metrics]) => metrics.bottleneckFlag)?.[0] ??
    model.baseline.bottleneckStepId ??
    model.stepModels[0]?.stepId ??
    "";
  const primaryConstraintLabel =
    model.stepModels.find((step) => step.stepId === primaryConstraintId)?.label ??
    output.globalMetrics.leadTimeTopContributor?.toString() ??
    "Current constraint";
  const maxima = {
    maxLeadTime: maxKnown(facts.map((fact) => fact.leadTimeMinutes)),
    maxExplicitLeadTime: maxKnown(facts.map((fact) => fact.explicitLeadTimeMinutes)),
    maxWip: maxKnown(facts.map((fact) => fact.wipQty)),
    maxVariability: maxKnown(facts.map((fact) => fact.variabilityCv)),
    maxChangeover: maxKnown(facts.map((fact) => fact.changeoverPenaltyMinutes))
  };

  const categories: KaizenFishboneCategoryKey[] = [
    "manpower",
    "machine",
    "method",
    "material",
    "measurement"
  ];

  const byCategory = categories.map((category) => {
    const { fact, score } = topFactForCategory(category, facts, maxima, primaryConstraintLabel);
    return {
      category,
      fact,
      score,
      opportunity: buildOpportunity(category, fact, score, primaryConstraintLabel),
      audit: buildFishboneCategory(
        category,
        fact,
        score,
        primaryConstraintId,
        primaryConstraintLabel,
        forecast
      )
    };
  });

  const topOpportunities = byCategory
    .map((entry) => entry.opportunity)
    .sort((a, b) => b.score - a.score)
    .map((opportunity, index) => ({
      ...opportunity,
      rank: index + 1
    }));

  const fishboneCategories = byCategory
    .map((entry) => entry.audit)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const missingSignals = buildMissingSignals(model);
  const confidence =
    missingSignals.length >= 8 ? "low" : missingSignals.length >= 5 ? "medium" : "high";
  const topCategory = fishboneCategories[0];

  return {
    scenarioLabel: model.metadata.name || "Current Scenario",
    primaryConstraint: primaryConstraintLabel,
    headline: `${primaryConstraintLabel} is the active constraint. Use the 5M audit below to verify which mechanism is actually pinning flow before launching a broader Kaizen event.`,
    practitionerSummary:
      "This is a strict Fishbone root-cause audit. Each category states the observed condition, the failure mode to confirm, the floor checks to run, and the smallest fix that should move flow.",
    selectionBasis:
      "Categories are ranked by how strongly their measured signals explain queue growth, lead-time expansion, throughput loss, and instability around the active constraint.",
    confidence,
    topOpportunities,
    fishboneCategories,
    missingSignals,
    kpiSummary: {
      topOpportunity: topCategory?.focusStep ?? primaryConstraintLabel,
      topOpportunityScore: topCategory?.priorityScore ?? 0,
      opportunityCount: fishboneCategories.length,
      fishboneFocus: topCategory?.label ?? categoryLabel("method"),
      missingSignalsCount: missingSignals.length
    }
  };
}
