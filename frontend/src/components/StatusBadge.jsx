import React from "react";
import { statusClass } from "../utils/format.js";

export default function StatusBadge({ status }) {
  if (!status) return null;
  return <span className={statusClass(status)}>{status.replace(/_/g, " ")}</span>;
}
