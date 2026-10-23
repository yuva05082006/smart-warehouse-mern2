import api from "./api.js";

export const listAlerts = () => api.get("/alerts").then((r) => r.data);
