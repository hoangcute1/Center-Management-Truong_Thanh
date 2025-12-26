import { create } from "zustand";
import api from "@/lib/api";
import type { User, UserRole } from "./auth-store";

interface UsersState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface UsersActions {
  fetchUsers: (params?: FetchUsersParams) => Promise<void>;
  fetchUserById: (id: string) => Promise<User>;
  createUser: (data: CreateUserData) => Promise<User>;
  updateUser: (id: string, data: UpdateUserData) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  clearError: () => void;
}

interface FetchUsersParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  branchId?: string;
  search?: string;
}

interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  branchId?: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: UserRole;
  branchId?: string;
  status?: "active" | "pending" | "inactive";
  avatarUrl?: string;
  dateOfBirth?: string;
}

export const useUsersStore = create<UsersState & UsersActions>((set, get) => ({
  // State
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },

  // Actions
  fetchUsers: async (params?: FetchUsersParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/users", { params });
      const users = Array.isArray(response.data)
        ? response.data
        : response.data.users || [];

      set({
        users: users.map((u: User) => ({ ...u, id: u._id })),
        isLoading: false,
        pagination: {
          ...get().pagination,
          total: response.data.total || users.length,
        },
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi tải danh sách người dùng";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  fetchUserById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/users/${id}`);
      const user = { ...response.data, id: response.data._id };
      set({ selectedUser: user, isLoading: false });
      return user;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi tải thông tin người dùng";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  createUser: async (data: CreateUserData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/users", data);
      const newUser = { ...response.data, id: response.data._id };

      set((state) => ({
        users: [...state.users, newUser],
        isLoading: false,
      }));

      return newUser;
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi khi tạo người dùng";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  updateUser: async (id: string, data: UpdateUserData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/users/${id}`, data);
      const updatedUser = { ...response.data, id: response.data._id };

      set((state) => ({
        users: state.users.map((u) => (u._id === id ? updatedUser : u)),
        selectedUser:
          state.selectedUser?._id === id ? updatedUser : state.selectedUser,
        isLoading: false,
      }));

      return updatedUser;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi cập nhật người dùng";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  deleteUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/users/${id}`);

      set((state) => ({
        users: state.users.filter((u) => u._id !== id),
        selectedUser:
          state.selectedUser?._id === id ? null : state.selectedUser,
        isLoading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi khi xóa người dùng";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  setSelectedUser: (user: User | null) => {
    set({ selectedUser: user });
  },

  clearError: () => {
    set({ error: null });
  },
}));
