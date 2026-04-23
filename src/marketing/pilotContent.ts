export interface PilotNavItem {
  id: string;
  label: string;
}

export interface PilotCriteria {
  title: string;
  body: string;
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
    { id: "fit", label: "Fit" },
    { id: "selection", label: "Selection" },
    { id: "apply", label: "Apply" }
  ] satisfies PilotNavItem[],

  hero: {
    eyebrow: "FlowStress Dynamics Pilot",
    headline: "We are selecting 1 operation for a free pilot simulation.",
    subheadline:
      "Turn your current-state value stream into a working operational model that shows where flow is breaking, what it is costing, and what to change first.",
    body: [
      "FlowStress Dynamics converts a real process into a simulation-backed operational readout.",
      "The selected team gets one free process simulation. In return, we get direct feedback from the people closest to the work so we can improve the product in real operating conditions."
    ],
    primaryCta: "Apply for the pilot",
    secondaryCta: "See how selection works",
    supportText: "Not all applications will be selected."
  },

  positioning: {
    title: "This is a field pilot, not a giveaway.",
    body: [
      "We are selecting one team with a real operational problem, real process access, and a real need for decision clarity.",
      "This pilot is designed to test where simulation creates value fastest: exposing the real constraint, separating delay from work, and helping teams focus on the first change most likely to stabilize output."
    ]
  },

  fit: {
    title: "Best fit for teams dealing with visible operational drag",
    intro: "Apply if your operation is dealing with issues like:",
    bullets: [
      "backlog that keeps coming back",
      "unstable lead times",
      "chronic bottlenecks",
      "firefighting and expediting",
      "too much labor for too little output",
      "handoff failures, queue buildup, or hidden waste",
      "a value stream map that shows the steps but not the behavior"
    ]
  },

  receive: {
    title: "What you receive",
    bullets: [
      "One free simulation of a real process",
      "A plain-English diagnosis of where the system is breaking",
      "Constraint analysis across the flow",
      "Readout on delay, throughput, and operational impact",
      "Initial guidance on what to change first",
      "A review session with your team"
    ],
    support: "This is not a static map review. It is a working model built to support an operational decision."
  },

  participation: {
    title: "What participation requires",
    bullets: [
      "A real current-state process or value stream",
      "Access to someone who understands how the work actually runs",
      "Willingness to answer follow-up questions",
      "Willingness to review the output and give direct feedback"
    ],
    support:
      "We are looking for input from operators, supervisors, engineers, planners, and improvement leads who can speak to the operation as it really behaves, not just how it is documented."
  },

  selection: {
    title: "How we select",
    criteria: [
      {
        title: "Problem severity",
        body:
          "The issue is already hurting throughput, lead time, labor efficiency, service, quality, or margin."
      },
      {
        title: "Problem clarity",
        body: "You can describe what is breaking and where the pain shows up."
      },
      {
        title: "Access to the real process",
        body: "You are close enough to the work to provide usable inputs."
      },
      {
        title: "Urgency",
        body: "If nothing changes in the next 90 days, the consequences matter."
      },
      {
        title: "Feedback value",
        body: "You are willing to tell us what helped, what missed, and what needs to improve."
      }
    ] satisfies PilotCriteria[]
  },

  notFit: {
    title: "This pilot is not for everyone",
    intro: "This is probably not a fit if:",
    bullets: [
      "the problem is still vague",
      "there is no visible business impact yet",
      "you cannot share the real process",
      "you are only browsing with no active operational priority",
      "no one involved can validate how the work actually behaves"
    ]
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
      "We are prioritizing operations with a real bottleneck, visible business impact, and a reason to act now."
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
    label: "Selected team receives",
    bullets: [
      "One real process simulation",
      "Constraint and delay diagnosis",
      "Operational impact readout",
      "Guidance on what to change first"
    ],
    proofLabel: "Pilot standard",
    proofValue: "Serious applications only"
  }
};
