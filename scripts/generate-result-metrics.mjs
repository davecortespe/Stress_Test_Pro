import fs from "node:fs";
import path from "node:path";
import { loadForecastModules } from "./load-forecast-modules.mjs";

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

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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

function withCompatibilityMetrics(output) {
  return {
    ...output,
    globalMetrics: {
      ...output.globalMetrics,
      globalThroughput: output.globalMetrics?.forecastThroughput ?? 0
    }
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const modelPath = path.resolve(String(args.model ?? path.join("models", "active", "compiled_forecast_model.json")));
  const scenarioPath = path.resolve(String(args.scenario ?? path.join("models", "active", "scenario_committed.json")));
  const outPath = args.out
    ? path.resolve(String(args.out))
    : path.resolve(path.dirname(scenarioPath), "result_metrics.json");

  const model = readJson(modelPath);
  const scenario = readJson(scenarioPath);
  const elapsedHours = args.elapsedHours
    ? num(args.elapsedHours, num(scenario.simulationHorizonHours, 168))
    : num(scenario.simulationHorizonHours, 168);

  const { createBottleneckForecastOutput } = await loadForecastModules();
  const output = withCompatibilityMetrics(createBottleneckForecastOutput(model, scenario, elapsedHours));

  writeJson(outPath, output);
  console.log(`Result metrics written: ${outPath}`);
}

await main();
