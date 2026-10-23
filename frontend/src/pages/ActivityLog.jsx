import React, { useCallback, useEffect, useState } from "react";
import * as activityApi from "../services/activityApi.js";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { formatDate } from "../utils/format.js";

const MODULES = ["PRODUCT", "WAREHOUSE", "RACK", "BIN", "RECEIVING", "ORDER", "PICKING", "DISPATCH"];

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [usernameFilter, setUsernameFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (moduleFilter) params.module = moduleFilter;
      if (usernameFilter) params.username = usernameFilter;
      setLogs(await activityApi.listActivityLogs(params));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, usernameFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="page-header"><h1>Activity / Audit Log</h1></div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filter-bar">
          <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <option value="">All Modules</option>
            {MODULES.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
          </select>
          <input type="text" placeholder="Filter by username..." value={usernameFilter} onChange={(e) => setUsernameFilter(e.target.value)} />
          <button className="btn btn-secondary btn-small" onClick={load}>Apply</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <LoadingState text="Loading activity log..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : logs.length === 0 ? (
          <EmptyState text="No activity found for these filters." />
        ) : (
          logs.map((a) => (
            <div className="list-item" key={a._id}>
              <strong>{a.action}</strong> · {a.module} — {a.description}
              <div className="meta">{a.username} · {formatDate(a.timestamp)}{a.relatedRecord ? ` · ${a.relatedRecord}` : ""}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
