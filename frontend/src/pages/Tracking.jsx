import React, { useEffect, useRef, useState } from "react";
import * as trackingApi from "../services/trackingApi.js";
import LoadingState from "../components/LoadingState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatDate } from "../utils/format.js";

const QR_SCRIPT_URL = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";

function useQrCodeLibrary() {
  const [ready, setReady] = useState(typeof window !== "undefined" && !!window.QRCode);
  useEffect(() => {
    if (ready) return;
    const existing = document.querySelector(`script[src="${QR_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => setReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src = QR_SCRIPT_URL;
    script.onload = () => setReady(true);
    script.onerror = () => setReady(false);
    document.body.appendChild(script);
  }, [ready]);
  return ready;
}

export default function Tracking() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const qrRef = useRef(null);
  const qrReady = useQrCodeLibrary();

  useEffect(() => {
    if (result && qrReady && qrRef.current) {
      qrRef.current.innerHTML = "";
      // eslint-disable-next-line no-undef
      new window.QRCode(qrRef.current, { text: result.sku, width: 160, height: 160 });
    }
  }, [result, qrReady]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const product = await trackingApi.trackProduct(query.trim());
      setResult(product);
    } catch (err) {
      setError(`No product found for "${query}". ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header"><h1>Product Tracking &amp; QR Lookup</h1></div>

      <div className="card" style={{ marginBottom: 18 }}>
        <p className="card-sub" style={{ marginBottom: 12 }}>
          <strong>Note:</strong> Camera-based QR scanning is not implemented in this project (it needs browser camera
          permissions that can't be reliably tested in every environment). Instead, every product has a unique ID and SKU
          you can search below - the same lookup a scanned QR code would trigger. Each product's printable QR code
          (encoding its SKU) is shown once you find it.
        </p>
        <form onSubmit={handleSubmit} className="filter-bar">
          <input type="text" placeholder="Enter Product ID or SKU..." style={{ flex: 1, minWidth: 220 }} required value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="submit" className="btn btn-primary">🔍 Look Up</button>
        </form>
      </div>

      {loading && <LoadingState text="Looking up product..." />}
      {error && <ErrorState message={error} />}

      {result && (
        <div className="card">
          <div className="dashboard-grid">
            <div>
              <h2 className="section-title">{result.name}</h2>
              <p><strong>Product ID:</strong> {result.id}</p>
              <p><strong>SKU:</strong> {result.sku}</p>
              <p><strong>Category:</strong> {result.category || "-"}</p>
              <p><strong>Location:</strong> {[result.warehouseName, result.rackCode, result.binCode].filter(Boolean).join(" / ") || "Unassigned"}</p>
              <p><strong>Available Quantity:</strong> {result.availableQuantity}</p>
              <p><strong>Reserved Quantity:</strong> {result.reservedQuantity}</p>
              <p><strong>Stock Status:</strong> <StatusBadge status={result.stockStatus} /></p>
              <p><strong>Product Status:</strong> <StatusBadge status={result.status} /></p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p className="card-sub">Printable QR Code (encodes SKU)</p>
              <div ref={qrRef} style={{ display: "inline-block", padding: 10, background: "#fff", border: "1px solid #eee", borderRadius: 8 }}>
                {!qrReady && <p className="card-sub">QR library unavailable offline - SKU: {result.sku}</p>}
              </div>
            </div>
          </div>

          {result.receivingHistory?.length > 0 && (
            <>
              <h3 className="section-title" style={{ marginTop: 20 }}>Recent Receiving History</h3>
              <table>
                <thead><tr><th>Receipt #</th><th>Supplier</th><th>Quantity</th><th>Date</th></tr></thead>
                <tbody>
                  {result.receivingHistory.map((r) => (
                    <tr key={r._id}><td>{r.receiptNumber}</td><td>{r.supplier || "-"}</td><td>{r.quantity}</td><td>{formatDate(r.receivedDate)}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {result.orderHistory?.length > 0 && (
            <>
              <h3 className="section-title" style={{ marginTop: 20 }}>Recent Order History</h3>
              <table>
                <thead><tr><th>Order #</th><th>Customer</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {result.orderHistory.map((o) => (
                    <tr key={o._id}><td>{o.orderNumber}</td><td>{o.customerName}</td><td><StatusBadge status={o.status} /></td><td>{formatDate(o.createdDate)}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </>
  );
}
