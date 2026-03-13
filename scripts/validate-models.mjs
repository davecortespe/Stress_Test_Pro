import fs from "node:fs";
import path from "node:path";

const modelsDir = process.argv[2] ?? "models";
const dashboardPath = path.join(modelsDir, "dashboard_config.json");
const compiledSimPath = path.join(modelsDir, "compiled_sim_spec.json");
const activeCompiledForecastPath = path.join(modelsDir, "active", "compiled_forecast_model.json");
const activeGraphPath = path.join(modelsDir, "active", "vsm_graph.json");
const activeMasterPath = path.join(modelsDir, "active", "master_data.json");

const errors = [];

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

if (!exists(dashboardPath)) {
  errors.push(`${dashboardPath} is missing.`);
}

if (!exists(compiledSimPath) && !exists(activeCompiledForecastPath)) {
  errors.push("Neither models/compiled_sim_spec.json nor models/active/compiled_forecast_model.json is present.");
}

if (exists(compiledSimPath)) {
  const compiledSim = readJson(compiledSimPath);
  if (!compiledSim.graph || !Array.isArray(compiledSim.graph.nodes)) {
    errors.push("compiled_sim_spec.json.graph.nodes is missing or invalid.");
  }
  if (!compiledSim.masterData || !Array.isArray(compiledSim.masterData.processing)) {
    errors.push("compiled_sim_spec.json.masterData.processing is missing or invalid.");
  }
}

if (exists(activeCompiledForecastPath)) {
  const compiledForecast = readJson(activeCompiledForecastPath);
  if (!compiledForecast.graph || !Array.isArray(compiledForecast.graph.nodes)) {
    errors.push("models/active/compiled_forecast_model.json.graph.nodes is missing or invalid.");
  }
  if (!Array.isArray(compiledForecast.stepModels) || compiledForecast.stepModels.length === 0) {
    errors.push("models/active/compiled_forecast_model.json.stepModels is missing or invalid.");
  }
  if (!compiledForecast.baseline || typeof compiledForecast.baseline !== "object") {
    errors.push("models/active/compiled_forecast_model.json.baseline is missing or invalid.");
  }
  if (!compiledForecast.inputDefaults || typeof compiledForecast.inputDefaults !== "object") {
    errors.push("models/active/compiled_forecast_model.json.inputDefaults is missing or invalid.");
  }
}

if (exists(activeGraphPath)) {
  const graph = readJson(activeGraphPath);
  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    errors.push("models/active/vsm_graph.json.nodes is missing or invalid.");
  }
  if (!Array.isArray(graph.edges)) {
    errors.push("models/active/vsm_graph.json.edges is missing or invalid.");
  }
}

if (exists(activeMasterPath)) {
  const master = readJson(activeMasterPath);
  if (!Array.isArray(master.processing) || master.processing.length === 0) {
    errors.push("models/active/master_data.json.processing is missing or invalid.");
  }
}

if (exists(dashboardPath)) {
  const dashboard = readJson(dashboardPath);
  if (!Array.isArray(dashboard.parameterGroups)) {
    errors.push("dashboard_config.json.parameterGroups is missing or invalid.");
  }
  if (!Array.isArray(dashboard.kpis)) {
    errors.push("dashboard_config.json.kpis is missing or invalid.");
  }
}

if (errors.length > 0) {
  console.error("Model validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Model validation passed.");
