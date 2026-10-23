import api from "./api.js";

export const listOrders = (params = {}) => api.get("/orders", { params }).then((r) => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data);
export const createOrder = (payload) => api.post("/orders", payload).then((r) => r.data);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status }).then((r) => r.data);
