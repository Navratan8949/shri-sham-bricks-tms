import axios from "axios";

const getBaseUrl = () => {
  let envUrl = process.env.NEXT_PUBLIC_API_URL;
  // If envUrl is missing or pointing to 5000 (macOS AirPlay port collision), use 5002
  if (!envUrl || envUrl.includes(":5000")) {
    envUrl = "http://localhost:5002/api";
  }
  const trimmed = envUrl.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      sessionStorage.getItem("ssbc_token") ||
      sessionStorage.getItem("nrl_token");
    config.headers = config.headers || {};
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const companyId =
      sessionStorage.getItem("ssbc_company") ||
      sessionStorage.getItem("nrl_company");
    if (companyId) {
      config.headers["x-company-id"] = companyId;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      if (error?.response?.status === 401) {
        sessionStorage.removeItem("ssbc_token");
        sessionStorage.removeItem("ssbc_user");
        sessionStorage.removeItem("nrl_token");
        sessionStorage.removeItem("nrl_user");
      }
      // If super_admin encounters Company is required error, smoothly redirect to select-company
      if (
        error?.response?.status === 400 &&
        (error?.response?.data?.message === "Company is required" ||
          error?.response?.data?.message === "Invalid companyId")
      ) {
        try {
          const rawUser = sessionStorage.getItem("nrl_user");
          if (rawUser) {
            const u = JSON.parse(rawUser);
            if (u?.role === "super_admin") {
              if (window.location.pathname !== "/select-company") {
                window.location.href = "/select-company";
                return new Promise(() => {}); // suppress further errors during redirect
              }
            }
          }
        } catch {}
      }
    }
    return Promise.reject(error);
  },
);

export default api;
