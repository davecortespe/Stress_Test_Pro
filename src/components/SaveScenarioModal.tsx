import { useEffect, useRef, useState } from "react";

interface SaveScenarioModalProps {
  isOpen: boolean;
  defaultName: string;
  libraryName?: string | null;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function SaveScenarioModal({
  isOpen,
  defaultName,
  libraryName,
  onConfirm,
  onCancel
}: SaveScenarioModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      setName(defaultName);
      dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen, defaultName]);

  const handleConfirm = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onConfirm(trimmedName);
  };

  return (
    <dialog
      ref={dialogRef}
      className="save-scenario-dialog"
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
    >
      <div className="save-scenario-content">
        <h2 className="save-scenario-title">Save Scenario to Library</h2>
        <p className="save-scenario-hint">
          Save this run so you can reopen it, compare it side by side, and keep a clean record of what changed.
        </p>
        <p className="save-scenario-target">
          {libraryName
            ? `Saving into ${libraryName}.`
            : "Your first save creates a scenario library CSV you can reopen later."}
        </p>

        <div className="save-scenario-field">
          <label htmlFor="scenario-name-input">Scenario name</label>
          <input
            id="scenario-name-input"
            type="text"
            value={name}
            maxLength={40}
            autoFocus
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleConfirm();
            }}
            placeholder="e.g. Baseline, +1 relief unit"
          />
          <span className="save-scenario-char-count">{name.length}/40</span>
        </div>

        <div className="save-scenario-actions">
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={handleConfirm} disabled={!name.trim()}>
            Save to Library
          </button>
        </div>
      </div>
    </dialog>
  );
}
