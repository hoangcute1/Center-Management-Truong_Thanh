import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";

// For Android emulator, localhost should be 10.0.2.2
// For iOS simulator, localhost works
// For real devices, need to use actual IP address
const getBaseUrl = () => {
  const configUrl = Constants.expoConfig?.extra?.apiUrl;

  if (configUrl && !configUrl.includes("localhost")) {
    return configUrl;
  }

  // Default development URLs
  if (__DEV__) {
    if (Platform.OS === "android") {
      return "http://10.0.2.2:3000"; // Android emulator
    }
    return "http://localhost:3000"; // iOS simulator
  }

  return configUrl || "http://localhost:3000";
};

const API_BASE_URL = getBaseUrl();

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Helper functions for SecureStore
export const getAuthData = async () => {
  try {
    const authData = await SecureStore.getItemAsync("auth-storage");
    if (authData) {
      return JSON.parse(authData);
    }
  } catch (e) {
    console.error("Error getting auth data:", e);
  }
  return null;
};

export const setAuthData = async (data: any) => {
  try {
    await SecureStore.setItemAsync("auth-storage", JSON.stringify(data));
  } catch (e) {
    console.error("Error setting auth data:", e);
  }
};

export const clearAuthData = async () => {
  try {
    await SecureStore.deleteItemAsync("auth-storage");
  } catch (e) {
    console.error("Error clearing auth data:", e);
  }
};

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const authData = await getAuthData();
    if (authData?.state?.accessToken) {
      config.headers.Authorization = `Bearer ${authData.state.accessToken}`;
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
        const authData = await getAuthData();
        if (authData?.state?.refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: authData.state.refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          // Update tokens in SecureStore
          authData.state.accessToken = accessToken;
          authData.state.refreshToken = newRefreshToken;
          await setAuthData(authData);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear auth
        await clearAuthData();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
