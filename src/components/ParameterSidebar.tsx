import { useEffect, useState } from "react";
import type { ParameterGroup, SelectOption } from "../types/contracts";

interface ParameterSidebarProps {
  groups: ParameterGroup[];
  scenario: Record<string, number | string>;
  onChange: (key: string, value: number | string) => void;
  editable: boolean;
  isRailOpen: boolean;
  onToggleRail: () => void;
}

function formatBadge(value: number | string, unit?: string): string {
  if (typeof value === "number") {
    return `${value}${unit ? ` ${unit}` : ""}`;
  }
  return `${value}${unit ? ` ${unit}` : ""}`;
}

function getOptionValue(option: string | SelectOption): string {
  return typeof option === "string" ? option : option.value;
}

function getOptionLabel(option: string | SelectOption): string {
  return typeof option === "string" ? option : option.label;
}

interface ActiveHelp {
  tooltipId: string;
  text: string;
  top: number;
  left: number;
  placement: "right" | "left" | "below";
}

export function ParameterSidebar({
  groups,
  scenario,
  onChange,
  editable,
  isRailOpen,
  onToggleRail
}: ParameterSidebarProps) {
  const [activeHelp, setActiveHelp] = useState<ActiveHelp | null>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const updateLayout = () => {
      const compact = window.innerWidth <= 1220;
      setIsCompact(compact);
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  useEffect(() => {
    if (!activeHelp) {
      return;
    }

    const handleWindowChange = () => setActiveHelp(null);
    window.addEventListener("scroll", handleWindowChange, true);
    window.addEventListener("resize", handleWindowChange);
    return () => {
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, [activeHelp]);

  const showHelp = (tooltipId: string, text: string, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    const padding = 12;
    const gap = 12;
    const fallbackWidth = 260;
    const width = Math.min(fallbackWidth, Math.max(220, window.innerWidth - padding * 2));
    const rightSpace = window.innerWidth - rect.right - gap;
    const leftSpace = rect.left - gap;

    if (rightSpace >= width) {
      setActiveHelp({
        tooltipId,
        text,
        top: Math.max(padding, rect.top + rect.height / 2),
        left: Math.min(rect.right + gap, window.innerWidth - width - padding),
        placement: "right"
      });
      return;
    }

    if (leftSpace >= width) {
      setActiveHelp({
        tooltipId,
        text,
        top: Math.max(padding, rect.top + rect.height / 2),
        left: Math.max(padding, rect.left - gap - width),
        placement: "left"
      });
      return;
    }

    setActiveHelp({
      tooltipId,
      text,
      top: Math.min(window.innerHeight - padding - 20, rect.bottom + gap),
      left: Math.max(padding, Math.min(rect.left, window.innerWidth - width - padding)),
      placement: "below"
    });
  };

  return (
    <div
      className={`parameter-sidebar ${isCompact ? "is-compact" : ""} ${isRailOpen ? "is-rail-open" : "is-rail-collapsed"}`}
    >
      {!isRailOpen ? (
        <button
          type="button"
          className="parameter-rail-tab"
          onClick={onToggleRail}
          aria-label="Show what-if controls"
        >
          <span className="parameter-rail-tab-kicker">Open</span>
          <span className="parameter-rail-tab-title">What-if Controls</span>
          <span className="parameter-rail-tab-arrow" aria-hidden="true">
            ›
          </span>
        </button>
      ) : null}
      <div className="panel-toolbar">
        <div>
          <p className="parameter-eyebrow">What-if Controls</p>
          <h2>{isRailOpen ? "Parameters" : "What-if"}</h2>
        </div>
        {isRailOpen ? (
          <button type="button" className="secondary panel-toggle" onClick={onToggleRail}>
            Hide
          </button>
        ) : null}
      </div>

      {!isRailOpen ? (
        <div className="parameter-rail-summary">
          <span>{groups.length} groups</span>
          <span>{editable ? "Ready for what-if testing" : "Pause to edit"}</span>
        </div>
      ) : null}

      {!editable && isRailOpen ? <p className="panel-hint">Pause to edit parameters.</p> : null}

      <div className={`parameter-scroll ${isRailOpen ? "" : "is-collapsed"}`}>
        {groups.map((group) => (
          <section key={group.groupId} className="parameter-group">
            <h3>{group.label}</h3>
            {group.fields.map((field) => {
              const value = scenario[field.key] ?? field.defaultValue;
              const tooltipId = `${field.key}-help`;
              return (
                <div key={field.key} className="input-row">
                  <div className="input-row-header">
                    <label htmlFor={field.key}>{field.label}</label>
                    {field.helpText ? (
                      <div className="field-help">
                        <button
                          type="button"
                          className="field-help-trigger"
                          aria-label={`About ${field.label}`}
                          aria-expanded={activeHelp?.tooltipId === tooltipId}
                          aria-describedby={tooltipId}
                          onFocus={(event) => showHelp(tooltipId, field.helpText ?? "", event.currentTarget)}
                          onMouseEnter={(event) => showHelp(tooltipId, field.helpText ?? "", event.currentTarget)}
                          onMouseLeave={() => setActiveHelp((current) => (current?.tooltipId === tooltipId ? null : current))}
                          onBlur={(event) => {
                            if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
                              setActiveHelp((current) => (current?.tooltipId === tooltipId ? null : current));
                            }
                          }}
                        >
                          i
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <div className="value-badge">{formatBadge(value, field.unit)}</div>
                  {field.type === "dropdown" ? (
                    <select
                      id={field.key}
                      value={String(value)}
                      onChange={(event) => onChange(field.key, event.target.value)}
                      disabled={!editable}
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={getOptionValue(option)} value={getOptionValue(option)}>
                          {getOptionLabel(option)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={field.key}
                      type={field.type === "slider" ? "range" : "number"}
                      value={Number(value)}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      onChange={(event) => onChange(field.key, Number(event.target.value))}
                      disabled={!editable}
                    />
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </div>
      {activeHelp ? (
        <div
          id={activeHelp.tooltipId}
          role="tooltip"
          className={`field-help-tooltip field-help-tooltip-floating field-help-tooltip-${activeHelp.placement}`}
          style={{
            position: "fixed",
            top: `${activeHelp.top}px`,
            left: `${activeHelp.left}px`,
            width: `min(260px, calc(100vw - 24px))`
          }}
        >
          {activeHelp.text}
        </div>
      ) : null}
    </div>
  );
}
