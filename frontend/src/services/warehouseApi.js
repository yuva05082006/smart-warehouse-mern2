import api from "./api.js";

export const listWarehouses = () => api.get("/warehouses").then((r) => r.data);
export const getWarehouseCapacity = (id) => api.get(`/warehouses/${id}/capacity`).then((r) => r.data);
export const createWarehouse = (payload) => api.post("/warehouses", payload).then((r) => r.data);
export const updateWarehouse = (id, payload) => api.put(`/warehouses/${id}`, payload).then((r) => r.data);
export const deleteWarehouse = (id) => api.delete(`/warehouses/${id}`).then((r) => r.data);
