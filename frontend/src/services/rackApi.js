import api from "./api.js";

export const listRacks = (params = {}) => api.get("/racks", { params }).then((r) => r.data);
export const getRackCapacity = (id) => api.get(`/racks/${id}/capacity`).then((r) => r.data);
export const createRack = (payload) => api.post("/racks", payload).then((r) => r.data);
export const updateRack = (id, payload) => api.put(`/racks/${id}`, payload).then((r) => r.data);
export const deleteRack = (id) => api.delete(`/racks/${id}`).then((r) => r.data);
