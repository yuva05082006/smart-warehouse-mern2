import api from "./api.js";

export const listReceipts = () => api.get("/receipts").then((r) => r.data);
export const createReceipt = (payload) => api.post("/receipts", payload).then((r) => r.data);
