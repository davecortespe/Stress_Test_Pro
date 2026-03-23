import type { ParameterGroup, ScenarioLibraryEntry, ScenarioSavedMetrics } from "../types/contracts";

type ComparisonTone = "positive" | "alert" | "neutral" | "caution";

interface ComparisonMetricRow {
  key: string;
  label: string;
  valueA: string;
  valueB: string;
  delta: string;
  direction: string;
  tone: ComparisonTone;
}

interface ComparisonGuidance {
  recommended: string;
  why: string;
  tradeoff: string;
  nextStep: string;
}

interface ComparisonReportModel {
  headline: string;
  summary: string;
  metrics: ComparisonMetricRow[];
  guidance: ComparisonGuidance;
  interpretation: string;
  parameterDiffs: Array<{ label: string; valueA: string; valueB: string }>;
  remainingDiffCount: number;
  scenarioAName: string;
  scenarioBName: string;
  generatedAt: string;
  operationName: string;
}

const METRIC_SPECS = [
  { key: "forecastThroughput", label: "Forecast Output / hr", direction: "higher_better", epsilon: 0.05 },
  { key: "totalWipQty", label: "WIP Load", direction: "lower_better", epsilon: 1 },
  { key: "weightedLeadTimeMinutes", label: "Weighted Lead Time", direction: "lower_better", epsilon: 1 },
  { key: "bottleneckIndex", label: "Constraint Pressure", direction: "lower_better", epsilon: 0.005 },
  { key: "activeConstraintName", label: "Active Constraint", direction: "neutral", epsilon: 0 },
  { key: "totalCompletedOutputPieces", label: "Total Completed Lots", direction: "higher_better", epsilon: 1 }
] as const;

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function optionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatNumber(value: number | null, digits = 1): string {
  if (value === null) return "--";
  return value.toFixed(digits);
}

function formatPercent(value: number | null, digits = 0): string {
  if (value === null) return "--";
  return `${(value * 100).toFixed(digits)}%`;
}

function formatLotsFloor(value: unknown): string {
  const parsed = optionalNumber(value);
  if (parsed === null) return "--";
  return `${Math.floor(parsed).toLocaleString()}`;
}

function metricValueLabel(key: string, value: unknown): string {
  const parsed = optionalNumber(value);
  if (key === "forecastThroughput") return parsed === null ? "--" : `${formatNumber(parsed, 2)} /hr`;
  if (key === "totalWipQty") return parsed === null ? "--" : `${formatNumber(parsed, 0)} pcs`;
  if (key === "weightedLeadTimeMinutes") return parsed === null ? "--" : `${formatNumber(parsed, 1)} min`;
  if (key === "bottleneckIndex") return formatPercent(parsed, 0);
  if (key === "totalCompletedOutputPieces") return `${formatLotsFloor(value)} pcs`;
  return clean(value || "--");
}

function toneLabel(tone: ComparisonTone): string {
  if (tone === "positive") return "Better";
  if (tone === "alert") return "Worse";
  if (tone === "caution") return "Shifted";
  return "No material change";
}

function computeMetricRows(entryA: ScenarioLibraryEntry, entryB: ScenarioLibraryEntry): ComparisonMetricRow[] {
  const metricsA = entryA.savedMetrics ?? {};
  const metricsB = entryB.savedMetrics ?? {};

  return METRIC_SPECS.map((spec) => {
    if (spec.key === "activeConstraintName") {
      const valueA = clean((metricsA as Record<string, unknown>)[spec.key] || "--");
      const valueB = clean((metricsB as Record<string, unknown>)[spec.key] || "--");
      const shifted = valueA.toLowerCase() !== valueB.toLowerCase();
      return {
        key: spec.key,
        label: spec.label,
        valueA,
        valueB,
        delta: shifted ? "Shifted" : "Same step",
        direction: shifted ? "Shifted" : "No material change",
        tone: shifted ? "caution" : "neutral"
      };
    }

    const rawA = (metricsA as Record<string, unknown>)[spec.key];
    const rawB = (metricsB as Record<string, unknown>)[spec.key];
    const numericA = optionalNumber(rawA);
    const numericB = optionalNumber(rawB);

    let delta = "No material change";
    let tone: ComparisonTone = "neutral";

    if (numericA !== null && numericB !== null) {
      if (spec.key === "totalCompletedOutputPieces") {
        const deltaLots = Math.floor(numericB) - Math.floor(numericA);
        if (Math.abs(deltaLots) >= spec.epsilon) {
          delta = `${deltaLots > 0 ? "+" : ""}${deltaLots} pcs`;
          tone = spec.direction === "higher_better" && deltaLots > 0 ? "positive" : "alert";
        }
      } else {
        const deltaValue = numericB - numericA;
        if (Math.abs(deltaValue) >= spec.epsilon) {
          if (spec.key === "forecastThroughput") delta = `${deltaValue > 0 ? "+" : ""}${deltaValue.toFixed(2)} /hr`;
          if (spec.key === "totalWipQty") delta = `${deltaValue > 0 ? "+" : ""}${deltaValue.toFixed(0)} pcs`;
          if (spec.key === "weightedLeadTimeMinutes") delta = `${deltaValue > 0 ? "+" : ""}${deltaValue.toFixed(1)} min`;
          if (spec.key === "bottleneckIndex") delta = `${deltaValue > 0 ? "+" : ""}${(deltaValue * 100).toFixed(0)} pts`;

          if (spec.direction === "higher_better") {
            tone = deltaValue > 0 ? "positive" : "alert";
          } else if (spec.direction === "lower_better") {
            tone = deltaValue < 0 ? "positive" : "alert";
          }
        }
      }
    }

    return {
      key: spec.key,
      label: spec.label,
      valueA: metricValueLabel(spec.key, rawA),
      valueB: metricValueLabel(spec.key, rawB),
      delta,
      direction: toneLabel(tone),
      tone
    };
  });
}

function computeVerdict(entryA: ScenarioLibraryEntry, entryB: ScenarioLibraryEntry) {
  const metricsA: Partial<ScenarioSavedMetrics> = entryA.savedMetrics ?? {};
  const metricsB: Partial<ScenarioSavedMetrics> = entryB.savedMetrics ?? {};
  let score = 0;

  const throughputA = optionalNumber(metricsA.forecastThroughput);
  const throughputB = optionalNumber(metricsB.forecastThroughput);
  if (throughputA !== null && throughputB !== null) {
    if (throughputB > throughputA + 0.05) score += 2;
    else if (throughputB < throughputA - 0.05) score -= 2;
  }

  const wipA = optionalNumber(metricsA.totalWipQty);
  const wipB = optionalNumber(metricsB.totalWipQty);
  if (wipA !== null && wipB !== null) {
    if (wipB < wipA - 1) score += 1;
    else if (wipB > wipA + 1) score -= 1;
  }

  const leadA = optionalNumber(metricsA.weightedLeadTimeMinutes);
  const leadB = optionalNumber(metricsB.weightedLeadTimeMinutes);
  if (leadA !== null && leadB !== null) {
    if (leadB < leadA - 1) score += 1;
    else if (leadB > leadA + 1) score -= 1;
  }

  if (score >= 3) return { headline: "Recommend Scenario B", recommended: "B" as const };
  if (score >= 1) return { headline: "Scenario B has the advantage", recommended: "B" as const };
  if (score <= -3) return { headline: "Recommend Scenario A", recommended: "A" as const };
  if (score <= -1) return { headline: "Scenario A has the advantage", recommended: "A" as const };
  return { headline: "No clear advantage between Scenario A and Scenario B", recommended: null };
}

function buildSummary(entryA: ScenarioLibraryEntry, entryB: ScenarioLibraryEntry, metricRows: ComparisonMetricRow[], recommended: "A" | "B" | null): string {
  const rowByKey = Object.fromEntries(metricRows.map((row) => [row.key, row]));
  const sentences: string[] = [];

  if (recommended === "B") sentences.push(`${entryB.scenarioName} is the stronger operating choice on the tracked flow metrics.`);
  else if (recommended === "A") sentences.push(`${entryA.scenarioName} remains the stronger operating choice; the tested alternative does not improve the line.`);
  else sentences.push("The tested changes do not create a clear enough operating advantage to justify adoption yet.");

  const throughput = rowByKey.forecastThroughput;
  const wip = rowByKey.totalWipQty;
  const lead = rowByKey.weightedLeadTimeMinutes;
  const constraint = rowByKey.activeConstraintName;

  if (throughput.tone === "positive") sentences.push(`Output improves in Scenario B by ${throughput.delta}.`);
  else if (throughput.tone === "alert") sentences.push(`Output declines in Scenario B by ${throughput.delta.replace("-", "")}.`);
  else sentences.push("Output remains broadly flat between the two scenarios.");

  if (wip.tone === "positive" && lead.tone === "positive") sentences.push("The tested change reduces congestion and shortens response time, which supports a cleaner operating rhythm.");
  else if (wip.tone === "alert" || lead.tone === "alert") sentences.push("The tested change adds operational friction through heavier congestion, longer delay, or both.");
  else sentences.push("Congestion and lead-time behavior remain directionally similar.");

  if (constraint.tone === "caution") sentences.push("The active constraint shifts, so leadership attention would need to move with the bottleneck.");

  return sentences.slice(0, 4).join(" ");
}

function buildGuidance(entryA: ScenarioLibraryEntry, entryB: ScenarioLibraryEntry, metricRows: ComparisonMetricRow[], recommended: "A" | "B" | null): ComparisonGuidance {
  const positiveRows = metricRows.filter((row) => row.tone === "positive").map((row) => row.label.toLowerCase());

  if (recommended === "B") {
    return {
      recommended: entryB.scenarioName,
      why: positiveRows.length > 0 ? `Preferred because it improves ${positiveRows.slice(0, 3).join(", ")}.` : "Preferred because it improves the tracked operating outcomes most clearly.",
      tradeoff: metricRows.some((row) => row.tone === "alert")
        ? `The main tradeoff sits in ${metricRows.filter((row) => row.tone === "alert").map((row) => row.label.toLowerCase()).slice(0, 2).join(", ")}.`
        : "The tracked tradeoffs are limited; the recommendation is supported by a cleaner overall operating profile.",
      nextStep: metricRows.find((row) => row.key === "activeConstraintName")?.tone === "caution"
        ? "Adopt Scenario B for the next validation cycle, then re-check the new bottleneck before widening the change."
        : "Adopt Scenario B as the next working baseline and validate the gain with one follow-up run."
    };
  }

  if (recommended === "A") {
    return {
      recommended: entryA.scenarioName,
      why: "Preferred because the tested alternative fails to improve flow enough to justify adoption.",
      tradeoff: "The main tradeoff is that the tested alternative adds complexity without enough operating gain.",
      nextStep: "Keep Scenario A as the baseline and test a stronger improvement lever before changing the operation."
    };
  }

  return {
    recommended: "No change recommended",
    why: "Neither scenario creates a material enough operating advantage to support a confident switch.",
    tradeoff: "The tradeoff is weak separation: the tested change does not move the decision enough to justify switching.",
    nextStep: "Keep the current baseline, then test a more material intervention before escalating the decision."
  };
}

function buildInterpretation(metricRows: ComparisonMetricRow[], recommended: "A" | "B" | null): string {
  const rowByKey = Object.fromEntries(metricRows.map((row) => [row.key, row]));
  const sentences: string[] = [];

  const throughput = rowByKey.forecastThroughput as ComparisonMetricRow;
  const wip = rowByKey.totalWipQty as ComparisonMetricRow;
  const lead = rowByKey.weightedLeadTimeMinutes as ComparisonMetricRow;
  const constraint = rowByKey.activeConstraintName as ComparisonMetricRow;

  if (throughput.tone === "positive") sentences.push("The tested change improves flow by lifting output.");
  else if (throughput.tone === "alert") sentences.push("The tested change weakens flow because output falls.");
  else sentences.push("The tested change does not materially alter flow rate.");

  if (wip.tone === "positive") sentences.push("Congestion eases, which reduces accumulation inside the system.");
  else if (wip.tone === "alert") sentences.push("Congestion increases, which raises the recovery burden on the line.");

  if (lead.tone === "positive") sentences.push("Delay comes down, suggesting a cleaner path from release to completion.");
  else if (lead.tone === "alert") sentences.push("Delay gets worse, which points to more friction in the operating path.");

  if (constraint.tone === "caution") sentences.push("The bottleneck shifts, so the operating focus would need to move with it.");

  if (recommended === "B") sentences.push("From a leadership standpoint, the tested change is worth adopting as the next baseline.");
  else if (recommended === "A") sentences.push("From a leadership standpoint, the current baseline should be preserved while a stronger change is tested.");
  else sentences.push("From a leadership standpoint, the tested change is not yet worth adopting.");

  return sentences.slice(0, 4).join(" ");
}

function buildParameterDiffs(entryA: ScenarioLibraryEntry, entryB: ScenarioLibraryEntry, parameterGroups: ParameterGroup[], maxRows = 8) {
  const rows: Array<{ label: string; valueA: string; valueB: string }> = [];
  const seen = new Set<string>();

  const display = (value: unknown) => {
    if (value === undefined || value === null || value === "") return "--";
    if (typeof value === "number") {
      if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value));
      return value.toFixed(2).replace(/\.?0+$/, "");
    }
    return clean(value);
  };

  for (const group of parameterGroups) {
    for (const field of group.fields) {
      const valueA = display(entryA.scenario[field.key]);
      const valueB = display(entryB.scenario[field.key]);
      if (valueA !== valueB) {
        rows.push({ label: field.label, valueA, valueB });
        seen.add(field.key);
      }
    }
  }

  const remainingKeys = Object.keys({ ...entryA.scenario, ...entryB.scenario })
    .filter((key) => !seen.has(key))
    .sort((left, right) => {
      const leftStep = left.startsWith("step_") ? 1 : 0;
      const rightStep = right.startsWith("step_") ? 1 : 0;
      return leftStep - rightStep || left.localeCompare(right);
    });

  for (const key of remainingKeys) {
    const valueA = display(entryA.scenario[key]);
    const valueB = display(entryB.scenario[key]);
    if (valueA !== valueB) {
      rows.push({
        label: key.replace(/^step_/, "").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
        valueA,
        valueB
      });
    }
  }

  return {
    rows: rows.slice(0, maxRows),
    remaining: Math.max(0, rows.length - maxRows)
  };
}

function toneClass(tone: ComparisonTone): string {
  return {
    positive: "tone-positive",
    alert: "tone-alert",
    caution: "tone-caution",
    neutral: "tone-neutral"
  }[tone];
}

function buildReportModel(
  entryA: ScenarioLibraryEntry,
  entryB: ScenarioLibraryEntry,
  parameterGroups: ParameterGroup[],
  operationName: string
): ComparisonReportModel {
  const metrics = computeMetricRows(entryA, entryB);
  const verdict = computeVerdict(entryA, entryB);
  const summary = buildSummary(entryA, entryB, metrics, verdict.recommended);
  const guidance = buildGuidance(entryA, entryB, metrics, verdict.recommended);
  const interpretation = buildInterpretation(metrics, verdict.recommended);
  const diffs = buildParameterDiffs(entryA, entryB, parameterGroups);

  return {
    headline: verdict.headline,
    summary,
    metrics,
    guidance,
    interpretation,
    parameterDiffs: diffs.rows,
    remainingDiffCount: diffs.remaining,
    scenarioAName: entryA.scenarioName,
    scenarioBName: entryB.scenarioName,
    generatedAt: new Date().toLocaleString(),
    operationName
  };
}

function buildHtml(report: ComparisonReportModel): string {
  const metricCards = report.metrics
    .map(
      (metric) => `
        <article class="metric-card ${toneClass(metric.tone)}">
          <div class="metric-label">${escapeHtml(metric.label)}</div>
          <div class="metric-pair"><span class="metric-slot">A</span><span>${escapeHtml(metric.valueA)}</span></div>
          <div class="metric-pair metric-pair-strong"><span class="metric-slot">B</span><span>${escapeHtml(metric.valueB)}</span></div>
          <div class="metric-delta"><strong>${escapeHtml(metric.delta)}</strong> ${escapeHtml(metric.direction)}</div>
        </article>
      `
    )
    .join("");

  const evidenceRows = report.metrics
    .map(
      (metric) => `
        <tr>
          <td>${escapeHtml(metric.label)}</td>
          <td>${escapeHtml(metric.valueA)}</td>
          <td>${escapeHtml(metric.valueB)}</td>
          <td>${escapeHtml(metric.delta)}</td>
          <td class="${toneClass(metric.tone)}">${escapeHtml(metric.direction)}</td>
        </tr>
      `
    )
    .join("");

  const diffRows =
    report.parameterDiffs.length > 0
      ? report.parameterDiffs
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.label)}</td>
                <td>${escapeHtml(row.valueA)}</td>
                <td>${escapeHtml(row.valueB)}</td>
              </tr>
            `
          )
          .join("")
      : `
        <tr>
          <td colspan="3">The tracked inputs are identical between Scenario A and Scenario B. Any output difference is likely simulation variability rather than a modeled process change.</td>
        </tr>
      `;

  const diffFooter =
    report.remainingDiffCount > 0
      ? `<p class="muted-note">+${report.remainingDiffCount} more differences not shown.</p>`
      : "";

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(report.headline)} - Comparison Report</title>
      <style>
        :root {
          --text: #202733;
          --text-secondary: #405062;
          --text-muted: #667587;
          --accent: #314a68;
          --surface: #ffffff;
          --surface-alt: #f7f9fc;
          --border: #d8e0ea;
          --divider: #e6ebf2;
          --success: #2e6e5b;
          --caution: #9a6a1f;
          --alert: #9a3b2f;
          --positive-fill: #edf6f3;
          --alert-fill: #f9edec;
          --caution-fill: #fff8ec;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #eef2f6;
          color: var(--text);
          font-family: Helvetica, Arial, sans-serif;
        }
        .toolbar {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 24px;
          background: rgba(238, 242, 246, 0.96);
          border-bottom: 1px solid var(--divider);
          backdrop-filter: blur(10px);
        }
        .toolbar-title {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          font-weight: 700;
        }
        .toolbar-actions {
          display: flex;
          gap: 10px;
        }
        .toolbar button {
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          border-radius: 999px;
          padding: 10px 16px;
          font-weight: 700;
          cursor: pointer;
        }
        .page {
          width: 8.5in;
          min-height: 11in;
          margin: 18px auto;
          background: var(--surface);
          padding: 0.72in 0.62in 0.62in;
          box-shadow: 0 24px 50px rgba(32, 39, 51, 0.10);
          position: relative;
        }
        .top-band {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: var(--accent);
        }
        .footer {
          position: absolute;
          left: 0.62in;
          right: 0.62in;
          bottom: 0.28in;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid var(--divider);
          color: #8391a3;
          font-size: 11px;
        }
        .eyebrow {
          margin: 0 0 6px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--accent);
          font-weight: 700;
        }
        h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.15;
        }
        h2 {
          margin: 0;
          font-size: 21px;
          line-height: 1.2;
        }
        p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.55;
        }
        .summary-box, .guidance-box, .section-box {
          border: 1px solid var(--border);
          background: var(--surface-alt);
          border-left: 3px solid var(--accent);
          border-radius: 12px;
          padding: 16px 18px;
        }
        .section-label {
          margin-bottom: 8px;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 700;
        }
        .meta {
          margin-top: 8px;
          color: var(--text-muted);
          font-size: 14px;
        }
        .stack {
          display: grid;
          gap: 16px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .metric-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          background: var(--surface);
          min-height: 132px;
        }
        .metric-card.tone-positive { background: var(--positive-fill); border-left: 3px solid var(--success); }
        .metric-card.tone-alert { background: var(--alert-fill); border-left: 3px solid var(--alert); }
        .metric-card.tone-caution { background: var(--caution-fill); border-left: 3px solid var(--caution); }
        .metric-card.tone-neutral { border-left: 3px solid var(--accent); }
        .metric-label {
          color: var(--text-muted);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .metric-pair {
          display: flex;
          gap: 10px;
          align-items: baseline;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        .metric-pair-strong {
          color: var(--text);
          font-weight: 700;
        }
        .metric-slot {
          display: inline-flex;
          width: 18px;
          font-size: 12px;
          font-weight: 700;
          color: var(--accent);
        }
        .metric-delta {
          margin-top: 12px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        .guidance-grid {
          display: grid;
          gap: 10px;
        }
        .guidance-row strong {
          display: inline-block;
          min-width: 150px;
          color: var(--text);
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid var(--border);
          padding: 10px 12px;
          text-align: left;
          vertical-align: top;
          font-size: 14px;
          color: var(--text);
        }
        th {
          background: var(--surface-alt);
          color: var(--text-muted);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        tbody tr:nth-child(even) td {
          background: #fbfcfe;
        }
        .tone-positive { color: var(--success); font-weight: 700; }
        .tone-alert { color: var(--alert); font-weight: 700; }
        .tone-caution { color: var(--caution); font-weight: 700; }
        .tone-neutral { color: var(--text-secondary); font-weight: 700; }
        .muted-note {
          margin-top: 8px;
          color: var(--text-muted);
          font-size: 13px;
        }
        .page-break {
          page-break-before: always;
        }
        @media print {
          body { background: white; }
          .toolbar { display: none; }
          .page {
            margin: 0;
            box-shadow: none;
            width: auto;
            min-height: 11in;
            page-break-after: always;
          }
          .page:last-of-type { page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <div class="toolbar-title">LeanStorming Comparison Executive Report</div>
        <div class="toolbar-actions">
          <button onclick="window.print()">Print / Save PDF</button>
          <button onclick="window.close()">Close</button>
        </div>
      </div>

      <section class="page">
        <div class="top-band"></div>
        <div class="stack">
          <div>
            <p class="eyebrow">Scenario Comparison</p>
            <h1>${escapeHtml(report.headline)} for ${escapeHtml(report.operationName)}</h1>
            <p class="meta">Scenario A: ${escapeHtml(report.scenarioAName)} | Scenario B: ${escapeHtml(report.scenarioBName)} | Generated ${escapeHtml(report.generatedAt)}</p>
          </div>

          <div class="summary-box">
            <div class="section-label">Executive summary</div>
            <p>${escapeHtml(report.summary)}</p>
          </div>

          <div class="metrics-grid">
            ${metricCards}
          </div>

          <div class="guidance-box">
            <div class="section-label">Decision guidance</div>
            <div class="guidance-grid">
              <p class="guidance-row"><strong>Recommended scenario</strong>${escapeHtml(report.guidance.recommended)}</p>
              <p class="guidance-row"><strong>Why it is preferred</strong>${escapeHtml(report.guidance.why)}</p>
              <p class="guidance-row"><strong>Tradeoff</strong>${escapeHtml(report.guidance.tradeoff)}</p>
              <p class="guidance-row"><strong>Suggested next step</strong>${escapeHtml(report.guidance.nextStep)}</p>
            </div>
          </div>
        </div>
        <div class="footer">
          <span>${escapeHtml(report.operationName)} · Operational Decision Report</span>
          <span>Page 1</span>
        </div>
      </section>

      <section class="page page-break">
        <div class="top-band"></div>
        <div class="stack">
          <div>
            <p class="eyebrow">Decision Evidence</p>
            <h2>Comparison Evidence and Interpretation</h2>
          </div>

          <div class="section-box">
            <div class="section-label">Decision evidence table</div>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>${escapeHtml(report.scenarioAName)}</th>
                  <th>${escapeHtml(report.scenarioBName)}</th>
                  <th>Delta</th>
                  <th>Direction</th>
                </tr>
              </thead>
              <tbody>
                ${evidenceRows}
              </tbody>
            </table>
          </div>

          <div class="section-box">
            <div class="section-label">Parameter differences</div>
            <table>
              <thead>
                <tr>
                  <th>Changed input</th>
                  <th>${escapeHtml(report.scenarioAName)}</th>
                  <th>${escapeHtml(report.scenarioBName)}</th>
                </tr>
              </thead>
              <tbody>
                ${diffRows}
              </tbody>
            </table>
            ${diffFooter}
          </div>

          <div class="section-box">
            <div class="section-label">Executive interpretation</div>
            <p>${escapeHtml(report.interpretation)}</p>
          </div>
        </div>
        <div class="footer">
          <span>${escapeHtml(report.operationName)} · Operational Decision Report</span>
          <span>Page 2</span>
        </div>
      </section>
    </body>
  </html>`;
}

export function openComparisonExecutiveReportWindow(input: {
  entryA: ScenarioLibraryEntry;
  entryB: ScenarioLibraryEntry;
  parameterGroups: ParameterGroup[];
  operationName: string;
}): boolean {
  const popup = window.open("", "_blank");
  if (!popup) {
    return false;
  }

  const report = buildReportModel(input.entryA, input.entryB, input.parameterGroups, input.operationName);
  popup.document.open();
  popup.document.write(buildHtml(report));
  popup.document.close();
  popup.document.title = `${report.headline} - LeanStorming Comparison Report`;
  return true;
}
