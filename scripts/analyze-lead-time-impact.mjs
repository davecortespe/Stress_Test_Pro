import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const compiledPath = path.join(repoRoot, "models", "active", "compiled_forecast_model.json");
const scenariosDir = path.join(repoRoot, "models", "scenarios");
const scenariosPath = path.join(scenariosDir, "lead_time_scenarios.json");
const scenarioResultsPath = path.join(repoRoot, "models", "scenario_results.json");
const sensitivityPath = path.join(repoRoot, "models", "sensitivity.json");
const insightsPath = path.join(repoRoot, "models", "insights.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function toNum(value, fallback = 0) {
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

function pct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function computeLead(model, leadOverrideByStep = {}) {
  const totalsByStep = [];
  let totalLeadTimeMinutes = 0;
  let totalWaitMinutes = 0;
  let topStepId = "";
  let topStepLabel = "n/a";
  let topStepMinutes = -1;

  for (const step of model.stepModels ?? []) {
    const nodeBaseline = model.baseline?.nodeMetrics?.[step.stepId] ?? {};
    const capacity = toNum(nodeBaseline.capacityPerHour, 0);
    const queueDepth = toNum(nodeBaseline.queueDepth, 0);
    const queueDelayMinutes = capacity > 0 ? (queueDepth / capacity) * 60 : 0;
    const processMinutes = Math.max(0, toNum(step.effectiveCtMinutes, toNum(step.ctMinutes, 0)));
    const configuredLeadMinutes = Object.prototype.hasOwnProperty.call(leadOverrideByStep, step.stepId)
      ? toNum(leadOverrideByStep[step.stepId], 0)
      : toNum(step.leadTimeMinutes, 0);
    const totalStepLeadTimeMinutes = processMinutes + queueDelayMinutes + Math.max(0, configuredLeadMinutes);

    totalLeadTimeMinutes += totalStepLeadTimeMinutes;
    totalWaitMinutes += Math.max(0, configuredLeadMinutes);
    if (totalStepLeadTimeMinutes > topStepMinutes) {
      topStepMinutes = totalStepLeadTimeMinutes;
      topStepId = step.stepId;
      topStepLabel = step.label;
    }

    totalsByStep.push({
      stepId: step.stepId,
      label: step.label,
      processMinutes: Number(processMinutes.toFixed(4)),
      queueDelayMinutes: Number(queueDelayMinutes.toFixed(4)),
      leadTimeMinutes: Number(Math.max(0, configuredLeadMinutes).toFixed(4)),
      totalStepLeadTimeMinutes: Number(totalStepLeadTimeMinutes.toFixed(4))
    });
  }

  const waitSharePct = totalLeadTimeMinutes > 0 ? totalWaitMinutes / totalLeadTimeMinutes : 0;
  return {
    totalLeadTimeMinutes: Number(totalLeadTimeMinutes.toFixed(4)),
    totalWaitMinutes: Number(totalWaitMinutes.toFixed(4)),
    waitSharePct: Number(waitSharePct.toFixed(6)),
    leadTimeTopContributor: topStepLabel,
    leadTimeTopStepId: topStepId,
    stepBreakdown: totalsByStep
  };
}

const model = readJson(compiledPath);
fs.mkdirSync(scenariosDir, { recursive: true });

const baseline = computeLead(model, {});
const factors = [0.5, 0.75, 1.25, 1.5];
const scenarioSpecs = [];
const scenarioResults = [];
const sensitivityRows = [];

for (const step of model.stepModels ?? []) {
  const baseLead = Math.max(0, toNum(step.leadTimeMinutes, 0));
  for (const factor of factors) {
    const scenarioId = `lead_${step.stepId}_${String(factor).replace(".", "_")}x`;
    const stepLead = Number((baseLead * factor).toFixed(4));
    scenarioSpecs.push({
      scenarioId,
      type: "lead-time-override",
      stepId: step.stepId,
      label: step.label,
      factor,
      leadTimeMinutes: stepLead
    });

    const output = computeLead(model, { [step.stepId]: stepLead });
    scenarioResults.push({
      scenarioId,
      stepId: step.stepId,
      label: step.label,
      factor,
      baselineStepLeadTimeMinutes: baseLead,
      scenarioStepLeadTimeMinutes: stepLead,
      baselineTotalLeadTimeMinutes: baseline.totalLeadTimeMinutes,
      scenarioTotalLeadTimeMinutes: output.totalLeadTimeMinutes,
      deltaLeadTimeMinutes: Number((output.totalLeadTimeMinutes - baseline.totalLeadTimeMinutes).toFixed(4)),
      deltaLeadTimePct: Number(
        (
          (output.totalLeadTimeMinutes - baseline.totalLeadTimeMinutes) /
          Math.max(1e-9, baseline.totalLeadTimeMinutes)
        ).toFixed(6)
      ),
      scenarioWaitSharePct: output.waitSharePct,
      leadTimeTopContributor: output.leadTimeTopContributor
    });
  }

  const down25 = scenarioResults.find((row) => row.stepId === step.stepId && row.factor === 0.75);
  const up25 = scenarioResults.find((row) => row.stepId === step.stepId && row.factor === 1.25);
  const elasticity =
    baseLead > 0 && down25 && up25
      ? Number((((Math.abs(down25.deltaLeadTimePct) + Math.abs(up25.deltaLeadTimePct)) / 2) / 0.25).toFixed(6))
      : 0;
  const down50 = scenarioResults.find((row) => row.stepId === step.stepId && row.factor === 0.5);
  sensitivityRows.push({
    stepId: step.stepId,
    label: step.label,
    baselineLeadTimeMinutes: baseLead,
    elasticityVsTotalLeadTime: elasticity,
    deltaMinutesAtMinus50Pct: down50 ? down50.deltaLeadTimeMinutes : 0,
    deltaPctAtMinus50Pct: down50 ? down50.deltaLeadTimePct : 0,
    impactRankScore: Math.abs(down50?.deltaLeadTimeMinutes ?? 0)
  });
}

sensitivityRows.sort((a, b) => b.impactRankScore - a.impactRankScore);

writeJson(scenariosPath, scenarioSpecs);
writeJson(scenarioResultsPath, {
  generatedAt: new Date().toISOString(),
  baseline,
  scenarios: scenarioResults
});
writeJson(sensitivityPath, {
  generatedAt: new Date().toISOString(),
  baseline,
  rows: sensitivityRows
});

const top = sensitivityRows[0];
const second = sensitivityRows[1];
const hasSingleDominant = top && second ? top.impactRankScore > second.impactRankScore * 20 : false;
const insights = [
  "# Lead Time Impact Insights",
  "",
  "## Baseline",
  `- Total lead time: ${baseline.totalLeadTimeMinutes.toFixed(2)} min`,
  `- Wait-time share: ${pct(baseline.waitSharePct)}`,
  `- Top contributor: ${baseline.leadTimeTopContributor}`,
  "",
  "## Sensitivity Ranking (Lead Time -50% at one step)",
  ...sensitivityRows.map(
    (row, index) =>
      `${index + 1}. ${row.label}: ${row.deltaMinutesAtMinus50Pct.toFixed(2)} min (${pct(row.deltaPctAtMinus50Pct)})`
  ),
  "",
  "## Interpretation",
  hasSingleDominant
    ? `- Lead-time behavior is highly concentrated at ${top.label}; reductions there dominate total lead-time improvement.`
    : "- Lead-time behavior is distributed across multiple steps; no single step overwhelmingly dominates.",
  `- Elasticity of ${top?.label ?? "top step"} vs total lead time: ${(top?.elasticityVsTotalLeadTime ?? 0).toFixed(3)}.`,
  "- Steps with null/zero explicit Lead Time show negligible sensitivity until non-zero values are entered.",
  "",
  "## Recommended Next Moves",
  `1. Validate and refine Lead Time entries for currently null steps in the Step Inspector.`,
  `2. Prioritize reduction experiments on ${top?.label ?? "the top-ranked step"} first, then ${second?.label ?? "the next-ranked step"}.`,
  "3. Re-run this analysis after each committed lead-time update to track migration in top contributors."
];
fs.writeFileSync(insightsPath, `${insights.join("\n")}\n`, "utf8");

console.log(`Lead-time analysis written: ${sensitivityPath}`);
console.log(`Insights written: ${insightsPath}`);
