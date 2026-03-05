import { create } from "zustand";
import api from "@/lib/api";

export type PaymentMethod = "PAYOS" | "FAKE" | "CASH";

export interface CreatePaymentResult {
  paymentId: string;
  paymentUrl?: string;   // PayOS real link
  checkoutUrl?: string;  // Fake PayOS link
  vnpTxnRef?: string;
  message?: string;
}

interface PaymentsState {
  isLoading: boolean;
  error: string | null;

  createPayment: (params: {
    requestIds: string[];
    method: PaymentMethod;
    studentId?: string;
  }) => Promise<CreatePaymentResult>;

  confirmFakePayment: (
    paymentId: string,
    status: "SUCCESS" | "CANCELLED"
  ) => Promise<{ success: boolean; message: string }>;

  clearError: () => void;
}

export const usePaymentsStore = create<PaymentsState>((set) => ({
  isLoading: false,
  error: null,

  createPayment: async ({ requestIds, method, studentId }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/payments/create", {
        requestIds,
        method,
        studentId,
      });
      set({ isLoading: false });
      return response.data as CreatePaymentResult;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi tạo giao dịch thanh toán";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  confirmFakePayment: async (paymentId, status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/payments/fake/callback", {
        paymentId,
        status,
      });
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi xác nhận thanh toán";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));
