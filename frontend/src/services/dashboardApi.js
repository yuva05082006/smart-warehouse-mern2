import api from "./api.js";

export const getDashboardSummary = () => api.get("/dashboard/summary").then((r) => r.data);
