import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);

function getArg(flag, fallback = undefined) {
  const index = args.indexOf(flag);
  if (index < 0 || index + 1 >= args.length) {
    return fallback;
  }
  return args[index + 1];
}

const inputPath = getArg("--from");
const outputPath = getArg("--out", "models/vsm_graph.json");

if (!inputPath) {
  console.error("Usage: node scripts/import-vsm.mjs --from <file> [--out models/vsm_graph.json]");
  process.exit(1);
}

const sourceText = fs.readFileSync(inputPath, "utf8");
let graph;

if (inputPath.toLowerCase().endsWith(".json")) {
  graph = JSON.parse(sourceText);
} else {
  const nodes = new Map();
  const edges = [];
  const incoming = new Map();
  const outgoing = new Map();

  const lines = sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  for (const line of lines) {
    const match = line.match(
      /^([A-Za-z0-9_-]+)\s*->\s*([A-Za-z0-9_-]+)(?:\s*\[\s*([0-9.]+)\s*\])?$/
    );
    if (!match) {
      console.warn(`Skipping unparsable line: ${line}`);
      continue;
    }

    const from = match[1];
    const to = match[2];
    const probability = match[3] ? Number(match[3]) : undefined;

    if (!nodes.has(from)) {
      nodes.set(from, { id: from, label: from, type: "process" });
    }
    if (!nodes.has(to)) {
      nodes.set(to, { id: to, label: to, type: "process" });
    }

    edges.push(typeof probability === "number" ? { from, to, probability } : { from, to });
    incoming.set(to, (incoming.get(to) ?? 0) + 1);
    outgoing.set(from, (outgoing.get(from) ?? 0) + 1);
  }

  const allNodeIds = [...nodes.keys()];
  const startNodes = allNodeIds.filter((id) => (incoming.get(id) ?? 0) === 0);
  const endNodes = allNodeIds.filter((id) => (outgoing.get(id) ?? 0) === 0);

  graph = {
    nodes: [...nodes.values()],
    edges,
    startNodes,
    endNodes
  };
}

const outputDir = path.dirname(outputPath);
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2), "utf8");

console.log(`Wrote normalized VSM graph to ${outputPath}`);
console.log(`Nodes: ${graph.nodes.length} | Edges: ${graph.edges.length}`);

