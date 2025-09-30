import axios from "axios";

const API_BASE_URL = 'http://localhost:5000/api';

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================
// REQUEST INTERCEPTOR
// ==========================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // or sessionStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================
// RESPONSE INTERCEPTOR
// ==========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Token expired or not valid
        console.warn("Unauthorized. Redirecting to login...");
        localStorage.removeItem("token");
        // window.location.href = "/login";
      }

      if (status === 403) {
        console.error("Forbidden: You don't have permission.");
      }

      if (status >= 500) {
        console.error("Server error. Please try again later.");
      }
    } else {
      console.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);

export default api;