import api from "./api.js";

export const listBins = (params = {}) => api.get("/bins", { params }).then((r) => r.data);
export const getBinCapacity = (id) => api.get(`/bins/${id}/capacity`).then((r) => r.data);
export const createBin = (payload) => api.post("/bins", payload).then((r) => r.data);
export const updateBin = (id, payload) => api.put(`/bins/${id}`, payload).then((r) => r.data);
export const deleteBin = (id) => api.delete(`/bins/${id}`).then((r) => r.data);
