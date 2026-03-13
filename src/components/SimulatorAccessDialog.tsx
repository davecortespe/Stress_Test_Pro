import { useEffect, useRef, useState } from "react";
import { validateSimulatorAccessCode } from "../lib/simulatorAccess";

interface SimulatorAccessDialogProps {
  title?: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onValidated: () => void;
  onCancel?: () => void;
}

export function SimulatorAccessDialog({
  title = "Enter Access Code",
  body = 'Enter the access code to open the simulation. The code is required once and will be remembered on this browser.',
  confirmLabel = "Enter Simulation",
  cancelLabel = "Cancel",
  onValidated,
  onCancel
}: SimulatorAccessDialogProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="access-gate-backdrop" role="presentation">
      <div className="access-gate-card" role="dialog" aria-modal="true" aria-labelledby="access-gate-title">
        <p className="access-gate-eyebrow">Simulation Access</p>
        <h2 id="access-gate-title">{title}</h2>
        <p className="access-gate-copy">{body}</p>

        <form
          className="access-gate-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (validateSimulatorAccessCode(code)) {
              setError("");
              onValidated();
              return;
            }
            setError('Code not recognized. Enter "LEAN" to continue.');
          }}
        >
          <label className="access-gate-label" htmlFor="sim-access-code">
            Access code
          </label>
          <input
            id="sim-access-code"
            ref={inputRef}
            className="access-gate-input"
            type="text"
            value={code}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={16}
            onChange={(event) => {
              setCode(event.target.value);
              if (error) {
                setError("");
              }
            }}
            placeholder="Enter code"
          />
          {error ? <p className="access-gate-error">{error}</p> : null}

          <div className="access-gate-actions">
            {onCancel ? (
              <button
                type="button"
                className="access-gate-btn access-gate-btn-secondary"
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
            ) : null}
            <button type="submit" className="access-gate-btn access-gate-btn-primary">
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
