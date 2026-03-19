import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import type { ParameterGroup, SelectOption } from "../types/contracts";

interface ParameterSidebarProps {
  groups: ParameterGroup[];
  scenario: Record<string, number | string>;
  onChange: (key: string, value: number | string) => void;
  editable: boolean;
  isRailOpen: boolean;
  railWidth: number;
  minRailWidth: number;
  maxRailWidth: number;
  onToggleRail: () => void;
  onRailWidthChange: (nextWidth: number) => void;
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

export function ParameterSidebar({
  groups,
  scenario,
  onChange,
  editable,
  isRailOpen,
  railWidth,
  minRailWidth,
  maxRailWidth,
  onToggleRail,
  onRailWidthChange
}: ParameterSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const [openHelpId, setOpenHelpId] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

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
    if (!openHelpId) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(".field-help")) {
        return;
      }
      setOpenHelpId(null);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [openHelpId]);

  useEffect(
    () => () => {
      resizeCleanupRef.current?.();
    },
    []
  );

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isRailOpen) {
      return;
    }

    resizeCleanupRef.current?.();
    event.preventDefault();
    event.stopPropagation();

    const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    setIsResizing(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      onRailWidthChange(moveEvent.clientX - sidebarLeft);
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
      if (document.body.style.cursor === "col-resize") {
        document.body.style.removeProperty("cursor");
      }
      if (document.body.style.userSelect === "none") {
        document.body.style.removeProperty("user-select");
      }
      resizeCleanupRef.current = null;
      setIsResizing(false);
    };

    resizeCleanupRef.current = cleanup;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
  };

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isRailOpen) {
      return;
    }

    const step = event.shiftKey ? 48 : 24;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onRailWidthChange(railWidth - step);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onRailWidthChange(railWidth + step);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      onRailWidthChange(minRailWidth);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      onRailWidthChange(maxRailWidth);
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={`parameter-sidebar ${isCompact ? "is-compact" : ""} ${isRailOpen ? "is-rail-open" : "is-rail-collapsed"} ${isResizing ? "is-resizing" : ""}`}
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
                      <div className={`field-help ${openHelpId === tooltipId ? "is-open" : ""}`}>
                        <button
                          type="button"
                          className="field-help-trigger"
                          aria-label={`About ${field.label}`}
                          aria-expanded={openHelpId === tooltipId}
                          aria-describedby={tooltipId}
                          aria-haspopup="true"
                          onClick={() => setOpenHelpId((current) => (current === tooltipId ? null : tooltipId))}
                          onFocus={() => setOpenHelpId(tooltipId)}
                          onBlur={(event) => {
                            if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
                              setOpenHelpId((current) => (current === tooltipId ? null : current));
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              setOpenHelpId((current) => (current === tooltipId ? null : current));
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
      {isRailOpen ? (
        <button
          type="button"
          className="parameter-resize-handle"
          role="separator"
          aria-label="Resize parameters panel"
          aria-orientation="vertical"
          aria-valuemin={minRailWidth}
          aria-valuemax={maxRailWidth}
          aria-valuenow={Math.round(railWidth)}
          onPointerDown={startResize}
          onKeyDown={handleResizeKeyDown}
        >
          <span aria-hidden="true" className="parameter-resize-grip" />
        </button>
      ) : null}
    </div>
  );
}
