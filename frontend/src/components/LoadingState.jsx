import React from "react";

export default function LoadingState({ text = "Loading..." }) {
  return (
    <div className="state-box">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}
