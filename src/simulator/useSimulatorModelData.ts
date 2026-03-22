import { useMemo } from "react";
import dashboardConfigJson from "../../models/dashboard_config.json";
import compiledForecastModelJson from "../../models/active/compiled_forecast_model.json";
import masterDataJson from "../../models/active/master_data.json";
import type { CompiledForecastModel, DashboardConfig, MasterData, ParameterField } from "../types/contracts";
import {
  bindParameterGroupsToForecast,
  buildScenarioLibraryStepColumns,
  getDefaultScenario
} from "./scenarioState";
import { getExportBundleData, getStartupScenarioOverride } from "./runtimeData";

interface UseSimulatorModelDataResult {
  dashboardConfig: DashboardConfig;
  forecastModel: CompiledForecastModel;
  masterData: MasterData;
  baselineScenario: Record<string, number | string>;
  simulationHorizonField: ParameterField | undefined;
  sidebarParameterGroups: DashboardConfig["parameterGroups"];
  scenarioLibraryColumns: string[];
  flowViewportStorageKey: string;
}

const DEFAULT_SIMULATION_HORIZON_HOURS = "24";

export function useSimulatorModelData(): UseSimulatorModelDataResult {
  const exportBundleData = useMemo(() => getExportBundleData(), []);

  const dashboardConfig = (exportBundleData?.dashboardConfig ?? dashboardConfigJson) as DashboardConfig;
  const forecastModel = (exportBundleData?.compiledForecastModel ?? compiledForecastModelJson) as CompiledForecastModel;
  const masterData = (exportBundleData?.masterData ?? masterDataJson) as MasterData;

  const boundParameterGroups = useMemo(
    () => bindParameterGroupsToForecast(dashboardConfig.parameterGroups, forecastModel),
    [dashboardConfig, forecastModel]
  );
  const startupScenarioOverride = useMemo(
    () => getStartupScenarioOverride(exportBundleData),
    [exportBundleData]
  );
  const baselineScenario = useMemo(
    () => ({
      ...getDefaultScenario(boundParameterGroups, forecastModel.inputDefaults),
      simulationHorizonHours: DEFAULT_SIMULATION_HORIZON_HOURS,
      ...(startupScenarioOverride ?? {})
    }),
    [boundParameterGroups, forecastModel.inputDefaults, startupScenarioOverride]
  );
  const simulationHorizonField = useMemo(
    () =>
      boundParameterGroups
        .flatMap((group) => group.fields)
        .find((field) => field.key === "simulationHorizonHours"),
    [boundParameterGroups]
  );
  const sidebarParameterGroups = useMemo(
    () =>
      boundParameterGroups
        .map((group) => ({
          ...group,
          fields: group.fields.filter((field) => field.key !== "simulationHorizonHours")
        }))
        .filter((group) => group.fields.length > 0),
    [boundParameterGroups]
  );
  const scenarioLibraryColumns = useMemo(
    () => buildScenarioLibraryStepColumns(forecastModel.stepModels),
    [forecastModel.stepModels]
  );
  const flowViewportStorageKey = useMemo(
    () => `${forecastModel.metadata.name ?? dashboardConfig.appTitle}-flow-viewport-v4`,
    [dashboardConfig.appTitle, forecastModel.metadata.name]
  );

  return {
    dashboardConfig,
    forecastModel,
    masterData,
    baselineScenario,
    simulationHorizonField,
    sidebarParameterGroups,
    scenarioLibraryColumns,
    flowViewportStorageKey
  };
}
