import { Link } from "react-router-dom";
import { heroMockData, marketingContent } from "./marketingContent";
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

const companyName = resolveTemplate(import.meta.env.VITE_COMPANY_NAME || marketingContent.companyName, "your operations team");
const clientLogo = resolveTemplate(import.meta.env.VITE_CLIENT_LOGO_URL || marketingContent.clientLogo, "");
const simulationName = resolveTemplate(import.meta.env.VITE_SIMULATION_NAME || marketingContent.simulationName, "Flow Simulation");
const leanStormingUrl = resolveUrl(
  import.meta.env.VITE_LEANSTORMING_URL || marketingContent.leanStormingUrl,
  "leanstorming.com"
);

function SectionIntro({ title, body }: { title: string; body?: string[] }) {
  return (
    <div className="landing-section-intro">
      <h2>{title}</h2>
      {body ? body.map((p, i) => <p key={i}>{p}</p>) : null}
    </div>
  );
}

function HeroMockup() {
  return (
    <div className="hero-visual-shell" aria-hidden="true">
      <div className="hero-metric-grid">
        {heroMockData.metrics.map((metric) => (
          <div key={metric.label} className={`hero-metric-card tone-${metric.tone ?? "neutral"}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="hero-dashboard-frame">
        <div className="hero-dashboard-topbar">
          <span className="frame-pill">{simulationName}</span>
          <span className="frame-pill frame-pill-live">Live Stress Window</span>
        </div>
        <div className="hero-dashboard-body">
          <div className="hero-bottleneck-card">
            <p>Bottleneck Analysis</p>
            <h3>Put-away Capacity</h3>
            <dl>
              <div>
                <dt>Utilization</dt>
                <dd>96%</dd>
              </div>
              <div>
                <dt>Queue Risk</dt>
                <dd>Critical</dd>
              </div>
              <div>
                <dt>Lead-time Effect</dt>
                <dd>+4.8 hrs</dd>
              </div>
            </dl>
          </div>
          <div className="hero-diagnosis-card">
            <p>Operational Diagnosis</p>
            <strong>Primary constraint emerges at downstream put-away.</strong>
            <span>Recommended action: add one operator in the 10:00-14:00 peak window.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const scrollToHowItWorks = () => {
    const section = document.getElementById("how-it-works");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const problemCopy = marketingContent.problem.cards.map((card) => ({
    ...card,
    body:
      card.body ||
      "Teams discover this only after throughput is already unstable and recovery costs are rising."
  }));

  return (
    <div className="landing-page">
      <header className="brand-ribbon">
        <a href={leanStormingUrl} target="_blank" rel="noopener noreferrer">
          LeanStorming Operational Stress Labs
        </a>
        <span>{marketingContent.hero.poweredBy}</span>
      </header>

      <main>
        <section className="landing-hero section-shell">
          <div className="landing-hero-copy">
            <div className="brand-meta">
              {clientLogo ? <img src={clientLogo} alt={`${companyName} logo`} className="client-logo" /> : null}
              <p className="landing-powered-by">{marketingContent.hero.poweredBy}</p>
              <span className="brand-labs-tag">OSL</span>
            </div>
            <h1>{marketingContent.hero.headline}</h1>
            <p className="landing-subheadline">
              {marketingContent.hero.subheadline.replace("{{COMPANY_NAME}}", companyName)}
            </p>
            <p className="landing-supporting-copy">{marketingContent.hero.description}</p>

            <div className="landing-cta-row">
              <Link to="/sim" className="landing-btn landing-btn-primary landing-btn-launch">
                {marketingContent.hero.primaryCta}
              </Link>
              <button type="button" className="landing-btn landing-btn-secondary" onClick={scrollToHowItWorks}>
                {marketingContent.hero.secondaryCta}
              </button>
            </div>
          </div>
          <HeroMockup />
        </section>

        <section className="section-shell simulation-launch-band" aria-label="Simulation launch">
          <div>
            <p>Ready to run the operation under load?</p>
            <h2>Launch the LeanStorming Operational Stress Labs Workspace</h2>
          </div>
          <Link to="/sim" className="simulation-launch-link">
            Open /sim
          </Link>
        </section>

        <section id="problem" className="section-shell landing-section">
          <SectionIntro title={marketingContent.problem.title} body={marketingContent.problem.body} />
          <div className="landing-card-grid pain-grid">
            {problemCopy.map((card) => (
              <article key={card.title} className="landing-card pain-card">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="insights" className="section-shell landing-section landing-section-dark">
          <SectionIntro title={marketingContent.insights.title} />
          <div className="landing-insights-grid">
            <div className="insight-list-card">
              <ul>
                {marketingContent.insights.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="landing-card diagnosis-preview-card">
              <h3>Sample Operational Diagnosis</h3>
              <p>System status: overloaded under demand surge scenario.</p>
              <p>Primary constraint: put-away capacity and release synchronization.</p>
              <p>Best next action: add one operator and rebalance release timing during peak hours.</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section-shell landing-section">
          <SectionIntro title={marketingContent.howItWorks.title} />
          <div className="workflow-grid">
            {marketingContent.howItWorks.steps.map((item) => (
              <article key={item.step} className="workflow-step-card">
                <span>Step {item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="section-shell landing-section">
          <SectionIntro title={marketingContent.about.title} />
          {marketingContent.about.body.split("\n\n").map((p) => (
            <p key={p} className="about-body">
              {p}
            </p>
          ))}
        </section>
      </main>

      <footer className="landing-footer">
        <div>
          <strong>{marketingContent.footer.attribution}</strong>
          <p>{marketingContent.footer.builtFor.replace("{{COMPANY_NAME}}", companyName)}</p>
          <p>{marketingContent.footer.poweredBy}</p>
          <p className="brand-signoff">{marketingContent.footer.signoff}</p>
        </div>
        <div className="landing-footer-links">
          <a href={leanStormingUrl} target="_blank" rel="noopener noreferrer">
            {marketingContent.footer.url}
          </a>
          <Link to="/sim" className="footer-sim-link">
            Open Simulation
          </Link>
        </div>
      </footer>
    </div>
  );
}
