import { useState } from "react";
import type { ParameterGroup, SelectOption } from "../types/contracts";

interface ParameterSidebarProps {
  groups: ParameterGroup[];
  scenario: Record<string, number | string>;
  onChange: (key: string, value: number | string) => void;
  editable: boolean;
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

export function ParameterSidebar({ groups, scenario, onChange, editable }: ParameterSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [openHelpKey, setOpenHelpKey] = useState<string | null>(null);

  return (
    <div className="parameter-sidebar">
      <div className="panel-toolbar">
        <h2>Parameters</h2>
        <button
          type="button"
          className="secondary panel-toggle"
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!editable ? <p className="panel-hint">Pause to edit parameters.</p> : null}

      <div className={`parameter-scroll ${collapsed ? "is-collapsed" : ""}`}>
        {groups.map((group) => (
          <section key={group.groupId} className="parameter-group">
            <h3>{group.label}</h3>
            {group.fields.map((field) => {
              const value = scenario[field.key] ?? field.defaultValue;
              const tooltipId = `${field.key}-help`;
              const isHelpOpen = openHelpKey === field.key;
              return (
                <div key={field.key} className="input-row">
                  <div className="input-row-header">
                    <label htmlFor={field.key}>{field.label}</label>
                    {field.helpText ? (
                      <div className={`field-help ${isHelpOpen ? "is-open" : ""}`}>
                        <button
                          type="button"
                          className="field-help-trigger"
                          aria-label={`About ${field.label}`}
                          aria-expanded={isHelpOpen}
                          aria-describedby={tooltipId}
                          onClick={() =>
                            setOpenHelpKey((current) => (current === field.key ? null : field.key))
                          }
                          onBlur={(event) => {
                            if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
                              setOpenHelpKey((current) => (current === field.key ? null : current));
                            }
                          }}
                        >
                          i
                        </button>
                        <div id={tooltipId} role="tooltip" className="field-help-tooltip">
                          {field.helpText}
                        </div>
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
    </div>
  );
}
