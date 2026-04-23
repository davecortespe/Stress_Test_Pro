import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { marketingContent } from "./marketingContent";
import { pilotContent } from "./pilotContent";
import "./landing.css";
import "./pilot.css";

type PilotFormState = {
  name: string;
  company: string;
  role: string;
  email: string;
  process: string;
  breaking: string;
  handling: string;
  consequence: string;
};

type PilotFormField = keyof PilotFormState;
type PilotFormErrors = Partial<Record<PilotFormField, string>>;

type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const INITIAL_FORM: PilotFormState = {
  name: "",
  company: "",
  role: "",
  email: "",
  process: "",
  breaking: "",
  handling: "",
  consequence: ""
};

function hasTemplateToken(value: string): boolean {
  return value.includes("{{") && value.includes("}}");
}

function resolveTemplate(value: string, fallback: string): string {
  if (!value || hasTemplateToken(value)) {
    return fallback;
  }

  return value;
}

function resolveUrl(value: string, fallback: string): string {
  const resolved = resolveTemplate(value, fallback).trim();
  if (/^https?:\/\//i.test(resolved)) {
    return resolved;
  }

  return `https://${resolved}`;
}

function resolveOptionalHref(value: string): string {
  const resolved = value.trim();
  if (!resolved) {
    return "";
  }

  if (/^(https?:\/\/|mailto:|\/)/i.test(resolved)) {
    return resolved;
  }

  return `https://${resolved}`;
}

function scrollToSection(sectionId: string): void {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmailFormat(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function validatePilotForm(form: PilotFormState): PilotFormErrors {
  const errors: PilotFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Name is required.";
  }
  if (!form.company.trim()) {
    errors.company = "Company is required.";
  }
  if (!form.role.trim()) {
    errors.role = "Role is required.";
  }
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmailFormat(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.process.trim()) {
    errors.process = "Describe the process you want modeled.";
  }
  if (!form.breaking.trim()) {
    errors.breaking = "Describe what is breaking right now.";
  }
  if (!form.handling.trim()) {
    errors.handling = "Explain how you are handling it today.";
  }
  if (!form.consequence.trim()) {
    errors.consequence = "Describe what happens if nothing changes.";
  }

  return errors;
}

function buildMailtoHref(targetEmail: string, form: PilotFormState): string {
  const subject = `FlowStress Dynamics pilot application: ${form.company.trim()}`;
  const body = [
    `Name: ${form.name.trim()}`,
    `Company: ${form.company.trim()}`,
    `Role: ${form.role.trim()}`,
    `Email: ${normalizeEmail(form.email)}`,
    "",
    "What process do you want modeled?",
    form.process.trim(),
    "",
    "What is breaking right now?",
    form.breaking.trim(),
    "",
    "How are you handling it today?",
    form.handling.trim(),
    "",
    "If nothing changes in 90 days, what happens?",
    form.consequence.trim()
  ].join("\n");

  return `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function PilotBulletList({ items }: { items: string[] }) {
  return (
    <ul className="pilot-bullet-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

const companyName = resolveTemplate(
  import.meta.env.VITE_COMPANY_NAME || marketingContent.companyName,
  "your operations team"
);
const leanStormingUrl = resolveUrl(
  import.meta.env.VITE_LEANSTORMING_URL || marketingContent.leanStormingUrl,
  "leanstorming.com"
);
const pilotFormEndpoint = resolveTemplate(
  import.meta.env.VITE_PILOT_FORM_ENDPOINT || import.meta.env.VITE_DEMO_FORM_ENDPOINT || "",
  ""
).trim();
const pilotContactEmail = resolveTemplate(
  import.meta.env.VITE_PILOT_CONTACT_EMAIL || import.meta.env.VITE_DEMO_CONTACT_EMAIL || "",
  ""
).trim();
const pilotContactUrl = resolveOptionalHref(
  resolveTemplate(import.meta.env.VITE_PILOT_CONTACT_URL || import.meta.env.VITE_DEMO_CONTACT_URL || "", "")
);

export default function PilotPage() {
  const [form, setForm] = useState<PilotFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<PilotFormErrors>({});
  const [submissionState, setSubmissionState] = useState<SubmissionState>({ kind: "idle" });
  const builtForLabel = marketingContent.footer.builtFor.replace("{{COMPANY_NAME}}", companyName);

  function handleFieldChange(field: PilotFormField, value: string): void {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      return { ...current, [field]: undefined };
    });

    if (submissionState.kind !== "idle") {
      setSubmissionState({ kind: "idle" });
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
    const field = event.target.name as PilotFormField;
    handleFieldChange(field, event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedForm: PilotFormState = {
      name: form.name.trim(),
      company: form.company.trim(),
      role: form.role.trim(),
      email: normalizeEmail(form.email),
      process: form.process.trim(),
      breaking: form.breaking.trim(),
      handling: form.handling.trim(),
      consequence: form.consequence.trim()
    };

    const nextErrors = validatePilotForm(trimmedForm);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmissionState({ kind: "error", message: "Please complete the missing fields and try again." });
      return;
    }

    setErrors({});
    setSubmissionState({ kind: "submitting" });

    try {
      if (pilotFormEndpoint) {
        const response = await fetch(pilotFormEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...trimmedForm,
            source: "pilot-application-page",
            submittedAt: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        setForm(INITIAL_FORM);
        setSubmissionState({
          kind: "success",
          message: pilotContent.application.successBody
        });
        return;
      }

      if (pilotContactEmail) {
        window.location.href = buildMailtoHref(pilotContactEmail, trimmedForm);
        setSubmissionState({
          kind: "success",
          message: "Your email client should open with the pilot application addressed to our team."
        });
        return;
      }

      if (pilotContactUrl) {
        window.open(pilotContactUrl, "_blank", "noopener,noreferrer");
        setSubmissionState({
          kind: "success",
          message: "We opened the configured contact page so you can finish the application there."
        });
        return;
      }

      throw new Error("No pilot submission destination is configured.");
    } catch (error) {
      console.error(error);
      setSubmissionState({
        kind: "error",
        message: "The pilot application could not be sent. Configure a pilot endpoint or contact fallback and try again."
      });
    }
  }

  return (
    <div className="landing-page pilot-page">
      <header className="ls-header">
        <div className="ls-header-shell section-shell">
          <a href={leanStormingUrl} target="_blank" rel="noopener noreferrer" className="ls-brand-block">
            <span className="ls-brand-title">LEANSTORMING</span>
            <span className="ls-brand-subtitle">Operational Intelligence Platform</span>
          </a>

          <nav className="ls-nav" aria-label="Pilot page">
            {pilotContent.nav.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <section id="hero" className="ls-hero section-shell pilot-hero-shell">
          <div className="ls-hero-panel pilot-hero-panel">
            <div className="ls-hero-copy pilot-hero-copy">
              <div className="pilot-hero-copy-stack">
                <p className="ls-hero-eyebrow">{pilotContent.hero.eyebrow}</p>
                <h1>{pilotContent.hero.headline}</h1>
                <p className="ls-hero-kicker pilot-hero-subheadline">{pilotContent.hero.subheadline}</p>
              </div>

              <div className="pilot-hero-lower">
                <div className="pilot-hero-body">
                  {pilotContent.hero.body.map((paragraph) => (
                    <p key={paragraph} className="ls-hero-description">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <div className="pilot-hero-action-block">
                <div className="ls-cta-row">
                  <button type="button" className="ls-btn ls-btn-primary" onClick={() => scrollToSection("apply")}>
                    {pilotContent.hero.primaryCta}
                  </button>
                  <button type="button" className="ls-btn ls-btn-secondary" onClick={() => scrollToSection("apply")}>
                    {pilotContent.hero.secondaryCta}
                  </button>
                </div>

                <p className="ls-cta-support pilot-selection-note">{pilotContent.hero.supportText}</p>
              </div>
            </div>

            <aside className="pilot-hero-summary" aria-label="Pilot summary">
              <div className="pilot-hero-summary-copy">
                <p className="ls-card-label">{pilotContent.heroSummary.label}</p>
                <h2 className="pilot-hero-summary-title">{pilotContent.heroSummary.title}</h2>
                <p className="pilot-hero-summary-intro">{pilotContent.heroSummary.intro}</p>
                <PilotBulletList items={pilotContent.heroSummary.bullets} />
              </div>

              <div className="pilot-hero-summary-footer">
                <p className="pilot-hero-summary-kicker">Good fit requires</p>
                <p className="pilot-hero-summary-proof">{pilotContent.heroSummary.proofValue}</p>
                <div className="pilot-hero-summary-tags">
                  {pilotContent.heroSummary.standards.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="apply" className="ls-section section-shell">
          <div className="ls-contact-band pilot-form-band">
            <div className="ls-contact-copy pilot-form-copy">
              <p className="ls-section-eyebrow">Apply for the pilot</p>
              <h2>{pilotContent.application.title}</h2>
              <div className="pilot-form-why-copy">
                <h2 className="pilot-form-why-title">{pilotContent.why.title}</h2>
                <p>{`${pilotContent.why.body[0]} ${pilotContent.why.body[1]}`}</p>
                <p>{pilotContent.why.body[2]}</p>
              </div>
              {pilotContent.application.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p className="ls-cta-support pilot-selection-note">{pilotContent.application.supportText}</p>
            </div>

            <div className="ls-intake-shell pilot-intake-shell">
              <form className="ls-intake-form pilot-intake-form" onSubmit={handleSubmit} noValidate>
                <div>
                  <p className="ls-card-label">Application</p>
                  <h3>Serious applications only.</h3>
                  <p className="ls-form-note">
                    Keep answers short and concrete so we can judge fit quickly and fairly.
                  </p>
                </div>

                <div className="ls-intake-grid pilot-intake-grid">
                  {pilotContent.application.fields.map((field) => {
                    const errorId = `pilot-field-${field.id}-error`;
                    const helpId = field.id === "email" ? "pilot-field-email-help" : undefined;
                    const error = errors[field.id as PilotFormField];
                    const commonProps = {
                      name: field.id,
                      value: form[field.id as PilotFormField],
                      onChange: handleInputChange,
                      "aria-invalid": Boolean(error),
                      "aria-describedby": error ? errorId : helpId
                    };

                    return (
                      <label
                        key={field.id}
                        className={`ls-field ${field.rows ? "ls-field-full" : ""} ${
                          field.id === "process" || field.id === "breaking" ? "pilot-field-major" : ""
                        }`}
                      >
                        <span className="ls-field-label">{field.label}</span>
                        {field.rows ? (
                          <textarea {...commonProps} rows={field.rows} placeholder={field.placeholder} />
                        ) : (
                          <input
                            {...commonProps}
                            type={field.type ?? "text"}
                            autoComplete={field.autoComplete}
                            placeholder={field.placeholder}
                          />
                        )}
                        {helpId ? (
                          <span id={helpId} className="ls-field-help">
                            Use the email where we should contact the team lead.
                          </span>
                        ) : null}
                        {error ? (
                          <span id={errorId} className="ls-field-error" role="alert">
                            {error}
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>

                <button type="submit" className="ls-btn ls-btn-primary" disabled={submissionState.kind === "submitting"}>
                  {submissionState.kind === "submitting" ? "Submitting..." : pilotContent.application.cta}
                </button>

                <p className="pilot-form-footnote">{pilotContent.application.footnote}</p>

                <div
                  className={`pilot-form-status ${
                    submissionState.kind === "success"
                      ? "is-success"
                      : submissionState.kind === "error"
                        ? "is-error"
                        : ""
                  }`}
                  aria-live="polite"
                >
                  {submissionState.kind === "success" ? (
                    <>
                      <strong>{pilotContent.application.successHeadline}</strong>
                      <p>{submissionState.message}</p>
                    </>
                  ) : submissionState.kind === "error" ? (
                    <>
                      <strong>Unable to submit</strong>
                      <p>{submissionState.message}</p>
                    </>
                  ) : null}
                </div>
              </form>
            </div>
          </div>
        </section>

      </main>

      <footer className="ls-footer section-shell">
        <div>
          <strong>{marketingContent.footer.attribution}</strong>
          <p>{builtForLabel}</p>
          <p>{marketingContent.footer.poweredBy}</p>
          <p className="ls-footer-signoff">{marketingContent.footer.signoff}</p>
        </div>

        <div className="ls-footer-links">
          <a href={leanStormingUrl} target="_blank" rel="noopener noreferrer">
            {marketingContent.footer.url}
          </a>
          <a
            href={marketingContent.footer.termsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LeanStorming Terms of Service"
          >
            Terms of Service
          </a>
          <a href="#apply">{pilotContent.hero.primaryCta}</a>
        </div>
      </footer>
    </div>
  );
}
