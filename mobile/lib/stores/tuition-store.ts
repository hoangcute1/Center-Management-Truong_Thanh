import { create } from "zustand";
import api from "@/lib/api";

export interface TuitionRecord {
  _id: string;
  id?: string;
  studentId: string;
  classId: string;
  amount: number;
  currency: string;
  period: string; // e.g., "2025-01" for January 2025
  dueDate: string;
  paidDate?: string;
  status: "pending" | "paid" | "overdue" | "partial";
  paidAmount?: number;
  paymentMethod?: "cash" | "bank_transfer" | "momo" | "other";
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt?: string;
  // Populated
  student?: {
    _id: string;
    name: string;
    email: string;
  };
  class?: {
    _id: string;
    name: string;
  };
}

interface TuitionSummary {
  totalPending: number;
  totalPaid: number;
  totalOverdue: number;
  totalAmount: number;
}

interface FetchTuitionParams {
  studentId?: string;
  classId?: string;
  status?: "pending" | "paid" | "overdue" | "partial";
  period?: string;
}

interface TuitionState {
  records: TuitionRecord[];
  isLoading: boolean;
  error: string | null;
  summary: TuitionSummary | null;

  // Actions
  fetchTuition: (params?: FetchTuitionParams) => Promise<void>;
  fetchMyTuition: () => Promise<void>;
  fetchChildrenTuition: () => Promise<void>;
  fetchSummary: (params?: {
    studentId?: string;
    classId?: string;
  }) => Promise<void>;
  clearError: () => void;
}

export const useTuitionStore = create<TuitionState>((set) => ({
  records: [],
  isLoading: false,
  error: null,
  summary: null,

  fetchTuition: async (params?: FetchTuitionParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/tuition", { params });
      const records = Array.isArray(response.data)
        ? response.data
        : response.data.tuition || [];

      set({
        records: records.map((r: TuitionRecord) => ({ ...r, id: r._id })),
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi tải danh sách học phí";
      set({ isLoading: false, error: message });
    }
  },

  fetchMyTuition: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/tuition/my");
      const records = Array.isArray(response.data)
        ? response.data
        : response.data.tuition || [];

      set({
        records: records.map((r: TuitionRecord) => ({ ...r, id: r._id })),
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi khi tải học phí";
      set({ isLoading: false, error: message });
    }
  },

  fetchChildrenTuition: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/tuition/my-children");
      const records = Array.isArray(response.data)
        ? response.data
        : response.data.tuition || [];

      set({
        records: records.map((r: TuitionRecord) => ({ ...r, id: r._id })),
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi tải học phí con";
      set({ isLoading: false, error: message });
    }
  },

  fetchSummary: async (params?: { studentId?: string; classId?: string }) => {
    try {
      const response = await api.get("/tuition/summary", { params });
      set({ summary: response.data });
    } catch (error: any) {
      console.error("Error fetching tuition summary:", error);
    }
  },

  clearError: () => set({ error: null }),
}));
