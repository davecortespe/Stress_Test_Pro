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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sanitizeName(input) {
  const trimmed = String(input ?? "")
    .trim()
    .toLowerCase();
  const compact = trimmed.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return compact.length > 0 ? compact.slice(0, 48) : "replit-deploy";
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

function runBuild(repoRoot) {
  const command = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npm";
  const args = process.platform === "win32" ? ["/d", "/s", "/c", "npm.cmd run build"] : ["run", "build"];
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit"
  });
  if (result.error) {
    throw result.error;
  }
  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`npm run build failed with exit code ${result.status}`);
  }
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
const port = Number(args.port || process.env.PORT || 3000);
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

function buildReplitPackageJson() {
  return {
    name: "forecast-export-replit",
    private: true,
    version: "0.1.0",
    type: "module",
    scripts: {
      start: "node server.mjs --root app"
    }
  };
}

function buildReplitReadme({ publishName, targetRelative }) {
  return `# Replit Deploy Bundle

This folder is a stable deployment target for Replit, published on demand from the current accepted simulator state.
The packaged forecast is deterministic math with a transient runtime-flow overlay, not a full discrete-event simulation.

## Publish target

- Name: \`${publishName}\`
- Folder: \`${targetRelative}\`

## Replit usage

1. Connect the repository in Replit.
2. Set the run command to:
   \`npm run start:replit-bundle\`
3. If you prefer to run from this folder directly, use:
   \`cd deploy/replit && npm start\`

## Included artifacts

- \`app/\` full exported web app
- \`server.mjs\` static Node server
- \`dashboard_config.json\`
- \`vsm_graph.json\`
- \`master_data.json\`
- \`compiled_forecast_model.json\`
- \`scenario_committed.json\`
- \`result_metrics.json\`
- \`operational_diagnosis.json\`
- \`operational_diagnosis.md\`
- \`publish_manifest.json\`

## Notes

- This target is intentionally stable and overwriteable. Re-publishing replaces the prior Replit deploy snapshot.
- Run \`npm run export:replit\` whenever you want to refresh the Replit deployment with a newly accepted scenario.
- `result_metrics.json` may include \`throughputState\`, \`warmupHours\`, and \`warnings\` when runtime output is transient or confidence is degraded.
- `nodeMetrics.processedQty` is pass-through volume per step, while `nodeMetrics.completedQty` is terminal completions only.
`;
}

function createFullAppPackage(targetPath, { dashboardConfig, vsmGraph, masterData, compiledForecast, operationalDiagnosis, scenarioCommitted }) {
  const distPath = path.join(process.cwd(), "dist");
  if (!fs.existsSync(distPath)) {
    throw new Error("dist/ is missing. Run npm run build before exporting for Replit.");
  }

  const appPath = path.join(targetPath, "app");
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
}

const args = parseArgs(process.argv.slice(2));
const repoRoot = process.cwd();
const publishName = sanitizeName(args.name ?? "replit-deploy");
const skipBuild = asBoolean(args.skipBuild, true);
const targetPath = path.resolve(repoRoot, String(args.target ?? path.join("deploy", "replit")));

if (!skipBuild) {
  runBuild(repoRoot);
}

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
const operationalDiagnosis =
  readJsonIfExists(activeDiagnosisJsonPath) ??
  buildOperationalDiagnosis(compiledForecast, resultMetrics, scenarioCommitted);
const operationalDiagnosisMarkdown = fs.existsSync(activeDiagnosisMdPath)
  ? fs.readFileSync(activeDiagnosisMdPath, "utf8").trim()
  : toOperationalDiagnosisMarkdown(operationalDiagnosis);

fs.rmSync(targetPath, { recursive: true, force: true });
fs.mkdirSync(targetPath, { recursive: true });

writeJson(path.join(targetPath, "dashboard_config.json"), dashboardConfig);
writeJson(path.join(targetPath, "vsm_graph.json"), vsmGraph);
writeJson(path.join(targetPath, "master_data.json"), masterData);
writeJson(path.join(targetPath, "compiled_forecast_model.json"), compiledForecast);
writeJson(path.join(targetPath, "scenario_committed.json"), scenarioCommitted);
writeJson(path.join(targetPath, "result_metrics.json"), resultMetrics);
writeJson(path.join(targetPath, "operational_diagnosis.json"), operationalDiagnosis);
fs.writeFileSync(
  path.join(targetPath, "operational_diagnosis.md"),
  `${operationalDiagnosisMarkdown}\n`,
  "utf8"
);
writeJson(path.join(targetPath, "package.json"), buildReplitPackageJson());
writeJson(path.join(targetPath, "publish_manifest.json"), {
  name: publishName,
  target: path.relative(repoRoot, targetPath).replace(/\\/g, "/"),
  generatedAt: new Date().toISOString(),
  runCommand: "npm run start:replit-bundle"
});
fs.writeFileSync(
  path.join(targetPath, "README.md"),
  buildReplitReadme({
    publishName,
    targetRelative: path.relative(repoRoot, targetPath).replace(/\\/g, "/")
  }),
  "utf8"
);
fs.writeFileSync(path.join(targetPath, "server.mjs"), buildBundleServerSource(), "utf8");

createFullAppPackage(targetPath, {
  dashboardConfig,
  vsmGraph,
  masterData,
  compiledForecast,
  operationalDiagnosis,
  scenarioCommitted
});

console.log(`Replit bundle ready: ${path.relative(repoRoot, targetPath)}`);
console.log(`Run from repo root with: npm run start:replit-bundle`);
