const SCENARIO_LIBRARY_SCHEMA_VERSION = "2";
const META_COLUMNS = [
    "schemaVersion",
    "scenarioId",
    "scenarioName",
    "savedAt",
    "appTitle",
    "modelName"
];
export function buildScenarioLibraryColumns(scenarioColumns) {
    return [...META_COLUMNS, ...scenarioColumns];
}
function csvEscape(value) {
    if (/[",\n\r]/.test(value)) {
        return `"${value.replace(/"/g, "\"\"")}"`;
    }
    return value;
}
function parseCsvText(csvText) {
    const rows = [];
    let currentRow = [];
    let currentCell = "";
    let inQuotes = false;
    for (let index = 0; index < csvText.length; index += 1) {
        const char = csvText[index];
        const next = csvText[index + 1];
        if (char === "\"") {
            if (inQuotes && next === "\"") {
                currentCell += "\"";
                index += 1;
            }
            else {
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
function inferValue(rawValue, key, rowNumber, issues) {
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
function rowIsEmpty(row) {
    return row.every((cell) => cell.trim().length === 0);
}
export function mergeScenarioRowWithBaseline(row, baselineScenario) {
    const next = { ...baselineScenario };
    Object.entries(row).forEach(([key, value]) => {
        if (value !== undefined) {
            next[key] = value;
        }
    });
    return next;
}
export function serializeScenarioLibrary(entries, context, scenarioColumns) {
    const columns = buildScenarioLibraryColumns(scenarioColumns);
    const lines = [columns.map(csvEscape).join(",")];
    entries.forEach((entry) => {
        const cells = columns.map((column) => {
            switch (column) {
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
                    const value = entry.scenario[column];
                    return value === undefined ? "" : String(value);
                }
            }
        });
        lines.push(cells.map(csvEscape).join(","));
    });
    return `${lines.join("\n")}\n`;
}
export function parseScenarioLibrary(csvText, scenarioColumns) {
    const issues = [];
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
    let rows;
    try {
        rows = parseCsvText(csvText);
    }
    catch (error) {
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
        if (!META_COLUMNS.includes(header) && !scenarioKeys.has(header)) {
            issues.push({
                severity: "warning",
                message: `Unknown column ${header} was ignored.`,
                column: header
            });
        }
    });
    const entries = [];
    let context = null;
    rows.slice(1).forEach((row, index) => {
        const rowNumber = index + 2;
        if (rowIsEmpty(row)) {
            return;
        }
        const valueByHeader = new Map();
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
        const rowScenario = {};
        scenarioColumns.forEach((key) => {
            rowScenario[key] = inferValue(valueByHeader.get(key) ?? "", key, rowNumber, issues);
        });
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
            scenario: Object.fromEntries(Object.entries(rowScenario).filter(([, value]) => value !== undefined))
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
export function upsertScenarioLibraryEntry(entries, nextEntry) {
    const existingIndex = entries.findIndex((entry) => entry.scenarioId === nextEntry.scenarioId);
    if (existingIndex === -1) {
        return [...entries, nextEntry];
    }
    const nextEntries = [...entries];
    nextEntries[existingIndex] = nextEntry;
    return nextEntries;
}
export function createScenarioLibraryContext(appTitle, modelName) {
    return {
        schemaVersion: SCENARIO_LIBRARY_SCHEMA_VERSION,
        appTitle,
        modelName
    };
}
