import axios from "axios";

const PROD_API_FALLBACK = "https://college-project-lb7u.onrender.com/api";

export const getApiBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_URL;
  if (envBase) return envBase.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return PROD_API_FALLBACK;
  }

  return "/api";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

export default api;
