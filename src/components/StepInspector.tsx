import { useEffect, useMemo, useRef, useState } from "react";

interface StepInspectorValues {
  capacityUnits: number;
  ctBaseline: number;
  ctMultiplier: number;
  downtimePct: number;
  leadTimeMinutes: number;
  materialCostPerUnit: number;
  laborRatePerHour: number;
  equipmentRatePerHour: number;
}

type StepInspectorFieldKey = keyof StepInspectorValues;

interface StepInspectorProps {
  isOpen: boolean;
  isPaused: boolean;
  stepLabel: string;
  anchor: { x: number; y: number } | null;
  values: StepInspectorValues;
  onChange: (field: keyof StepInspectorValues, value: number) => void;
  onDiscard: () => void;
  onStage: () => void;
  onApplyResume: () => void;
  onClose: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function scaledUpperBound(value: number, minimumMax: number, multiplier: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return minimumMax;
  }
  return Math.max(minimumMax, Math.ceil(value * multiplier));
}

const COST_INPUT_MAX = 100000;
const DOWNTIME_STEP = 0.5;
const DOWNTIME_PRESETS = [0, 5, 10, 15, 20, 30];

const STEP_FIELD_HELP: Record<StepInspectorFieldKey, string> = {
  capacityUnits:
    "Parallel units at this step (for example lines/stations). More units increase step capacity.",
  ctBaseline:
    "Base cycle time per unit before scenario multipliers. Lower CT increases processing capacity.",
  ctMultiplier:
    "Scenario factor on CT baseline. Values above 1 slow the step, below 1 speed it up.",
  downtimePct:
    "Percent of time this step is unavailable from interruptions, failures, or unplanned stops.",
  leadTimeMinutes:
    "Explicit delay at this step for lead-time reporting. This does not directly increase service capacity.",
  materialCostPerUnit:
    "Material consumed per produced unit at this step for throughput economics.",
  laborRatePerHour:
    "Loaded labor rate for this step used in per-unit and P&L calculations.",
  equipmentRatePerHour:
    "Loaded equipment rate for this step used in per-unit and P&L calculations."
};

function getStepPrecision(step: number): number {
  if (!Number.isFinite(step) || step <= 0) {
    return 0;
  }
  const normalized = step.toString().toLowerCase();
  if (normalized.includes("e-")) {
    const [, exponent = "0"] = normalized.split("e-");
    return Number(exponent);
  }
  const decimal = normalized.split(".")[1];
  return decimal ? decimal.length : 0;
}

function formatNumberForInput(value: number, step: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  const precision = getStepPrecision(step);
  return precision > 0 ? value.toFixed(precision) : Math.round(value).toString();
}

function formatMetric(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) {
    return "n/a";
  }
  return value.toFixed(decimals);
}

function useEditableNumberInput(
  value: number,
  min: number,
  max: number,
  step: number,
  onCommit: (next: number) => void
) {
  const [draft, setDraft] = useState(() => formatNumberForInput(value, step));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(formatNumberForInput(value, step));
    }
  }, [isEditing, step, value]);

  const commitDraft = () => {
    const parsed = Number(draft);
    setIsEditing(false);
    if (!Number.isFinite(parsed)) {
      setDraft(formatNumberForInput(value, step));
      return;
    }
    const normalized = clamp(parsed, min, max);
    onCommit(normalized);
    setDraft(formatNumberForInput(normalized, step));
  };

  const revertDraft = () => {
    setIsEditing(false);
    setDraft(formatNumberForInput(value, step));
  };

  return {
    draft,
    setDraft,
    setIsEditing,
    commitDraft,
    revertDraft
  };
}

function NumberField({
  id,
  label,
  helpKey,
  helpText,
  openHelpKey,
  onToggleHelp,
  onCloseHelp,
  value,
  min,
  max,
  step,
  unit,
  onChange
}: {
  id: string;
  label: string;
  helpKey: string;
  helpText?: string;
  openHelpKey: string | null;
  onToggleHelp: (key: string) => void;
  onCloseHelp: (key: string) => void;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (next: number) => void;
}) {
  const rounded = Number(value.toFixed(step < 1 ? 2 : 0));
  const { draft, setDraft, setIsEditing, commitDraft, revertDraft } = useEditableNumberInput(
    rounded,
    min,
    max,
    step,
    onChange
  );
  const tooltipId = `${id}-help`;
  const isHelpOpen = openHelpKey === helpKey;
  return (
    <div className="inspector-field">
      <div className="inspector-label-row">
        <label htmlFor={id}>{label}</label>
        {helpText ? (
          <div className={`field-help ${isHelpOpen ? "is-open" : ""}`}>
            <button
              type="button"
              className="field-help-trigger"
              aria-label={`About ${label}`}
              aria-expanded={isHelpOpen}
              aria-describedby={tooltipId}
              onClick={() => onToggleHelp(helpKey)}
              onBlur={(event) => {
                if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
                  onCloseHelp(helpKey);
                }
              }}
            >
              i
            </button>
            <div id={tooltipId} role="tooltip" className="field-help-tooltip">
              {helpText}
            </div>
          </div>
        ) : null}
      </div>
      <div className="step-input-row step-input-row-number">
        <button
          type="button"
          className="secondary mini"
          onClick={() => onChange(clamp(rounded - step, min, max))}
        >
          -
        </button>
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={draft}
          onFocus={() => setIsEditing(true)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              revertDraft();
              event.currentTarget.blur();
            }
          }}
        />
        <button
          type="button"
          className="secondary mini"
          onClick={() => onChange(clamp(rounded + step, min, max))}
        >
          +
        </button>
        <span className="unit-pill">{unit}</span>
      </div>
    </div>
  );
}

export function StepInspector({
  isOpen,
  isPaused,
  stepLabel,
  anchor,
  values,
  onChange,
  onDiscard,
  onStage,
  onApplyResume,
  onClose
}: StepInspectorProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [openHelpKey, setOpenHelpKey] = useState<string | null>(null);
  const [panelSize, setPanelSize] = useState({ width: 360, height: 420 });
  const capacityMax = useMemo(
    () => scaledUpperBound(values.capacityUnits, 48, 4),
    [values.capacityUnits]
  );
  const ctBaselineMax = useMemo(
    () => scaledUpperBound(values.ctBaseline, 120, 4),
    [values.ctBaseline]
  );
  const ctMultiplierMax = useMemo(
    () => Math.max(4, Number((values.ctMultiplier * 2).toFixed(2))),
    [values.ctMultiplier]
  );
  const leadTimeMax = useMemo(
    () => scaledUpperBound(values.leadTimeMinutes, 120960, 4),
    [values.leadTimeMinutes]
  );
  const materialCostMax = useMemo(
    () => scaledUpperBound(values.materialCostPerUnit, COST_INPUT_MAX, 4),
    [values.materialCostPerUnit]
  );
  const laborCostMax = useMemo(
    () => scaledUpperBound(values.laborRatePerHour, COST_INPUT_MAX, 4),
    [values.laborRatePerHour]
  );
  const equipmentCostMax = useMemo(
    () => scaledUpperBound(values.equipmentRatePerHour, COST_INPUT_MAX, 4),
    [values.equipmentRatePerHour]
  );
  const effectiveCtMinutes = useMemo(
    () => Math.max(0.01, values.ctBaseline * values.ctMultiplier),
    [values.ctBaseline, values.ctMultiplier]
  );
  const grossRatePerHour = useMemo(
    () => (values.capacityUnits * 60) / effectiveCtMinutes,
    [effectiveCtMinutes, values.capacityUnits]
  );
  const netRatePerHour = useMemo(
    () => grossRatePerHour * (1 - clamp(values.downtimePct, 0, 100) / 100),
    [grossRatePerHour, values.downtimePct]
  );
  const impliedTouchMinutes = useMemo(
    () => (netRatePerHour > 0 ? 60 / netRatePerHour : Number.POSITIVE_INFINITY),
    [netRatePerHour]
  );
  const ctMultiplierInput = useEditableNumberInput(
    Number(values.ctMultiplier.toFixed(2)),
    0.1,
    ctMultiplierMax,
    0.01,
    (next) => onChange("ctMultiplier", next)
  );
  const downtimeInput = useEditableNumberInput(
    Number(values.downtimePct.toFixed(1)),
    0,
    95,
    0.1,
    (next) => onChange("downtimePct", next)
  );

  useEffect(() => {
    const update = () => setIsSmallScreen(window.innerWidth <= 900);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setOpenHelpKey(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) {
      return;
    }
    const rect = panelRef.current.getBoundingClientRect();
    setPanelSize({ width: rect.width, height: rect.height });
  }, [isOpen, values, stepLabel, isSmallScreen]);

  const popoverStyle = useMemo(() => {
    if (!anchor || isSmallScreen) {
      return undefined;
    }
    const margin = 16;
    const left = clamp(anchor.x, panelSize.width / 2 + margin, window.innerWidth - panelSize.width / 2 - margin);
    const bottomAnchor = clamp(
      anchor.y - 8,
      panelSize.height + margin,
      window.innerHeight - margin
    );
    return {
      left: `${left}px`,
      top: `${bottomAnchor}px`,
      transform: "translate(-50%, -100%)"
    } as const;
  }, [anchor, isSmallScreen, panelSize.height, panelSize.width]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="inspector-shell"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        ref={panelRef}
        className={`inspector-panel ${isSmallScreen ? "is-modal" : "is-popover"}`}
        style={popoverStyle}
      >
        <div className="inspector-header">
          <h3>Step Inspector</h3>
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="inspector-content">
          <div className="inspector-field">
            <label>Step name</label>
            <div className="readonly-value" title={stepLabel}>
              {stepLabel}
            </div>
          </div>
          <div className="inspector-live-grid" aria-live="polite">
            <article className="inspector-live-card">
              <p>Effective CT</p>
              <strong>{formatMetric(effectiveCtMinutes, 2)} min</strong>
            </article>
            <article className="inspector-live-card">
              <p>Gross Capacity</p>
              <strong>{formatMetric(grossRatePerHour, 2)} /hr</strong>
            </article>
            <article className="inspector-live-card">
              <p>Net Capacity</p>
              <strong>{formatMetric(netRatePerHour, 2)} /hr</strong>
            </article>
            <article className="inspector-live-card">
              <p>Implied Touch Time</p>
              <strong>
                {Number.isFinite(impliedTouchMinutes) ? `${formatMetric(impliedTouchMinutes, 2)} min` : "blocked"}
              </strong>
            </article>
          </div>

          <NumberField
            id="inspector-capacity"
            label="Capacity units"
            helpKey="capacityUnits"
            helpText={STEP_FIELD_HELP.capacityUnits}
            openHelpKey={openHelpKey}
            onToggleHelp={(key) => setOpenHelpKey((current) => (current === key ? null : key))}
            onCloseHelp={(key) => setOpenHelpKey((current) => (current === key ? null : current))}
            value={values.capacityUnits}
            min={1}
            max={capacityMax}
            step={1}
            unit="units"
            onChange={(next) => onChange("capacityUnits", Math.round(next))}
          />

          <NumberField
            id="inspector-ct"
            label="CT baseline"
            helpKey="ctBaseline"
            helpText={STEP_FIELD_HELP.ctBaseline}
            openHelpKey={openHelpKey}
            onToggleHelp={(key) => setOpenHelpKey((current) => (current === key ? null : key))}
            onCloseHelp={(key) => setOpenHelpKey((current) => (current === key ? null : current))}
            value={values.ctBaseline}
            min={0.01}
            max={ctBaselineMax}
            step={0.1}
            unit="min"
            onChange={(next) => onChange("ctBaseline", next)}
          />

          <div className="inspector-field">
            <div className="inspector-label-row">
              <label htmlFor="inspector-ctm">CT multiplier</label>
              <div className={`field-help ${openHelpKey === "ctMultiplier" ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="field-help-trigger"
                  aria-label="About CT multiplier"
                  aria-expanded={openHelpKey === "ctMultiplier"}
                  aria-describedby="inspector-ctm-help"
                  onClick={() =>
                    setOpenHelpKey((current) => (current === "ctMultiplier" ? null : "ctMultiplier"))
                  }
                  onBlur={(event) => {
                    if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
                      setOpenHelpKey((current) => (current === "ctMultiplier" ? null : current));
                    }
                  }}
                >
                  i
                </button>
                <div id="inspector-ctm-help" role="tooltip" className="field-help-tooltip">
                  {STEP_FIELD_HELP.ctMultiplier}
                </div>
              </div>
            </div>
            <div className="step-input-row step-input-row-number">
              <button
                type="button"
                className="secondary mini"
                onClick={() =>
                  onChange("ctMultiplier", clamp(values.ctMultiplier - 0.05, 0.1, ctMultiplierMax))
                }
              >
                -
              </button>
              <input
                id="inspector-ctm"
                type="number"
                min={0.1}
                max={ctMultiplierMax}
                step={0.01}
                value={ctMultiplierInput.draft}
                onFocus={() => ctMultiplierInput.setIsEditing(true)}
                onChange={(event) => ctMultiplierInput.setDraft(event.target.value)}
                onBlur={ctMultiplierInput.commitDraft}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                  if (event.key === "Escape") {
                    ctMultiplierInput.revertDraft();
                    event.currentTarget.blur();
                  }
                }}
              />
              <button
                type="button"
                className="secondary mini"
                onClick={() =>
                  onChange("ctMultiplier", clamp(values.ctMultiplier + 0.05, 0.1, ctMultiplierMax))
                }
              >
                +
              </button>
              <span className="unit-pill">x</span>
            </div>
            <div className="preset-row">
              {[0.85, 1, 1.15].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="secondary preset-btn"
                  onClick={() => onChange("ctMultiplier", preset)}
                >
                  {preset.toFixed(2)}x
                </button>
              ))}
            </div>
          </div>

          <div className="inspector-field">
            <div className="inspector-label-row">
              <label htmlFor="inspector-dt">Downtime</label>
              <div className={`field-help ${openHelpKey === "downtimePct" ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="field-help-trigger"
                  aria-label="About Downtime"
                  aria-expanded={openHelpKey === "downtimePct"}
                  aria-describedby="inspector-dt-help"
                  onClick={() =>
                    setOpenHelpKey((current) => (current === "downtimePct" ? null : "downtimePct"))
                  }
                  onBlur={(event) => {
                    if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
                      setOpenHelpKey((current) => (current === "downtimePct" ? null : current));
                    }
                  }}
                >
                  i
                </button>
                <div id="inspector-dt-help" role="tooltip" className="field-help-tooltip">
                  {STEP_FIELD_HELP.downtimePct}
                </div>
              </div>
            </div>
            <div className="step-input-row step-input-row-range">
              <input
                id="inspector-dt"
                className="inspector-range"
                type="range"
                min={0}
                max={95}
                step={DOWNTIME_STEP}
                value={values.downtimePct}
                onChange={(event) =>
                  onChange("downtimePct", clamp(Number(event.target.value), 0, 95))
                }
              />
              <button
                type="button"
                className="secondary mini"
                onClick={() =>
                  onChange("downtimePct", clamp(values.downtimePct - DOWNTIME_STEP, 0, 95))
                }
              >
                -
              </button>
              <button
                type="button"
                className="secondary mini"
                onClick={() =>
                  onChange("downtimePct", clamp(values.downtimePct + DOWNTIME_STEP, 0, 95))
                }
              >
                +
              </button>
              <input
                className="downtime-value-input"
                type="number"
                min={0}
                max={95}
                step={0.1}
                value={downtimeInput.draft}
                onFocus={() => downtimeInput.setIsEditing(true)}
                onChange={(event) => downtimeInput.setDraft(event.target.value)}
                onBlur={downtimeInput.commitDraft}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                  if (event.key === "Escape") {
                    downtimeInput.revertDraft();
                    event.currentTarget.blur();
                  }
                }}
              />
              <span className="unit-pill">%</span>
            </div>
            <div className="preset-row">
              {DOWNTIME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="secondary preset-btn"
                  onClick={() => onChange("downtimePct", preset)}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          <NumberField
            id="inspector-lead-time"
            label="Lead Time"
            helpKey="leadTimeMinutes"
            helpText={STEP_FIELD_HELP.leadTimeMinutes}
            openHelpKey={openHelpKey}
            onToggleHelp={(key) => setOpenHelpKey((current) => (current === key ? null : key))}
            onCloseHelp={(key) => setOpenHelpKey((current) => (current === key ? null : current))}
            value={values.leadTimeMinutes}
            min={0}
            max={leadTimeMax}
            step={10}
            unit="min"
            onChange={(next) => onChange("leadTimeMinutes", next)}
          />

          <NumberField
            id="inspector-material-cost"
            label="Material cost / unit"
            helpKey="materialCostPerUnit"
            helpText={STEP_FIELD_HELP.materialCostPerUnit}
            openHelpKey={openHelpKey}
            onToggleHelp={(key) => setOpenHelpKey((current) => (current === key ? null : key))}
            onCloseHelp={(key) => setOpenHelpKey((current) => (current === key ? null : current))}
            value={values.materialCostPerUnit}
            min={0}
            max={materialCostMax}
            step={0.1}
            unit="$"
            onChange={(next) => onChange("materialCostPerUnit", next)}
          />

          <NumberField
            id="inspector-labor-rate"
            label="Labor rate / hr"
            helpKey="laborRatePerHour"
            helpText={STEP_FIELD_HELP.laborRatePerHour}
            openHelpKey={openHelpKey}
            onToggleHelp={(key) => setOpenHelpKey((current) => (current === key ? null : key))}
            onCloseHelp={(key) => setOpenHelpKey((current) => (current === key ? null : current))}
            value={values.laborRatePerHour}
            min={0}
            max={laborCostMax}
            step={0.1}
            unit="$/hr"
            onChange={(next) => onChange("laborRatePerHour", next)}
          />

          <NumberField
            id="inspector-equipment-rate"
            label="Equipment rate / hr"
            helpKey="equipmentRatePerHour"
            helpText={STEP_FIELD_HELP.equipmentRatePerHour}
            openHelpKey={openHelpKey}
            onToggleHelp={(key) => setOpenHelpKey((current) => (current === key ? null : key))}
            onCloseHelp={(key) => setOpenHelpKey((current) => (current === key ? null : current))}
            value={values.equipmentRatePerHour}
            min={0}
            max={equipmentCostMax}
            step={0.1}
            unit="$/hr"
            onChange={(next) => onChange("equipmentRatePerHour", next)}
          />
        </div>

        <div className="inspector-actions">
          {isPaused ? (
            <>
              <button type="button" className="secondary" onClick={onStage}>
                Stage Changes
              </button>
              <button type="button" className="secondary" onClick={onDiscard}>
                Discard
              </button>
              <button type="button" className="primary" onClick={onApplyResume}>
                Apply &amp; Start
              </button>
            </>
          ) : (
            <button type="button" className="primary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
