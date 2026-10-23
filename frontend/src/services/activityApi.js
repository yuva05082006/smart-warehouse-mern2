import api from "./api.js";

export const listActivityLogs = (params = {}) => api.get("/activity-logs", { params }).then((r) => r.data);
