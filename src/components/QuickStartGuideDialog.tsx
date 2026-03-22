import { useEffect, useMemo, useRef, useState } from "react";

interface QuickStartGuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExecutivePdf: () => void;
}

interface GuideStepItem {
  title: string;
  description: string;
}

interface GuideCallout {
  tone: "tip" | "warn" | "info";
  title: string;
  text: string;
}

const GUIDE_NAV = [
  "Overview",
  "Set Parameters",
  "Edit Step Cards",
  "Run the Sim",
  "Read the Flow",
  "Read the Diagnosis",
  "Save & Export"
] as const;

const GLOSSARY = [
  {
    term: "Utilization %",
    definition:
      "How loaded a station is relative to its capacity. Above 100% means the modeled demand is outrunning that step."
  },
  {
    term: "Constraint",
    definition:
      "The one station limiting total system throughput. Improving non-constraints first does not move total output."
  },
  {
    term: "WIP Load",
    definition: "Work in progress already inside the system. High WIP usually means longer lead times and hidden delay."
  },
  {
    term: "Constraint Pressure",
    definition: "How hard demand is pushing against the active constraint. Above 85% is the danger zone."
  },
  {
    term: "Horizon",
    definition: "The simulated time window. Set it before starting so the run reflects the period you want to evaluate."
  },
  {
    term: "Relief vs Baseline",
    definition: "The gain from your what-if scenario compared with the baseline case."
  },
  {
    term: "Edits Staged",
    definition: "You changed a parameter while the simulation was live. Reset and start again to apply that change."
  },
  {
    term: "Non-DES",
    definition: "A fast flow-rate simulation approach. It is conservative by design and built for operational decision support."
  }
] as const;

const OVERVIEW_CARDS = [
  {
    title: "Stress the system safely",
    description:
      "Run a full week of production in seconds and see where the operation bends, queues, or breaks before the floor absorbs the cost."
  },
  {
    title: "Find the real constraint",
    description:
      "LeanStorming shows which station is truly limiting output and how that pressure propagates into delay, starvation, and downstream instability."
  },
  {
    title: "Test the move before the meeting",
    description:
      "Change shifts, demand, bottleneck relief, or local step assumptions so you can compare interventions before committing labor, capital, or leadership attention."
  },
  {
    title: "Walk in with the decision story",
    description:
      "Open the executive PDF when you need a leadership-ready diagnosis, recommended next move, and business implication instead of another dashboard screenshot."
  }
] as const;

const PARAMETER_ITEMS: GuideStepItem[] = [
  {
    title: "Operating shifts",
    description: "Set how many shifts the facility runs. More shifts are often the fastest modeled capacity lever."
  },
  {
    title: "Demand multiplier",
    description: "Scale incoming demand up or down to test seasonal peaks, growth, or downside scenarios."
  },
  {
    title: "Bottleneck relief",
    description: "Add modeled capacity at the active constraint to estimate whether output actually improves."
  },
  {
    title: "Transfer price / unit",
    description: "Set the economic value per completed unit when you want stronger financial interpretation."
  },
  {
    title: "Mix profile",
    description: "Adjust product mix when uneven SKU loading changes where the line becomes unstable."
  }
];

const SPEED_ROWS = [
  {
    speed: "x1-x5",
    bestUse: "Live demos where people should watch the cards, queues, and utilization move in real time.",
    motion: "Visible"
  },
  {
    speed: "x100-x200",
    bestUse: "Fast diagnosis. Good default when you want a quick answer without waiting through the full horizon.",
    motion: "Partial"
  },
  {
    speed: "x1000",
    bestUse: "Instant end-state review. Best when you only care about the final diagnosis and report outputs.",
    motion: "Minimal"
  }
] as const;

const STEP_CARD_ITEMS: GuideStepItem[] = [
  {
    title: "Defaults come from the VSM",
    description:
      "Each step card starts with the cycle time, staffing, downtime, lead time, and economic inputs inferred from the VSM and model tables."
  },
  {
    title: "Edit only when the modeled default is not enough",
    description:
      "If the floor reality differs from the source map, open a step card and tune that station without rewriting the whole scenario."
  },
  {
    title: "Open the step editor from the flow map",
    description:
      "Double-click a station card in Flow view to open the step editor and adjust that node directly."
  },
  {
    title: "Use step edits for local overrides",
    description:
      "Override capacity units, cycle time, downtime, lead time, labor, material, or equipment rates when a specific step needs a more realistic assumption."
  },
  {
    title: "Reset or discard when testing alternatives",
    description:
      "Keep the VSM-derived defaults as the baseline, then use step-level edits as scenario-specific overrides you can clear later."
  }
];

const FLOW_STATUS = [
  {
    label: "Healthy",
    range: "< 70%",
    description: "The station still has slack. No immediate action is needed here.",
    tone: "good"
  },
  {
    label: "Risk",
    range: "70-95%",
    description: "Approaching the limit. Watch it as demand, WIP, or upstream pressure change.",
    tone: "warning"
  },
  {
    label: "Critical",
    range: "95-99%",
    description: "Near the ceiling. This step is a strong constraint candidate.",
    tone: "danger"
  },
  {
    label: "Model alarm",
    range: "> 100%",
    description: "The line is overloaded. The queue cannot clear without changing load or capacity.",
    tone: "danger"
  }
] as const;

const DIAGNOSIS_ITEMS: GuideStepItem[] = [
  {
    title: "KPI strip",
    description: "Start with the five headline numbers. Red means outside range, green means within target."
  },
  {
    title: "Status banner",
    description: "Read the one-line diagnosis, then compare input rate vs output rate to see how far the mismatch has opened."
  },
  {
    title: "Recommended action",
    description: "Use the highlighted next move when you need a 30-second answer in a meeting."
  },
  {
    title: "Diagnostic breakdown",
    description: "Use the five analysis cards for the full mechanism, downstream effects, and business case."
  },
  {
    title: "AI opportunity lens",
    description: "Use these cards to show where better data, automation, or pattern detection would improve decisions."
  }
];

const SAVE_ITEMS: GuideStepItem[] = [
  {
    title: "Save each scenario before changing inputs",
    description: "Name scenarios clearly so you can compare baseline, relief, and demand-stress cases later."
  },
  {
    title: "Change parameters, then reset and run again",
    description: "This creates a clean run with the new settings instead of mixing staged edits into the current state."
  },
  {
    title: "Open Executive PDF for leadership review",
    description: "Use the PDF when you want the short, decision-ready version of the current analysis."
  }
];

const STEP_CALLOUTS: GuideCallout[] = [
  {
    tone: "tip",
    title: "This is decision support, not dashboard theater",
    text: "LeanStorming is built to help you sell the decision, not just describe the current state. Better inputs produce stronger, more defensible recommendations."
  },
  {
    tone: "warn",
    title: "Changes while running are staged",
    text: "If you edit parameters while live, reset time and start again to apply the new settings cleanly."
  },
  {
    tone: "info",
    title: "Step edits are local overrides",
    text: "Use them when a single station needs a more realistic assumption than the VSM default provides."
  },
  {
    tone: "info",
    title: "Sim time tells you where you are",
    text: "The time chip shows elapsed hours versus horizon so you always know how far through the run you are."
  },
  {
    tone: "tip",
    title: "Look for the pattern, not just the red card",
    text: "A real bottleneck often starves downstream steps, so red followed by green is a useful flow signature."
  },
  {
    tone: "warn",
    title: "Check the confidence level",
    text: "If confidence is medium or low, collect the missing inputs before presenting the diagnosis as final."
  },
  {
    tone: "info",
    title: "You are ready for a client walkthrough",
    text: "Set parameters together, run the model, open Diagnosis, and finish with the executive PDF."
  }
];

const CHECKLIST_ITEMS = [
  "Simulation has run to 100% progress",
  "Scenario has been saved",
  "Confidence level is Medium or High",
  "Recommended action makes sense for the operating context",
  "Economic settings are populated if leadership wants financial output"
] as const;

function StepList({ items }: { items: GuideStepItem[] }) {
  return (
    <ol className="quickstart-step-list">
      {items.map((item, index) => (
        <li key={item.title}>
          <div className="quickstart-step-num">{index + 1}</div>
          <div>
            <div className="quickstart-step-list-title">{item.title}</div>
            <div className="quickstart-step-list-desc">{item.description}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Callout({ callout }: { callout: GuideCallout }) {
  return (
    <div className={`quickstart-callout tone-${callout.tone}`}>
      <div className="quickstart-callout-icon">{callout.tone === "warn" ? "!" : callout.tone === "tip" ? "*" : "i"}</div>
      <div>
        <div className="quickstart-callout-title">{callout.title}</div>
        <div className="quickstart-callout-text">{callout.text}</div>
      </div>
    </div>
  );
}

export function QuickStartGuideDialog({
  isOpen,
  onClose,
  onOpenExecutivePdf
}: QuickStartGuideDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [currentStep, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setCheckedItems([]);
    }
  }, [isOpen]);

  const activeCallout = STEP_CALLOUTS[currentStep];
  const progressText = useMemo(() => `Step ${currentStep + 1} of ${GUIDE_NAV.length}`, [currentStep]);

  if (!isOpen) {
    return null;
  }

  const toggleChecklistItem = (item: string) => {
    setCheckedItems((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );
  };

  return (
    <div className="quickstart-overlay" role="dialog" aria-modal="true" aria-labelledby="quickstart-title">
      <div className="quickstart-shell">
        <header className="quickstart-header">
          <div className="quickstart-header-brand">
            <div className="quickstart-brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div>
              <p className="quickstart-brand-name">LeanStorming</p>
              <p className="quickstart-brand-sub">Operational Stress Labs</p>
            </div>
          </div>
          <div className="quickstart-header-actions">
            <div className="quickstart-header-tag">Quick Start Guide</div>
            <button type="button" className="secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        <nav className="quickstart-progress-nav" aria-label="Guide steps">
          {GUIDE_NAV.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`quickstart-nav-step ${index === currentStep ? "is-active" : ""} ${
                index < currentStep ? "is-done" : ""
              }`}
              onClick={() => setCurrentStep(index)}
            >
              <span className="quickstart-nav-num">{index + 1}</span>
              <span className="quickstart-nav-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="quickstart-main">
          <div className="quickstart-steps-panel" ref={contentRef}>
            <p className="quickstart-step-eyebrow">{progressText}</p>

            {currentStep === 0 ? (
              <>
                <h1 id="quickstart-title" className="quickstart-step-title">
                  What are
                  <span> LeanStorming Operational Stress Labs?</span>
                </h1>
                <p className="quickstart-step-intro">
                  LeanStorming Operational Stress Labs turn a static value stream map into a working operational model.
                  They help you see what is breaking, why it is breaking, and what to change first before you spend money,
                  move people, or launch a broader improvement effort.
                </p>
                <p className="quickstart-step-intro">
                  This is not a generic dashboard and it is not just a simulator. It is a decision environment built to
                  pressure-test flow, expose the active constraint, compare interventions, and give leaders a cleaner story
                  about what action should happen next.
                </p>
                <div className="quickstart-action-cards">
                  {OVERVIEW_CARDS.map((card) => (
                    <article key={card.title} className="quickstart-action-card">
                      <h2>{card.title}</h2>
                      <p>{card.description}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : null}

            {currentStep === 1 ? (
              <>
                <h1 id="quickstart-title" className="quickstart-step-title">
                  Set your
                  <span> inputs first</span>
                </h1>
                <p className="quickstart-step-intro">
                  The left rail controls the simulation assumptions. Set them before pressing Start so your run is clean and comparable.
                </p>
                <StepList items={PARAMETER_ITEMS} />
              </>
            ) : null}

            {currentStep === 2 ? (
              <>
                <h1 id="quickstart-title" className="quickstart-step-title">
                  Edit step cards
                  <span> when needed</span>
                </h1>
                <p className="quickstart-step-intro">
                  The default step setup comes from the VSM and source model, but each station can be edited when floor reality, missing detail, or a test case requires it.
                </p>
                <StepList items={STEP_CARD_ITEMS} />
              </>
            ) : null}

            {currentStep === 3 ? (
              <>
                <h1 id="quickstart-title" className="quickstart-step-title">
                  Start and
                  <span> control speed</span>
                </h1>
                <p className="quickstart-step-intro">
                  The toolbar at the top controls the run. Start, reset time, save a scenario, then pick the playback speed that fits the conversation.
                </p>
                <div className="quickstart-speed-table-wrap">
                  <table className="quickstart-speed-table">
                    <thead>
                      <tr>
                        <th>Speed</th>
                        <th>Best used for</th>
                        <th>Card motion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SPEED_ROWS.map((row) => (
                        <tr key={row.speed}>
                          <td>{row.speed}</td>
                          <td>{row.bestUse}</td>
                          <td>{row.motion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            {currentStep === 4 ? (
              <>
                <h1 id="quickstart-title" className="quickstart-step-title">
                  Read the
                  <span> station cards</span>
                </h1>
                <p className="quickstart-step-intro">
                  The flow lane shows each step left to right. Read utilization and pressure as a pattern across the line, not as isolated cards.
                </p>
                <div className="quickstart-status-grid">
                  {FLOW_STATUS.map((item) => (
                    <article key={item.label} className={`quickstart-status-mini tone-${item.tone}`}>
                      <p>{item.label}</p>
                      <strong>{item.range}</strong>
                      <span>{item.description}</span>
                    </article>
                  ))}
                </div>
              </>
            ) : null}

            {currentStep === 5 ? (
              <>
                <h1 id="quickstart-title" className="quickstart-step-title">
                  Read the
                  <span> diagnosis report</span>
                </h1>
                <p className="quickstart-step-intro">
                  Open Diagnosis and read it top to bottom. The page is already arranged in the order a leader should consume it.
                </p>
                <StepList items={DIAGNOSIS_ITEMS} />
              </>
            ) : null}

            {currentStep === 6 ? (
              <>
                <h1 id="quickstart-title" className="quickstart-step-title">
                  Save scenarios,
                  <span> open reports</span>
                </h1>
                <p className="quickstart-step-intro">
                  Save each case clearly, rerun with changed assumptions, then use the Executive PDF when you need the short leadership version.
                </p>
                <StepList items={SAVE_ITEMS} />
                <div className="quickstart-checklist-shell">
                  <p className="quickstart-checklist-eyebrow">Pre-export checklist</p>
                  <ul className="quickstart-checklist">
                    {CHECKLIST_ITEMS.map((item) => {
                      const checked = checkedItems.includes(item);
                      return (
                        <li key={item}>
                          <button
                            type="button"
                            className={`quickstart-check-box ${checked ? "is-checked" : ""}`}
                            onClick={() => toggleChecklistItem(item)}
                            aria-pressed={checked}
                          >
                            {checked ? "x" : ""}
                          </button>
                          <span>{item}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="quickstart-inline-actions">
                  <button type="button" className="primary" onClick={onOpenExecutivePdf}>
                    Open Executive PDF
                  </button>
                </div>
              </>
            ) : null}

            <Callout callout={activeCallout} />

            <div className="quickstart-nav-buttons">
              <button
                type="button"
                className="secondary"
                onClick={() => setCurrentStep((current) => Math.max(0, current - 1))}
                disabled={currentStep === 0}
              >
                Back
              </button>
              <button
                type="button"
                className="primary"
                onClick={() =>
                  currentStep === GUIDE_NAV.length - 1
                    ? setCurrentStep(0)
                    : setCurrentStep((current) => Math.min(GUIDE_NAV.length - 1, current + 1))
                }
              >
                {currentStep === GUIDE_NAV.length - 1 ? "Start over" : "Next"}
              </button>
            </div>
          </div>

          <aside className="quickstart-sidebar">
            <p className="quickstart-sidebar-title">Key terms</p>
            <div className="quickstart-glossary">
              {GLOSSARY.map((item) => (
                <article key={item.term} className="quickstart-glossary-item">
                  <h2>{item.term}</h2>
                  <p>{item.definition}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
