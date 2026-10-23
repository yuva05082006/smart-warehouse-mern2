import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as inventoryApi from "../services/inventoryApi.js";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await inventoryApi.listInventory());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return items.filter((p) => {
      const matchesKeyword = !kw ||
        (p.name && p.name.toLowerCase().includes(kw)) ||
        (p.sku && p.sku.toLowerCase().includes(kw)) ||
        (p.category && p.category.toLowerCase().includes(kw));
      const matchesStatus = !statusFilter || p.stockStatus === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [items, keyword, statusFilter]);

  return (
    <>
      <div className="page-header">
        <h1>Inventory Management</h1>
        <button className="btn btn-secondary btn-small" onClick={load}>🔄 Refresh</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filter-bar">
          <input type="text" placeholder="Filter by name, SKU or category..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="OVERSTOCK">Overstock</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <LoadingState text="Loading inventory..." />
          ) : error ? (
            <ErrorState message={error} />
          ) : filtered.length === 0 ? (
            <EmptyState text="No inventory records match your filters." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>SKU</th><th>Category</th><th>Warehouse</th><th>Rack</th><th>Bin</th>
                  <th>Available</th><th>Reserved</th><th>Reorder Level</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.productId}>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>{p.category || "-"}</td>
                    <td>{p.warehouseName || "-"}</td>
                    <td>{p.rackCode || "-"}</td>
                    <td>{p.binCode || "-"}</td>
                    <td>{p.availableQuantity}</td>
                    <td>{p.reservedQuantity}</td>
                    <td>{p.reorderLevel}</td>
                    <td><StatusBadge status={p.stockStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
