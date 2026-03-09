import { useEffect, useMemo, useRef, useState } from "react";

interface StepInspectorValues {
  capacityUnits: number;
  ctBaseline: number;
  ctMultiplier: number;
  downtimePct: number;
  leadTimeMinutes: number;
}

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

function NumberField({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (next: number) => void;
}) {
  const rounded = Number(value.toFixed(step < 1 ? 2 : 0));
  return (
    <div className="inspector-field">
      <label htmlFor={id}>{label}</label>
      <div className="step-input-row">
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
          value={rounded}
          onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
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

  useEffect(() => {
    const update = () => setIsSmallScreen(window.innerWidth <= 900);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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

        <div className="inspector-field">
          <label>Step name</label>
          <div className="readonly-value" title={stepLabel}>
            {stepLabel}
          </div>
        </div>

        <NumberField
          id="inspector-capacity"
          label="Capacity units"
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
          value={values.ctBaseline}
          min={0.01}
          max={ctBaselineMax}
          step={0.1}
          unit="min"
          onChange={(next) => onChange("ctBaseline", next)}
        />

        <div className="inspector-field">
          <label htmlFor="inspector-ctm">CT multiplier</label>
          <div className="step-input-row">
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
              value={Number(values.ctMultiplier.toFixed(2))}
              onChange={(event) =>
                onChange("ctMultiplier", clamp(Number(event.target.value), 0.1, ctMultiplierMax))
              }
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
          <label htmlFor="inspector-dt">Downtime</label>
          <div className="step-input-row">
            <input
              id="inspector-dt"
              type="range"
              min={0}
              max={95}
              step={0.5}
              value={values.downtimePct}
              onChange={(event) =>
                onChange("downtimePct", clamp(Number(event.target.value), 0, 95))
              }
            />
            <input
              type="number"
              min={0}
              max={95}
              step={0.1}
              value={Number(values.downtimePct.toFixed(1))}
              onChange={(event) =>
                onChange("downtimePct", clamp(Number(event.target.value), 0, 95))
              }
            />
            <span className="unit-pill">%</span>
          </div>
        </div>

        <NumberField
          id="inspector-lead-time"
          label="Lead Time"
          value={values.leadTimeMinutes}
          min={0}
          max={leadTimeMax}
          step={10}
          unit="min"
          onChange={(next) => onChange("leadTimeMinutes", next)}
        />

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
