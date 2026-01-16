import { create } from "zustand";
import api from "../api";

export interface Payment {
  _id: string;
  requestIds: string[];
  paidBy: any;
  studentId: any;
  amount: number;
  method: "vnpay_test" | "cash" | "scholarship";
  status: "init" | "pending" | "success" | "failed";
  vnpTxnRef?: string;
  paidAt?: string;
  createdAt: string;
}

interface PaymentsState {
  payments: Payment[];
  allPayments: Payment[];
  pendingCashPayments: Payment[];
  isLoading: boolean;
  error: string | null;

  // Create payment
  createPayment: (data: {
    requestIds: string[];
    method: "vnpay_test" | "cash";
    studentId?: string;
  }) => Promise<{
    paymentId: string;
    paymentUrl?: string;
    message?: string;
  }>;

  // Admin
  fetchPendingCashPayments: () => Promise<void>;
  fetchAllPayments: () => Promise<void>;
  confirmCashPayment: (paymentId: string) => Promise<void>;

  // Common
  fetchMyPayments: () => Promise<void>;

  clearError: () => void;
}

export const usePaymentsStore = create<PaymentsState>((set) => ({
  payments: [],
  allPayments: [],
  pendingCashPayments: [],
  isLoading: false,
  error: null,

  createPayment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/payments/create", data);
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi tạo thanh toán";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  fetchAllPayments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/payments/admin/all");
      set({ allPayments: response.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi tải tất cả thanh toán";
      set({ isLoading: false, error: message });
    }
  },

  fetchPendingCashPayments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/payments/cash/pending");
      set({ pendingCashPayments: response.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi tải danh sách";
      set({ isLoading: false, error: message });
    }
  },

  confirmCashPayment: async (paymentId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/payments/cash/confirm", { paymentId });
      set({ isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi xác nhận";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  fetchMyPayments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/payments/my");
      set({ payments: response.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi tải thanh toán";
      set({ isLoading: false, error: message });
    }
  },

  clearError: () => set({ error: null }),
}));
