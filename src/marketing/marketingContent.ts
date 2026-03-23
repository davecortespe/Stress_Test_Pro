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
    { label: "Start Point", value: "Flow-map entry", tone: "good" },
    { label: "Shared Model", value: "Flow map, system diagnosis, throughput & economics, waste analysis, improvement priorities", tone: "neutral" },
    { label: "Decision Aim", value: "See what to change first", tone: "alert" }
  ]
};

export const reportShowcase: ReportShowcaseItem[] = [
  {
    id: "flow",
    label: "FLOW MAP",
    eyebrow: "Behaving system view",
    title: "See the operation as a behaving system, not a static diagram",
    summary:
      "Open the modeled flow to see where work accumulates, how instability moves, and which step is becoming the operational constraint under the current conditions.",
    bullets: [
      "See queue build, completed output, WIP, and bottleneck movement in one view",
      "Watch how operational stress appears across the line as conditions change",
      "Use the same model that powers diagnosis, economics, waste, and scenario testing"
    ],
    proofLabel: "Best for",
    proofValue: "Seeing where instability begins"
  },
  {
    id: "diagnosis",
    label: "SYSTEM DIAGNOSIS",
    eyebrow: "Operational story first",
    title: "Identify what is breaking and why",
    summary:
      "Start with a plain-English diagnosis of system status, the primary constraint, downstream effects, economic meaning, and the first change most likely to stabilize the operation.",
    bullets: [
      "Translate model output into a decision-ready operational readout",
      "Explain the constraint mechanism and downstream effects in direct language",
      "Surface the first stabilizing action before teams dive into controls"
    ],
    proofLabel: "Best for",
    proofValue: "Starting with operational clarity"
  },
  {
    id: "kaizen",
    label: "IMPROVEMENT PRIORITIES",
    eyebrow: "Improvement prioritization",
    title: "Prioritize the changes most likely to move output",
    summary:
      "Use ranked improvement opportunities, likely root causes, and fishbone framing to focus teams on the next intervention with the strongest operational leverage.",
    bullets: [
      "See which improvement events are most likely to move the system first",
      "Connect evidence to likely root causes across people, method, machine, material, and measurement",
      "Reduce wasted effort on low-leverage improvement activity"
    ],
    proofLabel: "Best for",
    proofValue: "Choosing the next high-value intervention"
  },
  {
    id: "throughput",
    label: "THROUGHPUT & ECONOMICS",
    eyebrow: "Performance and economics",
    title: "Understand performance and economics together",
    summary:
      "See how the current bottleneck changes throughput, leverage, and profit so teams can connect operational decisions to financial consequence without leaving the workspace.",
    bullets: [
      "Tie throughput, profit, and bottleneck leverage to the same system model",
      "Expose the cost and gain logic behind constraint-relief decisions",
      "Support decisions that must be sold beyond the dashboard"
    ],
    proofLabel: "Best for",
    proofValue: "Quantifying the gain from change"
  },
  {
    id: "waste",
    label: "WASTE",
    eyebrow: "Delay and loss visibility",
    title: "Separate delay, touch time, and hidden loss",
    summary:
      "Break lead time away from touch time, see where delay compounds across the route, and expose hidden loss that static maps or top-line dashboards tend to blur together.",
    bullets: [
      "Show where delay is compounding beyond the actual work content",
      "Identify where hidden loss is building by step and across the route",
      "Keep timing interpretation tied to the same modeled operation"
    ],
    proofLabel: "Best for",
    proofValue: "Finding where delay compounds"
  },
  {
    id: "assumptions",
    label: "MODEL ASSUMPTIONS",
    eyebrow: "Trust before action",
    title: "See what the model is assuming before acting on the result",
    summary:
      "Review defaults, estimates, and missing signals in plain language so the team knows how much to trust the result and what to verify before making a bigger call.",
    bullets: [
      "Show trust level and major assumption exposure before action",
      "Make hidden defaults visible to leaders and operators",
      "Focus verification on the few inputs most likely to change the decision"
    ],
    proofLabel: "Best for",
    proofValue: "Checking decision confidence"
  }
];

export const marketingContent = {
  companyName: "{{COMPANY_NAME}}",
  clientLogo: "{{CLIENT_LOGO}}",
  simulationName: "{{SIMULATION_NAME}}",
  leanStormingUrl: "{{LEANSTORMING_URL}}",

  nav: [
    { id: "decision-views", label: "Decision Views" },
    { id: "enter", label: "Start Now" }
  ] satisfies MarketingNavItem[],

  hero: {
    eyebrow: "Operational analytics for value stream systems",
    headline: "Turn your value stream map into a working operational model.",
    supportLine: "See what is breaking, why it is breaking, and what to change first.",
    brandLine: "Sell the decision, not just the dashboard.",
    description:
      "LeanStorming converts mapped operations into simulation-backed decision views for system diagnosis, throughput and economics, improvement prioritization, waste analysis, and scenario testing.",
    primaryCta: "Start the diagnosis",
    secondaryCta: "Explore analytics views",
    workspaceCta: "Go straight to simulation",
    supportText:
      "Enter the same modeled operation through Flow Map, System Diagnosis, Throughput & Economics, Waste Analysis, Model Assumptions, or scenario controls."
  },

  decisionViews: {
    eyebrow: "Decision Views",
    title: "One model. Five ways to decide what to do next.",
    body: [
      "LeanStorming gives you multiple decision readouts from the same operational model, so you can move from Flow Map visibility to System Diagnosis, Throughput & Economics, Waste Analysis, and intervention testing without changing tools or rebuilding the story."
    ]
  },

  whyClickNow: {
    eyebrow: "Why Enter Now",
    title: "Why enter now",
    body: [
      "The click opens a serious decision environment, not a generic dashboard. You enter the modeled operation with immediate paths into System Diagnosis, Flow Map, Throughput & Economics, Waste Analysis, Model Assumptions, and scenario testing.",
      "That means less time interpreting the tool and more time understanding what is breaking, what it costs, and what to change first."
    ],
    cards: [
      {
        label: "Start with System Diagnosis",
        title: "Begin with the operational story, not raw controls",
        body:
          "Use System Diagnosis first when you want the workspace to explain what is happening in the system before you dig into interventions."
      },
      {
        label: "Compare interventions",
        title: "Move from bottleneck visibility to scenario testing in one workspace",
        body:
          "Shift from the Flow Map to economics, waste, improvement priorities, and scenario changes without losing the shared model underneath the decision."
      },
      {
        label: "Support the decision",
        title: "Use the workspace to justify action, not just display metrics",
        body:
          "LeanStorming helps teams explain why a change matters, what happens downstream, and why this move should come first."
      }
    ] satisfies MarketingCard[]
  },

  enter: {
    eyebrow: "Enter The Modeled Operation",
    title: "Enter the modeled operation and begin with diagnosis.",
    body: [
      "Move from Flow Map to System Diagnosis, Throughput & Economics, Waste Analysis, and scenario testing in one workspace built for operational decisions under stress."
    ],
    primaryCta: "Start the diagnosis",
    secondaryCta: "Go straight to simulation"
  },

  footer: {
    attribution: "LeanStorming Operational Intelligence Platform",
    builtFor: "Built for {{COMPANY_NAME}}",
    poweredBy: "Operational decision intelligence for value stream systems",
    url: "LeanStorming.com",
    signoff: "\u00A92026 by LeanStorming.com"
  }
};
