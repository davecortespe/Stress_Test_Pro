import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "../components/DashboardHeader";
import { GraphCanvas } from "../components/GraphCanvas";
import { KpiRow } from "../components/KpiRow";
import { OperationalDiagnosisCard } from "../components/OperationalDiagnosisCard";
import { ParameterSidebar } from "../components/ParameterSidebar";
import { StepInspector } from "../components/StepInspector";
import { createBottleneckForecastOutput } from "../lib/bottleneckForecast";
import { exportScenarioBundleToLocalFolder } from "../lib/exportScenarioBundle";
import {
  buildOperationalDiagnosis,
  formatOperationalDiagnosisMarkdown
} from "../lib/operationalDiagnosis";
import type {
  CompiledForecastModel,
  DashboardConfig,
  OperationalDiagnosis,
  ParameterGroup
} from "../types/contracts";
import compiledForecastModelJson from "../../models/active/compiled_forecast_model.json";
import masterDataJson from "../../models/active/master_data.json";
import vsmGraphJson from "../../models/active/vsm_graph.json";
import dashboardConfigJson from "../../models/dashboard_config.json";
import "./simulator.css";

type ScenarioState = Record<string, number | string>;
type StepField = "capacityUnits" | "ctBaseline" | "ctMultiplier" | "downtimePct" | "leadTimeMinutes";
type SpeedMultiplier = 1 | 2 | 5 | 10 | 50 | 200;
const BASE_SIM_HOURS_PER_SECOND = 0.1;

interface ExportBundleData {
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

interface ExportNotice {
  tone: "success" | "error";
  text: string;
}

function bindParameterGroupsToForecast(
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

function getDefaultScenario(
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

function scenarioEquals(a: ScenarioState, b: ScenarioState): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

function stepScenarioKey(stepId: string, field: StepField): string {
  return `step_${stepId}_${field}`;
}

function toNumber(value: number | string | undefined, fallback: number): number {
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

export default function SimulatorApp() {
  const exportBundleData = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const raw = window.__EXPORT_BUNDLE_DATA__;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return null;
    }
    return raw as ExportBundleData;
  }, []);

  const dashboardConfig = (exportBundleData?.dashboardConfig ?? dashboardConfigJson) as DashboardConfig;
  const forecastModel = (exportBundleData?.compiledForecastModel ?? compiledForecastModelJson) as CompiledForecastModel;
  const masterData = exportBundleData?.masterData ?? masterDataJson;
  const vsmGraph = exportBundleData?.vsmGraph ?? vsmGraphJson;
  const boundParameterGroups = useMemo(
    () => bindParameterGroupsToForecast(dashboardConfig.parameterGroups, forecastModel),
    [dashboardConfig, forecastModel]
  );

  const startupScenarioOverride = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const raw = exportBundleData?.scenarioCommitted ?? window.__EXPORT_COMMITTED_SCENARIO__;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return null;
    }
    return raw as ScenarioState;
  }, [exportBundleData]);

  const baselineScenario = useMemo(
    () => ({
      ...getDefaultScenario(boundParameterGroups, forecastModel.inputDefaults),
      ...(startupScenarioOverride ?? {})
    }),
    [boundParameterGroups, forecastModel, startupScenarioOverride]
  );

  const [committedScenario, setCommittedScenario] = useState<ScenarioState>(baselineScenario);
  const [stagedScenario, setStagedScenario] = useState<ScenarioState>(baselineScenario);
  const [isPaused, setIsPaused] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<SpeedMultiplier>(1);
  const [simElapsedHours, setSimElapsedHours] = useState(0);
  const [inspectorStepId, setInspectorStepId] = useState<string | null>(null);
  const [inspectorAnchor, setInspectorAnchor] = useState<{ x: number; y: number } | null>(null);
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<ExportNotice | null>(null);

  const output = useMemo(
    () => createBottleneckForecastOutput(forecastModel, committedScenario, simElapsedHours),
    [forecastModel, committedScenario, simElapsedHours]
  );
  const operationalDiagnosis = useMemo(
    () => buildOperationalDiagnosis(forecastModel, output, committedScenario),
    [forecastModel, output, committedScenario]
  );
  const canToggleDiagnosis = true;
  const [isDiagnosisVisible, setIsDiagnosisVisible] = useState<boolean>(false);

  const hasStagedChanges = useMemo(
    () => !scenarioEquals(committedScenario, stagedScenario),
    [committedScenario, stagedScenario]
  );

  const inspectorStep = useMemo(
    () => forecastModel.stepModels.find((step) => step.stepId === inspectorStepId) ?? null,
    [forecastModel, inspectorStepId]
  );

  const activeScenario = isPaused ? stagedScenario : committedScenario;
  const simHorizonHours = Math.max(
    8,
    Math.min(720, Math.round(toNumber(activeScenario.simulationHorizonHours, 8)))
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
      setSimElapsedHours((current) => Math.min(simHorizonHours, current + deltaHours * speedMultiplier));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPaused, simHorizonHours, speedMultiplier]);

  useEffect(() => {
    if (!isPaused && simElapsedHours >= simHorizonHours - 1e-6) {
      setIsPaused(true);
      setStagedScenario({ ...committedScenario });
    }
  }, [committedScenario, isPaused, simElapsedHours, simHorizonHours]);

  const toggleStartPause = () => {
    if (isPaused) {
      setCommittedScenario({ ...stagedScenario });
      if (simElapsedHours >= simHorizonHours - 1e-6) {
        setSimElapsedHours(0);
      }
      setIsPaused(false);
      setInspectorStepId(null);
      return;
    }
    setIsPaused(true);
    setStagedScenario({ ...committedScenario });
  };

  const resetSimulation = () => {
    setCommittedScenario({ ...baselineScenario });
    setStagedScenario({ ...baselineScenario });
    setIsPaused(true);
    setSpeedMultiplier(1);
    setSimElapsedHours(0);
    setInspectorStepId(null);
    setInspectorAnchor(null);
    setResetViewSignal((current) => current + 1);
  };

  const openStepInspector = (nodeId: string, anchor: { x: number; y: number }) => {
    setInspectorStepId(nodeId);
    setInspectorAnchor(anchor);
  };

  const exportCommittedScenario = async () => {
    const defaultName = "Tablet_Manufacturing";
    const promptedName = window.prompt("Scenario export name (optional)", defaultName);
    if (promptedName === null) {
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportScenarioBundleToLocalFolder({
        name: promptedName.trim().length > 0 ? promptedName : defaultName,
        includeMetrics: true,
        dashboardConfig,
        vsmGraph,
        masterData,
        compiledForecastModel: forecastModel,
        scenarioCommitted: committedScenario,
        resultMetrics: {
          globalMetrics: output.globalMetrics,
          nodeMetrics: output.nodeMetrics as Record<string, unknown>
        },
        operationalDiagnosis,
        operationalDiagnosisMarkdown: formatOperationalDiagnosisMarkdown(operationalDiagnosis)
      });
      setExportNotice({
        tone: "success",
        text: `Exported bundle: ${result.exportPath}`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown export error";
      setExportNotice({
        tone: "error",
        text: `Export failed: ${message}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  const updateInspectorField = (field: StepField, value: number) => {
    if (!inspectorStep) {
      return;
    }
    const key = stepScenarioKey(inspectorStep.stepId, field);
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

  const discardInspectorStep = () => {
    if (!inspectorStep) {
      return;
    }
    const stepId = inspectorStep.stepId;
    const fields: StepField[] = [
      "capacityUnits",
      "ctBaseline",
      "ctMultiplier",
      "downtimePct",
      "leadTimeMinutes"
    ];
    setStagedScenario((current) => {
      const next = { ...current };
      for (const field of fields) {
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

  const inspectorValues = inspectorStep
    ? {
        capacityUnits: Math.max(
          1,
          Math.round(
            toNumber(
              activeScenario[stepScenarioKey(inspectorStep.stepId, "capacityUnits")],
              Math.max(1, Math.round(inspectorStep.effectiveUnits))
            )
          )
        ),
        ctBaseline: Math.max(
          0.01,
          toNumber(
            activeScenario[stepScenarioKey(inspectorStep.stepId, "ctBaseline")],
            inspectorStep.ctMinutes ?? 1
          )
        ),
        ctMultiplier: Math.max(
          0.1,
          toNumber(activeScenario[stepScenarioKey(inspectorStep.stepId, "ctMultiplier")], 1)
        ),
        downtimePct: Math.max(
          0,
          Math.min(95, toNumber(activeScenario[stepScenarioKey(inspectorStep.stepId, "downtimePct")], 0))
        ),
        leadTimeMinutes: Math.max(
          0,
          toNumber(
            activeScenario[stepScenarioKey(inspectorStep.stepId, "leadTimeMinutes")],
            inspectorStep.leadTimeMinutes ?? 0
          )
        )
      }
    : null;

  return (
    <div className="simulator-page">
      <div className="app-shell">
        <DashboardHeader
          title={dashboardConfig.appTitle}
          subtitle={dashboardConfig.subtitle ?? "Fast bottleneck forecast cockpit"}
          canToggleDiagnosis
          isPaused={isPaused}
          isDiagnosisVisible={isDiagnosisVisible}
          hasStagedChanges={hasStagedChanges}
          isExporting={isExporting}
          simElapsedHours={simElapsedHours}
          simHorizonHours={simHorizonHours}
          speedMultiplier={speedMultiplier}
          onToggleDiagnosis={() => setIsDiagnosisVisible((current) => !current)}
          onSpeedChange={(speed) => setSpeedMultiplier(speed)}
          onStartPause={toggleStartPause}
          onReset={resetSimulation}
          onExport={exportCommittedScenario}
        />

        {isPaused && hasStagedChanges ? (
          <div className={`pause-banner ${hasStagedChanges ? "has-changes" : "no-changes"}`}>
            Paused - edits staged
          </div>
        ) : null}

        {exportNotice ? (
          <div className={`export-banner ${exportNotice.tone === "error" ? "is-error" : "is-success"}`}>
            {exportNotice.text}
          </div>
        ) : null}

        <KpiRow kpis={dashboardConfig.kpis} metrics={output.globalMetrics} />

        {isDiagnosisVisible ? <OperationalDiagnosisCard diagnosis={operationalDiagnosis} /> : null}

        <div className="content-shell">
          <aside className="left-rail">
            <ParameterSidebar
              groups={boundParameterGroups}
              scenario={activeScenario}
              editable
              onChange={(key, value) => {
                if (isPaused) {
                  setStagedScenario((current) => ({ ...current, [key]: value }));
                  return;
                }
                setCommittedScenario((current) => ({ ...current, [key]: value }));
              }}
            />
          </aside>

          <main className="center-stage">
            <GraphCanvas
              graph={forecastModel.graph}
              output={output}
              nodeCardFields={dashboardConfig.nodeCardFields}
              showProbabilities={dashboardConfig.graphStyle?.showProbabilities ?? true}
              animateEdges={dashboardConfig.graphStyle?.edgeAnimation !== "none" && !isPaused}
              resetViewSignal={resetViewSignal}
              onNodeDoubleClick={(nodeId, anchor) => openStepInspector(nodeId, anchor)}
            />
          </main>
        </div>

        <StepInspector
          isOpen={!!inspectorStep && !!inspectorValues}
          isPaused={isPaused}
          stepLabel={inspectorStep?.label ?? ""}
          anchor={inspectorAnchor}
          values={
            inspectorValues ?? {
              capacityUnits: 1,
              ctBaseline: 1,
              ctMultiplier: 1,
              downtimePct: 0,
              leadTimeMinutes: 0
            }
          }
          onChange={updateInspectorField}
          onDiscard={discardInspectorStep}
          onStage={() => {
            setInspectorStepId(null);
            setInspectorAnchor(null);
          }}
          onApplyResume={toggleStartPause}
          onClose={() => {
            setInspectorStepId(null);
            setInspectorAnchor(null);
          }}
        />
      </div>
    </div>
  );
}
