import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { SimulatorResultsMode } from "../types/contracts";
import { heroMockData, marketingContent, reportShowcase } from "./marketingContent";
import "./landing.css";

const SIMULATOR_ENTRY_PATH = "/sim";
const PILOT_ENTRY_PATH = "/pilot";
const PERSONAL_EMAIL_DOMAINS = new Set([
  "aol.com",
  "att.net",
  "comcast.net",
  "gmail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "mac.com",
  "mail.com",
  "me.com",
  "msn.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "sbcglobal.net",
  "verizon.net",
  "yahoo.com",
  "ymail.com"
]);

type IntakeFormState = {
  name: string;
  company: string;
  email: string;
  challenge: string;
};

type IntakeFormField = keyof IntakeFormState;

type IntakeFormErrors = Partial<Record<IntakeFormField, string>>;

type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const INITIAL_INTAKE_FORM: IntakeFormState = {
  name: "",
  company: "",
  email: "",
  challenge: ""
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

function getEmailDomain(value: string): string | null {
  const email = normalizeEmail(value);
  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === email.length - 1) {
    return null;
  }
  return email.slice(atIndex + 1);
}

function isWorkEmail(value: string): boolean {
  if (!isValidEmailFormat(value)) {
    return false;
  }
  const domain = getEmailDomain(value);
  if (!domain) {
    return false;
  }
  return !PERSONAL_EMAIL_DOMAINS.has(domain);
}

function validateIntakeForm(form: IntakeFormState): IntakeFormErrors {
  const errors: IntakeFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Name is required.";
  }
  if (!form.company.trim()) {
    errors.company = "Company is required.";
  }
  if (!form.email.trim()) {
    errors.email = "Work email is required.";
  } else if (!isValidEmailFormat(form.email)) {
    errors.email = "Enter a valid email address.";
  } else if (!isWorkEmail(form.email)) {
    errors.email = "Use your work email. Personal inboxes are not accepted.";
  }
  if (!form.challenge.trim()) {
    errors.challenge = "Tell us what you want to diagnose.";
  }

  return errors;
}

function buildMailtoHref(targetEmail: string, form: IntakeFormState): string {
  const subject = `Operational Stress Labs intake: ${form.company.trim()}`;
  const body = [
    `Name: ${form.name.trim()}`,
    `Company: ${form.company.trim()}`,
    `Work email: ${normalizeEmail(form.email)}`,
    "",
    "What we want to diagnose:",
    form.challenge.trim()
  ].join("\n");

  return `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const companyName = resolveTemplate(
  import.meta.env.VITE_COMPANY_NAME || marketingContent.companyName,
  "your operations team"
);
const clientLogo = resolveTemplate(import.meta.env.VITE_CLIENT_LOGO_URL || marketingContent.clientLogo, "");
const simulationName = resolveTemplate(
  import.meta.env.VITE_SIMULATION_NAME || marketingContent.simulationName,
  "Operational Stress Labs"
);
const leanStormingUrl = resolveUrl(
  import.meta.env.VITE_LEANSTORMING_URL || marketingContent.leanStormingUrl,
  "leanstorming.com"
);
const demoFormEndpoint = resolveTemplate(import.meta.env.VITE_DEMO_FORM_ENDPOINT || "", "").trim();
const demoContactUrl = resolveOptionalHref(resolveTemplate(import.meta.env.VITE_DEMO_CONTACT_URL || "", ""));
const demoContactEmail = resolveTemplate(import.meta.env.VITE_DEMO_CONTACT_EMAIL || "", "").trim();
const operationalStressLabsBrand = "LeanStorming's Operational Stress Labs";

function SectionIntro({
  eyebrow,
  title,
  body
}: {
  eyebrow?: string;
  title: string;
  body?: string[];
}) {
  return (
    <div className="ls-section-intro">
      {eyebrow ? <p className="ls-section-eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {body ? body.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : null}
    </div>
  );
}

function ReportShowcase({
  activeMode,
  onSelectMode
}: {
  activeMode: SimulatorResultsMode;
  onSelectMode: (mode: SimulatorResultsMode) => void;
}) {
  const activeReport = reportShowcase.find((item) => item.id === activeMode) ?? reportShowcase[0];

  return (
    <div className="report-showcase" aria-label="Decision view preview">
      <p className="ls-brand-callout">One modeled operation. Multiple decision entries.</p>
      <div className="report-mode-tabs" role="tablist" aria-label="decision views">
        {reportShowcase.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activeMode === item.id}
            className={`report-mode-tab ${activeMode === item.id ? "is-active" : ""}`}
            onClick={() => onSelectMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="report-preview-shell">
        <article className="report-preview-main">
          <p className="ls-card-label">{activeReport.eyebrow}</p>
          <h3>{activeReport.title}</h3>
          <p>{activeReport.summary}</p>
          <ul className="report-preview-list">
            {activeReport.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </article>

        <article className="report-preview-proof">
          <span>{activeReport.proofLabel}</span>
          <strong>{activeReport.proofValue}</strong>
          <div className="report-preview-proof-stack">
            {heroMockData.metrics.map((metric) => (
              <div key={metric.label} className={`report-proof-chip tone-${metric.tone ?? "neutral"}`}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
          <div className="report-preview-actions">
            <Link to={SIMULATOR_ENTRY_PATH} className="ls-btn ls-btn-primary">
              {marketingContent.hero.primaryCta}
            </Link>
            <Link to={SIMULATOR_ENTRY_PATH} className="ls-inline-link report-preview-link">
              {marketingContent.hero.workspaceCta}
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [activeReportMode, setActiveReportMode] = useState<SimulatorResultsMode>("diagnosis");
  const [intakeForm, setIntakeForm] = useState<IntakeFormState>(INITIAL_INTAKE_FORM);
  const [intakeErrors, setIntakeErrors] = useState<IntakeFormErrors>({});
  const [submissionState, setSubmissionState] = useState<SubmissionState>({ kind: "idle" });
  const builtForLabel = marketingContent.footer.builtFor.replace("{{COMPANY_NAME}}", companyName);

  function handleFieldChange(field: IntakeFormField, value: string): void {
    setIntakeForm((current) => ({ ...current, [field]: value }));
    setIntakeErrors((current) => {
      if (!current[field]) {
        return current;
      }
      return { ...current, [field]: undefined };
    });
    if (submissionState.kind !== "idle") {
      setSubmissionState({ kind: "idle" });
    }
  }

  async function handleIntakeSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedForm: IntakeFormState = {
      name: intakeForm.name.trim(),
      company: intakeForm.company.trim(),
      email: normalizeEmail(intakeForm.email),
      challenge: intakeForm.challenge.trim()
    };

    const errors = validateIntakeForm(trimmedForm);
    if (Object.keys(errors).length > 0) {
      setIntakeErrors(errors);
      setSubmissionState({ kind: "error", message: "Please fix the highlighted fields and try again." });
      return;
    }

    setIntakeErrors({});
    setSubmissionState({ kind: "submitting" });

    try {
      if (demoFormEndpoint) {
        const response = await fetch(demoFormEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...trimmedForm,
            source: "landing-page-intake",
            submittedAt: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        setIntakeForm(INITIAL_INTAKE_FORM);
        setSubmissionState({
          kind: "success",
          message: "Thanks. We received your intake and will follow up using your work email."
        });
        return;
      }

      if (demoContactEmail) {
        window.location.href = buildMailtoHref(demoContactEmail, trimmedForm);
        setSubmissionState({
          kind: "success",
          message: "Your email client should open with the intake details addressed to our team."
        });
        return;
      }

      if (demoContactUrl) {
        window.open(demoContactUrl, "_blank", "noopener,noreferrer");
        setSubmissionState({
          kind: "success",
          message: "We opened the configured contact page so you can finish the request there."
        });
        return;
      }

      throw new Error("No demo contact destination is configured.");
    } catch (error) {
      console.error(error);
      setSubmissionState({
        kind: "error",
        message: "The intake request could not be sent. Configure a form endpoint or contact fallback and try again."
      });
    }
  }

  return (
    <div className="landing-page">
      <header className="ls-header">
        <div className="ls-header-shell section-shell">
          <a href={leanStormingUrl} target="_blank" rel="noopener noreferrer" className="ls-brand-block">
            <span className="ls-brand-title">LEANSTORMING</span>
            <span className="ls-brand-subtitle">Operational Intelligence Platform</span>
          </a>

          <nav className="ls-nav" aria-label="Primary">
            {marketingContent.nav.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {item.label}
              </a>
            ))}
            <Link to={PILOT_ENTRY_PATH}>Apply for the pilot</Link>
          </nav>
        </div>
      </header>

      <main>
        <section id="hero" className="ls-hero section-shell">
          <div className="ls-hero-panel analytics-hero-panel">
            <div className="ls-hero-copy">
              <p className="ls-hero-eyebrow">{marketingContent.hero.eyebrow}</p>
              <h1>{marketingContent.hero.headline}</h1>
              <p className="ls-hero-kicker">{marketingContent.hero.supportLine}</p>
              <p className="ls-hero-brand-line">{marketingContent.hero.brandLine}</p>
              <p className="ls-hero-description">{marketingContent.hero.description}</p>

              <div className="ls-hero-meta">
                {clientLogo ? <img src={clientLogo} alt={`${companyName} logo`} className="ls-client-logo" /> : null}
                <div>
                  <p>{builtForLabel}</p>
                  <span>{simulationName}</span>
                </div>
              </div>

              <div className="ls-cta-row">
                <Link to={SIMULATOR_ENTRY_PATH} className="ls-btn ls-btn-primary">
                  {marketingContent.hero.primaryCta}
                </Link>
                <button
                  type="button"
                  className="ls-btn ls-btn-secondary"
                  onClick={() => scrollToSection("decision-views")}
                >
                  {marketingContent.hero.secondaryCta}
                </button>
              </div>

              <p className="ls-cta-support">{marketingContent.hero.supportText}</p>

              <Link to={SIMULATOR_ENTRY_PATH} className="ls-inline-link">
                {marketingContent.hero.workspaceCta}
              </Link>

              <Link to={PILOT_ENTRY_PATH} className="ls-inline-link ls-inline-link-emphasis">
                Apply for the pilot
              </Link>
            </div>

            <ReportShowcase activeMode={activeReportMode} onSelectMode={setActiveReportMode} />
          </div>
        </section>

        <section id="decision-views" className="ls-section section-shell">
          <SectionIntro
            eyebrow={marketingContent.decisionViews.eyebrow}
            title={marketingContent.decisionViews.title}
            body={marketingContent.decisionViews.body}
          />

          <div className="ls-card-grid ls-services-grid ls-decision-grid">
            {reportShowcase.map((item) => (
              <article key={item.id} className="ls-surface-card ls-service-card">
                <span className="ls-card-label">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="why-enter" className="ls-section section-shell">
          <div className="ls-panel-shell">
            <SectionIntro
              eyebrow={marketingContent.whyClickNow.eyebrow}
              title={marketingContent.whyClickNow.title}
              body={marketingContent.whyClickNow.body}
            />

            <div className="ls-card-grid ls-why-click-grid">
              {marketingContent.whyClickNow.cards.map((card) => (
                <article key={card.title} className="ls-surface-card ls-service-card">
                  {card.label ? <span className="ls-card-label">{card.label}</span> : null}
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="enter" className="ls-section section-shell">
          <div className="ls-contact-band">
            <div className="ls-contact-copy">
              <p className="ls-section-eyebrow">{marketingContent.enter.eyebrow}</p>
              <p className="ls-brand-callout">{operationalStressLabsBrand}</p>
              <h2>{marketingContent.enter.title}</h2>
              {marketingContent.enter.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="ls-intake-shell">
              <form className="ls-intake-form" onSubmit={handleIntakeSubmit} noValidate>
                <div>
                  <p className="ls-card-label">Request Access</p>
                  <h3>Use your work email to request a guided intake.</h3>
                  <p className="ls-form-note">
                    Personal email domains are blocked so we can route follow-up inside a real operating context.
                  </p>
                </div>

                <div className="ls-intake-grid">
                  <label className="ls-field">
                    <span className="ls-field-label">Name</span>
                    <input
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={intakeForm.name}
                      onChange={(event) => handleFieldChange("name", event.target.value)}
                      aria-invalid={Boolean(intakeErrors.name)}
                      aria-describedby={intakeErrors.name ? "landing-intake-name-error" : undefined}
                    />
                    {intakeErrors.name ? (
                      <span id="landing-intake-name-error" className="ls-field-error">
                        {intakeErrors.name}
                      </span>
                    ) : null}
                  </label>

                  <label className="ls-field">
                    <span className="ls-field-label">Company</span>
                    <input
                      name="company"
                      type="text"
                      autoComplete="organization"
                      value={intakeForm.company}
                      onChange={(event) => handleFieldChange("company", event.target.value)}
                      aria-invalid={Boolean(intakeErrors.company)}
                      aria-describedby={intakeErrors.company ? "landing-intake-company-error" : undefined}
                    />
                    {intakeErrors.company ? (
                      <span id="landing-intake-company-error" className="ls-field-error">
                        {intakeErrors.company}
                      </span>
                    ) : null}
                  </label>

                  <label className="ls-field ls-field-full">
                    <span className="ls-field-label">Work email</span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@company.com"
                      value={intakeForm.email}
                      onChange={(event) => handleFieldChange("email", event.target.value)}
                      aria-invalid={Boolean(intakeErrors.email)}
                      aria-describedby={intakeErrors.email ? "landing-intake-email-error" : "landing-intake-email-help"}
                    />
                    <span id="landing-intake-email-help" className="ls-field-help">
                      Work email required.
                    </span>
                    {intakeErrors.email ? (
                      <span id="landing-intake-email-error" className="ls-field-error">
                        {intakeErrors.email}
                      </span>
                    ) : null}
                  </label>

                  <label className="ls-field ls-field-full">
                    <span className="ls-field-label">What are you trying to diagnose?</span>
                    <textarea
                      name="challenge"
                      rows={5}
                      placeholder="Example: We want to understand why queue buildup keeps moving between packaging and inspection."
                      value={intakeForm.challenge}
                      onChange={(event) => handleFieldChange("challenge", event.target.value)}
                      aria-invalid={Boolean(intakeErrors.challenge)}
                      aria-describedby={intakeErrors.challenge ? "landing-intake-challenge-error" : undefined}
                    />
                    {intakeErrors.challenge ? (
                      <span id="landing-intake-challenge-error" className="ls-field-error">
                        {intakeErrors.challenge}
                      </span>
                    ) : null}
                  </label>
                </div>

                <div className="ls-intake-actions">
                  <button type="submit" className="ls-btn ls-btn-primary" disabled={submissionState.kind === "submitting"}>
                    {submissionState.kind === "submitting" ? "Sending intake..." : "Request guided intake"}
                  </button>
                  <Link to={SIMULATOR_ENTRY_PATH} className="ls-btn ls-btn-secondary">
                    {marketingContent.enter.secondaryCta}
                  </Link>
                </div>

                <p
                  className={`ls-form-status ${
                    submissionState.kind === "success"
                      ? "is-success"
                      : submissionState.kind === "error"
                        ? "is-error"
                        : ""
                  }`}
                  aria-live="polite"
                >
                  {submissionState.kind === "idle"
                    ? "We’ll use this to route the right follow-up."
                    : submissionState.kind === "submitting"
                      ? "Sending intake..."
                      : submissionState.message}
                </p>
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
          <Link to={PILOT_ENTRY_PATH}>Apply for the pilot</Link>
          <Link to={SIMULATOR_ENTRY_PATH}>
            {marketingContent.hero.primaryCta}
          </Link>
        </div>
      </footer>
    </div>
  );
}
