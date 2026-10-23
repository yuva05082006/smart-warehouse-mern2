import api from "./api.js";

export const trackProduct = (idOrSku) => api.get(`/tracking/${encodeURIComponent(idOrSku)}`).then((r) => r.data);
