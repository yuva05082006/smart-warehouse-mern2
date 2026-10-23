import React from "react";

export default function ErrorState({ message }) {
  return (
    <div className="state-box state-error">
      <p className="empty-icon">⚠️</p>
      <p>{message}</p>
    </div>
  );
}
