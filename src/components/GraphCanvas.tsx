import { useEffect, useMemo, useState } from "react";
import { computeNodeLayout } from "../lib/layoutGraph";
import type { SimulationOutput, VsmGraph } from "../types/contracts";

interface GraphCanvasProps {
  graph: VsmGraph;
  output: SimulationOutput;
  nodeCardFields: string[];
  showProbabilities: boolean;
  animateEdges: boolean;
  onNodeDoubleClick?: (nodeId: string, anchor: { x: number; y: number }) => void;
  resetViewSignal?: number;
}

function metricLabel(key: string): string {
  if (key === "utilization") {
    return "util";
  }
  if (key === "queueDepth") {
    return "queue depth";
  }
  if (key === "wipQty") {
    return "lot/wip";
  }
  if (key === "completedQty") {
    return "Completed Lot";
  }
  if (key === "idleWaitHours") {
    return "idle wait";
  }
  if (key === "capacityPerHour") {
    return "cap/hr";
  }
  if (key === "headroom") {
    return "headroom";
  }
  if (key === "queueRisk") {
    return "queue risk";
  }
  if (key === "bottleneckIndex") {
    return "bn idx";
  }
  if (key === "status") {
    return "status";
  }
  if (key === "bottleneckFlag") {
    return "bottleneck";
  }
  return key;
}

function metricValue(value: unknown, key: string): string {
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    if (key === "queueDepth") {
      return value.toFixed(1);
    }
    if (key === "wipQty") {
      return `${Math.round(value)} pcs`;
    }
    if (key === "completedQty") {
      return `${Math.round(value)} pcs`;
    }
    if (key === "idleWaitHours") {
      return `${value.toFixed(1)} h`;
    }
    if (key === "utilization" && value > 0 && value < 1.35) {
      return `${(value * 100).toFixed(0)}%`;
    }
    return value.toFixed(1);
  }
  return "--";
}

function utilizationBand(utilization: number | null | undefined): "cool" | "warm" | "hot" | "unknown" {
  if (typeof utilization !== "number") {
    return "unknown";
  }
  if (utilization >= 0.85) {
    return "hot";
  }
  if (utilization >= 0.55) {
    return "warm";
  }
  return "cool";
}

function clampTitleLines(input: string, maxCharsPerLine = 16): string[] {
  const words = input.split(/\s+/).filter((token) => token.length > 0);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length > 0 ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine || current.length === 0) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === 2) {
      break;
    }
  }

  if (lines.length < 2 && current.length > 0) {
    lines.push(current);
  }

  if (lines.length > 2) {
    lines.length = 2;
  }

  const reconstructed = lines.join(" ");
  if (reconstructed.length < input.length && lines.length === 2) {
    const second = lines[1];
    lines[1] = second.length > maxCharsPerLine - 1 ? `${second.slice(0, maxCharsPerLine - 2)}...` : `${second}...`;
  }

  return lines.slice(0, 2);
}

function wipFillRatio(wipQty: number | null | undefined, capacityPerHour: number | null | undefined): number {
  if (typeof wipQty !== "number" || !Number.isFinite(wipQty) || wipQty <= 0) {
    return 0;
  }
  const reference = typeof capacityPerHour === "number" && capacityPerHour > 0 ? capacityPerHour * 0.75 : 18;
  const ratio = wipQty / Math.max(6, reference);
  return Math.max(0, Math.min(1, ratio));
}

function wipLoadClass(fill: number): "wip-low" | "wip-medium" | "wip-high" {
  if (fill >= 0.8) {
    return "wip-high";
  }
  if (fill >= 0.45) {
    return "wip-medium";
  }
  return "wip-low";
}

function idleFillRatio(idleWaitPct: number | null | undefined): number {
  if (typeof idleWaitPct !== "number" || !Number.isFinite(idleWaitPct) || idleWaitPct <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, idleWaitPct));
}

function idleLoadClass(fill: number): "idle-low" | "idle-medium" | "idle-high" {
  if (fill >= 0.8) {
    return "idle-high";
  }
  if (fill >= 0.45) {
    return "idle-medium";
  }
  return "idle-low";
}

export function GraphCanvas({
  graph,
  output,
  nodeCardFields,
  showProbabilities,
  animateEdges,
  onNodeDoubleClick,
  resetViewSignal
}: GraphCanvasProps) {
  const positions = useMemo(() => computeNodeLayout(graph), [graph]);
  const nodeCardHeight = 140;
  const nodeMetricSpacing = 12;
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [resetViewSignal]);

  return (
    <section className="graph-stage">
      <div className="graph-toolbar">
        <button type="button" onClick={() => setZoom((z) => Math.min(2.6, z + 0.12))}>
          +
        </button>
        <button type="button" onClick={() => setZoom((z) => Math.max(0.45, z - 0.12))}>
          -
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
          }}
        >
          Reset
        </button>
      </div>
      <svg
        viewBox="0 0 1280 720"
        onWheel={(event) => {
          event.preventDefault();
          const factor = event.deltaY < 0 ? 1.08 : 0.92;
          setZoom((z) => Math.max(0.45, Math.min(2.6, z * factor)));
        }}
        onMouseDown={(event) =>
          setDragStart({ x: event.clientX - offset.x, y: event.clientY - offset.y })
        }
        onMouseMove={(event) => {
          if (!dragStart) {
            return;
          }
          setOffset({
            x: event.clientX - dragStart.x,
            y: event.clientY - dragStart.y
          });
        }}
        onMouseUp={() => setDragStart(null)}
        onMouseLeave={() => setDragStart(null)}
      >
        <defs>
          <marker id="edgeArrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#33bac0" />
          </marker>
        </defs>

        <g transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`}>
          {graph.edges.map((edge) => {
            const source = positions[edge.from];
            const target = positions[edge.to];
            if (!source || !target) {
              return null;
            }

            const startX = source.x + 170;
            const startY = source.y + 44;
            const endX = target.x;
            const endY = target.y + 44;
            const curve = Math.max(45, (endX - startX) * 0.35);
            const pathDef = `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`;
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            return (
              <g key={`${edge.from}-${edge.to}`}>
                <path
                  d={pathDef}
                  markerEnd="url(#edgeArrow)"
                  className={animateEdges ? "edge edge-live" : "edge"}
                />
                {showProbabilities && typeof edge.probability === "number" ? (
                  <text x={midX} y={midY - 10} className="edge-prob">
                    {(edge.probability * 100).toFixed(0)}%
                  </text>
                ) : null}
              </g>
            );
          })}

          {graph.nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) {
              return null;
            }
            const metrics = output.nodeMetrics[node.id];
            const isBottleneck = metrics?.bottleneckFlag;
            const nodeStatus = metrics?.status ?? "neutral";
            const heatBand = utilizationBand(metrics?.utilization);
            const idleFill = idleFillRatio(metrics?.idleWaitPct);
            const idleSegments = Math.round(idleFill * 10);
            const idleClass = idleLoadClass(idleFill);
            const wipFill = wipFillRatio(metrics?.wipQty, metrics?.capacityPerHour);
            const filledSegments = Math.round(wipFill * 10);
            const wipClass = wipLoadClass(wipFill);
            const titleLines = clampTitleLines(node.label, 12);
            const completedLotValue = metricValue(metrics?.completedQty, "completedQty");
            const displayFields = nodeCardFields.filter((field) => field !== "completedQty").slice(0, 3);
            const hasWrappedTitle = titleLines.length > 1;
            const titleBaseY = 24;
            const titleLineHeight = 12;
            const cornerLabelY = hasWrappedTitle ? 20 : 22;
            const cornerValueY = hasWrappedTitle ? 42 : 44;
            const subtitleY = hasWrappedTitle ? 62 : 50;
            const nodeMetricY = hasWrappedTitle ? 80 : 76;
            return (
              <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                <title>{node.label}</title>
                <rect
                  className={`node-card node-card-${nodeStatus} node-heat-${heatBand} ${isBottleneck ? "node-card-bottleneck" : ""} ${onNodeDoubleClick ? "node-card-interactive" : ""}`}
                  width="170"
                  height={nodeCardHeight}
                  rx="12"
                  ry="12"
                  onDoubleClick={(event) =>
                    onNodeDoubleClick?.(node.id, {
                      x: event.clientX,
                      y: event.clientY
                    })
                  }
                />
                <text x="12" y="24" className="node-title">
                  {titleLines.map((line, index) => (
                    <tspan
                      key={`${node.id}-title-${index}`}
                      x="12"
                      y={titleBaseY + index * titleLineHeight}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
                <text x="12" y={subtitleY} className="node-subtitle">
                  {node.type}
                </text>

                <text x="158" y={cornerLabelY} textAnchor="end" className="node-corner-label">
                  completed lot
                </text>
                <text x="158" y={cornerValueY} textAnchor="end" className="node-corner-value">
                  {completedLotValue}
                </text>

                {displayFields.map((field, index) => (
                  <text
                    key={field}
                    x="12"
                    y={nodeMetricY + index * nodeMetricSpacing}
                    className="node-metric"
                  >
                    {metricLabel(field)}:{" "}
                    {metricValue((metrics as Record<string, unknown> | undefined)?.[field], field)}
                  </text>
                ))}

                <g className={`idle-strip ${idleClass}`}>
                  <text x="12" y={nodeCardHeight - 20} className="strip-label">
                    idle
                  </text>
                  <rect
                    className="idle-track"
                    x="42"
                    y={nodeCardHeight - 25}
                    width="116"
                    height="7"
                    rx="3.5"
                    ry="3.5"
                  />
                  {Array.from({ length: 10 }).map((_, segmentIndex) => {
                    const gap = 2;
                    const totalGap = 9 * gap;
                    const segmentWidth = (116 - totalGap) / 10;
                    const x = 42 + segmentIndex * (segmentWidth + gap);
                    return (
                      <rect
                        key={`${node.id}-idle-seg-${segmentIndex}`}
                        className={`idle-segment ${segmentIndex < idleSegments ? "filled" : ""}`}
                        x={x}
                        y={nodeCardHeight - 24}
                        width={segmentWidth}
                        height="5"
                        rx="1.5"
                        ry="1.5"
                      />
                    );
                  })}
                </g>

                <g className={`wip-strip ${wipClass}`}>
                  <text x="12" y={nodeCardHeight - 8} className="strip-label">
                    wip
                  </text>
                  <rect
                    className="wip-track"
                    x="42"
                    y={nodeCardHeight - 12}
                    width="116"
                    height="7"
                    rx="3.5"
                    ry="3.5"
                  />
                  {Array.from({ length: 10 }).map((_, segmentIndex) => {
                    const gap = 2;
                    const totalGap = 9 * gap;
                    const segmentWidth = (116 - totalGap) / 10;
                    const x = 42 + segmentIndex * (segmentWidth + gap);
                    return (
                      <rect
                        key={`${node.id}-wip-seg-${segmentIndex}`}
                        className={`wip-segment ${segmentIndex < filledSegments ? "filled" : ""}`}
                        x={x}
                        y={nodeCardHeight - 11}
                        width={segmentWidth}
                        height="5"
                        rx="1.5"
                        ry="1.5"
                      />
                    );
                  })}
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </section>
  );
}
