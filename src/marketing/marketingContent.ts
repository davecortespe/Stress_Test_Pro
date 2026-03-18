import type { SimulatorResultsMode } from "../types/contracts";

export interface MarketingNavItem {
  id: string;
  label: string;
}

export interface MarketingCard {
  title: string;
  body: string;
  label?: string;
}

export interface MarketingStep {
  step: number;
  title: string;
  body: string;
}

export interface HeroMetric {
  label: string;
  value: string;
  tone?: "alert" | "neutral" | "good";
}

export interface ReportShowcaseItem {
  id: SimulatorResultsMode;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
  proofLabel: string;
  proofValue: string;
}

export const heroMockData: {
  metrics: HeroMetric[];
} = {
  metrics: [
    { label: "Report Views", value: "6 analytics modes", tone: "good" },
    { label: "Scenario Controls", value: "Demand, labor, shifts, downtime", tone: "neutral" },
    { label: "Decision Focus", value: "Constraint, cost, waste, kaizen", tone: "alert" }
  ]
};

export const reportShowcase: ReportShowcaseItem[] = [
  {
    id: "flow",
    label: "FLOW MAP",
    eyebrow: "Live system view",
    title: "See the modeled flow, not just the static map",
    summary:
      "The flow view turns the value stream into an operational picture with node status, WIP, completed output, queue exposure, and bottleneck movement.",
    bullets: [
      "Graph-based flow map with live node performance state",
      "Forecast throughput, brittleness, WIP, and completed output KPIs",
      "Bottleneck migration visibility as scenario inputs change"
    ],
    proofLabel: "Best for",
    proofValue: "Spotting where instability starts"
  },
  {
    id: "diagnosis",
    label: "DIAGNOSIS",
    eyebrow: "Leader-ready readout",
    title: "Translate simulation output into the operational story",
    summary:
      "The diagnosis view explains system status, the primary constraint, its mechanism, downstream effects, economic meaning, and the smallest stabilizing action.",
    bullets: [
      "Status classification: stable, stressed, brittle, or overloaded",
      "Constraint mechanism and downstream blockage explained in plain language",
      "Recommended next action tied to business impact"
    ],
    proofLabel: "Best for",
    proofValue: "Turning output into action"
  },
  {
    id: "kaizen",
    label: "KAIZEN",
    eyebrow: "Improvement prioritization",
    title: "Prioritize improvement events with evidence, not instinct",
    summary:
      "The kaizen report ranks the top improvement opportunities, surfaces likely root causes, and organizes them into a 5M fishbone so teams know where to focus first.",
    bullets: [
      "Top ranked improvement events with score and rationale",
      "Fishbone categories across manpower, machine, method, material, and measurement",
      "Missing-signal warnings that reduce improvement confidence"
    ],
    proofLabel: "Best for",
    proofValue: "Choosing the next kaizen event"
  },
  {
    id: "throughput",
    label: "THROUGHPUT",
    eyebrow: "Economic leverage",
    title: "Expose throughput economics at the step and P&L level",
    summary:
      "The throughput analysis connects operating performance to money: throughput per unit, profit per unit, bottleneck leverage, step costs, and improvement upside.",
    bullets: [
      "Summary analysis for TOC throughput, profit, and leverage",
      "Step-level labor, equipment, and material cost breakdown",
      "P&L view plus exportable CSV reports"
    ],
    proofLabel: "Best for",
    proofValue: "Quantifying the gain from constraint relief"
  },
  {
    id: "waste",
    label: "WASTE",
    eyebrow: "Lead-time decomposition",
    title: "Separate touch time from delay and expose hidden waste",
    summary:
      "The waste analysis compares lead time against touch time by step, highlights weighted waste across the route, and flags poor or missing timing signals.",
    bullets: [
      "LT vs CT comparison across the line and by step",
      "Weighted waste minutes and value-add ratio visibility",
      "Data-quality flags for missing or contradictory timing inputs"
    ],
    proofLabel: "Best for",
    proofValue: "Finding where delay compounds"
  },
  {
    id: "assumptions",
    label: "ASSUMPTIONS",
    eyebrow: "Trust and data quality",
    title: "Show what the model assumed before people act on the result",
    summary:
      "The assumptions report turns hidden defaults and estimated inputs into a plain-language checklist so end users know what is solid, what needs review, and what to verify first.",
    bullets: [
      "Trust level summary for the current scenario",
      "Plain-language explanation of estimated or defaulted inputs",
      "Priority checks before using the report for bigger decisions"
    ],
    proofLabel: "Best for",
    proofValue: "Seeing how much to trust the result"
  }
];

export const marketingContent = {
  companyName: "{{COMPANY_NAME}}",
  clientLogo: "{{CLIENT_LOGO}}",
  simulationName: "{{SIMULATION_NAME}}",
  leanStormingUrl: "{{LEANSTORMING_URL}}",

  nav: [
    { id: "analytics", label: "Analytics Views" },
    { id: "scenario-lab", label: "Scenario Lab" },
    { id: "exports", label: "Exports" },
    { id: "about", label: "Platform" },
    { id: "enter", label: "Enter Simulation" }
  ] satisfies MarketingNavItem[],

  hero: {
    eyebrow: "Operational analytics for value stream systems",
    kicker: "Simulation-backed reports that show what is breaking, why it is breaking, and what to change first.",
    headline: "Sell the decision, not just the dashboard.",
    description:
      "This app converts a value stream map into a modeled flow system, then turns the output into five decision views: flow behavior, diagnosis, kaizen priorities, throughput economics, and waste analysis.",
    primaryCta: "Review Analytics Views",
    secondaryCta: "See Scenario Controls",
    workspaceCta: "Enter the simulation"
  },

  analytics: {
    eyebrow: "Analytics Views",
    title: "Five report modes built from the same modeled operation",
    body: [
      "The landing experience now sells the app the way the simulator works: one operational model, multiple analysis surfaces, each designed for a different decision."
    ]
  },

  scenarioLab: {
    eyebrow: "Scenario Lab",
    title: "Test the interventions operators actually debate",
    body: [
      "The simulator is built around editable inputs from the dashboard configuration and runtime model. Teams can stage changes, run the clock, compare behavior, and save scenarios into a reusable library."
    ],
    cards: [
      {
        label: "Demand",
        title: "Load demand and mix changes into the model",
        body:
          "Test demand multiplier and mix profile changes to see where constraints migrate and whether the line becomes brittle under surge conditions."
      },
      {
        label: "Capacity",
        title: "Stress staffing, equipment, downtime, and setup loss",
        body:
          "Model labor and equipment multipliers, unplanned downtime, and setup penalties so capacity decisions are tested before the floor absorbs the risk."
      },
      {
        label: "Execution",
        title: "Stage, save, and replay scenarios",
        body:
          "Pause the run, stage edits, save the current configuration, import scenario libraries from CSV, and reload scenarios without rebuilding the model."
      }
    ] satisfies MarketingCard[]
  },

  exports: {
    eyebrow: "Exports And Reporting",
    title: "Move from insight to handoff without rebuilding the story",
    body: [
      "The app supports CSV exports for analysis tables plus committed scenario/export workflows for packaging the accepted forecast, metrics, and diagnosis."
    ],
    steps: [
      {
        step: 1,
        title: "Run the scenario",
        body: "Set the horizon, operating shifts, and intervention assumptions, then run the model until the system behavior is clear."
      },
      {
        step: 2,
        title: "Capture the readout",
        body: "Export throughput and waste CSVs, save the scenario library entry, and generate a diagnosis aligned to the committed case."
      },
      {
        step: 3,
        title: "Hand off the decision package",
        body: "Use the accepted scenario bundle workflow to preserve the model, committed scenario, metrics, and diagnosis together."
      }
    ] satisfies MarketingStep[]
  },

  about: {
    eyebrow: "Platform",
    title: "A reusable simulator shell for operational analytics",
    body:
      "The repository is designed as a reusable starter for simulation projects: configurable dashboard shell, lazy-loaded simulator route, deterministic forecast outputs, scenario library support, and leader-ready diagnosis.\n\nThat makes the landing page strongest when it sells the analytics outputs and the scenario-testing workflow, not just the visual theme."
  },

  enter: {
    eyebrow: "Enter Simulation",
    title: "Go straight into the workspace when you are ready to test the system",
    body: [
      "The landing page should close with a direct route into `/sim` so visitors can move from the product story to the actual controls without friction."
    ],
    primaryCta: "Open /sim Workspace",
    secondaryCta: "Visit LeanStorming.com"
  },

  footer: {
    attribution: "LeanStorming Operational Intelligence Platform",
    builtFor: "Built for {{COMPANY_NAME}}",
    poweredBy: "Simulation-backed analytics and operator-ready reports",
    url: "LeanStorming.com",
    signoff: "\u00A92026 by LeanStorming.com"
  }
};
