import path from "node:path";
import { spawnSync } from "node:child_process";

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

function runNodeScript(repoRoot, scriptPath, args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    stdio: "inherit"
  });
  if (result.error) {
    throw result.error;
  }
  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`${path.basename(scriptPath)} failed with exit code ${result.status}`);
  }
}

const args = parseArgs(process.argv.slice(2));
const repoRoot = process.cwd();
const activeDir = path.resolve(repoRoot, String(args.activeDir ?? path.join("models", "active")));
const compiledModelPath = path.join(activeDir, "compiled_forecast_model.json");
const scenarioPath = path.join(activeDir, "scenario_committed.json");
const metricsPath = path.join(activeDir, "result_metrics.json");
const diagnosisJsonPath = path.join(activeDir, "operational_diagnosis.json");
const diagnosisMdPath = path.join(activeDir, "operational_diagnosis.md");
const consultingReportJsonPath = path.join(activeDir, "consulting_report_export.json");
const consultingReportMdPath = path.join(activeDir, "consulting_report_export.md");
const consultingReportHtmlPath = path.join(activeDir, "consulting_report_export.html");

console.log(`Refreshing accepted forecast artifacts in: ${activeDir}`);

runNodeScript(repoRoot, path.join("scripts", "compile-forecast-model.mjs"), [activeDir]);
runNodeScript(repoRoot, path.join("scripts", "generate-result-metrics.mjs"), [
  "--model",
  compiledModelPath,
  "--scenario",
  scenarioPath,
  "--out",
  metricsPath
]);
runNodeScript(repoRoot, path.join("scripts", "generate-operational-diagnosis.mjs"), [
  "--model",
  compiledModelPath,
  "--scenario",
  scenarioPath,
  "--metrics",
  metricsPath,
  "--outJson",
  diagnosisJsonPath,
  "--outMd",
  diagnosisMdPath
]);
runNodeScript(repoRoot, path.join("scripts", "export-consulting-report.mjs"), [
  "--model",
  compiledModelPath,
  "--scenario",
  scenarioPath,
  "--metrics",
  metricsPath,
  "--diagnosis",
  diagnosisJsonPath,
  "--diagnosisMd",
  diagnosisMdPath,
  "--outJson",
  consultingReportJsonPath,
  "--outMd",
  consultingReportMdPath,
  "--outHtml",
  consultingReportHtmlPath
]);

console.log("Accepted forecast artifacts refreshed.");
