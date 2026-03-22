import fs from "node:fs";
import path from "node:path";
import {
  buildConsultingReportExport,
  writeConsultingReportExport
} from "./consulting-report-export.mjs";

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

const args = parseArgs(process.argv.slice(2));
const repoRoot = process.cwd();
const dashboardConfigPath = path.resolve(
  String(args.dashboardConfig ?? path.join(repoRoot, "models", "dashboard_config.json"))
);
const compiledForecastPath = path.resolve(
  String(args.model ?? path.join(repoRoot, "models", "active", "compiled_forecast_model.json"))
);
const scenarioCommittedPath = path.resolve(
  String(args.scenario ?? path.join(repoRoot, "models", "active", "scenario_committed.json"))
);
const resultMetricsPath = path.resolve(
  String(args.metrics ?? path.join(repoRoot, "models", "active", "result_metrics.json"))
);
const operationalDiagnosisPath = path.resolve(
  String(args.diagnosis ?? path.join(repoRoot, "models", "active", "operational_diagnosis.json"))
);
const operationalDiagnosisMarkdownPath = path.resolve(
  String(args.diagnosisMd ?? path.join(repoRoot, "models", "active", "operational_diagnosis.md"))
);
const outJsonPath = path.resolve(
  String(args.outJson ?? path.join(repoRoot, "models", "active", "consulting_report_export.json"))
);
const outMarkdownPath = path.resolve(
  String(args.outMd ?? path.join(repoRoot, "models", "active", "consulting_report_export.md"))
);
const outHtmlPath = path.resolve(
  String(args.outHtml ?? path.join(repoRoot, "models", "active", "consulting_report_export.html"))
);

const spec = buildConsultingReportExport({
  dashboardConfig: readJson(dashboardConfigPath),
  compiledForecast: readJson(compiledForecastPath),
  scenarioCommitted: readJsonIfExists(scenarioCommittedPath),
  resultMetrics: readJsonIfExists(resultMetricsPath),
  operationalDiagnosis: readJsonIfExists(operationalDiagnosisPath),
  sourceArtifacts: {
    dashboardConfigPath: path.relative(repoRoot, dashboardConfigPath).replace(/\\/g, "/"),
    compiledForecastPath: path.relative(repoRoot, compiledForecastPath).replace(/\\/g, "/"),
    scenarioCommittedPath: path.relative(repoRoot, scenarioCommittedPath).replace(/\\/g, "/"),
    resultMetricsPath: path.relative(repoRoot, resultMetricsPath).replace(/\\/g, "/"),
    operationalDiagnosisPath: path.relative(repoRoot, operationalDiagnosisPath).replace(/\\/g, "/"),
    operationalDiagnosisMarkdownPath: path.relative(repoRoot, operationalDiagnosisMarkdownPath).replace(/\\/g, "/"),
    operationalDiagnosisMarkdown: fs.existsSync(operationalDiagnosisMarkdownPath)
      ? fs.readFileSync(operationalDiagnosisMarkdownPath, "utf8")
      : null
  }
});

writeConsultingReportExport({
  outJsonPath,
  outMarkdownPath,
  outHtmlPath,
  spec
});

console.log(`Consulting report export JSON written: ${outJsonPath}`);
console.log(`Consulting report export Markdown written: ${outMarkdownPath}`);
console.log(`Consulting report export HTML written: ${outHtmlPath}`);
