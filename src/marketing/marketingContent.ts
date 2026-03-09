export interface MarketingNavItem {
  id: string;
  label: string;
}

export interface MarketingCard {
  title: string;
  body: string;
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

export const heroMockData: {
  metrics: HeroMetric[];
} = {
  metrics: [
    { label: "Throughput Delta", value: "-12.4%", tone: "alert" },
    { label: "Queue Risk", value: "High", tone: "alert" },
    { label: "Brittleness Score", value: "78%", tone: "alert" },
    { label: "System Status", value: "Stressed", tone: "neutral" }
  ]
};

export const marketingContent = {
  // Populated by environment variables
  companyName: "{{COMPANY_NAME}}",
  clientLogo: "{{CLIENT_LOGO}}",
  simulationName: "{{SIMULATION_NAME}}",
  leanStormingUrl: "{{LEANSTORMING_URL}}",

  hero: {
    headline: "Operational Flow Stress Test",
    subheadline: "Proudly built for {{COMPANY_NAME}}",
    poweredBy: "Powered by LeanStorming Operational Stress Labs",
    description:
      "This simulation environment converts your value stream map into a dynamic operational model to reveal hidden bottlenecks, queue propagation, and capacity instability before they disrupt throughput.",
    primaryCta: "Open Live Simulation",
    secondaryCta: "How This Works"
  },
  problem: {
    title: "Why static Value Stream Maps miss operational behavior",
    body: [],
    cards: [
      {
        title: "Bottlenecks discovered too late",
        body: ""
      },
      {
        title: "Capacity planning based on averages",
        body: ""
      },
      {
        title: "Queue buildup hidden between steps",
        body: ""
      },
      {
        title: "Operational changes made without scenario testing",
        body: ""
      }
    ]
  },
  insights: {
    title: "Operational insights generated",
    bullets: [
      "True operational constraint location",
      "Hidden capacity loss",
      "Queue propagation across the flow",
      "Throughput instability triggers",
      "Labor imbalance across time windows",
      "Best stabilization action"
    ]
  },
  howItWorks: {
    title: "How the system works",
    steps: [
      {
        step: 1,
        title: "Share your Value Stream Map",
        body: "Send your current VSM with shift pattern context, known constraints, and target output."
      },
      {
        step: 2,
        title: "Within 48 hours LeanStorming builds your flow simulation model",
        body: "LeanStorming converts your map into a runnable model and calibrates the baseline behavior."
      },
      {
        step: 3,
        title: "Review stress tests for demand, labor, and sequencing",
        body: "You and LeanStorming test priority scenarios to see where throughput and queue risk break first."
      },
      {
        step: 4,
        title: "Receive your operational diagnosis and stabilization plan",
        body: "Get the primary constraint, likely business impact, and the best next action for flow stability."
      }
    ]
  },
  about: {
    title: "LeanStorming Operational Stress Labs",
    body: "LeanStorming develops AI-assisted operational diagnostics and simulation micro-applications that transform static process maps into dynamic flow models.\n\nThese tools help operations leaders understand the hidden physics of their systems, revealing bottlenecks, queue buildup, and capacity instability before they impact performance."
  },
  footer: {
    attribution: "Operational Simulation Environment",
    builtFor: "Proudly built for {{COMPANY_NAME}}",
    poweredBy: "Powered by LeanStorming Operational Stress Labs",
    url: "LeanStorming.com",
    signoff: "\u00A92026 by LeanStorming.com"
  }
};
