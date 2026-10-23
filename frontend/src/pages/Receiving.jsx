import React, { useCallback, useEffect, useState } from "react";
import * as receivingApi from "../services/receivingApi.js";
import * as productApi from "../services/productApi.js";
import * as binApi from "../services/binApi.js";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { useToast } from "../hooks/useToast.js";
import { formatDate } from "../utils/format.js";

const EMPTY_FORM = { productId: "", supplier: "", quantity: "", binId: "", notes: "" };

export default function Receiving() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [bins, setBins] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, b, r] = await Promise.all([productApi.listProducts(), binApi.listBins(), receivingApi.listReceipts()]);
      setProducts(p);
      setBins(b);
      setReceipts(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await receivingApi.createReceipt({
        productId: form.productId,
        supplier: form.supplier.trim(),
        quantity: Number(form.quantity),
        binId: form.binId || null,
        notes: form.notes.trim(),
      });
      toast("Stock received and inventory updated.");
      setForm(EMPTY_FORM);
      loadAll();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header"><h1>Stock Receiving</h1></div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2 className="section-title">Receive New Stock</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Product *</label>
              <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                <option value="">-- Select Product --</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Supplier</label>
              <input type="text" placeholder="e.g. Acme Distributors" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" min="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Receive Into Bin (optional - defaults to product's current bin)</label>
              <select value={form.binId} onChange={(e) => setForm({ ...form, binId: e.target.value })}>
                <option value="">-- Use product's assigned bin --</option>
                {bins.map((b) => <option key={b._id} value={b._id}>{b.code} (Rack {b.rack?.code})</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Notes</label>
            <textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>📥 Record Receipt</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="page-header" style={{ marginBottom: 10 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Receiving History</h2>
          <button className="btn btn-secondary btn-small" onClick={loadAll}>🔄 Refresh</button>
        </div>
        <div className="table-wrap">
          {loading ? (
            <LoadingState text="Loading receipts..." />
          ) : error ? (
            <ErrorState message={error} />
          ) : receipts.length === 0 ? (
            <EmptyState text="No stock has been received yet." />
          ) : (
            <table>
              <thead>
                <tr><th>Receipt #</th><th>Product</th><th>Supplier</th><th>Quantity</th><th>Warehouse / Rack / Bin</th><th>Date</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {receipts.slice().reverse().map((r) => {
                  const loc = [r.warehouse?.name, r.rack?.code, r.bin?.code].filter(Boolean).join(" / ") || "-";
                  return (
                    <tr key={r._id}>
                      <td>{r.receiptNumber}</td>
                      <td>{r.product?.name} ({r.product?.sku})</td>
                      <td>{r.supplier || "-"}</td>
                      <td>{r.quantity}</td>
                      <td>{loc}</td>
                      <td>{formatDate(r.receivedDate)}</td>
                      <td>{r.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
