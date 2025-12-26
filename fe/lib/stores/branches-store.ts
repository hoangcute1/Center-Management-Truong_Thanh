import { create } from "zustand";
import api from "@/lib/api";

export interface Branch {
  _id: string;
  id?: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  managerId?: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

interface BranchesState {
  branches: Branch[];
  selectedBranch: Branch | null;
  isLoading: boolean;
  error: string | null;
}

interface BranchesActions {
  fetchBranches: () => Promise<void>;
  fetchBranchById: (id: string) => Promise<Branch>;
  createBranch: (data: CreateBranchData) => Promise<Branch>;
  updateBranch: (id: string, data: UpdateBranchData) => Promise<Branch>;
  deleteBranch: (id: string) => Promise<void>;
  setSelectedBranch: (branch: Branch | null) => void;
  clearError: () => void;
}

interface CreateBranchData {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  managerId?: string;
}

interface UpdateBranchData {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  status?: "active" | "inactive";
}

export const useBranchesStore = create<BranchesState & BranchesActions>(
  (set, get) => ({
    // State
    branches: [],
    selectedBranch: null,
    isLoading: false,
    error: null,

    // Actions
    fetchBranches: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get("/branches");
        const branches = Array.isArray(response.data)
          ? response.data
          : response.data.branches || [];

        set({
          branches: branches.map((b: Branch) => ({ ...b, id: b._id })),
          isLoading: false,
        });
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi tải danh sách chi nhánh";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    fetchBranchById: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get(`/branches/${id}`);
        const branch = { ...response.data, id: response.data._id };
        set({ selectedBranch: branch, isLoading: false });
        return branch;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi tải thông tin chi nhánh";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    createBranch: async (data: CreateBranchData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post("/branches", data);
        const newBranch = { ...response.data, id: response.data._id };

        set((state) => ({
          branches: [...state.branches, newBranch],
          isLoading: false,
        }));

        return newBranch;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi tạo chi nhánh";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    updateBranch: async (id: string, data: UpdateBranchData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.patch(`/branches/${id}`, data);
        const updatedBranch = { ...response.data, id: response.data._id };

        set((state) => ({
          branches: state.branches.map((b) =>
            b._id === id ? updatedBranch : b
          ),
          selectedBranch:
            state.selectedBranch?._id === id
              ? updatedBranch
              : state.selectedBranch,
          isLoading: false,
        }));

        return updatedBranch;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi cập nhật chi nhánh";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    deleteBranch: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await api.delete(`/branches/${id}`);

        set((state) => ({
          branches: state.branches.filter((b) => b._id !== id),
          selectedBranch:
            state.selectedBranch?._id === id ? null : state.selectedBranch,
          isLoading: false,
        }));
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi xóa chi nhánh";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    setSelectedBranch: (branch: Branch | null) => {
      set({ selectedBranch: branch });
    },

    clearError: () => {
      set({ error: null });
    },
  })
);
