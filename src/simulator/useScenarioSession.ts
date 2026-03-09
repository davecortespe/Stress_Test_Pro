import { useEffect, useMemo, useState } from "react";
import {
  BASE_SIM_HOURS_PER_SECOND,
  DEFAULT_SPEED_MULTIPLIER,
  getSimulationHorizonHours,
  scenarioEquals,
  STEP_FIELDS,
  stepScenarioKey,
  type ScenarioState,
  type SpeedMultiplier,
  type StepField
} from "./scenarioState";

interface UseScenarioSessionInput {
  baselineScenario: ScenarioState;
}

interface UseScenarioSessionResult {
  committedScenario: ScenarioState;
  stagedScenario: ScenarioState;
  activeScenario: ScenarioState;
  hasStagedChanges: boolean;
  isPaused: boolean;
  speedMultiplier: SpeedMultiplier;
  simElapsedHours: number;
  simHorizonHours: number;
  resetViewSignal: number;
  setSpeedMultiplier: (value: SpeedMultiplier) => void;
  updateScenarioValue: (key: string, value: number | string) => void;
  updateStepField: (stepId: string, field: StepField, value: number) => void;
  discardStepOverrides: (stepId: string) => void;
  toggleStartPause: () => void;
  resetSimulation: () => void;
}

function cloneScenario(scenario: ScenarioState): ScenarioState {
  return { ...scenario };
}

export function useScenarioSession({
  baselineScenario
}: UseScenarioSessionInput): UseScenarioSessionResult {
  const [committedScenario, setCommittedScenario] = useState<ScenarioState>(() =>
    cloneScenario(baselineScenario)
  );
  const [stagedScenario, setStagedScenario] = useState<ScenarioState>(() =>
    cloneScenario(baselineScenario)
  );
  const [isPaused, setIsPaused] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] =
    useState<SpeedMultiplier>(DEFAULT_SPEED_MULTIPLIER);
  const [simElapsedHours, setSimElapsedHours] = useState(0);
  const [resetViewSignal, setResetViewSignal] = useState(0);

  useEffect(() => {
    setCommittedScenario(cloneScenario(baselineScenario));
    setStagedScenario(cloneScenario(baselineScenario));
    setIsPaused(true);
    setSpeedMultiplier(DEFAULT_SPEED_MULTIPLIER);
    setSimElapsedHours(0);
    setResetViewSignal((current) => current + 1);
  }, [baselineScenario]);

  const activeScenario = isPaused ? stagedScenario : committedScenario;
  const simHorizonHours = useMemo(
    () => getSimulationHorizonHours(activeScenario),
    [activeScenario]
  );
  const hasStagedChanges = useMemo(
    () => !scenarioEquals(committedScenario, stagedScenario),
    [committedScenario, stagedScenario]
  );

  useEffect(() => {
    if (isPaused) {
      return;
    }

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const deltaHours = ((now - last) / 1000) * BASE_SIM_HOURS_PER_SECOND;
      last = now;
      setSimElapsedHours((current) =>
        Math.min(simHorizonHours, current + deltaHours * speedMultiplier)
      );
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPaused, simHorizonHours, speedMultiplier]);

  useEffect(() => {
    if (!isPaused && simElapsedHours >= simHorizonHours - 1e-6) {
      setIsPaused(true);
      setStagedScenario(cloneScenario(committedScenario));
    }
  }, [committedScenario, isPaused, simElapsedHours, simHorizonHours]);

  const updateScenarioValue = (key: string, value: number | string) => {
    if (isPaused) {
      setStagedScenario((current) => ({
        ...current,
        [key]: value
      }));
      return;
    }

    setCommittedScenario((current) => ({
      ...current,
      [key]: value
    }));
  };

  const updateStepField = (stepId: string, field: StepField, value: number) => {
    updateScenarioValue(stepScenarioKey(stepId, field), value);
  };

  const discardStepOverrides = (stepId: string) => {
    setStagedScenario((current) => {
      const next = { ...current };
      for (const field of STEP_FIELDS) {
        const key = stepScenarioKey(stepId, field);
        if (key in committedScenario) {
          next[key] = committedScenario[key];
        } else {
          delete next[key];
        }
      }
      return next;
    });
  };

  const toggleStartPause = () => {
    if (isPaused) {
      setCommittedScenario(cloneScenario(stagedScenario));
      if (simElapsedHours >= simHorizonHours - 1e-6) {
        setSimElapsedHours(0);
      }
      setIsPaused(false);
      return;
    }

    setIsPaused(true);
    setStagedScenario(cloneScenario(committedScenario));
  };

  const resetSimulation = () => {
    setCommittedScenario(cloneScenario(baselineScenario));
    setStagedScenario(cloneScenario(baselineScenario));
    setIsPaused(true);
    setSpeedMultiplier(DEFAULT_SPEED_MULTIPLIER);
    setSimElapsedHours(0);
    setResetViewSignal((current) => current + 1);
  };

  return {
    committedScenario,
    stagedScenario,
    activeScenario,
    hasStagedChanges,
    isPaused,
    speedMultiplier,
    simElapsedHours,
    simHorizonHours,
    resetViewSignal,
    setSpeedMultiplier,
    updateScenarioValue,
    updateStepField,
    discardStepOverrides,
    toggleStartPause,
    resetSimulation
  };
}
