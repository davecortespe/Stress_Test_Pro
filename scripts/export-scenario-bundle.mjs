import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildOperationalDiagnosis, toMarkdown as toOperationalDiagnosisMarkdown } from "./generate-operational-diagnosis.mjs";

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
      continue;
    }
    result[key] = next;
    i += 1;
  }
  return result;
}

function asBoolean(value, fallback) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return fallback;
}

function formatTimestamp(date) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

function sanitizeName(input) {
  const trimmed = String(input ?? "")
    .trim()
    .toLowerCase();
  const compact = trimmed.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return compact.length > 0 ? compact.slice(0, 48) : "scenario";
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureUniqueDirectory(parentDir, baseName) {
  for (let i = 0; i < 5000; i += 1) {
    const candidate = i === 0 ? baseName : `${baseName}_${i + 1}`;
    const candidatePath = path.join(parentDir, candidate);
    if (!fs.existsSync(candidatePath)) {
      fs.mkdirSync(candidatePath, { recursive: false });
      return { folderName: candidate, folderPath: candidatePath };
    }
  }
  throw new Error("Unable to allocate unique export directory name.");
}

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.error) {
    throw result.error;
  }
  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

function buildPortableRunnerSource() {
  return `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
      continue;
    }
    result[key] = next;
    i += 1;
  }
  return result;
}

function num(value, fallback) {
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeOutgoing(edges) {
  if (edges.length === 0) {
    return [];
  }
  const explicitTotal = edges.reduce(
    (sum, edge) => sum + (typeof edge.probability === "number" ? edge.probability : 0),
    0
  );
  const missingCount = edges.filter((edge) => typeof edge.probability !== "number").length;
  const remaining = Math.max(0, 1 - explicitTotal);
  const implied = missingCount > 0 ? (remaining > 0 ? remaining / missingCount : 1 / edges.length) : 0;

  const provisional = edges.map((edge) => ({
    to: edge.to,
    probability: typeof edge.probability === "number" ? num(edge.probability, 0) : implied
  }));
  const total = provisional.reduce((sum, edge) => sum + edge.probability, 0);
  if (total <= 0) {
    const uniform = 1 / edges.length;
    return edges.map((edge) => ({ to: edge.to, probability: uniform }));
  }
  return provisional.map((edge) => ({ to: edge.to, probability: edge.probability / total }));
}

function computeVisitFactors(graph) {
  const nodeIds = graph.nodes.map((node) => node.id);
  const outgoingRaw = new Map();
  const outgoing = new Map();

  for (const nodeId of nodeIds) {
    outgoingRaw.set(nodeId, []);
    outgoing.set(nodeId, []);
  }
  for (const edge of graph.edges) {
    const group = outgoingRaw.get(edge.from) ?? [];
    group.push(edge);
    outgoingRaw.set(edge.from, group);
  }
  for (const [nodeId, edges] of outgoingRaw.entries()) {
    outgoing.set(nodeId, normalizeOutgoing(edges));
  }

  const fallbackStart = nodeIds.length > 0 ? [nodeIds[0]] : [];
  const startNodes = Array.isArray(graph.startNodes) && graph.startNodes.length > 0 ? graph.startNodes : fallbackStart;
  const base = new Map();
  for (const nodeId of nodeIds) {
    base.set(nodeId, 0);
  }
  const perStart = 1 / Math.max(1, startNodes.length);
  for (const nodeId of startNodes) {
    base.set(nodeId, (base.get(nodeId) ?? 0) + perStart);
  }

  let visits = new Map(base);
  for (let i = 0; i < 350; i += 1) {
    const next = new Map(base);
    for (const nodeId of nodeIds) {
      const fromVisits = visits.get(nodeId) ?? 0;
      if (fromVisits <= 0) {
        continue;
      }
      for (const edge of outgoing.get(nodeId) ?? []) {
        next.set(edge.to, (next.get(edge.to) ?? 0) + fromVisits * edge.probability);
      }
    }
    let maxDelta = 0;
    for (const nodeId of nodeIds) {
      maxDelta = Math.max(maxDelta, Math.abs((next.get(nodeId) ?? 0) - (visits.get(nodeId) ?? 0)));
    }
    visits = next;
    if (maxDelta < 1e-8) {
      break;
    }
  }

  const result = {};
  for (const nodeId of nodeIds) {
    result[nodeId] = clamp(num(visits.get(nodeId), 0), 0.01, 12);
  }
  return result;
}

function mixModifier(stepId, index, total, mixProfile) {
  if (mixProfile === "station-1-heavy") {
    return index <= 1 ? 1.12 : 0.96;
  }
  if (mixProfile === "final-step-heavy") {
    return index >= Math.max(0, total - 2) ? 1.12 : 0.96;
  }
  if (mixProfile === "family-A-heavy") {
    return stepId === "station_1" || stepId === "station_2" ? 1.1 : 0.97;
  }
  if (mixProfile === "family-B-heavy") {
    return stepId === "station_4" || stepId === "station_5" ? 1.1 : 0.97;
  }
  return 1;
}

function stepStatus(utilization, bottleneckIndex) {
  if (utilization >= 0.98 || bottleneckIndex >= 0.82) {
    return "critical";
  }
  if (utilization >= 0.85 || bottleneckIndex >= 0.62) {
    return "risk";
  }
  return "healthy";
}

function readStepOverride(scenario, stepId, field) {
  const value = num(scenario[\`step_\${stepId}_\${field}\`], Number.NaN);
  return Number.isFinite(value) ? value : null;
}

function evaluateSystem(model, scenario, visitFactors, reliefStepId, reliefUnits) {
  const baselineDemand = num(model.inputDefaults?.demandRatePerHour, num(model.baseline?.demandRatePerHour, 10));
  const demandMultiplier = clamp(num(scenario.demandMultiplier, 1), 0.2, 3);
  const lineDemand = Math.max(0.1, baselineDemand * demandMultiplier);
  const staffingMultiplier = clamp(num(scenario.staffingMultiplier, 1), 0.25, 3);
  const equipmentMultiplier = clamp(num(scenario.equipmentMultiplier, 1), 0.25, 3);
  const availabilityMultiplier = clamp(1 - num(scenario.unplannedDowntimePct, 7) / 100, 0.2, 1);
  const ctMultiplier = clamp(num(scenario.ctMultiplier, 1), 0.25, 3);
  const setupPenaltyMultiplier = clamp(num(scenario.setupPenaltyMultiplier, 1), 0, 3);
  const variabilityMultiplier = clamp(num(scenario.variabilityMultiplier, 1), 0.2, 3);
  const horizonHours = clamp(num(scenario.simulationHorizonHours, 8), 8, 24);
  const horizonSeverity = 1 + ((horizonHours - 8) / 16) * 0.22;
  const mixProfile = String(scenario.mixProfile ?? "balanced");

  const stepEvals = {};
  const ranked = [];
  let lineCapacity = Number.POSITIVE_INFINITY;
  let totalWipQty = 0;
  let worstCaseTouchTime = 0;

  model.stepModels.forEach((step, index) => {
    const ctMinutes = typeof step.ctMinutes === "number" ? step.ctMinutes : null;
    if (ctMinutes === null) {
      stepEvals[step.stepId] = {
        demandRatePerHour: null,
        utilization: null,
        headroom: null,
        queueRisk: null,
        queueDepth: null,
        wipQty: null,
        capacityPerHour: null,
        bottleneckIndex: null,
        status: "unknown",
        throughputLimit: null
      };
      return;
    }

    const stepVisitFactor = Math.max(0.01, num(visitFactors[step.stepId], 1));
    const stepMixFactor = mixModifier(step.stepId, index, model.stepModels.length, mixProfile);
    const stepDemandRate = lineDemand * stepVisitFactor * stepMixFactor;

    const stepCapacityUnitsOverride = readStepOverride(scenario, step.stepId, "capacityUnits");
    const stepCtBaselineOverride = readStepOverride(scenario, step.stepId, "ctBaseline");
    const stepCtMultiplier = Math.max(
      0.1,
      readStepOverride(scenario, step.stepId, "ctMultiplier") ?? 1
    );
    const stepDowntimePct = clamp(readStepOverride(scenario, step.stepId, "downtimePct") ?? 0, 0, 95);

    const ctBaseline = Math.max(0.05, stepCtBaselineOverride ?? ctMinutes);
    const setupPenalty = Math.max(0, num(step.changeoverPenaltyPerUnitMinutes, 0));
    const effectiveCt =
      Math.max(0.05, ctBaseline * ctMultiplier * stepCtMultiplier) +
      Math.max(0, setupPenalty * setupPenaltyMultiplier);
    const baseUnits = Math.max(
      0.05,
      (stepCapacityUnitsOverride ?? num(step.effectiveUnits, 1)) * staffingMultiplier * equipmentMultiplier
    );
    const relief = step.stepId === reliefStepId ? Math.max(0, reliefUnits) : 0;
    const effectiveUnits = baseUnits + relief;
    const stepAvailabilityMultiplier = availabilityMultiplier * (1 - stepDowntimePct / 100);
    const computedCapacityRate =
      (effectiveUnits * 60 * clamp(stepAvailabilityMultiplier, 0.05, 1)) / Math.max(0.05, effectiveCt);
    const capacityRate = Math.max(0.001, computedCapacityRate);

    const worstCtMinutes =
      Math.max(0.05, ctBaseline * ctMultiplier * stepCtMultiplier) * (1 + stepDowntimePct / 100);
    worstCaseTouchTime += worstCtMinutes;

    const utilizationRaw = stepDemandRate / Math.max(0.001, capacityRate);
    const utilization = clamp(utilizationRaw, 0, 1.35);
    const headroom = Math.max(0, 1 - utilizationRaw);
    const cv = Math.max(0.03, num(step.variabilityCv, 0.18) * variabilityMultiplier);
    const queuePressure = (utilization * utilization) / Math.max(0.06, 1 - utilization);
    const queueRisk = clamp((queuePressure * (0.52 + cv)) / 7.2, 0, 1);
    const queueDepth = Math.max(
      0,
      Math.min(24, (Math.max(0, utilizationRaw - 0.66) * 8 + queueRisk * 14) * stepVisitFactor)
    );
    const accumulationRate = Math.max(0, stepDemandRate - capacityRate);
    const wipQty = Math.max(0, queueDepth + accumulationRate * horizonHours);
    totalWipQty += wipQty;

    const shortage = clamp(utilizationRaw - 1, 0, 1);
    const bottleneckIndex = clamp(
      (0.6 * (Math.min(utilizationRaw, 1.25) / 1.25) + 0.3 * queueRisk + 0.1 * shortage) * horizonSeverity,
      0,
      1
    );
    const status = stepStatus(utilizationRaw, bottleneckIndex);
    const throughputLimit = capacityRate / Math.max(0.01, stepVisitFactor * stepMixFactor);

    lineCapacity = Math.min(lineCapacity, throughputLimit);
    stepEvals[step.stepId] = {
      demandRatePerHour: stepDemandRate,
      utilization,
      headroom,
      queueRisk,
      queueDepth,
      wipQty,
      capacityPerHour: capacityRate,
      bottleneckIndex,
      status,
      throughputLimit
    };
    ranked.push({ stepId: step.stepId, score: bottleneckIndex });
  });

  ranked.sort((a, b) => b.score - a.score);
  const throughput = Math.min(lineDemand, Number.isFinite(lineCapacity) ? lineCapacity : lineDemand);
  const avgQueueRisk =
    ranked.length > 0
      ? ranked.reduce((sum, row) => sum + (stepEvals[row.stepId]?.queueRisk ?? 0), 0) / ranked.length
      : 0;

  return {
    lineDemand,
    throughput,
    stepEvals,
    bottleneckStepId: ranked[0]?.stepId ?? "",
    avgQueueRisk,
    totalWipQty,
    worstCaseTouchTime,
    horizonHours,
    sortedByBottleneck: ranked
  };
}

function migrationLabel(model, baseline, relief) {
  const labels = new Map(model.graph.nodes.map((node) => [node.id, node.label]));
  const currentLabel = labels.get(baseline.bottleneckStepId) ?? baseline.bottleneckStepId;
  const nextLabel = labels.get(relief.bottleneckStepId) ?? relief.bottleneckStepId;
  if (!currentLabel || !nextLabel) {
    return "n/a";
  }
  if (currentLabel === nextLabel) {
    return currentLabel + " -> no change";
  }
  const top = relief.sortedByBottleneck[0]?.score ?? 0;
  const second = relief.sortedByBottleneck[1]?.score ?? 0;
  const confidence = top - second < 0.05 ? " (low confidence)" : "";
  return currentLabel + " -> " + nextLabel + confidence;
}

function runForecast(model, scenario) {
  const visitFactors = computeVisitFactors(model.graph);
  const baseline = evaluateSystem(model, scenario, visitFactors, "", 0);
  const reliefUnits = Math.max(0, Math.round(num(scenario.bottleneckReliefUnits, 1)));
  const relief =
    baseline.bottleneckStepId && reliefUnits > 0
      ? evaluateSystem(model, scenario, visitFactors, baseline.bottleneckStepId, reliefUnits)
      : baseline;

  const topScore = baseline.sortedByBottleneck[0]?.score ?? 0;
  const secondScore = baseline.sortedByBottleneck[1]?.score ?? 0;
  const margin = Math.max(0, topScore - secondScore);
  const known = Object.values(baseline.stepEvals).filter((step) => step.utilization !== null);
  const nearSatCount = known.filter((step) => (step.utilization ?? 0) >= 0.9).length;
  const cascadePressure = known.length > 0 ? nearSatCount / known.length : 0;
  const wipPressure = clamp(
    baseline.totalWipQty / Math.max(1, baseline.horizonHours * Math.max(1, model.stepModels.length) * 10),
    0,
    1
  );
  const migrationPenalty = baseline.bottleneckStepId !== relief.bottleneckStepId ? 0.08 : 0;
  const brittleness = clamp(
    0.48 * topScore +
      0.18 * baseline.avgQueueRisk +
      0.16 * cascadePressure +
      0.18 * wipPressure +
      migrationPenalty +
      (margin < 0.08 ? 0.06 : 0) -
      margin * 0.3,
    0,
    1
  );

  const labels = new Map(model.graph.nodes.map((node) => [node.id, node.label]));
  const top3 = baseline.sortedByBottleneck.slice(0, 3).map((row) => {
    const stepEval = baseline.stepEvals[row.stepId];
    return {
      stepId: row.stepId,
      label: labels.get(row.stepId) ?? row.stepId,
      bottleneckIndex: row.score,
      utilization: stepEval?.utilization ?? null,
      headroom: stepEval?.headroom ?? null,
      queueRisk: stepEval?.queueRisk ?? null,
      capacityPerHour: stepEval?.capacityPerHour ?? null,
      status: stepEval?.status ?? "unknown"
    };
  });

  return {
    globalKpis: {
      throughputPerHour: baseline.throughput,
      totalWipQty: baseline.totalWipQty,
      bottleneck: labels.get(baseline.bottleneckStepId) ?? baseline.bottleneckStepId,
      brittleness,
      worstCaseTouchTimeMinutes: baseline.worstCaseTouchTime,
      bottleneckMigration: migrationLabel(model, baseline, relief)
    },
    topConstrainedSteps: top3,
    nodeMetrics: baseline.stepEvals
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const args = parseArgs(process.argv.slice(2));
const bundlePath = path.resolve(String(args.path ?? process.cwd()));
const model = readJson(path.join(bundlePath, "compiled_forecast_model.json"));
const scenario = readJson(path.join(bundlePath, "scenario_committed.json"));
const result = runForecast(model, scenario);

if (args.json) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\\n");
} else {
  process.stdout.write("Forecast KPIs\\n");
  process.stdout.write("-------------\\n");
  process.stdout.write("Throughput/hr: " + result.globalKpis.throughputPerHour.toFixed(3) + "\\n");
  process.stdout.write("Total WIP: " + result.globalKpis.totalWipQty.toFixed(2) + "\\n");
  process.stdout.write("Bottleneck: " + result.globalKpis.bottleneck + "\\n");
  process.stdout.write("Brittleness: " + (result.globalKpis.brittleness * 100).toFixed(1) + "%\\n");
  process.stdout.write(
    "Worst-case touch time: " + result.globalKpis.worstCaseTouchTimeMinutes.toFixed(2) + " min\\n"
  );
  process.stdout.write("Bottleneck migration: " + result.globalKpis.bottleneckMigration + "\\n\\n");
  process.stdout.write("Top 3 constrained steps\\n");
  process.stdout.write("-----------------------\\n");
  result.topConstrainedSteps.forEach((step, index) => {
    const util = typeof step.utilization === "number" ? (step.utilization * 100).toFixed(1) + "%" : "--";
    const headroom = typeof step.headroom === "number" ? (step.headroom * 100).toFixed(1) + "%" : "--";
    const qRisk = typeof step.queueRisk === "number" ? (step.queueRisk * 100).toFixed(1) + "%" : "--";
    const score = typeof step.bottleneckIndex === "number" ? step.bottleneckIndex.toFixed(3) : "--";
    process.stdout.write(
      (index + 1) +
        ". " +
        step.label +
        " | score " +
        score +
        " | util " +
        util +
        " | headroom " +
        headroom +
        " | queue risk " +
        qRisk +
        "\\n"
    );
  });
}
`;
}

function buildReadme(folderName, includeMetrics, includeFullApp) {
  const metricsLine = includeMetrics
    ? "- `result_metrics.json` contains latest exported metrics from the source run."
    : "- `result_metrics.json` not included for this export.";
  const fullAppSection = includeFullApp
    ? `
### Full cockpit with one click (Windows)

Run:

\`\`\`bat
start_full_app.bat
\`\`\`

This starts a local static server and opens the full exported cockpit in your browser.
The \`app/\` files come from the current \`dist/\` build at export time.
`
    : "";
  const fullAppFiles = includeFullApp
    ? `
- \`app/\` (full built web app)
- \`server.mjs\` (local static server)
- \`start_full_app.bat\` (one-click launcher)`
    : "";
  return `# Export Scenario Bundle

This bundle is a portable snapshot of a committed forecast scenario.

## Run

### Browser cockpit (recommended)

Open \`browser_forecast.html\` in your browser.
${fullAppSection}

### Node CLI

From this bundle folder:

\`\`\`bash
node run_forecast.mjs --path .
\`\`\`

Machine-readable output:

\`\`\`bash
node run_forecast.mjs --path . --json
\`\`\`

From the repo root:

\`\`\`bash
node exports/${folderName}/run_forecast.mjs --path exports/${folderName}
\`\`\`

## Included files

- \`dashboard_config.json\`
- \`vsm_graph.json\`
- \`master_data.json\`
- \`compiled_forecast_model.json\`
- \`scenario_committed.json\`
- \`run_forecast.mjs\`
- \`browser_forecast.html\`
- \`operational_diagnosis.json\`
- \`operational_diagnosis.md\`
- \`README.md\`
${fullAppFiles}
${metricsLine}
`;
}

function buildBundleServerSource() {
  return `#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
      continue;
    }
    result[key] = next;
    i += 1;
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));
const port = Number(args.port || process.env.PORT || 4173);
const root = path.resolve(String(args.root || "app"));

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(String(req.url || "/").split("?")[0]);
  const relative = urlPath === "/" ? "/index.html" : urlPath;
  const safePath = path.normalize(relative).replace(/^([.][.][/\\\\])+/, "");
  let filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log("Serving", root, "at http://localhost:" + port);
  console.log("Press Ctrl+C to stop.");
});
`;
}

function buildStartBatSource(bundleId) {
  return `@echo off
setlocal EnableExtensions EnableDelayedExpansion
set BUNDLE_ID=${bundleId}
set ROOT=app
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required but was not found on PATH.
  echo Install Node.js and run this file again.
  pause
  exit /b 1
)

set PORT=
for /L %%P in (4173,1,4199) do (
  netstat -ano | findstr /R /C:":%%P .*LISTENING" >nul
  if errorlevel 1 (
    set PORT=%%P
    goto :port_found
  )
)

echo Could not find a free port in range 4173-4199.
pause
exit /b 1

:port_found
echo Starting %BUNDLE_ID% on http://localhost:%PORT%/
start "Export Full App Server (%BUNDLE_ID%)" cmd /k "cd /d ""%~dp0"" && node server.mjs --root ""%ROOT%"" --port %PORT%"
timeout /t 1 /nobreak >nul
start "" "http://localhost:%PORT%/?bundle=%BUNDLE_ID%"
`;
}

function createFullAppPackage(
  repoRoot,
  folderPath,
  {
    dashboardConfig,
    vsmGraph,
    masterData,
    compiledForecast,
    operationalDiagnosis,
    scenarioCommitted,
    skipBuild
  }
) {
  if (!skipBuild) {
    runCommand("npm", ["run", "build"], repoRoot);
  }

  const distPath = path.join(repoRoot, "dist");
  if (!fs.existsSync(distPath)) {
    throw new Error("dist/ is missing. Run npm run build before exporting full app.");
  }

  const appPath = path.join(folderPath, "app");
  fs.cpSync(distPath, appPath, { recursive: true });

  const bootstrapPath = path.join(appPath, "export_bootstrap.js");
  const bootstrapPayload = {
    dashboardConfig,
    vsmGraph,
    masterData,
    compiledForecastModel: compiledForecast,
    operationalDiagnosis,
    scenarioCommitted
  };
  const bootstrapSource = `window.__EXPORT_BUNDLE_DATA__ = ${JSON.stringify(bootstrapPayload, null, 2)};
window.__EXPORT_COMMITTED_SCENARIO__ = window.__EXPORT_BUNDLE_DATA__.scenarioCommitted;\n`;
  fs.writeFileSync(bootstrapPath, bootstrapSource, "utf8");

  const indexPath = path.join(appPath, "index.html");
  let indexHtml = fs.readFileSync(indexPath, "utf8");
  const injectTag = '<script src="./export_bootstrap.js"></script>';
  if (!indexHtml.includes(injectTag)) {
    if (indexHtml.includes("<head>")) {
      indexHtml = indexHtml.replace("<head>", `<head>\n    ${injectTag}`);
    } else {
      indexHtml = `${injectTag}\n${indexHtml}`;
    }
    fs.writeFileSync(indexPath, indexHtml, "utf8");
  }

  const bundleId = path.basename(folderPath);
  fs.writeFileSync(path.join(folderPath, "server.mjs"), buildBundleServerSource(), "utf8");
  fs.writeFileSync(path.join(folderPath, "start_full_app.bat"), buildStartBatSource(bundleId), "utf8");
}

function safeJsonForScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildBrowserForecastHtmlSource(dashboardConfig, compiledForecast, scenarioCommitted, operationalDiagnosis) {
  const dashboardJson = safeJsonForScript(dashboardConfig);
  const modelJson = safeJsonForScript(compiledForecast);
  const scenarioJson = safeJsonForScript(scenarioCommitted);
  const diagnosisJson = safeJsonForScript(operationalDiagnosis ?? null);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Forecast Export Cockpit</title>
  <style>
    :root {
      --bg-top: #071423;
      --bg-bottom: #040b15;
      --surface: rgba(10, 24, 40, 0.9);
      --surface-2: rgba(8, 19, 33, 0.93);
      --ink: #e8f7ff;
      --ink-muted: #8eb7c8;
      --line: rgba(116, 170, 197, 0.25);
      --accent: #14c4c9;
      --critical: #ff4f72;
      --risk: #ffbc6a;
      --healthy: #1cc2af;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; font-family: Arial, sans-serif; color: var(--ink); }
    body {
      background:
        radial-gradient(circle at 16% -8%, rgba(20, 196, 201, 0.18), transparent 34%),
        radial-gradient(circle at 82% 0%, rgba(240, 91, 120, 0.12), transparent 28%),
        linear-gradient(170deg, var(--bg-top), var(--bg-bottom));
      padding: 14px;
    }
    .app { display: grid; gap: 12px; }
    .header {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 10px;
    }
    .title { margin: 0; font-size: 28px; font-weight: 700; }
    .subtitle { margin: 4px 0 0; color: var(--ink-muted); font-size: 14px; }
    .header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    button {
      border: 1px solid var(--line);
      color: var(--ink);
      background: var(--surface-2);
      border-radius: 8px;
      padding: 7px 11px;
      cursor: pointer;
      font-weight: 600;
    }
    .primary { background: linear-gradient(135deg, #11bbc0, #0d8aa8); border-color: transparent; }
    .pill { border-radius: 999px; padding: 7px 12px; border: 1px solid var(--line); }
    .timer { font-family: monospace; font-size: 18px; }
    .speed button { min-width: 40px; }
    .speed .active { border-color: rgba(20, 196, 201, 0.8); box-shadow: 0 0 10px rgba(20, 196, 201, 0.24); }
    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 10px;
    }
    .kpi {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
      min-height: 72px;
    }
    .kpi .label { color: var(--ink-muted); font-size: 12px; }
    .kpi .value { margin-top: 6px; font-size: 32px; font-family: monospace; font-weight: 700; line-height: 1.05; }
    .layout {
      display: grid;
      grid-template-columns: 310px 1fr;
      gap: 12px;
      min-height: 500px;
    }
    .diagnosis {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 12px;
    }
    .diagnosis-grid {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
    .diagnosis-card {
      background: var(--surface-2);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
    }
    .diagnosis-card h3 {
      margin: 0 0 6px;
      color: #bfe8f3;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .diagnosis-card p, .diagnosis ul {
      margin: 0;
      line-height: 1.45;
      color: var(--ink);
    }
    .diagnosis ul {
      padding-left: 18px;
    }
    .params {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px;
      max-height: calc(100vh - 220px);
      overflow: auto;
    }
    .group-title { margin: 12px 0 8px; font-size: 18px; color: #bfe8f3; }
    .field {
      background: var(--surface-2);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 8px;
      margin-bottom: 8px;
    }
    .field label { display: block; font-size: 14px; margin-bottom: 6px; }
    .field .value { font-family: monospace; color: var(--ink-muted); margin-bottom: 6px; }
    .field input, .field select {
      width: 100%;
      background: rgba(4, 12, 22, 0.95);
      border: 1px solid rgba(114, 167, 194, 0.35);
      color: var(--ink);
      border-radius: 6px;
      padding: 6px;
    }
    .canvas {
      background:
        linear-gradient(180deg, #081729 0%, #050d1a 100%);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px;
      overflow: auto;
      position: relative;
    }
    .canvas::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(119, 163, 184, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(119, 163, 184, 0.08) 1px, transparent 1px);
      background-size: 28px 28px;
      pointer-events: none;
    }
    .flow {
      position: relative;
      z-index: 1;
      display: flex;
      gap: 24px;
      align-items: center;
      min-height: 440px;
      padding: 20px;
      min-width: max-content;
    }
    .arrow {
      color: #33bac0;
      font-size: 22px;
      font-family: monospace;
      opacity: 0.85;
      white-space: nowrap;
      position: relative;
      min-width: 74px;
      text-align: center;
      letter-spacing: 0.04em;
    }
    .flow.live .arrow::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 6px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #bfffff 0%, #1cc2af 55%, #0d7e92 100%);
      box-shadow: 0 0 10px rgba(20, 196, 201, 0.7);
      transform: translate(-10px, -50%);
      opacity: 0;
      animation: token-travel 1.25s linear infinite;
      animation-delay: var(--delay, 0s);
    }
    .node {
      width: 220px;
      background: rgba(11, 36, 54, 0.95);
      border: 2px solid rgba(28, 194, 175, 0.8);
      border-radius: 12px;
      padding: 10px 12px;
      box-shadow: 0 12px 22px rgba(0, 0, 0, 0.28);
      position: relative;
      overflow: hidden;
      transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
      will-change: transform;
    }
    .node::before {
      content: "";
      position: absolute;
      inset: -40% -30%;
      background: linear-gradient(
        120deg,
        rgba(255, 255, 255, 0) 28%,
        rgba(255, 255, 255, 0.14) 48%,
        rgba(255, 255, 255, 0) 68%
      );
      transform: translateX(-120%);
      pointer-events: none;
    }
    .flow.live .node::before {
      animation: node-sheen 2.8s linear infinite;
      animation-delay: var(--delay, 0s);
    }
    .flow.live .node {
      animation: node-breathe var(--pulse, 2s) ease-in-out infinite;
    }
    .flow.live .node.critical {
      animation: node-pressure 0.85s ease-in-out infinite;
    }
    .node.risk { border-color: var(--risk); }
    .node.critical { border-color: var(--critical); box-shadow: 0 0 14px rgba(255, 79, 114, 0.3); }
    .node h4 { margin: 0 0 8px; font-size: 30px; }
    .node p { margin: 3px 0; font-family: monospace; font-size: 22px; }
    .node .wip-bar {
      margin-top: 8px;
      height: 7px;
      border-radius: 999px;
      border: 1px solid rgba(116, 170, 197, 0.28);
      background: rgba(8, 24, 40, 0.7);
      overflow: hidden;
    }
    .node .wip-fill {
      display: block;
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #12c2c8 0%, #f7c063 55%, #ff4f72 100%);
      box-shadow: 0 0 10px rgba(18, 194, 200, 0.45);
      transition: width 260ms ease;
    }
    @keyframes token-travel {
      0% { transform: translate(-10px, -50%); opacity: 0; }
      15% { opacity: 1; }
      100% { transform: translate(58px, -50%); opacity: 0; }
    }
    @keyframes node-breathe {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(calc(-2px - 2px * var(--util, 0))); }
    }
    @keyframes node-pressure {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-2px) scale(1.01); }
    }
    @keyframes node-sheen {
      0% { transform: translateX(-120%); }
      100% { transform: translateX(120%); }
    }
    .muted { color: var(--ink-muted); }
    @media (max-width: 1080px) { .layout { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="app">
    <section class="header">
      <div>
        <h1 id="title" class="title"></h1>
        <p id="subtitle" class="subtitle"></p>
      </div>
      <div class="header-actions">
        <button id="startPause" class="primary">Start</button>
        <button id="resetBtn">Reset</button>
        <span id="livePill" class="pill">Paused</span>
        <span class="pill timer">SIM TIME <span id="simTime">0.00 / 8 h</span></span>
        <span class="pill speed">
          <button data-speed="1" class="active">x1</button>
          <button data-speed="2">x2</button>
          <button data-speed="5">x5</button>
        </span>
      </div>
    </section>

    <section id="kpiRow" class="kpis"></section>

    <section class="diagnosis">
      <div id="diagnosis"></div>
    </section>

    <section class="layout">
      <aside id="params" class="params"></aside>
      <main class="canvas">
        <div id="flow" class="flow"></div>
      </main>
    </section>
  </div>

  <script>
    (function () {
      const DASHBOARD_CONFIG = ${dashboardJson};
      const MODEL = ${modelJson};
      const BASE_SCENARIO = ${scenarioJson};
      const DIAGNOSIS = ${diagnosisJson};
      const BASE_SIM_HOURS_PER_SECOND = 0.1;

      function num(value, fallback) {
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (typeof value === "string" && value.trim().length > 0) {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) return parsed;
        }
        return fallback;
      }

      function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
      }

      function normalizeOutgoing(edges) {
        if (edges.length === 0) return [];
        const explicitTotal = edges.reduce(function (sum, edge) {
          return sum + (typeof edge.probability === "number" ? edge.probability : 0);
        }, 0);
        const missingCount = edges.filter(function (edge) { return typeof edge.probability !== "number"; }).length;
        const remaining = Math.max(0, 1 - explicitTotal);
        const implied = missingCount > 0 ? (remaining > 0 ? remaining / missingCount : 1 / edges.length) : 0;
        const provisional = edges.map(function (edge) {
          return { to: edge.to, probability: typeof edge.probability === "number" ? num(edge.probability, 0) : implied };
        });
        const total = provisional.reduce(function (sum, edge) { return sum + edge.probability; }, 0);
        if (total <= 0) {
          const uniform = 1 / edges.length;
          return edges.map(function (edge) { return { to: edge.to, probability: uniform }; });
        }
        return provisional.map(function (edge) { return { to: edge.to, probability: edge.probability / total }; });
      }

      function computeVisitFactors(graph) {
        const nodeIds = graph.nodes.map(function (node) { return node.id; });
        const outgoingRaw = new Map();
        const outgoing = new Map();
        nodeIds.forEach(function (id) { outgoingRaw.set(id, []); outgoing.set(id, []); });
        graph.edges.forEach(function (edge) {
          const list = outgoingRaw.get(edge.from) || [];
          list.push(edge);
          outgoingRaw.set(edge.from, list);
        });
        outgoingRaw.forEach(function (edges, id) { outgoing.set(id, normalizeOutgoing(edges)); });

        const startNodes = Array.isArray(graph.startNodes) && graph.startNodes.length > 0 ? graph.startNodes : (nodeIds[0] ? [nodeIds[0]] : []);
        const base = new Map();
        nodeIds.forEach(function (id) { base.set(id, 0); });
        const perStart = 1 / Math.max(1, startNodes.length);
        startNodes.forEach(function (id) { base.set(id, (base.get(id) || 0) + perStart); });
        let visits = new Map(base);
        for (let i = 0; i < 350; i += 1) {
          const next = new Map(base);
          nodeIds.forEach(function (id) {
            const from = visits.get(id) || 0;
            if (from <= 0) return;
            (outgoing.get(id) || []).forEach(function (edge) {
              next.set(edge.to, (next.get(edge.to) || 0) + from * edge.probability);
            });
          });
          let maxDelta = 0;
          nodeIds.forEach(function (id) {
            maxDelta = Math.max(maxDelta, Math.abs((next.get(id) || 0) - (visits.get(id) || 0)));
          });
          visits = next;
          if (maxDelta < 1e-8) break;
        }
        const result = {};
        nodeIds.forEach(function (id) { result[id] = clamp(num(visits.get(id), 0), 0.01, 12); });
        return result;
      }

      function mixModifier(stepId, index, total, mixProfile) {
        if (mixProfile === "station-1-heavy") return index <= 1 ? 1.12 : 0.96;
        if (mixProfile === "final-step-heavy") return index >= Math.max(0, total - 2) ? 1.12 : 0.96;
        return 1;
      }

      function stepStatus(utilization, bottleneckIndex) {
        if (utilization >= 0.98 || bottleneckIndex >= 0.82) return "critical";
        if (utilization >= 0.85 || bottleneckIndex >= 0.62) return "risk";
        return "healthy";
      }

      function readStepOverride(scenario, stepId, field) {
        const value = num(scenario["step_" + stepId + "_" + field], Number.NaN);
        return Number.isFinite(value) ? value : null;
      }

      function evaluateSystem(model, scenario, visitFactors, reliefStepId, reliefUnits) {
        const baselineDemand = num(model.inputDefaults.demandRatePerHour, num(model.baseline.demandRatePerHour, 10));
        const demandMultiplier = clamp(num(scenario.demandMultiplier, 1), 0.2, 3);
        const lineDemand = Math.max(0.1, baselineDemand * demandMultiplier);
        const staffingMultiplier = clamp(num(scenario.staffingMultiplier, 1), 0.25, 3);
        const equipmentMultiplier = clamp(num(scenario.equipmentMultiplier, 1), 0.25, 3);
        const availabilityMultiplier = clamp(1 - num(scenario.unplannedDowntimePct, 7) / 100, 0.2, 1);
        const ctMultiplier = clamp(num(scenario.ctMultiplier, 1), 0.25, 3);
        const setupPenaltyMultiplier = clamp(num(scenario.setupPenaltyMultiplier, 1), 0, 3);
        const variabilityMultiplier = clamp(num(scenario.variabilityMultiplier, 1), 0.2, 3);
        const horizonHours = clamp(num(scenario.simulationHorizonHours, 8), 8, 24);
        const horizonSeverity = 1 + ((horizonHours - 8) / 16) * 0.22;
        const mixProfile = String(scenario.mixProfile || "balanced");

        const stepEvals = {};
        const ranked = [];
        let lineCapacity = Number.POSITIVE_INFINITY;
        let worstCaseTouchTime = 0;

        model.stepModels.forEach(function (step, index) {
          const ctMinutes = typeof step.ctMinutes === "number" ? step.ctMinutes : null;
          if (ctMinutes === null) {
            stepEvals[step.stepId] = { utilization: null, headroom: null, queueRisk: null, queueDepth: null, wipQty: null, bottleneckIndex: null, status: "unknown", capacityPerHour: null };
            return;
          }
          const visit = Math.max(0.01, num(visitFactors[step.stepId], 1));
          const mix = mixModifier(step.stepId, index, model.stepModels.length, mixProfile);
          const stepDemandRate = lineDemand * visit * mix;
          const stepCapacityUnitsOverride = readStepOverride(scenario, step.stepId, "capacityUnits");
          const stepCtBaselineOverride = readStepOverride(scenario, step.stepId, "ctBaseline");
          const stepCtMultiplier = Math.max(0.1, readStepOverride(scenario, step.stepId, "ctMultiplier") || 1);
          const stepDowntimePct = clamp(readStepOverride(scenario, step.stepId, "downtimePct") || 0, 0, 95);
          const ctBaseline = Math.max(0.05, stepCtBaselineOverride || ctMinutes);
          const setupPenalty = Math.max(0, num(step.changeoverPenaltyPerUnitMinutes, 0));
          const effectiveCt = Math.max(0.05, ctBaseline * ctMultiplier * stepCtMultiplier) + Math.max(0, setupPenalty * setupPenaltyMultiplier);
          const baseUnits = Math.max(0.05, (stepCapacityUnitsOverride || num(step.effectiveUnits, 1)) * staffingMultiplier * equipmentMultiplier);
          const relief = step.stepId === reliefStepId ? Math.max(0, reliefUnits) : 0;
          const effectiveUnits = baseUnits + relief;
          const avail = availabilityMultiplier * (1 - stepDowntimePct / 100);
          const capRate = Math.max(0.001, (effectiveUnits * 60 * clamp(avail, 0.05, 1)) / Math.max(0.05, effectiveCt));
          const utilRaw = stepDemandRate / Math.max(0.001, capRate);
          const util = clamp(utilRaw, 0, 1.35);
          const headroom = Math.max(0, 1 - utilRaw);
          const cv = Math.max(0.03, num(step.variabilityCv, 0.18) * variabilityMultiplier);
          const qPressure = (util * util) / Math.max(0.06, 1 - util);
          const qRisk = clamp((qPressure * (0.52 + cv)) / 7.2, 0, 1);
          const qDepth = Math.max(0, Math.min(24, (Math.max(0, utilRaw - 0.66) * 8 + qRisk * 14) * visit));
          const accum = Math.max(0, stepDemandRate - capRate);
          const wipQty = Math.max(0, qDepth + accum * horizonHours);
          const shortage = clamp(utilRaw - 1, 0, 1);
          const bn = clamp((0.6 * (Math.min(utilRaw, 1.25) / 1.25) + 0.3 * qRisk + 0.1 * shortage) * horizonSeverity, 0, 1);
          lineCapacity = Math.min(lineCapacity, capRate / Math.max(0.01, visit * mix));
          worstCaseTouchTime += Math.max(0.05, ctBaseline * ctMultiplier * stepCtMultiplier) * (1 + stepDowntimePct / 100);
          stepEvals[step.stepId] = { utilization: util, headroom: headroom, queueRisk: qRisk, queueDepth: qDepth, wipQty: wipQty, bottleneckIndex: bn, status: stepStatus(utilRaw, bn), capacityPerHour: capRate };
          ranked.push({ stepId: step.stepId, score: bn });
        });
        ranked.sort(function (a, b) { return b.score - a.score; });
        const throughput = Math.min(lineDemand, Number.isFinite(lineCapacity) ? lineCapacity : lineDemand);
        const avgQueueRisk = ranked.length > 0 ? ranked.reduce(function (sum, row) { return sum + (stepEvals[row.stepId].queueRisk || 0); }, 0) / ranked.length : 0;
        return { lineDemand: lineDemand, throughput: throughput, stepEvals: stepEvals, bottleneckStepId: ranked[0] ? ranked[0].stepId : "", avgQueueRisk: avgQueueRisk, worstCaseTouchTime: worstCaseTouchTime, horizonHours: horizonHours, sortedByBottleneck: ranked };
      }

      function createOutput(model, scenario, elapsedHours) {
        const visit = computeVisitFactors(model.graph);
        const baseline = evaluateSystem(model, scenario, visit, "", 0);
        const reliefUnits = Math.max(0, Math.round(num(scenario.bottleneckReliefUnits, 1)));
        const relief = baseline.bottleneckStepId && reliefUnits > 0 ? evaluateSystem(model, scenario, visit, baseline.bottleneckStepId, reliefUnits) : baseline;
        const topScore = baseline.sortedByBottleneck[0] ? baseline.sortedByBottleneck[0].score : 0;
        const secondScore = baseline.sortedByBottleneck[1] ? baseline.sortedByBottleneck[1].score : 0;
        const margin = Math.max(0, topScore - secondScore);
        const knownIds = Object.keys(baseline.stepEvals).filter(function (id) { return baseline.stepEvals[id].utilization !== null; });
        const nearSat = knownIds.filter(function (id) { return (baseline.stepEvals[id].utilization || 0) >= 0.9; }).length;
        const cascadePressure = knownIds.length > 0 ? nearSat / knownIds.length : 0;
        const wipScale = clamp(num(scenario.simulationHorizonHours, 8), 8, 24) * Math.max(1, model.stepModels.length) * 10;
        const baselineTotalWip = knownIds.reduce(function (sum, id) { return sum + (baseline.stepEvals[id].wipQty || 0); }, 0);
        const progress = clamp(elapsedHours / Math.max(0.01, baseline.horizonHours), 0, 1);
        const ramp = 0.2 + 0.8 * progress;
        const totalWipQty = baselineTotalWip * ramp;
        const wipPressure = clamp(totalWipQty / Math.max(1, wipScale), 0, 1);
        const migrationPenalty = baseline.bottleneckStepId !== relief.bottleneckStepId ? 0.08 : 0;
        const brittleness = clamp(
          0.48 * topScore +
            0.18 * baseline.avgQueueRisk +
            0.16 * cascadePressure +
            0.18 * wipPressure +
            migrationPenalty +
            (margin < 0.08 ? 0.06 : 0) -
            margin * 0.3,
          0,
          1
        );
        const labels = new Map(model.graph.nodes.map(function (node) { return [node.id, node.label]; }));
        const completedTotal = baseline.throughput * elapsedHours;
        const nodeMetrics = {};
        model.stepModels.forEach(function (step) {
          const evalStep = baseline.stepEvals[step.stepId] || {};
          nodeMetrics[step.stepId] = {
            utilization: evalStep.utilization,
            headroom: evalStep.headroom,
            queueRisk: evalStep.queueRisk,
            queueDepth: evalStep.queueDepth == null ? null : evalStep.queueDepth * ramp,
            wipQty: evalStep.wipQty == null ? null : evalStep.wipQty * ramp,
            completedQty: completedTotal,
            capacityPerHour: evalStep.capacityPerHour == null ? null : evalStep.capacityPerHour,
            bottleneckIndex: evalStep.bottleneckIndex,
            bottleneckFlag: step.stepId === baseline.bottleneckStepId,
            status: step.stepId === baseline.bottleneckStepId ? "critical" : (evalStep.status || "unknown")
          };
        });
        return {
          globalMetrics: {
            simElapsedHours: elapsedHours,
            forecastThroughput: baseline.throughput,
            totalCompletedOutputPieces: completedTotal,
            totalWipQty: totalWipQty,
            worstCaseTouchTime: baseline.worstCaseTouchTime,
            throughputDelta: relief.throughput - baseline.throughput,
            bottleneckMigration: (labels.get(baseline.bottleneckStepId) || baseline.bottleneckStepId) + " -> " + (labels.get(relief.bottleneckStepId) || relief.bottleneckStepId || "n/a"),
            bottleneckIndex: topScore,
            brittleness: brittleness
          },
          nodeMetrics: nodeMetrics
        };
      }

      function bindParameterGroupsToForecast(groups, forecastModel) {
        const inputMap = new Map((forecastModel.inputs || []).map(function (input) { return [input.key, input]; }));
        return (groups || []).map(function (group) {
          return Object.assign({}, group, {
            fields: (group.fields || []).map(function (field) {
              const input = inputMap.get(field.key);
              if (!input) return field;
              return Object.assign({}, field, {
                type: input.type === "select" ? "dropdown" : field.type,
                min: typeof input.min === "number" ? input.min : field.min,
                max: typeof input.max === "number" ? input.max : field.max,
                step: typeof input.step === "number" ? input.step : field.step,
                options: input.options || field.options,
                defaultValue: (forecastModel.inputDefaults || {})[field.key] != null ? (forecastModel.inputDefaults || {})[field.key] : (input.defaultValue != null ? input.defaultValue : field.defaultValue)
              });
            })
          });
        });
      }

      function getDefaultScenario(groups, inputDefaults) {
        const scenario = {};
        groups.forEach(function (group) {
          (group.fields || []).forEach(function (field) {
            scenario[field.key] = inputDefaults[field.key] != null ? inputDefaults[field.key] : field.defaultValue;
          });
        });
        return scenario;
      }

      function formatValue(value, format, decimals) {
        const d = typeof decimals === "number" ? decimals : 1;
        if (typeof value === "string") return value;
        if (typeof value !== "number") return "--";
        if (format === "percent") return (value * 100).toFixed(d) + "%";
        if (format === "delta") return (value >= 0 ? "+" : "") + value.toFixed(d);
        if (format === "duration") return value.toFixed(d) + " min";
        return value.toFixed(d);
      }

      const parameterGroups = bindParameterGroupsToForecast(DASHBOARD_CONFIG.parameterGroups || [], MODEL);
      const defaultScenario = Object.assign({}, getDefaultScenario(parameterGroups, MODEL.inputDefaults || {}), BASE_SCENARIO || {});
      let scenario = Object.assign({}, defaultScenario);
      let isPaused = true;
      let speed = 1;
      let elapsed = 0;
      let lastTick = performance.now();
      const titleEl = document.getElementById("title");
      const subtitleEl = document.getElementById("subtitle");
      const paramsEl = document.getElementById("params");
      const kpiEl = document.getElementById("kpiRow");
      const diagnosisEl = document.getElementById("diagnosis");
      const flowEl = document.getElementById("flow");
      const simTimeEl = document.getElementById("simTime");
      const livePillEl = document.getElementById("livePill");
      const startPauseEl = document.getElementById("startPause");

      function horizonHours() {
        return clamp(Math.round(num(scenario.simulationHorizonHours, 8)), 8, 24);
      }

      function renderParams() {
        let html = "<h3 style=\\"margin:0 0 8px;\\">Parameters</h3>";
        parameterGroups.forEach(function (group) {
          html += "<div class=\\"group-title\\">" + group.label + "</div>";
          (group.fields || []).forEach(function (field) {
            const raw = scenario[field.key] != null ? scenario[field.key] : field.defaultValue;
            const valueLabel = (typeof raw === "number" ? raw : String(raw)) + (field.unit ? " " + field.unit : "");
            html += "<div class=\\"field\\">";
            html += "<label>" + field.label + "</label>";
            html += "<div class=\\"value\\">" + valueLabel + "</div>";
            if (field.type === "dropdown") {
              html += "<select data-key=\\"" + field.key + "\\">";
              (field.options || []).forEach(function (option) {
                const selected = String(raw) === String(option) ? " selected" : "";
                html += "<option value=\\"" + option + "\\""+ selected +">" + option + "</option>";
              });
              html += "</select>";
            } else if (field.type === "slider") {
              html += "<input data-key=\\"" + field.key + "\\" type=\\"range\\" min=\\"" + (field.min != null ? field.min : 0) + "\\" max=\\"" + (field.max != null ? field.max : 100) + "\\" step=\\"" + (field.step != null ? field.step : 1) + "\\" value=\\"" + Number(raw) + "\\" />";
            } else {
              html += "<input data-key=\\"" + field.key + "\\" type=\\"number\\" min=\\"" + (field.min != null ? field.min : "") + "\\" max=\\"" + (field.max != null ? field.max : "") + "\\" step=\\"" + (field.step != null ? field.step : "any") + "\\" value=\\"" + Number(raw) + "\\" />";
            }
            html += "</div>";
          });
        });
        paramsEl.innerHTML = html;
        paramsEl.querySelectorAll("input[data-key],select[data-key]").forEach(function (el) {
          el.addEventListener("input", function (event) {
            const target = event.target;
            const key = target.getAttribute("data-key");
            if (!key) return;
            if (target.tagName === "SELECT") {
              scenario[key] = target.value;
            } else {
              scenario[key] = Number(target.value);
            }
            render();
          });
        });
      }

      function renderKpis(metrics) {
        const kpis = DASHBOARD_CONFIG.kpis || [];
        let html = "";
        kpis.forEach(function (kpi) {
          const value = metrics[kpi.key] != null ? metrics[kpi.key] : 0;
          html += "<article class=\\"kpi\\"><div class=\\"label\\">" + kpi.label + "</div><div class=\\"value\\">" + formatValue(value, kpi.format, kpi.decimals) + "</div></article>";
        });
        kpiEl.innerHTML = html;
      }

      function renderDiagnosis() {
        if (!DIAGNOSIS) {
          diagnosisEl.textContent = "Operational diagnosis not included in this bundle.";
          return;
        }
        diagnosisEl.innerHTML =
          "<div class=\\"diagnosis-grid\\">" +
          "<article class=\\"diagnosis-card\\"><h3>Operational Diagnosis</h3><p>" + DIAGNOSIS.statusSummary + "</p></article>" +
          "<article class=\\"diagnosis-card\\"><h3>Primary Constraint</h3><p>" + DIAGNOSIS.primaryConstraint + "</p></article>" +
          "<article class=\\"diagnosis-card\\"><h3>Constraint Mechanism</h3><p>" + DIAGNOSIS.constraintMechanism + "</p></article>" +
          "<article class=\\"diagnosis-card\\"><h3>Recommended Action</h3><p>" + DIAGNOSIS.recommendedAction + "</p></article>" +
          "</div>" +
          "<div class=\\"diagnosis-grid\\" style=\\"margin-top:10px\\">" +
          "<article class=\\"diagnosis-card\\"><h3>Downstream Effects</h3><p>" + DIAGNOSIS.downstreamEffects + "</p></article>" +
          "<article class=\\"diagnosis-card\\"><h3>Economic Interpretation</h3><p>" + DIAGNOSIS.economicInterpretation + "</p></article>" +
          "<article class=\\"diagnosis-card\\"><h3>Scenario Guidance</h3><p>" + DIAGNOSIS.scenarioGuidance + "</p></article>" +
          "<article class=\\"diagnosis-card\\"><h3>Confidence</h3><p>" + DIAGNOSIS.confidence + " - " + DIAGNOSIS.confidenceNote + "</p></article>" +
          "</div>" +
          "<article class=\\"diagnosis-card\\" style=\\"margin-top:10px\\"><h3>AI Opportunity Lens</h3><ul>" +
          "<li><strong>Data already exists but is underused:</strong> " + DIAGNOSIS.aiOpportunityLens.dataAlreadyExists + "</li>" +
          "<li><strong>Manual but pattern-based decisions:</strong> " + DIAGNOSIS.aiOpportunityLens.manualPatternDecisions + "</li>" +
          "<li><strong>Backward-looking vs predictive gap:</strong> " + DIAGNOSIS.aiOpportunityLens.predictiveGap + "</li>" +
          "<li><strong>Tribal knowledge / email as database:</strong> " + DIAGNOSIS.aiOpportunityLens.tribalKnowledge + "</li>" +
          "<li><strong>Visibility gaps causing profit leakage:</strong> " + DIAGNOSIS.aiOpportunityLens.visibilityGap + "</li>" +
          "</ul></article>";
      }

      function renderFlow(output) {
        let html = "";
        const edges = MODEL.graph.edges || [];
        const edgeSet = new Set(edges.map(function (edge) { return edge.from + "->" + edge.to; }));
        MODEL.graph.nodes.forEach(function (node, index) {
          const metrics = output.nodeMetrics[node.id] || {};
          const utilRatio = typeof metrics.utilization === "number" ? clamp(metrics.utilization, 0, 1.35) : 0;
          const util = typeof metrics.utilization === "number" ? (metrics.utilization * 100).toFixed(1) + "%" : "--";
          const wip = typeof metrics.wipQty === "number" ? Math.round(metrics.wipQty) + " pcs" : "--";
          const completed = typeof metrics.completedQty === "number" ? Math.round(metrics.completedQty) + " pcs" : "--";
          const queueDepth = typeof metrics.queueDepth === "number" ? metrics.queueDepth : 0;
          const status = metrics.status || "unknown";
          const klass = status === "critical" ? "critical" : (status === "risk" ? "risk" : "");
          const pulse = status === "critical" ? 0.85 : (status === "risk" ? 1.2 : 1.9);
          const wipBarPct = clamp((queueDepth / 14) * 100, 0, 100);
          const delay = (index * 0.11).toFixed(2);
          html += "<article class=\\"node " + klass + "\\" style=\\"--util:" + utilRatio.toFixed(3) + ";--pulse:" + pulse.toFixed(2) + "s;--delay:" + delay + "s;\\">";
          html += "<h4>" + node.label + "</h4>";
          html += "<p class=\\"muted\\">PROCESS</p>";
          html += "<p>util: " + util + "</p>";
          html += "<p>lot/wip: " + wip + "</p>";
          html += "<p>Completed Lot: " + completed + "</p>";
          html += "<p>status: " + status + "</p>";
          html += "<div class=\\"wip-bar\\"><span class=\\"wip-fill\\" style=\\"width:" + wipBarPct.toFixed(1) + "%\\"></span></div>";
          html += "</article>";
          if (index < MODEL.graph.nodes.length - 1) {
            const next = MODEL.graph.nodes[index + 1];
            const prob = edgeSet.has(node.id + "->" + next.id) ? "100%" : "";
            html += "<div class=\\"arrow\\" style=\\"--delay:" + delay + "s\\">" + prob + " -></div>";
          }
        });
        flowEl.innerHTML = html;
      }

      function render() {
        titleEl.textContent = DASHBOARD_CONFIG.appTitle || "Forecast Export Cockpit";
        subtitleEl.textContent = DASHBOARD_CONFIG.subtitle || "Constraint forecast (non-DES)";
        const output = createOutput(MODEL, scenario, elapsed);
        renderKpis(output.globalMetrics);
        renderFlow(output);
        flowEl.classList.toggle("live", !isPaused);
        simTimeEl.textContent = elapsed.toFixed(2) + " / " + horizonHours() + " h";
        livePillEl.textContent = isPaused ? "Paused" : "Live";
        startPauseEl.textContent = isPaused ? "Start" : "Pause";
      }

      document.querySelectorAll("[data-speed]").forEach(function (button) {
        button.addEventListener("click", function () {
          speed = Number(button.getAttribute("data-speed") || "1");
          document.querySelectorAll("[data-speed]").forEach(function (b) { b.classList.remove("active"); });
          button.classList.add("active");
        });
      });

      document.getElementById("startPause").addEventListener("click", function () {
        isPaused = !isPaused;
        if (!isPaused && elapsed >= horizonHours() - 1e-6) {
          elapsed = 0;
        }
        render();
      });

      document.getElementById("resetBtn").addEventListener("click", function () {
        scenario = Object.assign({}, defaultScenario);
        isPaused = true;
        speed = 1;
        elapsed = 0;
        document.querySelectorAll("[data-speed]").forEach(function (b) { b.classList.remove("active"); });
        const speedOne = document.querySelector("[data-speed='1']");
        if (speedOne) speedOne.classList.add("active");
        renderParams();
        render();
      });

      function loop(now) {
        const delta = (now - lastTick) / 1000;
        lastTick = now;
        if (!isPaused) {
          elapsed = Math.min(horizonHours(), elapsed + delta * BASE_SIM_HOURS_PER_SECOND * speed);
          if (elapsed >= horizonHours() - 1e-6) {
            isPaused = true;
          }
          render();
        }
        requestAnimationFrame(loop);
      }

      renderParams();
      renderDiagnosis();
      render();
      requestAnimationFrame(function (now) {
        lastTick = now;
        requestAnimationFrame(loop);
      });
    })();
  </script>
</body>
</html>
`;
}

function deriveDefaultScenario(compiledModel, dashboardConfig) {
  const scenario = { ...(compiledModel.inputDefaults ?? {}) };
  const hasHorizon = Object.prototype.hasOwnProperty.call(scenario, "simulationHorizonHours");
  if (!hasHorizon) {
    const groups = Array.isArray(dashboardConfig.parameterGroups) ? dashboardConfig.parameterGroups : [];
    for (const group of groups) {
      const fields = Array.isArray(group.fields) ? group.fields : [];
      for (const field of fields) {
        if (field?.key === "simulationHorizonHours") {
          scenario.simulationHorizonHours = field.defaultValue ?? "8";
        }
      }
    }
  }
  return scenario;
}

const args = parseArgs(process.argv.slice(2));
const now = new Date();
const name = args.name ? String(args.name) : "scenario";
const includeMetrics = asBoolean(args.includeMetrics, true);
const includeFullApp = asBoolean(args.includeFullApp, true);
const skipBuild = asBoolean(args.skipBuild, true);

const repoRoot = process.cwd();
const exportsRoot = path.join(repoRoot, "exports");
fs.mkdirSync(exportsRoot, { recursive: true });

const folderBase = `${formatTimestamp(now)}_${sanitizeName(name)}`;
const { folderName, folderPath } = ensureUniqueDirectory(exportsRoot, folderBase);

const dashboardConfigPath = path.join(repoRoot, "models", "dashboard_config.json");
const vsmGraphPath = path.join(repoRoot, "models", "active", "vsm_graph.json");
const masterDataPath = path.join(repoRoot, "models", "active", "master_data.json");
const compiledPath = path.join(repoRoot, "models", "active", "compiled_forecast_model.json");

const dashboardConfig = readJson(dashboardConfigPath);
const vsmGraph = readJson(vsmGraphPath);
const masterData = readJson(masterDataPath);
const compiledForecast = readJson(compiledPath);

const scenarioPath = args.scenario ? path.resolve(String(args.scenario)) : null;
const metricsPath = args.metrics ? path.resolve(String(args.metrics)) : null;

const scenarioCommitted = scenarioPath
  ? readJson(scenarioPath)
  : deriveDefaultScenario(compiledForecast, dashboardConfig);
const resultMetrics = metricsPath
  ? readJson(metricsPath)
  : {
      globalMetrics: compiledForecast.baseline?.globalMetrics ?? {},
      nodeMetrics: compiledForecast.baseline?.nodeMetrics ?? {}
    };
const metricsExportPath = path.join(folderPath, "result_metrics.json");
const diagnosisJsonPath = path.join(folderPath, "operational_diagnosis.json");
const diagnosisMdPath = path.join(folderPath, "operational_diagnosis.md");

writeJson(path.join(folderPath, "dashboard_config.json"), dashboardConfig);
writeJson(path.join(folderPath, "vsm_graph.json"), vsmGraph);
writeJson(path.join(folderPath, "master_data.json"), masterData);
writeJson(path.join(folderPath, "compiled_forecast_model.json"), compiledForecast);
writeJson(path.join(folderPath, "scenario_committed.json"), scenarioCommitted);
if (includeMetrics) {
  writeJson(metricsExportPath, resultMetrics);
} else {
  writeJson(metricsExportPath, resultMetrics);
}
const operationalDiagnosis = buildOperationalDiagnosis(compiledForecast, resultMetrics, scenarioCommitted);
writeJson(diagnosisJsonPath, operationalDiagnosis);
fs.writeFileSync(diagnosisMdPath, `${toOperationalDiagnosisMarkdown(operationalDiagnosis)}\n`, "utf8");
if (!includeMetrics) {
  fs.rmSync(metricsExportPath);
}
fs.writeFileSync(path.join(folderPath, "run_forecast.mjs"), buildPortableRunnerSource(), "utf8");
fs.writeFileSync(
  path.join(folderPath, "browser_forecast.html"),
  buildBrowserForecastHtmlSource(dashboardConfig, compiledForecast, scenarioCommitted, operationalDiagnosis),
  "utf8"
);
if (includeFullApp) {
  createFullAppPackage(repoRoot, folderPath, {
    dashboardConfig,
    vsmGraph,
    masterData,
    compiledForecast,
    operationalDiagnosis,
    scenarioCommitted,
    skipBuild
  });
}
fs.writeFileSync(
  path.join(folderPath, "README.md"),
  buildReadme(folderName, includeMetrics, includeFullApp),
  "utf8"
);

const relative = path.relative(repoRoot, folderPath);
console.log(`Export complete: ${relative}`);
console.log(`Bundle path: ${folderPath}`);
