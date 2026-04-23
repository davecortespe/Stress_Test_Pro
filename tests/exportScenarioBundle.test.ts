import assert from "node:assert/strict";
import vm from "node:vm";
import { buildBrowserSnapshotHtmlSource } from "../src/lib/exportScenarioBundle.ts";
import type { CompiledForecastModel, OperationalDiagnosis } from "../src/types/contracts.ts";

class MockTextNode {
  constructor(private value: string) {}

  get textContent(): string {
    return this.value;
  }

  set textContent(next: string) {
    this.value = String(next);
  }
}

class MockElement {
  children: Array<MockElement | MockTextNode> = [];
  className = "";
  id = "";
  style: Record<string, string> = {};
  private ownText = "";

  constructor(readonly tagName: string) {}

  get textContent(): string {
    if (this.children.length === 0) {
      return this.ownText;
    }
    return this.children.map((child) => child.textContent).join("");
  }

  set textContent(next: string) {
    this.ownText = String(next);
    this.children = [];
  }

  append(...items: Array<MockElement | MockTextNode | string>): void {
    if (this.children.length === 0 && this.ownText.length > 0) {
      this.children.push(new MockTextNode(this.ownText));
      this.ownText = "";
    }

    items.forEach((item) => {
      if (typeof item === "string") {
        this.children.push(new MockTextNode(item));
      } else {
        this.children.push(item);
      }
    });
  }

  replaceChildren(...items: Array<MockElement | MockTextNode | string>): void {
    this.ownText = "";
    this.children = [];
    if (items.length > 0) {
      this.append(...items);
    }
  }
}

class MockDocument {
  private readonly elements = new Map<string, MockElement>();

  constructor(ids: string[]) {
    ids.forEach((id) => {
      const element = new MockElement("div");
      element.id = id;
      this.elements.set(id, element);
    });
  }

  createElement(tagName: string): MockElement {
    return new MockElement(tagName);
  }

  createTextNode(text: string): MockTextNode {
    return new MockTextNode(String(text));
  }

  getElementById(id: string): MockElement {
    const element = this.elements.get(id);
    assert.ok(element, `Expected mock element for #${id}`);
    return element;
  }
}

function run(name: string, fn: () => void): void {
  fn();
  console.log(`ok - ${name}`);
}

function asElement(node: MockElement | MockTextNode | undefined): MockElement {
  assert.ok(node instanceof MockElement, "Expected element node");
  return node;
}

function executeSnapshot(html: string): MockDocument {
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, "Expected generated HTML to contain a script block");

  const document = new MockDocument(["title", "subtitle", "scenario", "kpis", "nodes", "diagnosis"]);
  vm.runInNewContext(scriptMatch[1], { document, console });
  return document;
}

function createSnapshotModel(nodeLabel: string): CompiledForecastModel {
  return {
    version: "test",
    generatedAt: "2026-04-16T00:00:00.000Z",
    metadata: {
      name: "Snapshot Model",
      units: "per-hour",
      mode: "constraint-forecast-non-des"
    },
    graph: {
      nodes: [{ id: "node_a", label: nodeLabel, type: "process" }],
      edges: [],
      startNodes: ["node_a"],
      endNodes: ["node_a"]
    },
    inputs: [],
    inputDefaults: {},
    stepModels: [],
    baseline: {
      demandRatePerHour: 0,
      lineCapacityPerHour: 0,
      bottleneckStepId: "node_a",
      globalMetrics: {},
      nodeMetrics: {}
    },
    assumptions: []
  };
}

function createDiagnosis(overrides: Partial<OperationalDiagnosis> = {}): OperationalDiagnosis {
  return {
    status: "stressed",
    shortStatusSummary: "Short summary",
    statusSummary: "Status summary",
    constraintStepName: "Cut",
    primaryConstraint: "Cut",
    constraintMechanism: "Queue is growing",
    downstreamEffects: "Lead time extends",
    economicInterpretation: "Margin pressure increases",
    recommendedAction: "Add relief",
    scenarioGuidance: "Validate with another run",
    demandRatePerHour: 10,
    outputRatePerHour: 8,
    missingFields: [],
    aiOpportunityLens: {
      dataAlreadyExists: "Data exists",
      manualPatternDecisions: "Pattern decisions",
      predictiveGap: "Predictive gap",
      tribalKnowledge: "Tribal knowledge",
      visibilityGap: "Visibility gap"
    },
    confidence: "medium",
    confidenceNote: "Some assumptions remain",
    ...overrides
  };
}

run("buildBrowserSnapshotHtmlSource uses DOM-safe rendering for exported snapshot content", () => {
  const maliciousKpiLabel = "<img src=x onerror=alert(1)>";
  const maliciousNodeLabel = "<svg onload=alert(2)>";
  const maliciousStatus = "<script>alert(3)</script>";
  const maliciousAction = "<b>ship it</b>";
  const maliciousLens = "<iframe src=javascript:alert(4)>";

  const html = buildBrowserSnapshotHtmlSource(
    {
      appTitle: "Snapshot Demo",
      subtitle: "Safe rendering",
      kpis: [{ key: "badKpi", label: maliciousKpiLabel }]
    },
    createSnapshotModel(maliciousNodeLabel),
    { scenarioName: "Baseline" },
    {
      globalMetrics: { badKpi: 42 },
      nodeMetrics: {
        node_a: {
          status: "critical",
          utilization: 0.91,
          wipQty: 5,
          processedQty: 12,
          completedQty: 9
        }
      }
    },
    createDiagnosis({
      statusSummary: maliciousStatus,
      recommendedAction: maliciousAction,
      aiOpportunityLens: {
        dataAlreadyExists: maliciousLens,
        manualPatternDecisions: "Manual choices",
        predictiveGap: "Predictive blind spot",
        tribalKnowledge: "Inbox memory",
        visibilityGap: "Missed alerts"
      }
    })
  );

  assert.ok(html.includes("document.createElement("));
  assert.ok(html.includes("replaceChildren("));
  assert.ok(!html.includes("innerHTML"));

  const document = executeSnapshot(html);
  const kpiContainer = document.getElementById("kpis");
  assert.equal(kpiContainer.children.length, 1);
  const kpiCard = asElement(kpiContainer.children[0]);
  assert.equal(asElement(kpiCard.children[0]).textContent, maliciousKpiLabel);
  assert.equal(asElement(kpiCard.children[1]).textContent, "42");

  const nodesContainer = document.getElementById("nodes");
  assert.equal(nodesContainer.children.length, 1);
  const nodeCard = asElement(nodesContainer.children[0]);
  assert.equal(asElement(nodeCard.children[0]).textContent, maliciousNodeLabel);
  assert.equal(asElement(nodeCard.children[1]).textContent, "util: 91.0%");

  const diagnosisText = document.getElementById("diagnosis").textContent;
  assert.ok(diagnosisText.includes(maliciousStatus));
  assert.ok(diagnosisText.includes(maliciousAction));
  assert.ok(diagnosisText.includes(maliciousLens));
});

run("buildBrowserSnapshotHtmlSource degrades safely when AI opportunity lens data is missing", () => {
  const html = buildBrowserSnapshotHtmlSource(
    {
      appTitle: "Snapshot Demo",
      subtitle: "Safe rendering",
      kpis: []
    },
    createSnapshotModel("Node A"),
    { scenarioName: "Baseline" },
    {
      globalMetrics: {},
      nodeMetrics: {
        node_a: { status: "healthy" }
      }
    },
    {
      ...createDiagnosis(),
      aiOpportunityLens: undefined
    } as unknown as OperationalDiagnosis
  );

  const document = executeSnapshot(html);
  const diagnosisText = document.getElementById("diagnosis").textContent;
  assert.ok(diagnosisText.includes("AI opportunity lens details were not included in this export."));
  assert.ok(diagnosisText.includes("Validate with another run"));
});
