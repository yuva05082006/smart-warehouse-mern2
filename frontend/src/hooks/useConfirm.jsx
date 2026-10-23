import React, { useCallback, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

/**
 * Promise-based confirmation dialog hook.
 * Usage:
 *   const [confirm, ConfirmModal] = useConfirm();
 *   ...
 *   if (await confirm("Delete this product?")) { ... }
 *   ...
 *   return <>{ConfirmModal}...</>;
 */
export function useConfirm() {
  const [state, setState] = useState({ open: false, message: "", danger: false });
  const resolver = useRef(null);

  const confirm = useCallback((message, { danger = false } = {}) => {
    setState({ open: true, message, danger });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setState((s) => ({ ...s, open: false }));
    resolver.current?.(true);
  };

  const handleCancel = () => {
    setState((s) => ({ ...s, open: false }));
    resolver.current?.(false);
  };

  const ConfirmModal = (
    <ConfirmDialog
      open={state.open}
      message={state.message}
      danger={state.danger}
      confirmLabel={state.danger ? "Delete" : "Confirm"}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return [confirm, ConfirmModal];
}
