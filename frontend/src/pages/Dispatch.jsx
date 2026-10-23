import React, { useCallback, useEffect, useState } from "react";
import * as orderApi from "../services/orderApi.js";
import * as dispatchApi from "../services/dispatchApi.js";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useToast } from "../hooks/useToast.js";
import { formatDate } from "../utils/format.js";

export default function Dispatch() {
  const toast = useToast();
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [orderId, setOrderId] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [orders, dList] = await Promise.all([orderApi.listOrders(), dispatchApi.listDispatches()]);
      setEligibleOrders(orders.filter((o) => o.status === "PICKED" || o.status === "READY_FOR_DISPATCH"));
      setDispatches(dList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId) {
      toast("Select an order to dispatch.", "error");
      return;
    }
    try {
      await dispatchApi.createDispatch({ orderId, carrier: carrier.trim(), trackingNumber: trackingNumber.trim(), notes: notes.trim() });
      toast("Order dispatched successfully.");
      setOrderId(""); setCarrier(""); setTrackingNumber(""); setNotes("");
      loadAll();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <>
      <div className="page-header"><h1>Dispatch Management</h1></div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2 className="section-title">Dispatch an Order</h2>
        <p className="card-sub" style={{ marginBottom: 12 }}>
          Only orders that are PICKED or READY FOR DISPATCH can be dispatched. Inventory was already deducted during picking,
          so dispatch will not deduct it again.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Order *</label>
              <select required value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                <option value="">{eligibleOrders.length === 0 ? "No orders ready to dispatch" : "-- Select Order --"}</option>
                {eligibleOrders.map((o) => <option key={o._id} value={o._id}>{o.orderNumber} - {o.customerName}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Carrier</label><input type="text" placeholder="e.g. BlueDart" value={carrier} onChange={(e) => setCarrier(e.target.value)} /></div>
            <div className="form-group"><label>Tracking Number</label><input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} /></div>
            <div className="form-group"><label>Notes</label><input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">🚚 Dispatch Order</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="page-header" style={{ marginBottom: 10 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Dispatch History</h2>
          <button className="btn btn-secondary btn-small" onClick={loadAll}>🔄 Refresh</button>
        </div>
        <div className="table-wrap">
          {loading ? (
            <LoadingState text="Loading dispatch history..." />
          ) : error ? (
            <ErrorState message={error} />
          ) : dispatches.length === 0 ? (
            <EmptyState text="No dispatches recorded yet." />
          ) : (
            <table>
              <thead><tr><th>Dispatch #</th><th>Order</th><th>Customer</th><th>Carrier</th><th>Tracking #</th><th>Status</th><th>Date</th><th>Notes</th></tr></thead>
              <tbody>
                {dispatches.slice().reverse().map((d) => (
                  <tr key={d._id}>
                    <td>{d.dispatchNumber}</td>
                    <td>{d.order?.orderNumber}</td>
                    <td>{d.order?.customerName}</td>
                    <td>{d.carrier || "-"}</td>
                    <td>{d.trackingNumber || "-"}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>{formatDate(d.dispatchDate)}</td>
                    <td>{d.notes || "-"}</td>
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
