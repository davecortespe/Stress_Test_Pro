import type { KpiConfig, SimulatorResultsMode } from "../types/contracts";

export interface ExportNotice {
  tone: "success" | "error";
  text: string;
}

export const RESULTS_MODE_LABELS: Record<SimulatorResultsMode, string> = {
  flow: "Live Flow Map",
  diagnosis: "Operational Diagnosis",
  kaizen: "Fishbone Audit",
  throughput: "Throughput Economics",
  waste: "Waste Analysis",
  assumptions: "Assumptions Review"
};

export const KAIZEN_PDF_URL = "/generated/kaizen-executive-report.pdf";
export const PARAMETER_RAIL_WIDTH_STORAGE_KEY = "stress-test-pro.parameter-rail-width-v1";
export const PARAMETER_RAIL_MIN_WIDTH = 290;
export const PARAMETER_RAIL_DEFAULT_WIDTH = 320;
export const PARAMETER_RAIL_HARD_MAX_WIDTH = 520;
export const DEFAULT_VIEWPORT_WIDTH = 1440;

export const throughputKpis: KpiConfig[] = [
  {
    key: "tocThroughputPerUnit",
    label: "TOC Throughput / Unit",
    format: "currency",
    decimals: 2
  },
  {
    key: "fullyLoadedProfitPerUnit",
    label: "Fully Loaded Profit / Unit",
    format: "currency",
    decimals: 2
  },
  {
    key: "tocThroughputPerBottleneckMinute",
    label: "TOC / Bottleneck Min",
    format: "currency",
    decimals: 2
  },
  {
    key: "estimatedGainPercent",
    label: "Estimated Gain %",
    format: "percent",
    decimals: 1
  }
];

export const wasteKpis: KpiConfig[] = [
  {
    key: "totalLeadTimeMinutes",
    label: "Weighted LT",
    format: "duration",
    decimals: 1
  },
  {
    key: "totalTouchTimeMinutes",
    label: "Weighted CT",
    format: "duration",
    decimals: 1
  },
  {
    key: "totalWasteMinutes",
    label: "Weighted Waste",
    format: "duration",
    decimals: 1
  },
  {
    key: "totalWastePct",
    label: "Waste %",
    format: "percent",
    decimals: 1
  },
  {
    key: "topWasteStep",
    label: "Top Waste Step",
    format: "text"
  }
];

export const kaizenKpis: KpiConfig[] = [
  {
    key: "topOpportunity",
    label: "Top Kaizen Focus",
    format: "text"
  },
  {
    key: "topOpportunityScore",
    label: "Event Score",
    format: "number",
    decimals: 1
  },
  {
    key: "fishboneFocus",
    label: "Fishbone Focus",
    format: "text"
  },
  {
    key: "opportunityCount",
    label: "Top Events",
    format: "number",
    decimals: 0
  },
  {
    key: "missingSignalsCount",
    label: "Missing Signals",
    format: "number",
    decimals: 0
  }
];

export const assumptionsKpis: KpiConfig[] = [
  {
    key: "trustLevel",
    label: "Trust Level",
    helpText: "Overall confidence based on how many important inputs were assumed or defaulted.",
    format: "text"
  },
  {
    key: "totalAssumptions",
    label: "Assumptions Logged",
    helpText: "Total number of documented assumptions in the current model.",
    format: "number",
    decimals: 0
  },
  {
    key: "needsReview",
    label: "Need Review",
    helpText: "Assumptions that could materially change the conclusion if they are wrong.",
    format: "number",
    decimals: 0
  },
  {
    key: "priorityChecks",
    label: "Priority Checks",
    helpText: "Best confirmations to collect before using the report for bigger decisions.",
    format: "number",
    decimals: 0
  }
];

export const flowOverlayKpis: KpiConfig[] = [
  {
    key: "forecastThroughput",
    label: "Forecast Output / hr",
    helpText: "Estimated completed output rate per hour under the current scenario settings and elapsed-time state.",
    format: "number",
    decimals: 1
  },
  {
    key: "bottleneckIndex",
    label: "Constraint Pressure",
    helpText: "Constraint pressure score (0-100%). Higher values mean tighter capacity and higher risk of flow breakage.",
    format: "percent",
    decimals: 0
  },
  {
    key: "totalWipQty",
    label: "WIP Load",
    helpText: "Total work-in-process currently in the system (queue plus in-process load across all steps).",
    format: "number",
    decimals: 0
  },
  {
    key: "totalCompletedOutputPieces",
    label: "Total Completed Lots",
    helpText: "Cumulative completed lots produced by the flow at the current elapsed time.",
    format: "number",
    decimals: 1
  }
];

export function downloadTextFile(
  fileName: string,
  contents: string,
  mimeType = "text/plain;charset=utf-8"
): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getParameterRailMaxWidth(viewportWidth: number): number {
  return Math.max(
    PARAMETER_RAIL_MIN_WIDTH,
    Math.min(PARAMETER_RAIL_HARD_MAX_WIDTH, Math.round(viewportWidth * 0.42))
  );
}

export function clampParameterRailWidth(width: number, viewportWidth: number): number {
  return Math.round(
    Math.min(
      Math.max(width, PARAMETER_RAIL_MIN_WIDTH),
      getParameterRailMaxWidth(viewportWidth)
    )
  );
}
