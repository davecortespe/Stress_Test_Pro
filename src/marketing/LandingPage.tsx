import { useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SimulatorAccessDialog } from "../components/SimulatorAccessDialog";
import { grantSimulatorAccess, hasSimulatorAccess } from "../lib/simulatorAccess";
import type { SimulatorResultsMode } from "../types/contracts";
import { heroMockData, marketingContent, reportShowcase } from "./marketingContent";
import "./landing.css";

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

function scrollToSection(sectionId: string): void {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

const companyName = resolveTemplate(import.meta.env.VITE_COMPANY_NAME || marketingContent.companyName, "your operations team");
const clientLogo = resolveTemplate(import.meta.env.VITE_CLIENT_LOGO_URL || marketingContent.clientLogo, "");
const simulationName = resolveTemplate(
  import.meta.env.VITE_SIMULATION_NAME || marketingContent.simulationName,
  "Operational Stress Labs"
);
const leanStormingUrl = resolveUrl(
  import.meta.env.VITE_LEANSTORMING_URL || marketingContent.leanStormingUrl,
  "leanstorming.com"
);
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
  onSelectMode,
  onEnterSimulation
}: {
  activeMode: SimulatorResultsMode;
  onSelectMode: (mode: SimulatorResultsMode) => void;
  onEnterSimulation: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const activeReport = reportShowcase.find((item) => item.id === activeMode) ?? reportShowcase[0];

  return (
    <div className="report-showcase" aria-label="Analytics showcase">
      <p className="ls-brand-callout">Inside {operationalStressLabsBrand}</p>
      <div className="report-mode-tabs" role="tablist" aria-label="analytics views">
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
          <Link to="/sim" className="ls-btn ls-btn-primary" onClick={onEnterSimulation}>
            Enter the simulation
          </Link>
        </article>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [activeReportMode, setActiveReportMode] = useState<SimulatorResultsMode>("diagnosis");
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const navigate = useNavigate();
  const builtForLabel = marketingContent.footer.builtFor.replace("{{COMPANY_NAME}}", companyName);
  const aboutParagraphs = marketingContent.about.body.split("\n\n");

  function requestSimulationEntry(event: MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault();
    if (hasSimulatorAccess()) {
      navigate("/sim");
      return;
    }
    setIsAccessDialogOpen(true);
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
            <a href="#hero" className="is-active">
              Home
            </a>
            {marketingContent.nav.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <section id="hero" className="ls-hero section-shell">
          <div className="ls-hero-panel analytics-hero-panel">
            <div className="ls-hero-copy">
              <p className="ls-hero-eyebrow">{marketingContent.hero.eyebrow}</p>
              <p className="ls-hero-kicker">{marketingContent.hero.kicker}</p>
              <h1>{marketingContent.hero.headline}</h1>
              <p className="ls-hero-description">{marketingContent.hero.description}</p>

              <div className="ls-hero-meta">
                {clientLogo ? <img src={clientLogo} alt={`${companyName} logo`} className="ls-client-logo" /> : null}
            <div>
              <p>{builtForLabel}</p>
              <span>{simulationName}</span>
            </div>
          </div>

          <div className="ls-cta-row">
            <button
                  type="button"
                  className="ls-btn ls-btn-primary"
                  onClick={() => scrollToSection("analytics")}
                >
                  {marketingContent.hero.primaryCta}
                </button>
                <button
                  type="button"
                  className="ls-btn ls-btn-secondary"
                  onClick={() => scrollToSection("scenario-lab")}
                >
                  {marketingContent.hero.secondaryCta}
                </button>
              </div>

              <Link to="/sim" className="ls-inline-link" onClick={requestSimulationEntry}>
                {marketingContent.hero.workspaceCta}
              </Link>
            </div>

            <ReportShowcase
              activeMode={activeReportMode}
              onSelectMode={setActiveReportMode}
              onEnterSimulation={requestSimulationEntry}
            />
          </div>
        </section>

        <section id="analytics" className="ls-section section-shell">
          <SectionIntro
            eyebrow={marketingContent.analytics.eyebrow}
            title={marketingContent.analytics.title}
            body={marketingContent.analytics.body}
          />

          <div className="ls-card-grid ls-services-grid">
            {reportShowcase.map((item) => (
              <article key={item.id} className="ls-surface-card ls-service-card">
                <span className="ls-card-label">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="scenario-lab" className="ls-section section-shell">
          <div className="ls-panel-shell">
            <SectionIntro
              eyebrow={marketingContent.scenarioLab.eyebrow}
              title={marketingContent.scenarioLab.title}
              body={marketingContent.scenarioLab.body}
            />

            <div className="ls-card-grid ls-services-grid">
              {marketingContent.scenarioLab.cards.map((card) => (
                <article key={card.title} className="ls-surface-card ls-service-card">
                  {card.label ? <span className="ls-card-label">{card.label}</span> : null}
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="exports" className="ls-section section-shell">
          <SectionIntro
            eyebrow={marketingContent.exports.eyebrow}
            title={marketingContent.exports.title}
            body={marketingContent.exports.body}
          />

          <div className="ls-card-grid ls-method-grid">
            {marketingContent.exports.steps.map((item) => (
              <article key={item.step} className="ls-surface-card ls-method-card">
                <span className="ls-step-index">Step {item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="ls-section section-shell">
          <div className="ls-panel-shell ls-about-panel">
            <SectionIntro eyebrow={marketingContent.about.eyebrow} title={marketingContent.about.title} />
            <div className="ls-about-copy">
              {aboutParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
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

            <div className="ls-contact-actions">
              <Link to="/sim" className="ls-btn ls-btn-primary" onClick={requestSimulationEntry}>
                {marketingContent.enter.primaryCta}
              </Link>
              <a
                href={leanStormingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ls-btn ls-btn-secondary"
              >
                {marketingContent.enter.secondaryCta}
              </a>
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
          <Link to="/sim" onClick={requestSimulationEntry}>Enter Simulation</Link>
        </div>
      </footer>

      {isAccessDialogOpen ? (
        <SimulatorAccessDialog
          onValidated={() => {
            grantSimulatorAccess();
            setIsAccessDialogOpen(false);
            navigate("/sim");
          }}
          onCancel={() => setIsAccessDialogOpen(false)}
        />
      ) : null}
    </div>
  );
}
