import api from "./api.js";

export const startPicking = (orderId) => api.post(`/picking/start/${orderId}`).then((r) => r.data);
export const listPickingTasks = (orderId) => api.get("/picking/tasks", { params: { orderId } }).then((r) => r.data);
export const recordPick = (taskId, quantity) => api.put(`/picking/tasks/${taskId}/pick`, { quantity }).then((r) => r.data);
