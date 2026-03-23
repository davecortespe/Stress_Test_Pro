import { useEffect, useMemo, useRef, useState } from "react";
import type { KpiConfig } from "../types/contracts";

interface KpiRowProps {
  kpis: KpiConfig[];
  metrics: Record<string, number | string>;
  featuredKey?: string;
  variant?: "default" | "compact" | "overlay";
  referenceMetrics?: Record<string, number>;
  referenceLabel?: string;
}

const KPI_HELP_FALLBACK: Record<string, string> = {
  forecastThroughput:
    "Estimated completed output rate per hour under the current scenario settings and elapsed-time state.",
  bottleneckMigration:
    "Shows where the active constraint is predicted to move after applying current relief settings.",
  bottleneckIndex:
    "Constraint pressure score (0-100%). Higher values mean tighter capacity and higher risk of flow breakage.",
  brittleness:
    "System fragility score (0-100%) combining queue risk, saturation, WIP pressure, and migration instability.",
  throughputDelta:
    "Change in throughput per hour versus baseline after applying bottleneck relief settings.",
  totalWipQty: "Total work-in-process currently in the system (queue plus in-process load across all steps).",
  totalCompletedOutputPieces:
    "Cumulative completed units at the end of the flow for the current elapsed simulation time."
};

function useAnimatedNumber(target: number, durationMs = 280): number {
  const [value, setValue] = useState(target);
  const lastValueRef = useRef(target);

  useEffect(() => {
    const from = lastValueRef.current;
    const to = target;
    if (Math.abs(to - from) < 1e-6) {
      setValue(to);
      return;
    }

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (to - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    lastValueRef.current = to;

    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

function formatValue(value: number | string, format?: KpiConfig["format"], decimals = 1): string {
  if (typeof value === "string") {
    return value;
  }
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
  if (format === "percent") {
    return `${(value * 100).toFixed(decimals)}%`;
  }
  if (format === "delta") {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(decimals)}`;
  }
  if (format === "duration") {
    return `${value.toFixed(decimals)} min`;
  }
  return value.toFixed(decimals);
}

function buildDeltaLabel(key: string, current: number, previous: number, format?: KpiConfig["format"]): string {
  const delta = current - previous;
  if (Math.abs(delta) < 1e-6) {
    return "No change";
  }
  const sign = delta > 0 ? "+" : "";
  if (format === "percent") {
    return `${sign}${(delta * 100).toFixed(1)} pts`;
  }
  if (key === "forecastThroughput") {
    return `${sign}${delta.toFixed(2)} /hr`;
  }
  return `${sign}${Math.round(delta)}`;
}

function getSeverityMeta(key: string, rawValue: number | string): { tone: "neutral" | "good" | "watch" | "alert"; label: string } | null {
  if (typeof rawValue !== "number") {
    return null;
  }
  if (key === "bottleneckIndex") {
    if (rawValue >= 0.95) {
      return { tone: "alert", label: "Critical" };
    }
    if (rawValue >= 0.85) {
      return { tone: "watch", label: "Tight" };
    }
    if (rawValue >= 0.7) {
      return { tone: "neutral", label: "Elevated" };
    }
    return { tone: "good", label: "Controlled" };
  }
  if (key === "totalWipQty") {
    if (rawValue >= 1500) {
      return { tone: "alert", label: "High WIP" };
    }
    if (rawValue >= 750) {
      return { tone: "watch", label: "Building" };
    }
    return { tone: "good", label: "Contained" };
  }
  if (key === "forecastThroughput") {
    if (rawValue < 3) {
      return { tone: "alert", label: "Low output" };
    }
    if (rawValue < 5) {
      return { tone: "watch", label: "Constrained" };
    }
    return { tone: "good", label: "Stable" };
  }
  if (key === "totalCompletedOutputPieces") {
    return { tone: "neutral", label: "Run total" };
  }
  return null;
}

function buildSparklinePoints(values: number[], width = 72, height = 22, extendedValues?: number[]): string {
  if (values.length === 0) {
    return "";
  }
  const allForRange = extendedValues ? [...values, ...extendedValues] : values;
  const min = Math.min(...allForRange);
  const max = Math.max(...allForRange);
  const span = Math.max(max - min, 1e-6);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildReferenceLineY(values: number[], refVal: number, height = 22): number {
  const allForRange = [...values, refVal];
  const min = Math.min(...allForRange);
  const max = Math.max(...allForRange);
  const span = Math.max(max - min, 1e-6);
  const y = height - ((refVal - min) / span) * height;
  return Math.max(0, Math.min(height, y));
}

function KpiCard({
  kpi,
  rawValue,
  isFeatured,
  variant,
  referenceValue
}: {
  kpi: KpiConfig;
  rawValue: number | string;
  isFeatured: boolean;
  variant: "default" | "compact" | "overlay";
  referenceValue?: number;
}) {
  const prevRef = useRef<number | string>(rawValue);
  const [trend, setTrend] = useState<"flat" | "up" | "down">("flat");
  const [history, setHistory] = useState<number[]>(() =>
    typeof rawValue === "number" ? [rawValue] : []
  );
  const numericTarget = typeof rawValue === "number" ? rawValue : 0;
  const animatedNumeric = useAnimatedNumber(numericTarget);

  useEffect(() => {
    const prev = prevRef.current;
    if (typeof rawValue === "number" && typeof prev === "number") {
      if (rawValue > prev + 1e-6) {
        setTrend("up");
      } else if (rawValue < prev - 1e-6) {
        setTrend("down");
      } else {
        setTrend("flat");
      }
    } else {
      setTrend("flat");
    }
    prevRef.current = rawValue;
  }, [rawValue]);

  useEffect(() => {
    if (typeof rawValue !== "number") {
      setHistory([]);
      return;
    }
    setHistory((current) => {
      const next = [...current, rawValue];
      return next.slice(-12);
    });
  }, [rawValue]);

  const displayValue =
    typeof rawValue === "number"
      ? formatValue(animatedNumeric, kpi.format, kpi.decimals ?? 1)
      : formatValue(rawValue, kpi.format, kpi.decimals ?? 1);
  const helpText = kpi.helpText ?? KPI_HELP_FALLBACK[kpi.key] ?? "";
  const tooltipId = `kpi-help-${kpi.key.replace(/[^a-z0-9_-]/gi, "-").toLowerCase()}`;
  const showHelp = variant !== "overlay";
  const isTotalCompletedLots = kpi.key === "totalCompletedOutputPieces";
  const displayNumericValue =
    typeof rawValue === "number" && isTotalCompletedLots ? Math.floor(animatedNumeric) : animatedNumeric;
  const displayDecimals = isTotalCompletedLots ? 0 : kpi.decimals ?? 1;
  const deltaLabel =
    typeof rawValue === "number" && typeof prevRef.current === "number"
      ? buildDeltaLabel(kpi.key, rawValue, prevRef.current, kpi.format)
      : null;
  const severityMeta = getSeverityMeta(kpi.key, rawValue);
  const hasReference = typeof referenceValue === "number" && Number.isFinite(referenceValue);
  const sparklinePoints = useMemo(
    () => buildSparklinePoints(history, 72, 22, hasReference ? [referenceValue as number] : undefined),
    [history, hasReference, referenceValue]
  );
  const referenceLineY = useMemo(
    () => (hasReference && history.length > 0 ? buildReferenceLineY(history, referenceValue as number) : null),
    [history, hasReference, referenceValue]
  );
  const showContext = typeof rawValue === "number" && variant !== "compact";

  return (
    <article
      className={`kpi-card kpi-${trend} kpi-${variant} ${isFeatured ? "kpi-featured" : ""} ${
        isTotalCompletedLots ? "kpi-magenta-outline" : ""
      } ${severityMeta ? `kpi-tone-${severityMeta.tone}` : ""}`}
    >
      <div className="kpi-label-row">
        <p>{kpi.label}</p>
      {showHelp && helpText ? (
          <span className="kpi-help-wrap">
            <button
              type="button"
              className="kpi-help-trigger"
              aria-label={`About ${kpi.label}`}
              aria-describedby={tooltipId}
            >
              i
            </button>
            <span id={tooltipId} role="tooltip" className="kpi-help-tooltip">
              {helpText}
            </span>
          </span>
        ) : null}
      </div>
      <h2>{typeof rawValue === "number" ? formatValue(displayNumericValue, kpi.format, displayDecimals) : displayValue}</h2>
      {showContext ? (
        <div className="kpi-context-row">
          <div className="kpi-context-chips">
            {severityMeta ? (
              <span className={`kpi-context-chip tone-${severityMeta.tone}`}>{severityMeta.label}</span>
            ) : null}
            {deltaLabel ? <span className="kpi-context-chip tone-muted">{deltaLabel}</span> : null}
          </div>
          {sparklinePoints ? (
            <svg viewBox="0 0 72 22" className={`kpi-sparkline trend-${trend}`} aria-hidden="true">
              {referenceLineY !== null ? (
                <line
                  x1="0"
                  y1={referenceLineY.toFixed(1)}
                  x2="72"
                  y2={referenceLineY.toFixed(1)}
                  className="sparkline-reference-line"
                />
              ) : null}
              <polyline points={sparklinePoints} />
            </svg>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function KpiRow({ kpis, metrics, featuredKey, variant = "default", referenceMetrics, referenceLabel }: KpiRowProps) {
  const featuredMetricKey = featuredKey ?? kpis[0]?.key;
  return (
    <div className={`kpi-row-wrap kpi-row-wrap-${variant}`}>
      <section className={`kpi-row kpi-row-${variant}`}>
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.key}
            kpi={kpi}
            rawValue={metrics[kpi.key] ?? 0}
            isFeatured={kpi.key === featuredMetricKey}
            variant={variant}
            referenceValue={referenceMetrics ? (typeof referenceMetrics[kpi.key] === "number" ? referenceMetrics[kpi.key] : undefined) : undefined}
          />
        ))}
      </section>
      {referenceMetrics && referenceLabel ? (
        <p className="kpi-reference-legend">
          <span className="kpi-reference-dash" aria-hidden="true" /> Baseline: {referenceLabel}
        </p>
      ) : null}
    </div>
  );
}
