import type {
  CompiledForecastModel,
  DashboardConfig,
  OperationalDiagnosis
} from "../types/contracts";
import type { ScenarioState } from "./scenarioState";

export interface ExportBundleData {
  dashboardConfig?: DashboardConfig;
  compiledForecastModel?: CompiledForecastModel;
  masterData?: unknown;
  operationalDiagnosis?: OperationalDiagnosis;
  vsmGraph?: unknown;
  scenarioCommitted?: ScenarioState;
}

declare global {
  interface Window {
    __EXPORT_COMMITTED_SCENARIO__?: ScenarioState;
    __EXPORT_BUNDLE_DATA__?: ExportBundleData;
  }
}

export function getExportBundleData(): ExportBundleData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.__EXPORT_BUNDLE_DATA__;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  return raw as ExportBundleData;
}

export function getStartupScenarioOverride(
  exportBundleData: ExportBundleData | null
): ScenarioState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = exportBundleData?.scenarioCommitted ?? window.__EXPORT_COMMITTED_SCENARIO__;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  return raw as ScenarioState;
}
