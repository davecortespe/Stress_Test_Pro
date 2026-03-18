import { useEffect, useRef, useState } from "react";
import type { KpiConfig } from "../types/contracts";

interface KpiRowProps {
  kpis: KpiConfig[];
  metrics: Record<string, number | string>;
  featuredKey?: string;
  variant?: "default" | "compact" | "overlay";
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

function KpiCard({
  kpi,
  rawValue,
  isFeatured,
  variant
}: {
  kpi: KpiConfig;
  rawValue: number | string;
  isFeatured: boolean;
  variant: "default" | "compact" | "overlay";
}) {
  const prevRef = useRef<number | string>(rawValue);
  const [trend, setTrend] = useState<"flat" | "up" | "down">("flat");
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

  const displayValue =
    typeof rawValue === "number"
      ? formatValue(animatedNumeric, kpi.format, kpi.decimals ?? 1)
      : formatValue(rawValue, kpi.format, kpi.decimals ?? 1);
  const helpText = kpi.helpText ?? KPI_HELP_FALLBACK[kpi.key] ?? "";
  const tooltipId = `kpi-help-${kpi.key.replace(/[^a-z0-9_-]/gi, "-").toLowerCase()}`;
  const showHelp = variant !== "overlay";
  const isTotalCompletedLots = kpi.key === "totalCompletedOutputPieces";

  return (
    <article
      className={`kpi-card kpi-${trend} kpi-${variant} ${isFeatured ? "kpi-featured" : ""} ${
        isTotalCompletedLots ? "kpi-magenta-outline" : ""
      }`}
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
      <h2>{displayValue}</h2>
    </article>
  );
}

export function KpiRow({ kpis, metrics, featuredKey, variant = "default" }: KpiRowProps) {
  const featuredMetricKey = featuredKey ?? kpis[0]?.key;
  return (
    <section className={`kpi-row kpi-row-${variant}`}>
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.key}
          kpi={kpi}
          rawValue={metrics[kpi.key] ?? 0}
          isFeatured={kpi.key === featuredMetricKey}
          variant={variant}
        />
      ))}
    </section>
  );
}
