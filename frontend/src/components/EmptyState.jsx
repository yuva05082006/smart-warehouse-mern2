import React from "react";

export default function EmptyState({ text = "No records found." }) {
  return (
    <div className="state-box">
      <p className="empty-icon">🗂️</p>
      <p>{text}</p>
    </div>
  );
}
