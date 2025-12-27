import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

export type UserRole = "student" | "teacher" | "parent" | "admin";

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  branchId?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  status: "active" | "pending" | "inactive";
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  registerByInvite: (
    data: RegisterByInviteData
  ) => Promise<{ message: string }>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User) => void;
  refreshTokens: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  clearMustChangePassword: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface RegisterByInviteData {
  token: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  mustChangePassword?: boolean;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      mustChangePassword: false,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<LoginResponse>("/auth/login", {
            email,
            password,
          });

          const { user, accessToken, refreshToken, mustChangePassword } =
            response.data;
          const userWithId = { ...user, id: user._id };

          set({
            user: userWithId,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            mustChangePassword: mustChangePassword || false,
          });

          return userWithId;
        } catch (error: any) {
          const message = error.response?.data?.message || "Đăng nhập thất bại";
          set({
            isLoading: false,
            error: message,
            isAuthenticated: false,
          });
          throw new Error(message);
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<LoginResponse>(
            "/auth/register",
            data
          );

          const { user, accessToken, refreshToken } = response.data;
          const userWithId = { ...user, id: user._id };

          set({
            user: userWithId,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return userWithId;
        } catch (error: any) {
          const message = error.response?.data?.message || "Đăng ký thất bại";
          set({
            isLoading: false,
            error: message,
          });
          throw new Error(message);
        }
      },

      registerByInvite: async (data: RegisterByInviteData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post("/auth/register/by-invite", data);
          set({ isLoading: false });
          return response.data;
        } catch (error: any) {
          const message = error.response?.data?.message || "Đăng ký thất bại";
          set({
            isLoading: false,
            error: message,
          });
          throw new Error(message);
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
          mustChangePassword: false,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User) => {
        set({ user });
      },

      changePassword: async (newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.post("/auth/change-password", { newPassword });
          set({
            isLoading: false,
            mustChangePassword: false,
            user: get().user
              ? { ...get().user!, mustChangePassword: false }
              : null,
          });
        } catch (error: any) {
          const message =
            error.response?.data?.message || "Đổi mật khẩu thất bại";
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      clearMustChangePassword: () => {
        set({ mustChangePassword: false });
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await api.post<LoginResponse>("/auth/refresh", {
            refreshToken,
          });

          const {
            user,
            accessToken,
            refreshToken: newRefreshToken,
          } = response.data;

          set({
            user: { ...user, id: user._id },
            accessToken,
            refreshToken: newRefreshToken,
          });
        } catch (error) {
          get().logout();
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
