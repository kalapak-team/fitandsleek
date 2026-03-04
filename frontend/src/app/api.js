import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const baseURL = rawBaseURL.replace(/\/$/, "").endsWith("/api")
  ? rawBaseURL.replace(/\/$/, "")
  : `${rawBaseURL.replace(/\/$/, "")}/api`;
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "fs_token";

const api = axios.create({
  baseURL,
  headers: { Accept: "application/json" },
});

// attach Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
export { TOKEN_KEY };
