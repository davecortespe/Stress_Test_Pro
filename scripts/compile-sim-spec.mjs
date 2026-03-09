import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const modelsDir = args[0] && !args[0].startsWith("--") ? args[0] : "models";

const graphPath = path.join(modelsDir, "vsm_graph.json");
const masterPath = path.join(modelsDir, "master_data.json");
const dashboardPath = path.join(modelsDir, "dashboard_config.json");
const compiledPath = path.join(modelsDir, "compiled_sim_spec.json");
const checklistPath = path.join(modelsDir, "missing_data_checklist.json");

const graph = JSON.parse(fs.readFileSync(graphPath, "utf8"));
const masterData = JSON.parse(fs.readFileSync(masterPath, "utf8"));
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, "utf8"));

const checklist = [];

if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
  checklist.push({
    severity: "critical",
    code: "VSM_NODES_MISSING",
    message: "vsm_graph.json must include at least one node."
  });
}

if (!Array.isArray(graph.edges) || graph.edges.length === 0) {
  checklist.push({
    severity: "critical",
    code: "VSM_EDGES_MISSING",
    message: "vsm_graph.json must include at least one edge."
  });
}

if (!Array.isArray(masterData.products) || masterData.products.length === 0) {
  checklist.push({
    severity: "warning",
    code: "PRODUCTS_MISSING",
    message: "master_data.json should include products rows."
  });
}

const equipmentByType = new Set((masterData.equipment ?? []).map((item) => item.equipmentType));
const processByStep = new Map((masterData.processing ?? []).map((row) => [row.stepId, row]));

for (const node of graph.nodes ?? []) {
  if (node.type !== "process") {
    continue;
  }
  const processRow = processByStep.get(node.id);
  if (!processRow) {
    checklist.push({
      severity: "critical",
      code: "STEP_MAPPING_MISSING",
      message: `No processing row found for process node '${node.id}'.`
    });
    continue;
  }
  if (!equipmentByType.has(processRow.equipmentType)) {
    checklist.push({
      severity: "critical",
      code: "EQUIPMENT_REFERENCE_MISSING",
      message: `Step '${node.id}' references unknown equipment '${processRow.equipmentType}'.`
    });
  }
}

const scenarioDefaults = {};
for (const group of dashboard.parameterGroups ?? []) {
  for (const field of group.fields ?? []) {
    scenarioDefaults[field.key] = field.defaultValue;
  }
}

const hasCritical = checklist.some((item) => item.severity === "critical");

const compiled = {
  version: "0.1.0",
  generatedAt: new Date().toISOString(),
  graph,
  masterData,
  scenarioDefaults,
  validationSummary: {
    missingItemCount: checklist.length,
    hasCritical
  }
};

fs.writeFileSync(compiledPath, JSON.stringify(compiled, null, 2), "utf8");
fs.writeFileSync(checklistPath, JSON.stringify(checklist, null, 2), "utf8");

console.log(`Compiled spec written: ${compiledPath}`);
if (checklist.length === 0) {
  console.log("No missing data items found.");
} else {
  console.log(`Checklist written: ${checklistPath} (${checklist.length} items)`);
}

