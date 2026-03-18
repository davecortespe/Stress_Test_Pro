import type { AssumptionsReportItem, AssumptionsReportResult, CompiledForecastModel } from "../types/contracts";

function categoryForAssumption(text: string): string {
  const lower = text.toLowerCase();
  if (/(worker|staff|equipment count|shift|uptime)/.test(lower)) {
    return "Capacity inputs";
  }
  if (/(demand|mix|lot size)/.test(lower)) {
    return "Demand inputs";
  }
  if (/(lead time|wait)/.test(lower)) {
    return "Time data";
  }
  if (/(variability|queue risk|bottleneck index|brittleness|migration|heuristic)/.test(lower)) {
    return "Forecast logic";
  }
  if (/(changeover|setup)/.test(lower)) {
    return "Setup data";
  }
  return "General setup";
}

function titleForAssumption(text: string): string {
  const lower = text.toLowerCase();
  if (/(worker|staff|equipment count)/.test(lower)) {
    return "Staffing and equipment counts are incomplete";
  }
  if (/(demand rate is not shown|baseline demandrateperhour is seeded)/.test(lower)) {
    return "Demand was estimated";
  }
  if (/(demand rate, product mix, lot size, shift hours, and uptime)/.test(lower)) {
    return "Several planning inputs are missing";
  }
  if (/(shift calendar|activeshiftcount defaults)/.test(lower)) {
    return "Shift schedule was defaulted";
  }
  if (/(variability.*defaults)/.test(lower)) {
    return "Variability was defaulted";
  }
  if (/(lot-size fallback|lot size)/.test(lower)) {
    return "Lot size was assumed for setup math";
  }
  if (/(lead time.*transcribed|wait\/flow-delay)/.test(lower)) {
    return "Lead time was taken from the VSM image";
  }
  if (/(heuristics|rapid recompute)/.test(lower)) {
    return "Some risk signals are heuristic";
  }
  return "Model assumption";
}

function plainLanguageForAssumption(text: string): string {
  const lower = text.toLowerCase();
  if (/(worker|staff|equipment count)/.test(lower)) {
    return "The model does not know the real staffing or equipment counts for every step.";
  }
  if (/(demand rate is not shown|baseline demandrateperhour is seeded)/.test(lower)) {
    return "The incoming demand level was estimated instead of read from confirmed planning data.";
  }
  if (/(demand rate, product mix, lot size, shift hours, and uptime)/.test(lower)) {
    return "Important planning inputs were not visible in the source, so the model had to fill gaps.";
  }
  if (/(shift calendar|activeshiftcount defaults)/.test(lower)) {
    return "The model assumes a default shift pattern unless you override it.";
  }
  if (/(variability.*defaults)/.test(lower)) {
    return "The model uses a standard variability setting rather than measured variation from the process.";
  }
  if (/(lot-size fallback|lot size)/.test(lower)) {
    return "Setup impact per unit was estimated because the actual lot size was not available.";
  }
  if (/(lead time.*transcribed|wait\/flow-delay)/.test(lower)) {
    return "Lead-time values came directly from the VSM image and were treated as waiting or delay time.";
  }
  if (/(heuristics|rapid recompute)/.test(lower)) {
    return "Some risk scores are fast forecast indicators, not detailed simulation physics.";
  }
  return text;
}

function whyItMattersForAssumption(text: string): string {
  const lower = text.toLowerCase();
  if (/(worker|staff|equipment count)/.test(lower)) {
    return "Capacity and bottleneck advice can shift once the true resource counts are known.";
  }
  if (/(demand|mix)/.test(lower)) {
    return "If demand or mix is wrong, the model can point to the wrong constraint or overstate risk.";
  }
  if (/(shift|uptime)/.test(lower)) {
    return "Operating time assumptions directly change available capacity and queue build-up.";
  }
  if (/(variability)/.test(lower)) {
    return "Queue growth and brittleness are very sensitive to real-world variability.";
  }
  if (/(lot size|changeover|setup)/.test(lower)) {
    return "Setup losses can be under- or over-estimated without the actual batch policy.";
  }
  if (/(heuristics|queue risk|bottleneck index|brittleness|migration)/.test(lower)) {
    return "These indicators are useful for screening, but they should not be treated like precise predictions.";
  }
  return "This assumption changes how much confidence you should place in the final recommendation.";
}

function recommendedCheckForAssumption(text: string): string {
  const lower = text.toLowerCase();
  if (/(worker|staff|equipment count)/.test(lower)) {
    return "Confirm the actual headcount, parallel units, and usable equipment at the constrained steps.";
  }
  if (/(demand rate is not shown|baseline demandrateperhour is seeded)/.test(lower)) {
    return "Replace the estimated demand with the real hourly or daily demand plan.";
  }
  if (/(demand rate, product mix, lot size, shift hours, and uptime)/.test(lower)) {
    return "Fill in the missing planning inputs before using the report for commitments or budget decisions.";
  }
  if (/(shift calendar|activeshiftcount defaults)/.test(lower)) {
    return "Set the real number of operating shifts for this line.";
  }
  if (/(variability.*defaults)/.test(lower)) {
    return "Use measured cycle-time variation if it exists.";
  }
  if (/(lot-size fallback|lot size)/.test(lower)) {
    return "Enter the normal batch or lot size used for setup and changeover decisions.";
  }
  if (/(heuristics|queue risk|bottleneck index|brittleness|migration)/.test(lower)) {
    return "Use these signals to focus discussion, then validate the conclusion with floor knowledge or scenario testing.";
  }
  return "Review and confirm this assumption with the process owner.";
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

export function buildAssumptionsReport(model: CompiledForecastModel): AssumptionsReportResult {
  const assumptions = model.assumptions ?? [];
  const items: AssumptionsReportItem[] = assumptions.map((assumption, index) => ({
    id: assumption.id || `assumption-${index + 1}`,
    severity: assumption.severity,
    category: categoryForAssumption(assumption.text),
    title: titleForAssumption(assumption.text),
    plainLanguage: plainLanguageForAssumption(assumption.text),
    whyItMatters: whyItMattersForAssumption(assumption.text),
    recommendedCheck: recommendedCheckForAssumption(assumption.text)
  }));

  const counts = {
    total: items.length,
    info: items.filter((item) => item.severity === "info").length,
    warning: items.filter((item) => item.severity === "warning").length,
    blocker: items.filter((item) => item.severity === "blocker").length
  };

  const trustLevel =
    counts.blocker > 0 ? "low" : counts.warning >= 4 ? "low" : counts.warning >= 2 ? "medium" : "high";

  const safeToUseFor =
    trustLevel === "high"
      ? [
          "Quick bottleneck screening",
          "Internal improvement discussions",
          "Comparing small scenario changes"
        ]
      : trustLevel === "medium"
        ? [
            "Directional prioritization",
            "Early bottleneck discussions",
            "Preparing data-collection follow-up"
          ]
        : [
            "Framing questions for the team",
            "Spotting where more data is needed",
            "Guiding what to validate next"
          ];

  const useCautionFor =
    trustLevel === "high"
      ? ["Final budget approval", "External commitments"]
      : [
          "Final staffing commitments",
          "Budget or ROI decisions",
          "Customer or production promises"
        ];

  const priorityChecks = dedupe(
    items
      .filter((item) => item.severity !== "info")
      .map((item) => item.recommendedCheck)
      .slice(0, 4)
  );

  const headline =
    trustLevel === "high"
      ? "These results are based on a mostly complete model."
      : trustLevel === "medium"
        ? "These results are directionally useful, but some key inputs still need confirmation."
        : "These results should be treated as a first-pass forecast, not a final answer.";

  const summary =
    counts.total === 0
      ? "No model assumptions were recorded for this scenario."
      : trustLevel === "high"
        ? `The model includes ${counts.total} documented assumptions, but most are low-risk context notes rather than major gaps.`
        : trustLevel === "medium"
          ? `The model includes ${counts.total} documented assumptions, including ${counts.warning} that could change the recommendation if they are wrong.`
          : `The model includes ${counts.total} documented assumptions, including ${counts.warning + counts.blocker} high-impact gaps that can materially change the results.`;

  return {
    scenarioLabel: model.metadata.name || "Current Scenario",
    trustLevel,
    headline,
    summary,
    safeToUseFor,
    useCautionFor,
    priorityChecks,
    items,
    counts
  };
}
