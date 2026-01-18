import { create } from "zustand";
import api from "@/lib/api";
import { translateErrorMessage } from "./auth-store";

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "teacher" | "student" | "parent";
  branchId?: string;
  status?: "active" | "pending" | "inactive";
  avatarUrl?: string;
  subjects?: string[];
  createdAt?: string;
}

interface UsersState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

interface FetchUsersParams {
  role?: string;
  branchId?: string;
  search?: string;
}

interface UsersActions {
  fetchUsers: (params?: FetchUsersParams) => Promise<void>;
  clearError: () => void;
}

export const useUsersStore = create<UsersState & UsersActions>((set) => ({
  // State
  users: [],
  isLoading: false,
  error: null,

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
      });
    } catch (error: any) {
      const message = translateErrorMessage(
        error,
        "Lỗi khi tải danh sách người dùng",
      );
      set({ isLoading: false, error: message });
    }
  },

  clearError: () => set({ error: null }),
}));
