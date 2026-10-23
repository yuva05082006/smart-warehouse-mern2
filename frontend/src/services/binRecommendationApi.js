import api from "./api.js";

export const getBinRecommendation = (params) => api.get("/bin-recommendation", { params }).then((r) => r.data);
