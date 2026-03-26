import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadForecastModules } from "./load-forecast-modules.mjs";
import {
  buildConsultingReportExport,
  consultingReportExportToHtml,
  consultingReportExportToMarkdown
} from "./consulting-report-export.mjs";
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

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
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
The forecast engine is deterministic math with a transient runtime-flow overlay, not a full discrete-event simulation.
The default simulation horizon is 1 week (168 hours) unless the committed scenario overrides it.

## Run

### Browser cockpit (recommended)

Open \`browser_forecast.html\` in your browser.
Playback presets in the exported cockpit include \`x1\`, \`x2\`, \`x5\`, \`x100\`, \`x200\`, and \`x1000\`.
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
- \`consulting_report_export.json\`
- \`consulting_report_export.md\`
- \`consulting_report_export.html\`
- \`README.md\`
${fullAppFiles}
${metricsLine}

## Metric semantics

- \`forecastThroughput\` may be steady-state, transient, or fallback-analytical. Check \`globalMetrics.throughputState\`.
- \`globalMetrics.warmupHours\` estimates when runtime throughput should be treated as warmed up and may be \`"unbounded"\` for non-absorbing cycles.
- \`warnings[]\` flags degraded-confidence conditions such as cyclic graphs or transient runtime output.
- \`queueRisk\` is an equivalent single-server wait-probability approximation: \`P(wait) ~= rho\`. It is theory-based, but not a full network waiting model across arbitrary routing or blocking.
- \`nodeMetrics.processedQty\` is pass-through volume at a step over elapsed time.
- \`nodeMetrics.completedQty\` is terminal completions only.
- Edge badges in the browser cockpit represent \`processedQty\` pass-through lots between steps.
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

function deriveDefaultScenario(compiledModel, dashboardConfig) {
  const scenario = { ...(compiledModel.inputDefaults ?? {}) };
  const hasHorizon = Object.prototype.hasOwnProperty.call(scenario, "simulationHorizonHours");
  if (!hasHorizon) {
    const groups = Array.isArray(dashboardConfig.parameterGroups) ? dashboardConfig.parameterGroups : [];
    for (const group of groups) {
      const fields = Array.isArray(group.fields) ? group.fields : [];
      for (const field of fields) {
        if (field?.key === "simulationHorizonHours") {
          scenario.simulationHorizonHours = field.defaultValue ?? "168";
        }
      }
    }
  }
  return scenario;
}

async function main() {
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
  const activeScenarioPath = path.join(repoRoot, "models", "active", "scenario_committed.json");
  const activeMetricsPath = path.join(repoRoot, "models", "active", "result_metrics.json");
  const activeDiagnosisJsonPath = path.join(repoRoot, "models", "active", "operational_diagnosis.json");
  const activeDiagnosisMdPath = path.join(repoRoot, "models", "active", "operational_diagnosis.md");

  const dashboardConfig = readJson(dashboardConfigPath);
  const vsmGraph = readJson(vsmGraphPath);
  const masterData = readJson(masterDataPath);
  const compiledForecast = readJson(compiledPath);

  const scenarioPath = args.scenario ? path.resolve(String(args.scenario)) : null;
  const metricsPath = args.metrics ? path.resolve(String(args.metrics)) : null;

  const scenarioCommitted =
    (scenarioPath ? readJson(scenarioPath) : null) ??
    readJsonIfExists(activeScenarioPath) ??
    deriveDefaultScenario(compiledForecast, dashboardConfig);
  const resultMetrics =
    (metricsPath ? readJson(metricsPath) : null) ??
    readJsonIfExists(activeMetricsPath) ?? {
      globalMetrics: compiledForecast.baseline?.globalMetrics ?? {},
      nodeMetrics: compiledForecast.baseline?.nodeMetrics ?? {}
    };
  const metricsExportPath = path.join(folderPath, "result_metrics.json");
  const diagnosisJsonPath = path.join(folderPath, "operational_diagnosis.json");
  const diagnosisMdPath = path.join(folderPath, "operational_diagnosis.md");
  const consultingReportJsonPath = path.join(folderPath, "consulting_report_export.json");
  const consultingReportMdPath = path.join(folderPath, "consulting_report_export.md");
  const consultingReportHtmlPath = path.join(folderPath, "consulting_report_export.html");
  const {
    buildPortableRunnerSource: buildSourcePortableRunner,
    buildBrowserSnapshotHtmlSource: buildSourceBrowserSnapshotHtml
  } = await loadForecastModules();

  writeJson(path.join(folderPath, "dashboard_config.json"), dashboardConfig);
  writeJson(path.join(folderPath, "vsm_graph.json"), vsmGraph);
  writeJson(path.join(folderPath, "master_data.json"), masterData);
  writeJson(path.join(folderPath, "compiled_forecast_model.json"), compiledForecast);
  writeJson(path.join(folderPath, "scenario_committed.json"), scenarioCommitted);
  writeJson(metricsExportPath, resultMetrics);
  const operationalDiagnosis =
    readJsonIfExists(activeDiagnosisJsonPath) ??
    buildOperationalDiagnosis(compiledForecast, resultMetrics, scenarioCommitted);
  const operationalDiagnosisMarkdown = fs.existsSync(activeDiagnosisMdPath)
    ? fs.readFileSync(activeDiagnosisMdPath, "utf8").trim()
    : toOperationalDiagnosisMarkdown(operationalDiagnosis);
  writeJson(diagnosisJsonPath, operationalDiagnosis);
  fs.writeFileSync(diagnosisMdPath, `${operationalDiagnosisMarkdown}\n`, "utf8");
  const consultingReportExport = buildConsultingReportExport({
    dashboardConfig,
    compiledForecast,
    scenarioCommitted,
    resultMetrics: includeMetrics ? resultMetrics : null,
    operationalDiagnosis,
    sourceArtifacts: {
      dashboardConfigPath: "dashboard_config.json",
      compiledForecastPath: "compiled_forecast_model.json",
      scenarioCommittedPath: "scenario_committed.json",
      resultMetricsPath: "result_metrics.json",
      operationalDiagnosisPath: "operational_diagnosis.json",
      operationalDiagnosisMarkdownPath: "operational_diagnosis.md",
      operationalDiagnosisMarkdown
    }
  });
  writeJson(consultingReportJsonPath, consultingReportExport);
  fs.writeFileSync(consultingReportMdPath, consultingReportExportToMarkdown(consultingReportExport), "utf8");
  fs.writeFileSync(consultingReportHtmlPath, consultingReportExportToHtml(consultingReportExport), "utf8");
  if (!includeMetrics) {
    fs.rmSync(metricsExportPath);
  }
  fs.writeFileSync(path.join(folderPath, "run_forecast.mjs"), buildSourcePortableRunner(), "utf8");
  fs.writeFileSync(
    path.join(folderPath, "browser_forecast.html"),
    buildSourceBrowserSnapshotHtml(
      dashboardConfig,
      compiledForecast,
      scenarioCommitted,
      includeMetrics ? resultMetrics : null,
      operationalDiagnosis
    ),
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
}

await main();
