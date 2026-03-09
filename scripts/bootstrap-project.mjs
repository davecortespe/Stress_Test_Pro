import { spawnSync } from "node:child_process";
import fs from "node:fs";

const requiredFiles = [
  "models/dashboard_config.json",
  "models/vsm_graph.json",
  "models/tables/products.csv",
  "models/tables/equipment.csv",
  "models/tables/processing.csv",
  "scripts/compile-sim-spec.mjs"
];

const missing = requiredFiles.filter((file) => !fs.existsSync(file));
if (missing.length > 0) {
  console.error("Bootstrap failed. Missing required files:");
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

const buildMaster = spawnSync(process.execPath, ["scripts/build-master-data.mjs"], { stdio: "inherit" });
if (buildMaster.status !== 0) {
  process.exit(buildMaster.status ?? 1);
}

const compile = spawnSync(process.execPath, ["scripts/compile-sim-spec.mjs"], { stdio: "inherit" });
if (compile.status !== 0) {
  process.exit(compile.status ?? 1);
}

const validate = spawnSync(process.execPath, ["scripts/validate-models.mjs"], { stdio: "inherit" });
if (validate.status !== 0) {
  process.exit(validate.status ?? 1);
}

console.log("Bootstrap complete.");
