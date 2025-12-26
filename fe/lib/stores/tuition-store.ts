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

interface TuitionState {
  records: TuitionRecord[];
  isLoading: boolean;
  error: string | null;
  summary: {
    totalPending: number;
    totalPaid: number;
    totalOverdue: number;
    totalAmount: number;
  } | null;
}

interface TuitionActions {
  fetchTuition: (params?: FetchTuitionParams) => Promise<void>;
  createTuition: (data: CreateTuitionData) => Promise<TuitionRecord>;
  updateTuition: (
    id: string,
    data: UpdateTuitionData
  ) => Promise<TuitionRecord>;
  recordPayment: (
    id: string,
    data: RecordPaymentData
  ) => Promise<TuitionRecord>;
  deleteTuition: (id: string) => Promise<void>;
  fetchSummary: (params?: FetchSummaryParams) => Promise<void>;
  clearError: () => void;
}

interface FetchTuitionParams {
  studentId?: string;
  classId?: string;
  status?: "pending" | "paid" | "overdue" | "partial";
  period?: string;
}

interface CreateTuitionData {
  studentId: string;
  classId: string;
  amount: number;
  period: string;
  dueDate: string;
  notes?: string;
}

interface UpdateTuitionData {
  amount?: number;
  dueDate?: string;
  notes?: string;
  status?: "pending" | "paid" | "overdue" | "partial";
}

interface RecordPaymentData {
  paidAmount: number;
  paymentMethod: "cash" | "bank_transfer" | "momo" | "other";
  notes?: string;
}

interface FetchSummaryParams {
  studentId?: string;
  classId?: string;
  branchId?: string;
}

export const useTuitionStore = create<TuitionState & TuitionActions>(
  (set, get) => ({
    // State
    records: [],
    isLoading: false,
    error: null,
    summary: null,

    // Actions
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
        throw new Error(message);
      }
    },

    createTuition: async (data: CreateTuitionData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post("/tuition", data);
        const newRecord = { ...response.data, id: response.data._id };

        set((state) => ({
          records: [...state.records, newRecord],
          isLoading: false,
        }));

        return newRecord;
      } catch (error: any) {
        const message = error.response?.data?.message || "Lỗi khi tạo học phí";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    updateTuition: async (id: string, data: UpdateTuitionData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.patch(`/tuition/${id}`, data);
        const updatedRecord = { ...response.data, id: response.data._id };

        set((state) => ({
          records: state.records.map((r) => (r._id === id ? updatedRecord : r)),
          isLoading: false,
        }));

        return updatedRecord;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi cập nhật học phí";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    recordPayment: async (id: string, data: RecordPaymentData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post(`/tuition/${id}/payment`, data);
        const updatedRecord = { ...response.data, id: response.data._id };

        set((state) => ({
          records: state.records.map((r) => (r._id === id ? updatedRecord : r)),
          isLoading: false,
        }));

        return updatedRecord;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi ghi nhận thanh toán";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    deleteTuition: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await api.delete(`/tuition/${id}`);

        set((state) => ({
          records: state.records.filter((r) => r._id !== id),
          isLoading: false,
        }));
      } catch (error: any) {
        const message = error.response?.data?.message || "Lỗi khi xóa học phí";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    fetchSummary: async (params?: FetchSummaryParams) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get("/tuition/summary", { params });
        set({
          summary: response.data,
          isLoading: false,
        });
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi tải tổng hợp học phí";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    clearError: () => {
      set({ error: null });
    },
  })
);
