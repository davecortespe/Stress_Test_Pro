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

function buildFishboneCategory(
  category: KaizenFishboneCategoryKey,
  opportunity: KaizenOpportunity,
  fact: StepFact
): KaizenFishboneCategory {
  const commonLine = `${fact.stepName} currently shows ${pct(fact.utilization)} utilization, ${pct(fact.queueRisk)} queue risk, and ${minutes(fact.leadTimeMinutes)} lead time.`;

  if (category === "manpower") {
    return {
      key: category,
      label: categoryLabel(category),
      headline: "People and staffing may be part of the bottleneck.",
      priorityScore: opportunity.score,
      likelyCauses: [
        commonLine,
        `There are ${fact.workerCount} workers tied to this step, so balancing and cross-training may help more than adding complexity.`,
        `This step has very little extra capacity to absorb variation.`
      ]
    };
  }

  if (category === "machine") {
    return {
      key: category,
      label: categoryLabel(category),
      headline: "Equipment or uptime issues may be causing extra delay.",
      priorityScore: opportunity.score,
      likelyCauses: [
        `Modeled downtime at ${fact.stepName} is ${fixed(fact.downtimePct, 0)}%.`,
        `This step has ${fixed(fact.effectiveUnits, 1)} effective units, so small stops can have a big effect.`,
        `When this step is unstable, queues grow downstream.`
      ]
    };
  }

  if (category === "method") {
    return {
      key: category,
      label: categoryLabel(category),
      headline: "The way work flows may be creating avoidable waiting.",
      priorityScore: opportunity.score,
      likelyCauses: [
        commonLine,
        `Setup or changeover drag is ${minutes(fact.changeoverPenaltyMinutes)} per unit.`,
        `Queue delay at this step is ${minutes(fact.queueDelayMinutes)}.`
      ]
    };
  }

  if (category === "material") {
    return {
      key: category,
      label: categoryLabel(category),
      headline: "Inputs may not be ready when work reaches this step.",
      priorityScore: opportunity.score,
      likelyCauses: [
        `Known wait time before or around ${fact.stepName} is ${minutes(fact.explicitLeadTimeMinutes)}.`,
        `WIP near this step is ${fixed(fact.wipQty, 1)}.`,
        "Inputs can mean materials, information, approvals, or prep work."
      ]
    };
  }

  return {
    key: category,
    label: categoryLabel(category),
    headline: "The team may need better signals to see problems earlier.",
    priorityScore: opportunity.score,
    likelyCauses: [
      `Variation at ${fact.stepName} is ${fixed(fact.variabilityCv, 2)} and there are ${fact.assumptionCount} open assumptions tied to the step.`,
      "Missing time data lowers confidence in the root cause.",
      "Daily control may need clearer trigger points and reason tracking."
    ]
  };
}

export function buildKaizenReport(
  model: CompiledForecastModel,
  scenario: ScenarioState,
  output: SimulationOutput
): KaizenReportResult {
  const facts = buildStepFacts(model, scenario, output);
  const primaryConstraint =
    Object.entries(output.nodeMetrics).find(([, metrics]) => metrics.bottleneckFlag)?.[0] ??
    model.baseline.bottleneckStepId ??
    model.stepModels[0]?.stepId ??
    "";
  const primaryConstraintLabel =
    model.stepModels.find((step) => step.stepId === primaryConstraint)?.label ??
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
      opportunity: buildOpportunity(category, fact, score, primaryConstraintLabel)
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
    .map((entry) => buildFishboneCategory(entry.category, entry.opportunity, entry.fact))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const missingSignals = buildMissingSignals(model);
  const confidence =
    missingSignals.length >= 8 ? "low" : missingSignals.length >= 5 ? "medium" : "high";
  const topOpportunity = topOpportunities[0];

  return {
    scenarioLabel: model.metadata.name || "Current Scenario",
    primaryConstraint: primaryConstraintLabel,
    headline: `${primaryConstraintLabel} is the best place to start, but the biggest win will likely come from fixing the surrounding causes that keep feeding the bottleneck.`,
    practitionerSummary: "This report highlights the best Kaizen opportunities based on where pressure, delay, and instability are showing up in the current forecast.",
    selectionBasis: "The list is based on how busy each step is, how much waiting builds up around it, how unstable it is, and how complete the data is.",
    confidence,
    topOpportunities,
    fishboneCategories,
    missingSignals,
    kpiSummary: {
      topOpportunity: topOpportunity?.stepName ?? primaryConstraintLabel,
      topOpportunityScore: topOpportunity?.score ?? 0,
      opportunityCount: topOpportunities.length,
      fishboneFocus: categoryLabel(topOpportunity?.fishboneCategory ?? "method"),
      missingSignalsCount: missingSignals.length
    }
  };
}
