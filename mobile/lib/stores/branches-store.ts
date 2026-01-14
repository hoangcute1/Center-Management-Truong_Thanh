import { create } from "zustand";
import api from "@/lib/api";
import { translateErrorMessage } from "./auth-store";

export interface Branch {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

interface BranchesState {
  branches: Branch[];
  selectedBranch: Branch | null;
  isLoading: boolean;
  error: string | null;

  fetchBranches: () => Promise<void>;
  selectBranch: (branch: Branch | null) => void;
  clearError: () => void;
}

export const useBranchesStore = create<BranchesState>((set) => ({
  branches: [],
  selectedBranch: null,
  isLoading: false,
  error: null,

  fetchBranches: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/branches");
      const branches = Array.isArray(response.data)
        ? response.data
        : response.data.branches || [];
      set({ branches, isLoading: false });
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tải danh sách cơ sở"
      );
      set({ error: errorMessage, isLoading: false });
    }
  },

  selectBranch: (branch: Branch | null) => {
    set({ selectedBranch: branch });
  },

  clearError: () => set({ error: null }),
}));
