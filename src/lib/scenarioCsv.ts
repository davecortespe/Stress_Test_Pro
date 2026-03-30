import type {
  ScenarioLibraryEntry,
  ScenarioLibraryFileContext,
  ScenarioLibraryIssue,
  ScenarioLibraryParseResult,
  ScenarioSavedMetrics
} from "../types/contracts";

const SCENARIO_LIBRARY_SCHEMA_VERSION = "2";
const META_COLUMNS = [
  "schemaVersion",
  "scenarioId",
  "scenarioName",
  "savedAt",
  "appTitle",
  "modelName"
] as const;
const SAVED_METRIC_COLUMNS = [
  "savedForecastThroughput",
  "savedBottleneckIndex",
  "savedTotalWipQty",
  "savedTotalCompletedOutputPieces",
  "savedActiveConstraintName",
  "savedWeightedLeadTimeMinutes",
  "savedTocThroughputPerUnit"
] as const;

type MetaColumn = (typeof META_COLUMNS)[number];
type SavedMetricColumn = (typeof SAVED_METRIC_COLUMNS)[number];

const SAVED_METRIC_COLUMN_BY_KEY: Record<keyof ScenarioSavedMetrics, SavedMetricColumn> = {
  forecastThroughput: "savedForecastThroughput",
  bottleneckIndex: "savedBottleneckIndex",
  totalWipQty: "savedTotalWipQty",
  totalCompletedOutputPieces: "savedTotalCompletedOutputPieces",
  activeConstraintName: "savedActiveConstraintName",
  weightedLeadTimeMinutes: "savedWeightedLeadTimeMinutes",
  tocThroughputPerUnit: "savedTocThroughputPerUnit"
};
const SAVED_METRIC_KEY_BY_COLUMN = Object.fromEntries(
  Object.entries(SAVED_METRIC_COLUMN_BY_KEY).map(([key, column]) => [column, key])
) as Record<SavedMetricColumn, keyof ScenarioSavedMetrics>;

export function buildScenarioLibraryColumns(
  scenarioColumns: string[]
): string[] {
  return [...META_COLUMNS, ...scenarioColumns, ...SAVED_METRIC_COLUMNS];
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function parseCsvText(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        currentCell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (inQuotes) {
    throw new Error("CSV contains an unterminated quoted field.");
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

function inferValue(rawValue: string, key: string, rowNumber: number, issues: ScenarioLibraryIssue[]): number | undefined {
  if (rawValue.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(rawValue);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  issues.push({
    severity: "warning",
    message: `Invalid numeric value for ${key}; baseline/default value will be used instead.`,
    rowNumber,
    column: key
  });
  return undefined;
}

function rowIsEmpty(row: string[]): boolean {
  return row.every((cell) => cell.trim().length === 0);
}

function parseSavedMetricValue(rawValue: string): number | string {
  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return "";
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : trimmed;
}

function parseSavedMetrics(
  valueByHeader: Map<string, string>,
  rowNumber: number,
  issues: ScenarioLibraryIssue[]
): ScenarioSavedMetrics | undefined {
  const populatedColumns = SAVED_METRIC_COLUMNS.filter((column) => {
    const value = valueByHeader.get(column);
    return typeof value === "string" && value.trim().length > 0;
  });

  if (populatedColumns.length === 0) {
    return undefined;
  }

  if (populatedColumns.length !== SAVED_METRIC_COLUMNS.length) {
    issues.push({
      severity: "warning",
      message: "Saved metrics were partially present and were ignored for this row.",
      rowNumber
    });
    return undefined;
  }

  const metrics: Partial<ScenarioSavedMetrics> = {};
  SAVED_METRIC_COLUMNS.forEach((column) => {
    const key = SAVED_METRIC_KEY_BY_COLUMN[column];
    (metrics as Record<string, number | string>)[key] = parseSavedMetricValue(
      valueByHeader.get(column) ?? ""
    );
  });
  return metrics as ScenarioSavedMetrics;
}

export function mergeScenarioRowWithBaseline(
  row: Record<string, number | string | undefined>,
  baselineScenario: Record<string, number | string>
): Record<string, number | string> {
  const next = { ...baselineScenario };
  Object.entries(row).forEach(([key, value]) => {
    if (value !== undefined) {
      next[key] = value;
    }
  });
  return next;
}

export function serializeScenarioLibrary(
  entries: ScenarioLibraryEntry[],
  context: ScenarioLibraryFileContext,
  scenarioColumns: string[]
): string {
  const columns = buildScenarioLibraryColumns(scenarioColumns);
  const lines = [columns.map(csvEscape).join(",")];

  entries.forEach((entry) => {
    const cells = columns.map((column) => {
      switch (column as MetaColumn) {
        case "schemaVersion":
          return context.schemaVersion;
        case "scenarioId":
          return entry.scenarioId;
        case "scenarioName":
          return entry.scenarioName;
        case "savedAt":
          return entry.savedAt;
        case "appTitle":
          return context.appTitle;
        case "modelName":
          return context.modelName;
        default: {
          if (column in SAVED_METRIC_KEY_BY_COLUMN) {
            const metricKey = SAVED_METRIC_KEY_BY_COLUMN[column as SavedMetricColumn];
            const value = entry.savedMetrics?.[metricKey];
            return value === undefined ? "" : String(value);
          }
          const value = entry.scenario[column];
          return value === undefined ? "" : String(value);
        }
      }
    });
    lines.push(cells.map(csvEscape).join(","));
  });

  return `${lines.join("\n")}\n`;
}

export function parseScenarioLibrary(
  csvText: string,
  scenarioColumns: string[]
): ScenarioLibraryParseResult {
  const issues: ScenarioLibraryIssue[] = [];
  const trimmed = csvText.trim();
  if (trimmed.length === 0) {
    return {
      entries: [],
      issues: [
        {
          severity: "error",
          message: "CSV file is empty."
        }
      ],
      discoveredColumns: [],
      context: null
    };
  }

  let rows: string[][];
  try {
    rows = parseCsvText(csvText);
  } catch (error) {
    return {
      entries: [],
      issues: [
        {
          severity: "error",
          message: error instanceof Error ? error.message : "CSV could not be parsed."
        }
      ],
      discoveredColumns: [],
      context: null
    };
  }

  if (rows.length === 0) {
    return {
      entries: [],
      issues: [
        {
          severity: "error",
          message: "CSV file does not contain a header row."
        }
      ],
      discoveredColumns: [],
      context: null
    };
  }

  const headers = rows[0].map((header) => header.trim());
  const requiredHeaders = ["scenarioId", "scenarioName", "savedAt"];
  requiredHeaders.forEach((header) => {
    if (!headers.includes(header)) {
      issues.push({
        severity: "error",
        message: `CSV is missing required column: ${header}.`,
        column: header
      });
    }
  });

  const scenarioKeys = new Set(scenarioColumns);
  headers.forEach((header) => {
    if (
      !META_COLUMNS.includes(header as MetaColumn) &&
      !SAVED_METRIC_COLUMNS.includes(header as SavedMetricColumn) &&
      !scenarioKeys.has(header)
    ) {
      issues.push({
        severity: "warning",
        message: `Unknown column ${header} was ignored.`,
        column: header
      });
    }
  });

  const entries: ScenarioLibraryEntry[] = [];
  let context: ScenarioLibraryFileContext | null = null;

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    if (rowIsEmpty(row)) {
      return;
    }

    const valueByHeader = new Map<string, string>();
    headers.forEach((header, headerIndex) => {
      valueByHeader.set(header, row[headerIndex] ?? "");
    });

    const scenarioId = valueByHeader.get("scenarioId")?.trim() ?? "";
    const scenarioName = valueByHeader.get("scenarioName")?.trim() ?? "";
    const savedAt = valueByHeader.get("savedAt")?.trim() ?? "";

    if (!scenarioId || !scenarioName || !savedAt) {
      issues.push({
        severity: "error",
        message: "Scenario row is missing required metadata and was skipped.",
        rowNumber
      });
      return;
    }

    const rowScenario: Record<string, number | string | undefined> = {};
    scenarioColumns.forEach((key) => {
      rowScenario[key] = inferValue(valueByHeader.get(key) ?? "", key, rowNumber, issues);
    });
    const savedMetrics = parseSavedMetrics(valueByHeader, rowNumber, issues);

    if (context === null) {
      const schemaVersion = valueByHeader.get("schemaVersion")?.trim() || SCENARIO_LIBRARY_SCHEMA_VERSION;
      const appTitle = valueByHeader.get("appTitle")?.trim() || "";
      const modelName = valueByHeader.get("modelName")?.trim() || "";
      context = {
        schemaVersion,
        appTitle,
        modelName
      };
    }

    entries.push({
      scenarioId,
      scenarioName,
      savedAt,
      scenario: Object.fromEntries(
        Object.entries(rowScenario).filter(([, value]) => value !== undefined)
      ) as Record<string, number | string>,
      savedMetrics
    });
  });

  if (context === null) {
    context = {
      schemaVersion: SCENARIO_LIBRARY_SCHEMA_VERSION,
      appTitle: "",
      modelName: ""
    };
  }

  return {
    entries,
    issues,
    discoveredColumns: headers,
    context
  };
}

export function upsertScenarioLibraryEntry(
  entries: ScenarioLibraryEntry[],
  nextEntry: ScenarioLibraryEntry
): ScenarioLibraryEntry[] {
  const existingIndex = entries.findIndex((entry) => entry.scenarioId === nextEntry.scenarioId);
  if (existingIndex === -1) {
    return [...entries, nextEntry];
  }

  const nextEntries = [...entries];
  nextEntries[existingIndex] = nextEntry;
  return nextEntries;
}

export function createScenarioLibraryContext(
  appTitle: string,
  modelName: string
): ScenarioLibraryFileContext {
  return {
    schemaVersion: SCENARIO_LIBRARY_SCHEMA_VERSION,
    appTitle,
    modelName
  };
}

/** Serialize a single saved run as a 1-row CSV (header + data row). */
export function serializeSingleScenario(
  entry: ScenarioLibraryEntry,
  context: ScenarioLibraryFileContext,
  scenarioColumns: string[]
): string {
  return serializeScenarioLibrary([entry], context, scenarioColumns);
}
