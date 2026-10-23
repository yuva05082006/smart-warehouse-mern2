import React, { useCallback, useEffect, useState } from "react";
import * as warehouseApi from "../services/warehouseApi.js";
import * as rackApi from "../services/rackApi.js";
import * as binApi from "../services/binApi.js";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import Modal from "../components/Modal.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useConfirm } from "../hooks/useConfirm.jsx";

function CapacityCell({ occupied, capacity }) {
  const pct = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
  const cls = pct >= 90 ? "danger" : pct >= 70 ? "warn" : "";
  return (
    <div style={{ minWidth: 140 }}>
      {occupied} used ({pct}%)
      <div className="capacity-bar"><div className={`capacity-bar-fill ${cls}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function Warehouses() {
  const { isManager } = useAuth();
  const toast = useToast();
  const [confirm, ConfirmModal] = useConfirm();
  const [tab, setTab] = useState("warehouses");

  const [warehouses, setWarehouses] = useState([]);
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState([]);
  const [capacities, setCapacities] = useState({}); // id -> {occupied, capacity}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [whModal, setWhModal] = useState({ open: false, form: null });
  const [rkModal, setRkModal] = useState({ open: false, form: null });
  const [bnModal, setBnModal] = useState({ open: false, form: null });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [w, r, b] = await Promise.all([warehouseApi.listWarehouses(), rackApi.listRacks(), binApi.listBins()]);
      setWarehouses(w);
      setRacks(r);
      setBins(b);

      const capEntries = await Promise.all([
        ...w.map(async (x) => [`w-${x._id}`, await warehouseApi.getWarehouseCapacity(x._id).catch(() => ({ occupied: 0 }))]),
        ...r.map(async (x) => [`r-${x._id}`, await rackApi.getRackCapacity(x._id).catch(() => ({ occupied: 0 }))]),
        ...b.map(async (x) => [`b-${x._id}`, await binApi.getBinCapacity(x._id).catch(() => ({ occupied: 0 }))]),
      ]);
      setCapacities(Object.fromEntries(capEntries));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ---------- Warehouse CRUD ----------
  const saveWarehouse = async (e) => {
    e.preventDefault();
    const { id, name, location, totalCapacity } = whModal.form;
    try {
      if (id) {
        await warehouseApi.updateWarehouse(id, { name, location, totalCapacity: Number(totalCapacity) });
        toast("Warehouse updated.");
      } else {
        await warehouseApi.createWarehouse({ name, location, totalCapacity: Number(totalCapacity) });
        toast("Warehouse created.");
      }
      setWhModal({ open: false, form: null });
      loadAll();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const deleteWarehouse = async (w) => {
    const ok = await confirm(`Delete warehouse "${w.name}"?`, { danger: true });
    if (!ok) return;
    try {
      await warehouseApi.deleteWarehouse(w._id);
      toast("Warehouse deleted.");
      loadAll();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  // ---------- Rack CRUD ----------
  const saveRack = async (e) => {
    e.preventDefault();
    const { id, warehouseId, code, capacity } = rkModal.form;
    try {
      if (id) {
        await rackApi.updateRack(id, { warehouseId, code, capacity: Number(capacity) });
        toast("Rack updated.");
      } else {
        await rackApi.createRack({ warehouseId, code, capacity: Number(capacity) });
        toast("Rack created.");
      }
      setRkModal({ open: false, form: null });
      loadAll();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const deleteRack = async (r) => {
    const ok = await confirm(`Delete rack "${r.code}"?`, { danger: true });
    if (!ok) return;
    try {
      await rackApi.deleteRack(r._id);
      toast("Rack deleted.");
      loadAll();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  // ---------- Bin CRUD ----------
  const saveBin = async (e) => {
    e.preventDefault();
    const { id, rackId, code, capacity } = bnModal.form;
    try {
      if (id) {
        await binApi.updateBin(id, { rackId, code, capacity: Number(capacity) });
        toast("Bin updated.");
      } else {
        await binApi.createBin({ rackId, code, capacity: Number(capacity) });
        toast("Bin created.");
      }
      setBnModal({ open: false, form: null });
      loadAll();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const deleteBin = async (b) => {
    const ok = await confirm(`Delete bin "${b.code}"?`, { danger: true });
    if (!ok) return;
    try {
      await binApi.deleteBin(b._id);
      toast("Bin deleted.");
      loadAll();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <>
      <div className="page-header"><h1>Warehouses, Racks &amp; Bins</h1></div>

      <div className="tabs">
        <button className={`tab-btn${tab === "warehouses" ? " active" : ""}`} onClick={() => setTab("warehouses")}>Warehouses</button>
        <button className={`tab-btn${tab === "racks" ? " active" : ""}`} onClick={() => setTab("racks")}>Racks</button>
        <button className={`tab-btn${tab === "bins" ? " active" : ""}`} onClick={() => setTab("bins")}>Bins</button>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
        <>
          {tab === "warehouses" && (
            <div className="tab-panel active">
              {isManager && (
                <div className="page-header">
                  <div />
                  <button className="btn btn-primary btn-small" onClick={() => setWhModal({ open: true, form: { id: null, name: "", location: "", totalCapacity: "" } })}>+ Add Warehouse</button>
                </div>
              )}
              <div className="card">
                <div className="table-wrap">
                  {warehouses.length === 0 ? <EmptyState text="No warehouses yet." /> : (
                    <table>
                      <thead><tr><th>Name</th><th>Location</th><th>Capacity</th><th>Occupancy</th>{isManager && <th>Actions</th>}</tr></thead>
                      <tbody>
                        {warehouses.map((w) => (
                          <tr key={w._id}>
                            <td>{w.name}</td>
                            <td>{w.location || "-"}</td>
                            <td>{w.totalCapacity}</td>
                            <td><CapacityCell occupied={capacities[`w-${w._id}`]?.occupied || 0} capacity={w.totalCapacity} /></td>
                            {isManager && (
                              <td className="row-actions">
                                <button className="btn btn-secondary btn-small" onClick={() => setWhModal({ open: true, form: { id: w._id, name: w.name, location: w.location, totalCapacity: w.totalCapacity } })}>Edit</button>
                                <button className="btn btn-danger btn-small" onClick={() => deleteWarehouse(w)}>Delete</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "racks" && (
            <div className="tab-panel active">
              {isManager && (
                <div className="page-header">
                  <div />
                  <button className="btn btn-primary btn-small" onClick={() => setRkModal({ open: true, form: { id: null, warehouseId: warehouses[0]?._id || "", code: "", capacity: "" } })}>+ Add Rack</button>
                </div>
              )}
              <div className="card">
                <div className="table-wrap">
                  {racks.length === 0 ? <EmptyState text="No racks yet." /> : (
                    <table>
                      <thead><tr><th>Code</th><th>Warehouse</th><th>Capacity</th><th>Occupied</th>{isManager && <th>Actions</th>}</tr></thead>
                      <tbody>
                        {racks.map((r) => (
                          <tr key={r._id}>
                            <td>{r.code}</td>
                            <td>{r.warehouse?.name}</td>
                            <td>{r.capacity}</td>
                            <td>{capacities[`r-${r._id}`]?.occupied || 0}</td>
                            {isManager && (
                              <td className="row-actions">
                                <button className="btn btn-secondary btn-small" onClick={() => setRkModal({ open: true, form: { id: r._id, warehouseId: r.warehouse?._id, code: r.code, capacity: r.capacity } })}>Edit</button>
                                <button className="btn btn-danger btn-small" onClick={() => deleteRack(r)}>Delete</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "bins" && (
            <div className="tab-panel active">
              {isManager && (
                <div className="page-header">
                  <div />
                  <button className="btn btn-primary btn-small" onClick={() => setBnModal({ open: true, form: { id: null, rackId: racks[0]?._id || "", code: "", capacity: "" } })}>+ Add Bin</button>
                </div>
              )}
              <div className="card">
                <div className="table-wrap">
                  {bins.length === 0 ? <EmptyState text="No bins yet." /> : (
                    <table>
                      <thead><tr><th>Code</th><th>Rack</th><th>Warehouse</th><th>Capacity</th><th>Occupied</th>{isManager && <th>Actions</th>}</tr></thead>
                      <tbody>
                        {bins.map((b) => (
                          <tr key={b._id}>
                            <td>{b.code}</td>
                            <td>{b.rack?.code}</td>
                            <td>{b.rack?.warehouse?.name}</td>
                            <td>{b.capacity}</td>
                            <td>{capacities[`b-${b._id}`]?.occupied || 0}</td>
                            {isManager && (
                              <td className="row-actions">
                                <button className="btn btn-secondary btn-small" onClick={() => setBnModal({ open: true, form: { id: b._id, rackId: b.rack?._id, code: b.code, capacity: b.capacity } })}>Edit</button>
                                <button className="btn btn-danger btn-small" onClick={() => deleteBin(b)}>Delete</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Warehouse modal */}
      <Modal open={whModal.open} title={whModal.form?.id ? "Edit Warehouse" : "Add Warehouse"} onClose={() => setWhModal({ open: false, form: null })}>
        {whModal.form && (
          <form onSubmit={saveWarehouse}>
            <div className="form-grid">
              <div className="form-group"><label>Name *</label><input type="text" required value={whModal.form.name} onChange={(e) => setWhModal({ ...whModal, form: { ...whModal.form, name: e.target.value } })} /></div>
              <div className="form-group"><label>Location</label><input type="text" value={whModal.form.location || ""} onChange={(e) => setWhModal({ ...whModal, form: { ...whModal.form, location: e.target.value } })} /></div>
              <div className="form-group"><label>Total Capacity (units) *</label><input type="number" min="1" required value={whModal.form.totalCapacity} onChange={(e) => setWhModal({ ...whModal, form: { ...whModal.form, totalCapacity: e.target.value } })} /></div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setWhModal({ open: false, form: null })}>Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Rack modal */}
      <Modal open={rkModal.open} title={rkModal.form?.id ? "Edit Rack" : "Add Rack"} onClose={() => setRkModal({ open: false, form: null })}>
        {rkModal.form && (
          <form onSubmit={saveRack}>
            <div className="form-grid">
              <div className="form-group">
                <label>Warehouse *</label>
                <select required value={rkModal.form.warehouseId} onChange={(e) => setRkModal({ ...rkModal, form: { ...rkModal.form, warehouseId: e.target.value } })}>
                  {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Rack Code *</label><input type="text" required value={rkModal.form.code} onChange={(e) => setRkModal({ ...rkModal, form: { ...rkModal.form, code: e.target.value } })} /></div>
              <div className="form-group"><label>Capacity (units) *</label><input type="number" min="1" required value={rkModal.form.capacity} onChange={(e) => setRkModal({ ...rkModal, form: { ...rkModal.form, capacity: e.target.value } })} /></div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setRkModal({ open: false, form: null })}>Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Bin modal */}
      <Modal open={bnModal.open} title={bnModal.form?.id ? "Edit Bin" : "Add Bin"} onClose={() => setBnModal({ open: false, form: null })}>
        {bnModal.form && (
          <form onSubmit={saveBin}>
            <div className="form-grid">
              <div className="form-group">
                <label>Rack *</label>
                <select required value={bnModal.form.rackId} onChange={(e) => setBnModal({ ...bnModal, form: { ...bnModal.form, rackId: e.target.value } })}>
                  {racks.map((r) => <option key={r._id} value={r._id}>{r.code} ({r.warehouse?.name})</option>)}
                </select>
              </div>
              <div className="form-group"><label>Bin Code *</label><input type="text" required value={bnModal.form.code} onChange={(e) => setBnModal({ ...bnModal, form: { ...bnModal.form, code: e.target.value } })} /></div>
              <div className="form-group"><label>Capacity (units) *</label><input type="number" min="1" required value={bnModal.form.capacity} onChange={(e) => setBnModal({ ...bnModal, form: { ...bnModal.form, capacity: e.target.value } })} /></div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setBnModal({ open: false, form: null })}>Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      {ConfirmModal}
    </>
  );
}
