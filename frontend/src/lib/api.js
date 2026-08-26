import axios from "axios";

export function resolveApiUrl() {
  let backendUrl = process.env.REACT_APP_BACKEND_URL || "";
  backendUrl = backendUrl.trim();
  if (backendUrl && !backendUrl.startsWith("http://") && !backendUrl.startsWith("https://")) {
    backendUrl = `https://${backendUrl}`;
  }
  backendUrl = backendUrl.replace(/\/+$/, "");
  return backendUrl ? `${backendUrl}/api` : "/api";
}

export const API = resolveApiUrl();

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sd_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sd_token");
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/" &&
        window.location.pathname !== "/register"
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
