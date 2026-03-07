import axios from "axios";
import { getDeviceHeaders } from "./device";

// កែត្រង់នេះ៖ ប្រើ Variable ពី .env ផ្ទាល់ បើគ្មានឱ្យប្រើអាសយដ្ឋាន Render
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "https://fitandsleek-backend.onrender.com/api";
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "fs_token";

const api = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const getCsrfToken = () => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute("content") : null;
};

api.interceptors.request.use((config) => {
  // ប្រាកដថា baseURL ត្រូវបានប្រើត្រឹមត្រូវ
  config.baseURL = baseURL;

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers["X-CSRF-TOKEN"] = csrfToken;
  }

  const deviceHeaders = getDeviceHeaders();
  Object.entries(deviceHeaders).forEach(([key, value]) => {
    config.headers[key] = value;
  });

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export { TOKEN_KEY };
export default api;
