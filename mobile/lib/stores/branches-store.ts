import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "@/lib/api";
import { translateErrorMessage } from "./auth-store";

export interface Branch {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  status: "active" | "inactive";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const normalizeBranch = (branch: any): Branch => {
  if (!branch || !branch._id || !branch.name) {
    console.warn("Invalid branch data:", branch);
    return {
      _id: branch?._id || "",
      name: branch?.name || "Unknown",
      status: "inactive",
      isActive: false,
    };
  }

  const status: "active" | "inactive" =
    branch.status === "inactive" ? "inactive" : "active";

  const isActive =
    typeof branch.isActive === "boolean"
      ? branch.isActive
      : status === "active";

  return {
    _id: branch._id,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    email: branch.email,
    description: branch.description,
    status,
    isActive,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  };
};

interface BranchesState {
  branches: Branch[];
  selectedBranch: Branch | null;
  isLoading: boolean;
  error: string | null;

  fetchBranches: () => Promise<void>;
  addBranch: (data: Partial<Branch>) => Promise<void>;
  updateBranch: (id: string, data: Partial<Branch>) => Promise<void>;
  selectBranch: (branch: Branch | null) => void;
  clearError: () => void;
}

export const useBranchesStore = create<BranchesState>()(
  persist(
    (set, get) => ({
      branches: [],
      selectedBranch: null,
      isLoading: false,
      error: null,

      fetchBranches: async () => {
        const currentSelected = get().selectedBranch;
        set({ isLoading: true, error: null });
        try {
          console.log("Fetching branches from API...");
          const response = await api.get("/branches");
          console.log("Branches API response:", response.data);

          const rawBranches = Array.isArray(response.data)
            ? response.data
            : response.data.branches || [];

          console.log("Raw branches count:", rawBranches.length);
          const normalizedBranches: Branch[] = rawBranches.map(normalizeBranch);
          console.log("Normalized branches count:", normalizedBranches.length);

          let nextSelected: Branch | null = null;
          if (normalizedBranches.length > 0) {
            const matchedBranch = currentSelected
              ? normalizedBranches.find(
                  (branch) => branch._id === currentSelected._id
                )
              : null;
            nextSelected = matchedBranch ?? normalizedBranches[0];
          }

          set({
            branches: normalizedBranches,
            selectedBranch: nextSelected,
            isLoading: false,
          });
        } catch (error: any) {
          console.error("Error fetching branches:", error);
          console.error("Error details:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          const errorMessage = translateErrorMessage(
            error,
            "Không thể tải danh sách cơ sở"
          );
          set({ error: errorMessage, isLoading: false, branches: [] });
        }
      },

      addBranch: async (data: Partial<Branch>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post("/branches", data);
          const newBranch = normalizeBranch(response.data);
          set((state) => ({
            branches: [...state.branches, newBranch],
            isLoading: false,
          }));
        } catch (error: any) {
          console.error("Error adding branch:", error);
          const errorMessage = translateErrorMessage(
            error,
            "Không thể thêm cơ sở"
          );
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateBranch: async (id: string, data: Partial<Branch>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.patch(`/branches/${id}`, data);
          const updatedBranch = normalizeBranch(response.data);
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
        } catch (error: any) {
          console.error("Error updating branch:", error);
          const errorMessage = translateErrorMessage(
            error,
            "Không thể cập nhật cơ sở"
          );
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      selectBranch: (branch: Branch | null) => {
        set({ selectedBranch: branch ? normalizeBranch(branch) : null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "branches-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedBranch: state.selectedBranch,
      }),
    }
  )
);
