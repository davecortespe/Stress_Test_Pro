import type {
  CompiledForecastModel,
  OperationalDiagnosis,
  OperationalSystemStatus,
  SimulationOutput
} from "../types/contracts";

type ScenarioState = Record<string, number | string>;

function num(value: number | string | null | undefined, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function pct(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

function oneDecimal(value: number): string {
  if (value > 0 && value < 1) {
    return value.toFixed(3);
  }
  return value.toFixed(1);
}

function sentence(value: string): string {
  const trimmed = value.trim();
  if (trimmed.endsWith(".")) {
    return trimmed;
  }
  return `${trimmed}.`;
}

function inferMissingFieldsFromAssumptions(
  assumptions: Array<{ severity: "info" | "warning" | "blocker"; text: string }> | undefined
): string[] {
  const missing = new Set<string>();
  for (const assumption of assumptions ?? []) {
    const text = String(assumption?.text ?? "").toLowerCase();
    if (!text) {
      continue;
    }
    const isMissingText = /(not visible|missing|not shown|not provided|cannot be read|unreadable)/.test(text);
    if (!isMissingText) {
      continue;
    }
    if (/(demand|mix|product mix)/.test(text)) {
      missing.add("demand rate/product mix");
    }
    if (/(worker|staff|equipment count)/.test(text)) {
      missing.add("staffing/equipment counts");
    }
    if (/(changeover|c\/o|setup)/.test(text)) {
      missing.add("changeover/setup times");
    }
    if (/(wait|triangle|unit not shown)/.test(text)) {
      missing.add("wait-time units");
    }
    if (/(shift|uptime|availability)/.test(text)) {
      missing.add("shift hours/uptime");
    }
    if (/(parallel)/.test(text)) {
      missing.add("parallel procedures");
    }
    if (/(lot-size|lot size|policy)/.test(text)) {
      missing.add("lot-size policy");
    }
  }
  return [...missing];
}

function getOutgoingStepIds(model: CompiledForecastModel, stepId: string): string[] {
  return model.graph.edges.filter((edge) => edge.from === stepId).map((edge) => edge.to);
}

function classifyStatus(args: {
  throughputGapPct: number;
  brittleness: number;
  bottleneckUtilization: number;
  bottleneckQueueDepth: number;
  queueRisk: number;
  migrationText: string;
  nearSatCount: number;
}): OperationalSystemStatus {
  const {
    throughputGapPct,
    brittleness,
    bottleneckUtilization,
    bottleneckQueueDepth,
    queueRisk,
    migrationText,
    nearSatCount
  } = args;

  if (
    throughputGapPct >= 0.08 ||
    bottleneckUtilization >= 0.99 ||
    (bottleneckQueueDepth >= 6 && queueRisk >= 0.6)
  ) {
    return "overloaded";
  }
  if (
    brittleness >= 0.72 ||
    nearSatCount >= 2 ||
    (migrationText !== "n/a" && !migrationText.includes("no change"))
  ) {
    return "brittle";
  }
  if (throughputGapPct > 0.02 || bottleneckUtilization >= 0.9 || queueRisk >= 0.45) {
    return "stressed";
  }
  return "stable";
}

export function buildOperationalDiagnosis(
  model: CompiledForecastModel,
  output: SimulationOutput,
  scenario: ScenarioState
): OperationalDiagnosis {
  const stepById = new Map(model.stepModels.map((step) => [step.stepId, step]));
  const nodeMetrics = Object.entries(output.nodeMetrics);
  const bottleneckEntry =
    nodeMetrics.find(([, metrics]) => metrics.bottleneckFlag) ??
    nodeMetrics
      .slice()
      .sort((a, b) => (b[1].bottleneckIndex ?? -1) - (a[1].bottleneckIndex ?? -1))[0] ??
    null;

  const bottleneckId = bottleneckEntry?.[0] ?? model.baseline.bottleneckStepId ?? model.stepModels[0]?.stepId ?? "";
  const bottleneckMetrics = bottleneckEntry?.[1] ?? output.nodeMetrics[bottleneckId];
  const bottleneckStep = stepById.get(bottleneckId) ?? null;
  const bottleneckLabel = (bottleneckStep?.label ?? bottleneckId) || "the current bottleneck step";

  const demandRate = Math.max(
    0.01,
    num(model.baseline.demandRatePerHour, 1) * Math.max(0.2, num(scenario.demandMultiplier, 1))
  );
  const throughput = Math.max(0, num(output.globalMetrics.forecastThroughput, 0));
  const throughputGap = Math.max(0, demandRate - throughput);
  const throughputGapPct = demandRate > 0 ? throughputGap / demandRate : 0;
  const totalWip = Math.max(0, num(output.globalMetrics.totalWipQty, 0));
  const bottleneckUtilization = Math.max(0, num(bottleneckMetrics?.utilization, 0));
  const bottleneckQueueDepth = Math.max(0, num(bottleneckMetrics?.queueDepth, 0));
  const bottleneckQueueRisk = Math.max(0, num(bottleneckMetrics?.queueRisk, 0));
  const bottleneckCapacity = Math.max(0, num(bottleneckMetrics?.capacityPerHour, 0));
  const bottleneckIndex = Math.max(0, num(output.globalMetrics.bottleneckIndex, bottleneckMetrics?.bottleneckIndex ?? 0));
  const brittleness = Math.max(0, num(output.globalMetrics.brittleness, 0));
  const leadTime = Math.max(0, num(output.globalMetrics.totalLeadTimeMinutes, 0));
  const waitShare = Math.max(0, num(output.globalMetrics.waitSharePct, 0));
  const throughputDelta = num(output.globalMetrics.throughputDelta, 0);
  const migrationText = String(output.globalMetrics.bottleneckMigration ?? "n/a");
  const nearSatCount = nodeMetrics.filter(([, metrics]) => (metrics.utilization ?? 0) >= 0.9).length;

  const downstreamIds = getOutgoingStepIds(model, bottleneckId);
  const downstreamEntry =
    downstreamIds
      .map((stepId) => [stepId, output.nodeMetrics[stepId]] as const)
      .filter(([, metrics]) => Boolean(metrics))
      .sort((a, b) => (b[1]?.queueRisk ?? -1) - (a[1]?.queueRisk ?? -1))[0] ?? null;
  const downstreamLabel = downstreamEntry ? stepById.get(downstreamEntry[0])?.label ?? downstreamEntry[0] : "";
  const downstreamCongestion =
    (downstreamEntry?.[1]?.queueRisk ?? 0) >= 0.55 || (downstreamEntry?.[1]?.utilization ?? 0) >= 0.92;

  const status = classifyStatus({
    throughputGapPct,
    brittleness,
    bottleneckUtilization,
    bottleneckQueueDepth,
    queueRisk: bottleneckQueueRisk,
    migrationText,
    nearSatCount
  });

  const statusSummaryByType: Record<OperationalSystemStatus, string> = {
    stable: `${bottleneckLabel} is carrying the line without visible queue runaway. Throughput is at or near required rate and the system still has usable operating margin.`,
    stressed: `${bottleneckLabel} is absorbing most of the load and the line is operating with limited margin. It is still moving work, but queue pressure and utilization are high enough that small disruptions will show up quickly.`,
    brittle: `${bottleneckLabel} is not the only issue; the line is unstable. The system is close to the limit, bottleneck pressure is migrating, and normal variation can push work into visible delay.`,
    overloaded: `${bottleneckLabel} is no longer clearing work at the required rate. The system is effectively overloaded, so queue and WIP growth will continue until load is reduced or capacity is added.`
  };

  let primaryConstraint = `${bottleneckLabel} is the current system constraint.`;
  if (downstreamCongestion && downstreamLabel) {
    primaryConstraint = `${bottleneckLabel} is the current constraint, and downstream congestion at ${downstreamLabel} is preventing that queue from clearing cleanly.`;
  } else if (bottleneckUtilization >= 0.98 && bottleneckCapacity > 0) {
    primaryConstraint = `${bottleneckLabel} is saturated; effective service capacity is capped near ${oneDecimal(bottleneckCapacity)} units/hr.`;
  } else if (bottleneckQueueDepth >= 5) {
    primaryConstraint = `${bottleneckLabel} is the active choke point because work is arriving faster than that step can drain its queue.`;
  }

  let constraintMechanism = `${bottleneckLabel} is taking demand at about ${oneDecimal(demandRate)} units/hr but only clearing about ${oneDecimal(Math.max(throughput, bottleneckCapacity || throughput))} units/hr, so arrivals are outrunning service and the queue cannot normalize.`;
  if (downstreamCongestion && downstreamLabel) {
    constraintMechanism = `${bottleneckLabel} is not failing in isolation. ${downstreamLabel} is also congested, so downstream WIP is not clearing fast enough and the blockage propagates back upstream.`;
  } else if (status === "brittle") {
    constraintMechanism = `Average capacity is close to demand, but the operating margin is too thin. Variability and release timing are moving pressure between steps, which makes the line unstable even before average demand formally exceeds average capacity.`;
  } else if (bottleneckCapacity > 0 && demandRate <= bottleneckCapacity && bottleneckQueueRisk >= 0.5) {
    constraintMechanism = `${bottleneckLabel} has enough average capacity on paper, but bunching is compressing work into peaks. That makes the queue spike faster than the step can recover between waves.`;
  }

  const downstreamEffects = sentence(
    [
      throughputGapPct > 0.02
        ? `Throughput is running about ${pct(throughputGapPct, 0)} below required rate`
        : `The line is meeting demand with very little spare capacity`,
      totalWip > 0 ? `WIP has built to roughly ${Math.round(totalWip)} units` : "",
      leadTime > 0 ? `total lead time is now about ${oneDecimal(leadTime)} minutes` : "",
      status !== "stable" ? `and operators should expect more expediting, rescheduling, and service risk if this state persists` : ""
    ]
      .filter(Boolean)
      .join(", ")
  );

  const economicInterpretation = sentence(
    throughputGapPct > 0.02
      ? `This is creating hidden capacity loss of roughly ${pct(throughputGapPct, 0)} versus required output. The likely business impact is overtime pressure, slower inventory availability, and missed throughput that has to be recovered later.`
      : waitShare >= 0.3
        ? `The main cost is delay rather than pure output loss. A large share of lead time is waiting, which ties up WIP, delays availability, and burns labor on chasing flow rather than moving product.`
        : `The immediate economic risk is margin erosion from low operating slack. Small disruptions will convert quickly into labor inefficiency and schedule instability before they show up as a major output miss.`
  );

  let recommendedAction = `Start with the smallest lever at ${bottleneckLabel}: add 1 operator-equivalent or parallel unit during the peak window, then retest the line before considering larger changes.`;
  if (downstreamCongestion && downstreamLabel) {
    recommendedAction = `Stabilize the handoff between ${bottleneckLabel} and ${downstreamLabel} first. Clear downstream WIP before releasing more work, and rebalance labor by queue pressure instead of fixed headcount.`;
  } else if (status === "brittle") {
    recommendedAction = `Smooth releases into ${bottleneckLabel} and rebalance labor by time-of-day rather than average staffing. This is a flow-control problem first, not a software problem.`;
  } else if (bottleneckStep?.ctMinutes && bottleneckStep.ctMinutes > 0) {
    recommendedAction = `Reduce effective cycle time at ${bottleneckLabel} with standard work, faster changeovers, or error removal before spending on larger structural changes.`;
  }

  const scenarioGuidance =
    Math.abs(throughputDelta) >= 0.1
      ? sentence(
          throughputDelta > 0
            ? `The current relief scenario is directionally right. It improves throughput by about ${oneDecimal(throughputDelta)} units/hr, and ${migrationText.includes("no change") ? `the constraint still stays at ${bottleneckLabel}, so more relief may be needed there` : `it also changes bottleneck behavior to ${migrationText}`}.`
            : `The tested relief scenario is not stabilizing the system. It reduces throughput by about ${oneDecimal(Math.abs(throughputDelta))} units/hr, so keep the intervention focused on flow control and cycle-time recovery instead of generic capacity adds.`
        )
      : "Scenario comparison is limited. Current outputs do not show a materially better tested scenario than the active case.";

  const missingSignals: string[] = [];
  if (bottleneckMetrics?.queueDepth == null) {
    missingSignals.push("queue depth");
  }
  if (output.globalMetrics.totalWipQty == null) {
    missingSignals.push("backlog/WIP trend");
  }
  if (!migrationText || migrationText === "n/a") {
    missingSignals.push("bottleneck migration");
  }
  const missingModelFields = inferMissingFieldsFromAssumptions(model.assumptions);
  const totalGaps = missingSignals.length + missingModelFields.length;
  const confidence = totalGaps === 0 ? "high" : totalGaps <= 3 ? "medium" : "low";
  const confidenceNote =
    totalGaps === 0
      ? "High confidence because throughput, queue, WIP, bottleneck, and required model inputs are present."
      : `Confidence is ${confidence} because key inputs are incomplete. Missing or weak fields: ${[
          ...missingSignals,
          ...missingModelFields
        ].join(", ")}.`;

  return {
    status,
    statusSummary: statusSummaryByType[status],
    primaryConstraint,
    constraintMechanism,
    downstreamEffects,
    economicInterpretation,
    recommendedAction,
    scenarioGuidance,
    aiOpportunityLens: {
      dataAlreadyExists:
        "Utilization, queue, WIP, and lead-time data already exist here but are usually reviewed as separate metrics instead of as one flow signal.",
      manualPatternDecisions:
        "Labor rebalance, release timing, and expediting decisions are still manual even though the patterns are repetitive and detectable from the same simulation outputs.",
      predictiveGap:
        "Most current reporting is backward-looking. The diagnosis should be used to flag where the next queue spike or throughput miss is likely before the floor feels it.",
      tribalKnowledge:
        "If step recovery depends on supervisor memory, shift handoff notes, or email threads, that is acting like an unstructured operating database.",
      visibilityGap:
        "When operators cannot see where queue pressure will propagate next, the business leaks profit through avoidable delay, premium labor, and hidden capacity loss."
    },
    confidence,
    confidenceNote
  };
}

export function formatOperationalDiagnosisMarkdown(diagnosis: OperationalDiagnosis): string {
  return [
    "## Operational Diagnosis",
    "",
    `**1. System Status**`,
    diagnosis.statusSummary,
    "",
    `**2. Primary Constraint**`,
    diagnosis.primaryConstraint,
    "",
    `**3. Constraint Mechanism**`,
    diagnosis.constraintMechanism,
    "",
    `**4. Downstream Effects**`,
    diagnosis.downstreamEffects,
    "",
    `**5. Economic Interpretation**`,
    diagnosis.economicInterpretation,
    "",
    `**6. Recommended Action**`,
    diagnosis.recommendedAction,
    "",
    `**7. Scenario Guidance**`,
    diagnosis.scenarioGuidance,
    "",
    `**AI Opportunity Lens**`,
    `- Data already exists but is underused: ${diagnosis.aiOpportunityLens.dataAlreadyExists}`,
    `- Manual but pattern-based decisions: ${diagnosis.aiOpportunityLens.manualPatternDecisions}`,
    `- Backward-looking vs predictive gap: ${diagnosis.aiOpportunityLens.predictiveGap}`,
    `- Tribal knowledge / email as database: ${diagnosis.aiOpportunityLens.tribalKnowledge}`,
    `- Visibility gaps causing profit leakage: ${diagnosis.aiOpportunityLens.visibilityGap}`,
    "",
    `**Confidence**`,
    `${diagnosis.confidence} - ${diagnosis.confidenceNote}`
  ].join("\n");
}
