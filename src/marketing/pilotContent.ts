export interface PilotNavItem {
  id: string;
  label: string;
}

export interface PilotFormFieldDefinition {
  id: string;
  label: string;
  placeholder?: string;
  type?: "text" | "email";
  autoComplete?: string;
  rows?: number;
}

export const pilotContent = {
  nav: [
    { id: "apply", label: "Apply" }
  ] satisfies PilotNavItem[],

  hero: {
    eyebrow: "This month only",
    headline: "This month, we're opening 1 complimentary FlowStress Dynamics pilot.",
    subheadline:
      "For one team with a real bottleneck, clear business stakes, and direct access to the process.",
    body: [
      "We'll turn your current-state value stream into a working simulation that shows where flow is breaking, what it is costing, and what to change first.",
      "The selected team receives a simulation-backed operational readout built from the real process, not a static map review."
    ],
    primaryCta: "Apply for consideration",
    secondaryCta: "Read why",
    supportText: "One operation will be selected for this pilot cycle."
  },

  why: {
    title: "Why we are doing this",
    body: [
      "We want to improve FlowStress Dynamics using real operating conditions, not assumptions from the outside.",
      "That means learning directly from the people in the trenches: where the model helps, where it oversimplifies, and what decision view creates the most value fastest.",
      "You get a free simulation. We get product-shaping feedback from a live operation."
    ]
  },

  application: {
    title: "Apply for the pilot",
    body: [
      "Tell us enough to judge fit quickly.",
      "We are prioritizing operations with a real bottleneck, visible business impact, and a reason to act now.",
      "If the process is messy but real, that is fine. We just need enough detail to tell whether the pilot can produce a useful readout fast."
    ],
    cta: "Apply for the free pilot simulation",
    supportText: "Not all applications will be selected.",
    footnote:
      "We will review submissions and select the operation where simulation is most likely to produce meaningful operational insight and useful product feedback.",
    successHeadline: "Application received",
    successBody:
      "We will review your submission and reach out if your operation is selected for this pilot cycle.",
    fields: [
      { id: "name", label: "Name", type: "text", autoComplete: "name" },
      { id: "company", label: "Company", type: "text", autoComplete: "organization" },
      { id: "role", label: "Role", type: "text", autoComplete: "organization-title" },
      { id: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@company.com" },
      {
        id: "process",
        label: "What process do you want modeled?",
        placeholder: "Example: inbound receiving through final pack-out for our custom assembly line",
        rows: 4
      },
      {
        id: "breaking",
        label: "What is breaking right now?",
        placeholder: "Describe where the pain is showing up in throughput, lead time, labor, service, or quality.",
        rows: 4
      },
      {
        id: "handling",
        label: "How are you handling it today?",
        placeholder: "Explain the current workaround, firefighting pattern, or decision process.",
        rows: 4
      },
      {
        id: "consequence",
        label: "If nothing changes in 90 days, what happens?",
        placeholder: "Describe the likely operational or business consequence.",
        rows: 4
      }
    ] satisfies PilotFormFieldDefinition[]
  },

  heroSummary: {
    label: "Includes",
    title: "One live operation. One decision-ready readout.",
    intro:
      "We model the real flow, expose the constraint, and make the first useful change easier to see before more time gets burned in the wrong place.",
    bullets: [
      "One real process simulation",
      "Constraint and delay diagnosis",
      "Operational impact readout"
    ],
    standards: [
      "Live operational constraint",
      "Clear business stakes",
      "Direct access to the real process"
    ],
    proofValue: "Serious applications only."
  }
};
