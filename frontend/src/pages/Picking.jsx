import React, { useEffect, useState } from "react";
import * as orderApi from "../services/orderApi.js";
import * as pickingApi from "../services/pickingApi.js";
import LoadingState from "../components/LoadingState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useToast } from "../hooks/useToast.js";

export default function Picking() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qtyInputs, setQtyInputs] = useState({});

  useEffect(() => {
    orderApi.listOrders().then((all) => {
      setOrders(all.filter((o) => ["PENDING", "CONFIRMED", "PICKING", "PICKED"].includes(o.status)));
    }).catch(() => {});
  }, []);

  const loadTasks = async (id) => {
    if (!id) {
      setTasks(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await pickingApi.listPickingTasks(id);
      setTasks(data);
      const defaults = {};
      data.forEach((t) => { defaults[t._id] = Math.min(1, t.requiredQuantity - t.pickedQuantity); });
      setQtyInputs(defaults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (id) => {
    setOrderId(id);
    loadTasks(id);
  };

  const handleStartPicking = async () => {
    try {
      await pickingApi.startPicking(orderId);
      toast("Picking started.");
      loadTasks(orderId);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handlePick = async (taskId) => {
    const quantity = Number(qtyInputs[taskId]);
    if (!quantity || quantity < 1) {
      toast("Enter a valid quantity to pick.", "error");
      return;
    }
    try {
      await pickingApi.recordPick(taskId, quantity);
      toast(`Picked ${quantity} unit(s).`);
      loadTasks(orderId);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <>
      <div className="page-header"><h1>Picking Management</h1></div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filter-bar">
          <select value={orderId} onChange={(e) => handleOrderChange(e.target.value)}>
            <option value="">-- Select an Order --</option>
            {orders.map((o) => <option key={o._id} value={o._id}>{o.orderNumber} - {o.customerName} [{o.status}]</option>)}
          </select>
          <button className="btn btn-secondary btn-small" onClick={() => loadTasks(orderId)}>Load Picking Tasks</button>
        </div>
        <p className="card-sub">Only orders with status PENDING/CONFIRMED can start picking (do that from the Orders page), or PICKING orders already have tasks here.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          {!orderId ? (
            <div className="state-box"><p className="empty-icon">🧺</p><p>Select an order above to view its picking tasks.</p></div>
          ) : loading ? (
            <LoadingState text="Loading picking tasks..." />
          ) : error ? (
            <ErrorState message={error} />
          ) : tasks && tasks.length === 0 ? (
            <div className="state-box">
              <p>No picking tasks yet for this order.</p>
              <button className="btn btn-primary" onClick={handleStartPicking}>Start Picking</button>
            </div>
          ) : tasks ? (
            <table>
              <thead><tr><th>Pick Instruction</th><th>Required</th><th>Picked</th><th>Status</th><th>Record Pick</th></tr></thead>
              <tbody>
                {tasks.map((t) => {
                  const remaining = t.requiredQuantity - t.pickedQuantity;
                  const disabled = t.status === "COMPLETED";
                  return (
                    <tr key={t._id}>
                      <td><span className="pick-instruction">{t.pickInstruction}</span></td>
                      <td>{t.requiredQuantity}</td>
                      <td>{t.pickedQuantity}</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td className="row-actions">
                        <input
                          type="number" min="1" max={remaining} style={{ width: 70 }}
                          value={qtyInputs[t._id] ?? Math.min(1, remaining)}
                          disabled={disabled}
                          onChange={(e) => setQtyInputs({ ...qtyInputs, [t._id]: e.target.value })}
                        />
                        <button className="btn btn-primary btn-small" disabled={disabled} onClick={() => handlePick(t._id)}>Pick</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </>
  );
}
