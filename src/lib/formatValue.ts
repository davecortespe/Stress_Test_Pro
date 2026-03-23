import type { KpiConfig } from "../types/contracts";

export function formatValue(value: number | string, format?: KpiConfig["format"], decimals = 1): string {
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
