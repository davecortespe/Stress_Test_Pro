import type { CompiledForecastModel, ForecastStepModel, ParameterGroup } from "../types/contracts";

export type ScenarioState = Record<string, number | string>;
export type StepField =
  | "capacityUnits"
  | "ctBaseline"
  | "ctMultiplier"
  | "downtimePct"
  | "leadTimeMinutes"
  | "materialCostPerUnit"
  | "laborRatePerHour"
  | "equipmentRatePerHour";
export type SpeedMultiplier = 1 | 2 | 5 | 10 | 50 | 200;

export const BASE_SIM_HOURS_PER_SECOND = 0.1;
export const DEFAULT_SPEED_MULTIPLIER: SpeedMultiplier = 1;
export const STEP_FIELDS: StepField[] = [
  "capacityUnits",
  "ctBaseline",
  "ctMultiplier",
  "downtimePct",
  "leadTimeMinutes",
  "materialCostPerUnit",
  "laborRatePerHour",
  "equipmentRatePerHour"
];

export interface InspectorValues {
  capacityUnits: number;
  ctBaseline: number;
  ctMultiplier: number;
  downtimePct: number;
  leadTimeMinutes: number;
  materialCostPerUnit: number;
  laborRatePerHour: number;
  equipmentRatePerHour: number;
}

export function bindParameterGroupsToForecast(
  groups: ParameterGroup[],
  forecastModel: CompiledForecastModel
): ParameterGroup[] {
  const inputMap = new Map(forecastModel.inputs.map((input) => [input.key, input]));
  return groups.map((group) => ({
    ...group,
    fields: group.fields.map((field) => {
      const input = inputMap.get(field.key);
      if (!input) {
        return field;
      }
      return {
        ...field,
        type: input.type === "select" ? "dropdown" : field.type,
        min: typeof input.min === "number" ? input.min : field.min,
        max: typeof input.max === "number" ? input.max : field.max,
        step: typeof input.step === "number" ? input.step : field.step,
        options: input.options ?? field.options,
        defaultValue:
          forecastModel.inputDefaults[field.key] ?? input.defaultValue ?? field.defaultValue
      };
    })
  }));
}

export function getDefaultScenario(
  groups: ParameterGroup[],
  inputDefaults: Record<string, number | string>
): ScenarioState {
  const defaults: ScenarioState = {};
  groups.forEach((group) => {
    group.fields.forEach((field) => {
      defaults[field.key] = inputDefaults[field.key] ?? field.defaultValue;
    });
  });
  return defaults;
}

export function scenarioEquals(a: ScenarioState, b: ScenarioState): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

export function stepScenarioKey(stepId: string, field: StepField): string {
  return `step_${stepId}_${field}`;
}

export function toNumber(value: number | string | undefined, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

export function getSimulationHorizonHours(scenario: ScenarioState): number {
  return Math.max(8, Math.min(720, Math.round(toNumber(scenario.simulationHorizonHours, 8))));
}

export function buildInspectorValues(
  step: ForecastStepModel | null,
  scenario: ScenarioState,
  defaults?: {
    materialCostPerUnit?: number | null;
    laborRatePerHour?: number | null;
    equipmentRatePerHour?: number | null;
  }
): InspectorValues | null {
  if (!step) {
    return null;
  }

  return {
    capacityUnits: Math.max(
      1,
      Math.round(
        toNumber(
          scenario[stepScenarioKey(step.stepId, "capacityUnits")],
          Math.max(1, Math.round(step.effectiveUnits))
        )
      )
    ),
    ctBaseline: Math.max(
      0.01,
      toNumber(scenario[stepScenarioKey(step.stepId, "ctBaseline")], step.ctMinutes ?? 1)
    ),
    ctMultiplier: Math.max(
      0.1,
      toNumber(scenario[stepScenarioKey(step.stepId, "ctMultiplier")], 1)
    ),
    downtimePct: Math.max(
      0,
      Math.min(95, toNumber(scenario[stepScenarioKey(step.stepId, "downtimePct")], 0))
    ),
    leadTimeMinutes: Math.max(
      0,
      toNumber(
        scenario[stepScenarioKey(step.stepId, "leadTimeMinutes")],
        step.leadTimeMinutes ?? 0
      )
    ),
    materialCostPerUnit: Math.max(
      0,
      toNumber(
        scenario[stepScenarioKey(step.stepId, "materialCostPerUnit")],
        defaults?.materialCostPerUnit ?? 0
      )
    ),
    laborRatePerHour: Math.max(
      0,
      toNumber(
        scenario[stepScenarioKey(step.stepId, "laborRatePerHour")],
        defaults?.laborRatePerHour ?? 0
      )
    ),
    equipmentRatePerHour: Math.max(
      0,
      toNumber(
        scenario[stepScenarioKey(step.stepId, "equipmentRatePerHour")],
        defaults?.equipmentRatePerHour ?? 0
      )
    )
  };
}
