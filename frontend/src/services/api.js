import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the saved token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralised error shaping + 401 handling (session expired -> send to login).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error(`Could not reach the backend at ${API_BASE_URL}. Make sure the Express server is running.`));
    }

    if (error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("fullName");
      localStorage.removeItem("role");
      if (!window.location.pathname.endsWith("/login")) {
        window.location.href = "/login";
      }
    }

    const data = error.response.data || {};
    const message =
      data.message ||
      (data.fieldErrors && Object.values(data.fieldErrors).join(", ")) ||
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default api;
