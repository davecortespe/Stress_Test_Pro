import type { VsmGraph } from "../types/contracts";

export interface NodePosition {
  x: number;
  y: number;
}

export function computeNodeLayout(graph: VsmGraph): Record<string, NodePosition> {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  const level = new Map<string, number>();
  const byLevel = new Map<number, string[]>();
  const maxNodeWidth = 178;
  const maxNodeHeight = 186;
  const xGap = 130;
  const yGap = 36;

  for (const node of graph.nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  for (const edge of graph.edges) {
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    const outList = outgoing.get(edge.from) ?? [];
    outList.push(edge.to);
    outgoing.set(edge.from, outList);
  }

  const queue = [...graph.startNodes];
  for (const start of graph.startNodes) {
    level.set(start, 0);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = level.get(current) ?? 0;
    for (const next of outgoing.get(current) ?? []) {
      const candidateLevel = currentLevel + 1;
      if ((level.get(next) ?? -1) < candidateLevel) {
        level.set(next, candidateLevel);
      }
      incoming.set(next, (incoming.get(next) ?? 0) - 1);
      if ((incoming.get(next) ?? 0) <= 0) {
        queue.push(next);
      }
    }
  }

  for (const node of graph.nodes) {
    const nodeLevel = level.get(node.id) ?? 0;
    const layer = byLevel.get(nodeLevel) ?? [];
    layer.push(node.id);
    byLevel.set(nodeLevel, layer);
  }

  const positions: Record<string, NodePosition> = {};
  const leftMargin = 56;
  const topMargin = 78;
  for (const [row, ids] of [...byLevel.entries()].sort((a, b) => a[0] - b[0])) {
    ids.forEach((id, index) => {
      positions[id] = {
        x: leftMargin + row * (maxNodeWidth + xGap),
        y: topMargin + index * (maxNodeHeight + yGap)
      };
    });
  }

  return positions;
}
