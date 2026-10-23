import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as productApi from "../services/productApi.js";
import * as warehouseApi from "../services/warehouseApi.js";
import * as rackApi from "../services/rackApi.js";
import * as binApi from "../services/binApi.js";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Modal from "../components/Modal.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useConfirm } from "../hooks/useConfirm.jsx";

const EMPTY_FORM = {
  id: null, name: "", sku: "", category: "", unit: "", reorderLevel: 0,
  description: "", status: "ACTIVE", warehouseId: "", rackId: "", binId: "", initialQuantity: 0,
};

export default function Products() {
  const { isManager } = useAuth();
  const toast = useToast();
  const [confirm, ConfirmModal] = useConfirm();

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadLookups = useCallback(async () => {
    const [w, r, b] = await Promise.all([warehouseApi.listWarehouses(), rackApi.listRacks(), binApi.listBins()]);
    setWarehouses(w);
    setRacks(r);
    setBins(b);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;
      if (status) params.status = status;
      if (sortBy) params.sortBy = sortBy;
      const data = await productApi.listProducts(params);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [keyword, category, status, sortBy]);

  useEffect(() => { loadLookups(); }, [loadLookups]);
  useEffect(() => { loadProducts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(),
    [products]
  );

  const racksForWarehouse = (warehouseId) => racks.filter((r) => String(r.warehouse?._id || r.warehouse) === String(warehouseId));
  const binsForRack = (rackId) => bins.filter((b) => String(b.rack?._id || b.rack) === String(rackId));

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = async (product) => {
    try {
      const fresh = await productApi.getProduct(product.id);
      setForm({
        id: fresh.id, name: fresh.name, sku: fresh.sku, category: fresh.category || "",
        unit: fresh.unit || "", reorderLevel: fresh.reorderLevel, description: fresh.description || "",
        status: fresh.status, warehouseId: fresh.warehouseId || "", rackId: fresh.rackId || "",
        binId: fresh.binId || "", initialQuantity: 0,
      });
      setModalOpen(true);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleDelete = async (product) => {
    const ok = await confirm(`Delete product "${product.name}"? This cannot be undone.`, { danger: true });
    if (!ok) return;
    try {
      await productApi.deleteProduct(product.id);
      toast("Product deleted successfully.");
      loadProducts();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(), sku: form.sku.trim(), category: form.category.trim(),
      unit: form.unit.trim(), description: form.description.trim(),
      reorderLevel: Number(form.reorderLevel) || 0,
      warehouseId: form.warehouseId || null, rackId: form.rackId || null, binId: form.binId || null,
      status: form.status, initialQuantity: Number(form.initialQuantity) || 0,
    };
    try {
      if (form.id) {
        await productApi.updateProduct(form.id, payload);
        toast("Product updated successfully.");
      } else {
        await productApi.createProduct(payload);
        toast("Product created successfully.");
      }
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Product Management</h1>
        <button className="btn btn-primary" onClick={openAddModal}>+ Add Product</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filter-bar">
          <input type="text" placeholder="Search by name or SKU..." value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadProducts()} />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="">Sort by...</option>
            <option value="name">Name</option>
            <option value="sku">SKU</option>
            <option value="category">Category</option>
            <option value="quantity">Quantity</option>
          </select>
          <button className="btn btn-secondary btn-small" onClick={loadProducts}>Apply</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <LoadingState text="Loading products..." />
          ) : error ? (
            <ErrorState message={error} />
          ) : products.length === 0 ? (
            <EmptyState text="No products found. Try adjusting your filters or add a new product." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>SKU</th><th>Category</th><th>Location</th>
                  <th>Available</th><th>Reserved</th><th>Reorder Lvl</th><th>Stock Status</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const location = [p.warehouseName, p.rackCode, p.binCode].filter(Boolean).join(" / ") || "Unassigned";
                  return (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.sku}</td>
                      <td>{p.category || "-"}</td>
                      <td>{location}</td>
                      <td>{p.availableQuantity}</td>
                      <td>{p.reservedQuantity}</td>
                      <td>{p.reorderLevel}</td>
                      <td><StatusBadge status={p.stockStatus} /></td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="row-actions">
                        <button className="btn btn-secondary btn-small" onClick={() => openEditModal(p)}>Edit</button>
                        {isManager && <button className="btn btn-danger btn-small" onClick={() => handleDelete(p)}>Delete</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modalOpen} title={form.id ? "Edit Product" : "Add Product"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Product Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>SKU *</label>
              <input type="text" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input type="text" placeholder="e.g. Electronics" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <input type="text" placeholder="e.g. pcs" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Reorder Level</label>
              <input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
            </div>
            {!form.id && (
              <div className="form-group">
                <label>Initial Quantity</label>
                <input type="number" min="0" value={form.initialQuantity} onChange={(e) => setForm({ ...form, initialQuantity: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label>Warehouse</label>
              <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value, rackId: "", binId: "" })}>
                <option value="">-- None --</option>
                {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Rack</label>
              <select value={form.rackId} onChange={(e) => setForm({ ...form, rackId: e.target.value, binId: "" })} disabled={!form.warehouseId}>
                <option value="">-- None --</option>
                {racksForWarehouse(form.warehouseId).map((r) => <option key={r._id} value={r._id}>{r.code}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Bin</label>
              <select value={form.binId} onChange={(e) => setForm({ ...form, binId: e.target.value })} disabled={!form.rackId}>
                <option value="">-- None --</option>
                {binsForRack(form.rackId).map((b) => <option key={b._id} value={b._id}>{b.code}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DISCONTINUED">Discontinued</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Description</label>
            <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save Product</button>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {ConfirmModal}
    </>
  );
}
