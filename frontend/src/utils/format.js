export function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function statusClass(status) {
  if (!status) return "";
  return "badge badge-" + status.toLowerCase().replace(/_/g, "-");
}
