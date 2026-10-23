import api from "./api.js";

export const listDispatches = () => api.get("/dispatch").then((r) => r.data);
export const createDispatch = (payload) => api.post("/dispatch", payload).then((r) => r.data);
