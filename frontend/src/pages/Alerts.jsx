import React, { useCallback, useEffect, useState } from "react";
import * as alertApi from "../services/alertApi.js";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAlerts(await alertApi.listAlerts());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="page-header">
        <h1>Smart Stock Alerts</h1>
        <button className="btn btn-secondary btn-small" onClick={load}>🔄 Refresh</button>
      </div>
      <p className="card-sub" style={{ marginBottom: 16 }}>Computed live from current database quantities vs. each product's reorder level.</p>

      {loading ? (
        <LoadingState text="Loading alerts..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : alerts.length === 0 ? (
        <div className="card"><EmptyState text="No active alerts. All stock levels look healthy." /></div>
      ) : (
        <div className="card">
          {alerts.map((a) => (
            <div className={`list-item alert-item ${a.alertType}`} key={a.productId}>
              <strong>{a.productName}</strong> ({a.sku}) <StatusBadge status={a.alertType} />
              <div className="meta">{a.message}</div>
              <div className="meta">Available: {a.availableQuantity} &nbsp;|&nbsp; Reorder Level: {a.reorderLevel}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
