import React, { useCallback, useEffect, useState } from "react";
import * as dashboardApi from "../services/dashboardApi.js";
import LoadingState from "../components/LoadingState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { formatDate } from "../utils/format.js";

function StatCard({ label, value, icon }) {
  return (
    <div className="card">
      <p className="card-title">{icon} {label}</p>
      <p className="card-value">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardApi.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState text="Loading dashboard..." />;
  if (error) return <ErrorState message={error} />;
  if (!summary) return null;

  const occupancyPct = summary.totalWarehouseCapacity > 0
    ? Math.round((summary.totalWarehouseOccupied / summary.totalWarehouseCapacity) * 100)
    : 0;
  const occClass = occupancyPct >= 90 ? "danger" : occupancyPct >= 70 ? "warn" : "";

  return (
    <>
      <div className="page-header">
        <h1>Warehouse Dashboard</h1>
        <button className="btn btn-secondary btn-small" onClick={load}>🔄 Refresh</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Products" value={summary.totalProducts} icon="📦" />
        <StatCard label="Total Inventory Units" value={summary.totalInventoryUnits} icon="🗃️" />
        <StatCard label="Low Stock" value={summary.lowStockCount} icon="⚠️" />
        <StatCard label="Out of Stock" value={summary.outOfStockCount} icon="🚫" />
        <StatCard label="Pending Orders" value={summary.pendingOrders} icon="🧾" />
        <StatCard label="Orders Being Picked" value={summary.pickingOrders} icon="🧺" />
        <StatCard label="Ready for Dispatch" value={summary.readyForDispatchOrders} icon="🚚" />
        <div className="card">
          <p className="card-title">Warehouse Capacity</p>
          <p className="card-value">{occupancyPct}%</p>
          <div className="capacity-bar"><div className={`capacity-bar-fill ${occClass}`} style={{ width: `${occupancyPct}%` }} /></div>
          <p className="card-sub">{summary.totalWarehouseOccupied} / {summary.totalWarehouseCapacity} units used</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="section-title">Recent Activity</h2>
          {summary.recentActivities?.length ? (
            summary.recentActivities.map((a) => (
              <div className="list-item" key={a._id}>
                <strong>{a.action}</strong> — {a.description}
                <div className="meta">{a.username} · {a.module} · {formatDate(a.timestamp)}</div>
              </div>
            ))
          ) : (
            <EmptyState text="No activity recorded yet." />
          )}
        </div>
        <div className="card">
          <h2 className="section-title">Stock Alerts</h2>
          {summary.alerts?.length ? (
            summary.alerts.slice(0, 8).map((a) => (
              <div className={`list-item alert-item ${a.alertType}`} key={a.productId}>
                <strong>{a.productName}</strong> ({a.sku})
                <div className="meta">{a.message}</div>
              </div>
            ))
          ) : (
            <EmptyState text="No active stock alerts. Everything looks healthy." />
          )}
        </div>
      </div>
    </>
  );
}
