import { useCallback, useEffect, useMemo, useState } from "react";
import { computeNodeLayout } from "../lib/layoutGraph";
import type { SimulationOutput, VsmGraph } from "../types/contracts";

interface GraphCanvasProps {
  graph: VsmGraph;
  output: SimulationOutput;
  nodeCardFields: string[];
  showProbabilities: boolean;
  animateEdges: boolean;
  isPaused: boolean;
  viewportStorageKey?: string;
  parameterToggleLabel?: string;
  onParameterToggle?: () => void;
  onNodeDoubleClick?: (nodeId: string, anchor: { x: number; y: number }) => void;
  resetViewSignal?: number;
}

const VIEWBOX_WIDTH = 1280;
const VIEWBOX_HEIGHT = 720;
const ZOOM_MIN = 0.45;
const ZOOM_MAX = 2.6;
const NODE_CARD_WIDTH = 178;
const NODE_CARD_HEIGHT = 186;
const EDGE_LABEL_WIDTH = 128;
const EDGE_LABEL_HEIGHT = 38;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
  const maxLines = 4;

  for (const word of words) {
    const candidate = current.length > 0 ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine || current.length === 0) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && current.length > 0) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  const reconstructed = lines.join(" ");
  if (reconstructed.length < input.length && lines.length === maxLines) {
    const lastIndex = maxLines - 1;
    const tail = lines[lastIndex];
    lines[lastIndex] =
      tail.length > maxCharsPerLine - 1 ? `${tail.slice(0, maxCharsPerLine - 2)}...` : `${tail}...`;
  }

  return lines.slice(0, maxLines);
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
  isPaused,
  viewportStorageKey,
  parameterToggleLabel,
  onParameterToggle,
  onNodeDoubleClick,
  resetViewSignal
}: GraphCanvasProps) {
  const positions = useMemo(() => computeNodeLayout(graph), [graph]);
  const nodeCardHeight = NODE_CARD_HEIGHT;
  const nodeCardWidth = NODE_CARD_WIDTH;
  const nodeMetricSpacing = 13;
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
    pxToVbX: number;
    pxToVbY: number;
  } | null>(null);
  const graphBounds = useMemo(() => {
    const values = graph.nodes
      .map((node) => positions[node.id])
      .filter((value): value is { x: number; y: number } => Boolean(value));

    if (values.length === 0) {
      return {
        left: 0,
        top: 0,
        right: VIEWBOX_WIDTH,
        bottom: VIEWBOX_HEIGHT,
        width: VIEWBOX_WIDTH,
        height: VIEWBOX_HEIGHT
      };
    }

    let left = Number.POSITIVE_INFINITY;
    let top = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;
    for (const point of values) {
      left = Math.min(left, point.x);
      top = Math.min(top, point.y);
      right = Math.max(right, point.x + nodeCardWidth);
      bottom = Math.max(bottom, point.y + nodeCardHeight);
    }

    return {
      left,
      top,
      right,
      bottom,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top)
    };
  }, [graph.nodes, positions]);

  const persistViewport = useCallback(
    (nextZoom: number, nextOffset: { x: number; y: number }) => {
      if (!viewportStorageKey || typeof window === "undefined") {
        return;
      }

      try {
        window.localStorage.setItem(
          viewportStorageKey,
          JSON.stringify({
            zoom: nextZoom,
            offset: nextOffset
          })
        );
      } catch {
        // Ignore storage failures and keep the canvas usable.
      }
    },
    [viewportStorageKey]
  );

  const readSavedViewport = useCallback(() => {
    if (!viewportStorageKey || typeof window === "undefined") {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(viewportStorageKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as { zoom?: number; offset?: { x?: number; y?: number } };
      if (
        typeof parsed.zoom !== "number" ||
        !Number.isFinite(parsed.zoom) ||
        typeof parsed.offset?.x !== "number" ||
        typeof parsed.offset?.y !== "number"
      ) {
        return null;
      }
      return {
        zoom: clamp(parsed.zoom, ZOOM_MIN, ZOOM_MAX),
        offset: {
          x: parsed.offset.x,
          y: parsed.offset.y
        }
      };
    } catch {
      return null;
    }
  }, [viewportStorageKey]);

  const fitToGraph = useCallback(() => {
    const paddingX = 18;
    const paddingY = 18;
    const nextZoom = clamp(
      Math.min(
        (VIEWBOX_WIDTH - paddingX * 2) / Math.max(1, graphBounds.width),
        (VIEWBOX_HEIGHT - paddingY * 2) / Math.max(1, graphBounds.height)
      ),
      ZOOM_MIN,
      ZOOM_MAX
    );
    const leftMargin = 18;
    const topMargin = 18;
    const nextOffset = {
      x: leftMargin - graphBounds.left * nextZoom,
      y: topMargin - graphBounds.top * nextZoom
    };
    setZoom(nextZoom);
    setOffset(nextOffset);
    persistViewport(nextZoom, nextOffset);
  }, [graphBounds, persistViewport]);

  const focusStartLane = useCallback(() => {
    const preferredZoom = clamp(
      Math.min((VIEWBOX_HEIGHT - 132) / Math.max(nodeCardHeight, graphBounds.height), 0.72),
      0.58,
      0.72
    );
    const nextOffset = {
      x: 28 - graphBounds.left * preferredZoom,
      y: 94 - graphBounds.top * preferredZoom
    };
    setZoom(preferredZoom);
    setOffset(nextOffset);
    persistViewport(preferredZoom, nextOffset);
  }, [graphBounds.height, graphBounds.left, graphBounds.top, nodeCardHeight, persistViewport]);

  const zoomAround = useCallback(
    (nextZoomRaw: number, focalPoint = { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 }) => {
      const nextZoom = clamp(nextZoomRaw, ZOOM_MIN, ZOOM_MAX);
      const worldX = (focalPoint.x - offset.x) / zoom;
      const worldY = (focalPoint.y - offset.y) / zoom;
      setZoom(nextZoom);
      const nextOffset = {
        x: focalPoint.x - worldX * nextZoom,
        y: focalPoint.y - worldY * nextZoom
      };
      setOffset(nextOffset);
      persistViewport(nextZoom, nextOffset);
    },
    [offset.x, offset.y, persistViewport, zoom]
  );

  useEffect(() => {
    const savedViewport = readSavedViewport();
    if (savedViewport) {
      setZoom(savedViewport.zoom);
      setOffset(savedViewport.offset);
      return;
    }

    focusStartLane();
  }, [focusStartLane, graph.nodes.length, graph.edges.length, resetViewSignal, readSavedViewport]);

  return (
    <section className={`graph-stage ${isPaused ? "is-paused" : "is-live"}`}>
      <div className="graph-toolbar">
        {parameterToggleLabel && onParameterToggle ? (
          <button type="button" onClick={onParameterToggle}>
            {parameterToggleLabel}
          </button>
        ) : null}
        <button type="button" onClick={() => zoomAround(zoom + 0.12)}>
          +
        </button>
        <button type="button" onClick={() => zoomAround(zoom - 0.12)}>
          -
        </button>
        <button type="button" onClick={fitToGraph}>
          Fit
        </button>
        <button
          type="button"
          onClick={() => {
            focusStartLane();
          }}
        >
          Reset
        </button>
        <div className="graph-zoom-readout">{Math.round(zoom * 100)}%</div>
      </div>
      {isPaused ? <div className="graph-paused-watermark">PAUSED</div> : null}
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        onWheel={(event) => {
          event.preventDefault();
          const factor = event.deltaY < 0 ? 1.08 : 0.92;
          const rect = event.currentTarget.getBoundingClientRect();
          const focalPoint = {
            x: ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH,
            y: ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT
          };
          zoomAround(zoom * factor, focalPoint);
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }
          const isInteractiveNode = (event.target as Element).closest(".node-card-interactive");
          if (isInteractiveNode) {
            return;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragState({
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startOffsetX: offset.x,
            startOffsetY: offset.y,
            pxToVbX: rect.width > 0 ? VIEWBOX_WIDTH / rect.width : 1,
            pxToVbY: rect.height > 0 ? VIEWBOX_HEIGHT / rect.height : 1
          });
        }}
        onPointerMove={(event) => {
          if (!dragState || dragState.pointerId !== event.pointerId) {
            return;
          }
          const deltaX = (event.clientX - dragState.startClientX) * dragState.pxToVbX;
          const deltaY = (event.clientY - dragState.startClientY) * dragState.pxToVbY;
          setOffset({
            x: dragState.startOffsetX + deltaX,
            y: dragState.startOffsetY + deltaY
          });
        }}
        onPointerUp={(event) => {
          if (dragState?.pointerId === event.pointerId) {
            event.currentTarget.releasePointerCapture(event.pointerId);
            setDragState(null);
            persistViewport(zoom, offset);
          }
        }}
        onPointerCancel={(event) => {
          if (dragState?.pointerId === event.pointerId) {
            event.currentTarget.releasePointerCapture(event.pointerId);
            setDragState(null);
            persistViewport(zoom, offset);
          }
        }}
      >
        <defs>
          <marker id="edgeArrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#33bac0" />
          </marker>
        </defs>

        <g transform={`matrix(${zoom} 0 0 ${zoom} ${offset.x} ${offset.y})`}>
          {graph.edges.map((edge) => {
            const source = positions[edge.from];
            const target = positions[edge.to];
            if (!source || !target) {
              return null;
            }

            const sourceMetrics = output.nodeMetrics[edge.from];
            const completedLotValue = metricValue(sourceMetrics?.completedQty, "completedQty");
            const showCompletedLot = completedLotValue !== "--";
            const startX = source.x + nodeCardWidth;
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
                {showCompletedLot ? (
                  <g transform={`translate(${midX - EDGE_LABEL_WIDTH / 2}, ${midY + 8})`}>
                    <rect
                      className="edge-lot-badge"
                      width={EDGE_LABEL_WIDTH}
                      height={EDGE_LABEL_HEIGHT}
                      rx="19"
                      ry="19"
                    />
                    <text
                      x={EDGE_LABEL_WIDTH / 2}
                      y={25}
                      textAnchor="middle"
                      className="edge-lot-value"
                    >
                      {completedLotValue}
                    </text>
                  </g>
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
            const utilizationValue = metricValue(metrics?.utilization, "utilization");
            const titleLines = clampTitleLines(node.label, 13);
            const titleLineCount = titleLines.length;
            const displayFields = nodeCardFields
              .filter((field) => field !== "completedQty" && field !== "utilization")
              .slice(0, 3);
            const titleBaseY = 26;
            const titleLineHeight = 13;
            const titleBottomY = titleBaseY + (titleLineCount - 1) * titleLineHeight;
            const subtitleY = titleBottomY + 16;
            const dividerY = subtitleY + 10;
            const nodeMetricY = dividerY + 18;
            return (
              <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                <title>{node.label}</title>
                <rect
                  className={`node-card node-card-${nodeStatus} node-heat-${heatBand} ${isBottleneck ? "node-card-bottleneck" : ""} ${onNodeDoubleClick ? "node-card-interactive" : ""}`}
                  width={nodeCardWidth}
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
                <text x={nodeCardWidth - 14} y="22" textAnchor="end" className="node-util-kicker">
                  util
                </text>
                <text x={nodeCardWidth - 14} y="46" textAnchor="end" className="node-util-value">
                  {utilizationValue}
                </text>
                <line
                  x1="12"
                  y1={dividerY}
                  x2={nodeCardWidth - 12}
                  y2={dividerY}
                  className="node-divider"
                />

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
