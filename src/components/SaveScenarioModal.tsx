import { useEffect, useRef, useState } from "react";

interface SaveScenarioModalProps {
  isOpen: boolean;
  defaultName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function SaveScenarioModal({
  isOpen,
  defaultName,
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
        <h2 className="save-scenario-title">Save Current Run</h2>
        <p className="save-scenario-hint">
          Save this run to a file so you can reopen it, compare it side by side, and keep a clean record of what changed.
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
            Save Run
          </button>
        </div>
      </div>
    </dialog>
  );
}
