import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./demo-access-modal.css";

interface Props {
  onClose: () => void;
}

interface FormState {
  name: string;
  email: string;
  company: string;
  role: string;
  optIn: boolean;
}

export default function DemoAccessModal({ onClose }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ name: "", email: "", company: "", role: "", optIn: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/collect-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      navigate("/sim?view=flow");
    } catch {
      setError("Unable to connect. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="dam-overlay" role="dialog" aria-modal="true" aria-labelledby="dam-title">
      <div className="dam-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="dam-panel">
        <button type="button" className="dam-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <p className="dam-eyebrow">Access the demo</p>
        <h2 id="dam-title" className="dam-title">Let's get you into the simulator</h2>
        <p className="dam-body">
          Tell us a little about yourself and we'll take you straight into the operational demo.
        </p>

        <form className="dam-form" onSubmit={handleSubmit} noValidate>
          <div className="dam-field">
            <label htmlFor="dam-name">Full name <span aria-hidden="true">*</span></label>
            <input
              id="dam-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              value={form.name}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>

          <div className="dam-field">
            <label htmlFor="dam-email">Work email <span aria-hidden="true">*</span></label>
            <input
              id="dam-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="jane@company.com"
              value={form.email}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>

          <div className="dam-field">
            <label htmlFor="dam-company">Company</label>
            <input
              id="dam-company"
              name="company"
              type="text"
              autoComplete="organization"
              placeholder="Acme Manufacturing"
              value={form.company}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="dam-field">
            <label htmlFor="dam-role">Role</label>
            <input
              id="dam-role"
              name="role"
              type="text"
              autoComplete="organization-title"
              placeholder="Operations Manager"
              value={form.role}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <label className="dam-optin">
            <input
              name="optIn"
              type="checkbox"
              checked={form.optIn}
              onChange={handleChange}
              disabled={submitting}
            />
            <span>Keep me updated with LeanStorming tips and news</span>
          </label>

          {error && <p className="dam-error" role="alert">{error}</p>}

          <button type="submit" className="ls-btn ls-btn-primary dam-submit" disabled={submitting}>
            {submitting ? "Loading..." : "See the demo"}
          </button>
        </form>
      </div>
    </div>
  );
}
