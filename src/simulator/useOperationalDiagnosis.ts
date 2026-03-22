import { useEffect, useRef, useState } from "react";
import { buildOperationalDiagnosis } from "../lib/operationalDiagnosis";
import type { CompiledForecastModel, OperationalDiagnosis, SimulationOutput } from "../types/contracts";
import type { ScenarioState } from "./scenarioState";

interface UseOperationalDiagnosisInput {
  forecastModel: CompiledForecastModel;
  output: SimulationOutput;
  committedScenario: ScenarioState;
  isPaused: boolean;
  simElapsedHours: number;
}

export function useOperationalDiagnosis({
  forecastModel,
  output,
  committedScenario,
  isPaused,
  simElapsedHours
}: UseOperationalDiagnosisInput): OperationalDiagnosis {
  const wasRunningRef = useRef(false);
  const [operationalDiagnosis, setOperationalDiagnosis] = useState(() =>
    buildOperationalDiagnosis(forecastModel, output, committedScenario)
  );

  useEffect(() => {
    if (!isPaused) {
      wasRunningRef.current = true;
      return;
    }

    if (wasRunningRef.current) {
      setOperationalDiagnosis(buildOperationalDiagnosis(forecastModel, output, committedScenario));
      wasRunningRef.current = false;
    }
  }, [committedScenario, forecastModel, isPaused, output]);

  useEffect(() => {
    if (isPaused && simElapsedHours <= 1e-6) {
      setOperationalDiagnosis(buildOperationalDiagnosis(forecastModel, output, committedScenario));
    }
  }, [committedScenario, forecastModel, isPaused, output, simElapsedHours]);

  return operationalDiagnosis;
}
