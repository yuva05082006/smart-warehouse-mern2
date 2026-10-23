import api from "./api.js";

export const listInventory = () => api.get("/inventory").then((r) => r.data);
