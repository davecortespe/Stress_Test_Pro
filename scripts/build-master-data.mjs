import fs from "node:fs";
import path from "node:path";

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) {
    return [];
  }
  const [headerLine, ...dataLines] = raw.split(/\r?\n/);
  const headers = headerLine.split(",").map((value) => value.trim());

  return dataLines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const cols = line.split(",").map((value) => value.trim());
      const row = {};
      headers.forEach((key, index) => {
        row[key] = cols[index] ?? "";
      });
      return row;
    });
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const tablesDir = process.argv[2] ?? "models/tables";
const outputPath = process.argv[3] ?? "models/master_data.json";

const products = parseCsv(path.join(tablesDir, "products.csv")).map((row) => ({
  productId: row.productId,
  family: row.family,
  mixPct: asNumber(row.mixPct, 0),
  demandRate: asNumber(row.demandRate, 0),
  sellingPricePerUnit:
    row.sellingPricePerUnit && row.sellingPricePerUnit.length > 0
      ? asNumber(row.sellingPricePerUnit, 0)
      : null
}));

const equipment = parseCsv(path.join(tablesDir, "equipment.csv")).map((row) => ({
  equipmentType: row.equipmentType,
  count: asNumber(row.count, 0),
  availability: asNumber(row.availability, 1)
}));

const processing = parseCsv(path.join(tablesDir, "processing.csv")).map((row) => ({
  stepId: row.stepId,
  equipmentType: row.equipmentType,
  productKey: row.productKey || "all",
  ct_dist: {
    type: row.ctDistType || "normal",
    params: {
      mean: asNumber(row.ctMean, 0),
      stdDev: asNumber(row.ctStdDev, 0)
    }
  },
  setup_rule: {
    type: row.setupRule || "none",
    by: row.setupBy || undefined
  },
  setup_dist: {
    type: row.setupDistType || "constant",
    params: {
      low: asNumber(row.setupLow, 0),
      mode: asNumber(row.setupMode, 0),
      high: asNumber(row.setupHigh, 0)
    }
  },
  materialCostPerUnit:
    row.materialCostPerUnit && row.materialCostPerUnit.length > 0
      ? asNumber(row.materialCostPerUnit, 0)
      : null,
  laborRatePerHour:
    row.laborRatePerHour && row.laborRatePerHour.length > 0
      ? asNumber(row.laborRatePerHour, 0)
      : row.laborCostPerUnit && row.laborCostPerUnit.length > 0
        ? asNumber(row.laborCostPerUnit, 0)
      : null,
  equipmentRatePerHour:
    row.equipmentRatePerHour && row.equipmentRatePerHour.length > 0
      ? asNumber(row.equipmentRatePerHour, 0)
      : row.equipmentCostPerUnit && row.equipmentCostPerUnit.length > 0
        ? asNumber(row.equipmentCostPerUnit, 0)
      : null
}));

const variabilityPath = path.join(tablesDir, "variability.csv");
const ctVariability = fs.existsSync(variabilityPath)
  ? parseCsv(variabilityPath).map((row) => ({
      stepId: row.stepId,
      cv: asNumber(row.cv, 0),
      notes: row.notes || undefined
    }))
  : [];

const master = {
  products,
  equipment,
  processing,
  ctVariability,
  economicsDefaults: {
    sellingPricePerUnit:
      products.find((product) => typeof product.sellingPricePerUnit === "number")?.sellingPricePerUnit ?? null
  }
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(master, null, 2), "utf8");
console.log(`Master data written: ${outputPath}`);

