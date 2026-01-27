import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    if (typeof window !== "undefined") {
      const authData = localStorage.getItem("auth-storage");
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const token = parsed?.state?.accessToken;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (e) {
          console.error("Error parsing auth data:", e);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authData = localStorage.getItem("auth-storage");
        if (authData) {
          const parsed = JSON.parse(authData);
          const refreshToken = parsed?.state?.refreshToken;

          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } =
              response.data;

            // Update tokens in localStorage
            parsed.state.accessToken = accessToken;
            parsed.state.refreshToken = newRefreshToken;
            localStorage.setItem("auth-storage", JSON.stringify(parsed));

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        localStorage.removeItem("auth-storage");
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
