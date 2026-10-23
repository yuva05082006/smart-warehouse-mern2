import React, { useCallback, useEffect, useState } from "react";
import * as orderApi from "../services/orderApi.js";
import * as productApi from "../services/productApi.js";
import * as pickingApi from "../services/pickingApi.js";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Modal from "../components/Modal.jsx";
import { useToast } from "../hooks/useToast.js";
import { useConfirm } from "../hooks/useConfirm.jsx";
import { formatDate } from "../utils/format.js";

const STATUS_FLOW = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  PICKING: [],
  PICKED: ["READY_FOR_DISPATCH"],
  READY_FOR_DISPATCH: [],
  DISPATCHED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export default function Orders() {
  const toast = useToast();
  const [confirm, ConfirmModal] = useConfirm();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [items, setItems] = useState([{ productId: "", quantity: 1 }]);

  const [viewOrder, setViewOrder] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      setOrders(await orderApi.listOrders(params));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { productApi.listProducts().then(setProducts).catch(() => {}); }, []);

  const openCreateModal = () => {
    setCustomerName("");
    setCustomerContact("");
    setItems([{ productId: "", quantity: 1 }]);
    setCreateOpen(true);
  };

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast("Add at least one order item.", "error");
      return;
    }
    try {
      await orderApi.createOrder({
        customerName: customerName.trim(),
        customerContact: customerContact.trim(),
        items: items.map((it) => ({ productId: it.productId, quantity: Number(it.quantity) })),
      });
      toast("Order created and stock reserved.");
      setCreateOpen(false);
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    if (newStatus === "CANCELLED") {
      const ok = await confirm("Cancel this order? Reserved stock will be released back to available.", { danger: true });
      if (!ok) return;
    }
    try {
      await orderApi.updateOrderStatus(order._id, newStatus);
      toast(`Order status updated to ${newStatus.replace(/_/g, " ")}.`);
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleStartPicking = async (order) => {
    const ok = await confirm("Start picking for this order? Picking tasks will be created for every item.");
    if (!ok) return;
    try {
      await pickingApi.startPicking(order._id);
      toast("Picking started. Go to the Picking page to record picks.");
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Order Management</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>+ Create Order</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filter-bar">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {Object.keys(STATUS_FLOW).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <button className="btn btn-secondary btn-small" onClick={load}>🔄 Refresh</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <LoadingState text="Loading orders..." />
          ) : error ? (
            <ErrorState message={error} />
          ) : orders.length === 0 ? (
            <EmptyState text="No orders found." />
          ) : (
            <table>
              <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.slice().reverse().map((o) => {
                  const nextStatuses = STATUS_FLOW[o.status] || [];
                  const canPick = o.status === "PENDING" || o.status === "CONFIRMED";
                  return (
                    <tr key={o._id}>
                      <td>{o.orderNumber}</td>
                      <td>{o.customerName}</td>
                      <td>{o.items.length} item(s)</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td>{formatDate(o.createdDate)}</td>
                      <td className="row-actions">
                        <button className="btn btn-secondary btn-small" onClick={() => setViewOrder(o)}>View</button>
                        {canPick && <button className="btn btn-primary btn-small" onClick={() => handleStartPicking(o)}>Start Picking</button>}
                        {nextStatuses.map((s) => (
                          <button key={s} className={`btn btn-small ${s === "CANCELLED" ? "btn-danger" : "btn-secondary"}`} onClick={() => handleStatusChange(o, s)}>
                            {s.replace(/_/g, " ")}
                          </button>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={createOpen} title="Create Order" onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="form-group"><label>Customer Name *</label><input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
            <div className="form-group"><label>Customer Contact</label><input type="text" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} /></div>
          </div>
          <h3 className="section-title" style={{ marginTop: 16 }}>Order Items</h3>
          {items.map((it, idx) => (
            <div className="form-grid" key={idx} style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label>Product</label>
                <select value={it.productId} onChange={(e) => updateItem(idx, "productId", e.target.value)}>
                  <option value="">-- Select --</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) - {p.availableQuantity} available</option>)}
                </select>
              </div>
              <div className="form-group"><label>Quantity</label><input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} /></div>
              <div className="form-group">
                <label>&nbsp;</label>
                <button type="button" className="btn btn-danger btn-small" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-small" style={{ marginTop: 8 }} onClick={() => setItems((prev) => [...prev, { productId: "", quantity: 1 }])}>+ Add Item</button>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Create Order</button>
            <button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewOrder} title="Order Details" onClose={() => setViewOrder(null)}>
        {viewOrder && (
          <div>
            <p><strong>Order #:</strong> {viewOrder.orderNumber}</p>
            <p><strong>Customer:</strong> {viewOrder.customerName}{viewOrder.customerContact ? ` (${viewOrder.customerContact})` : ""}</p>
            <p><strong>Status:</strong> <StatusBadge status={viewOrder.status} /></p>
            <p><strong>Created:</strong> {formatDate(viewOrder.createdDate)}</p>
            <h3 className="section-title" style={{ marginTop: 14 }}>Items</h3>
            <table>
              <thead><tr><th>Product</th><th>Ordered</th><th>Picked</th></tr></thead>
              <tbody>
                {viewOrder.items.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.product?.name} ({it.product?.sku})</td>
                    <td>{it.quantity}</td>
                    <td>{it.pickedQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {ConfirmModal}
    </>
  );
}
