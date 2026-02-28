import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL,
});

// automatically attach bearer token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// refresh token on 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const resp = await axios.post(`${baseURL}/token/refresh/`, {
            refresh,
          });
          localStorage.setItem("access_token", resp.data.access);
          api.defaults.headers.common["Authorization"] =
            `Bearer ${resp.data.access}`;
          originalRequest.headers["Authorization"] =
            `Bearer ${resp.data.access}`;
          return api(originalRequest);
        } catch (e) {
          console.error("refresh failed", e);
        }
      }
      // if refresh fails, clear tokens and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
