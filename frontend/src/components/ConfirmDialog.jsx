import React from "react";

/**
 * A reusable confirmation modal (used instead of the browser's built-in
 * confirm() so it matches the app's visual style). Render it once near
 * the top of a page and control it with { open, message } state plus
 * onConfirm/onCancel callbacks.
 */
export default function ConfirmDialog({ open, message, confirmLabel = "Confirm", onConfirm, onCancel, danger = false }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2>Please confirm</h2>
          <button type="button" className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <p style={{ marginBottom: 18 }}>{message}</p>
        <div className="form-actions">
          <button type="button" className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
