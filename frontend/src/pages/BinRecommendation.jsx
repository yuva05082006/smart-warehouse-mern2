import React, { useEffect, useState } from "react";
import * as warehouseApi from "../services/warehouseApi.js";
import * as binRecommendationApi from "../services/binRecommendationApi.js";
import LoadingState from "../components/LoadingState.jsx";
import ErrorState from "../components/ErrorState.jsx";

export default function BinRecommendation() {
  const [warehouses, setWarehouses] = useState([]);
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    warehouseApi.listWarehouses().then(setWarehouses).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params = { quantity };
      if (category) params.category = category;
      if (warehouseId) params.warehouseId = warehouseId;
      const rec = await binRecommendationApi.getBinRecommendation(params);
      setResult(rec);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header"><h1>Smart Bin Recommendation</h1></div>

      <div className="card" style={{ marginBottom: 18 }}>
        <p className="card-sub" style={{ marginBottom: 14 }}>
          This is a simple, <strong>rule-based</strong> recommendation (not machine learning / AI).
          It picks the best available bin using free capacity, product category affinity, and best-fit sizing - and explains why.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Product Category</label>
              <input type="text" placeholder="e.g. Electronics (optional)" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Quantity Needed *</label>
              <input type="number" min="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Restrict to Warehouse (optional)</label>
              <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                <option value="">-- Any Warehouse --</option>
                {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">🧠 Get Recommendation</button>
          </div>
        </form>
      </div>

      {loading && <LoadingState text="Calculating best-fit bin..." />}
      {error && <ErrorState message={error} />}
      {result && (
        <div className="card">
          <h2 className="section-title">✅ Recommended Location</h2>
          <div className="pick-instruction">{result.warehouseName} &rarr; {result.rackCode} &rarr; {result.binCode}</div>
          <p style={{ marginTop: 14 }}><strong>Remaining capacity after this placement:</strong> {result.remainingCapacity} unit(s)</p>
          <p><strong>Why this bin:</strong> {result.reason}</p>
        </div>
      )}
    </>
  );
}
