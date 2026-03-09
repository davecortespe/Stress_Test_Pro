import fs from "node:fs";
import path from "node:path";

const modelsDir = process.argv[2] ?? "models";
const compiledPath = path.join(modelsDir, "compiled_sim_spec.json");
const dashboardPath = path.join(modelsDir, "dashboard_config.json");

const errors = [];

if (!fs.existsSync(compiledPath)) {
  errors.push(`${compiledPath} is missing.`);
}
if (!fs.existsSync(dashboardPath)) {
  errors.push(`${dashboardPath} is missing.`);
}

if (errors.length === 0) {
  const compiled = JSON.parse(fs.readFileSync(compiledPath, "utf8"));
  const dashboard = JSON.parse(fs.readFileSync(dashboardPath, "utf8"));

  if (!compiled.graph || !Array.isArray(compiled.graph.nodes)) {
    errors.push("compiled_sim_spec.json.graph.nodes is missing or invalid.");
  }
  if (!compiled.masterData || !Array.isArray(compiled.masterData.processing)) {
    errors.push("compiled_sim_spec.json.masterData.processing is missing or invalid.");
  }
  if (!dashboard.parameterGroups || !Array.isArray(dashboard.parameterGroups)) {
    errors.push("dashboard_config.json.parameterGroups is missing or invalid.");
  }
  if (!dashboard.kpis || !Array.isArray(dashboard.kpis)) {
    errors.push("dashboard_config.json.kpis is missing or invalid.");
  }
}

if (errors.length > 0) {
  console.error("Model validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Model validation passed.");

