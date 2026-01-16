import { create } from "zustand";
import api from "@/lib/api";

// Types
export interface StudentPaymentRequest {
  _id: string;
  classPaymentRequestId: string;
  classId: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  className: string;
  classSubject?: string;
  title: string;
  description?: string;
  dueDate?: string;
  baseAmount: number;
  scholarshipPercent: number;
  scholarshipType?: string;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  paidAt?: string;
  createdAt: string;
}

export interface ClassPaymentRequest {
  _id: string;
  classId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  dueDate?: string;
  className: string;
  classSubject?: string;
  totalStudents: number;
  paidCount: number;
  totalCollected: number;
  status: "active" | "cancelled";
  createdAt: string;
}

export interface ChildPaymentRequests {
  studentId: string;
  studentName: string;
  requests: StudentPaymentRequest[];
}

interface PaymentRequestsState {
  // Student
  myRequests: StudentPaymentRequest[];
  // Parent
  childrenRequests: ChildPaymentRequests[];
  // Admin/Teacher
  classRequests: ClassPaymentRequest[];

  isLoading: boolean;
  error: string | null;

  // Student actions
  fetchMyRequests: () => Promise<void>;
  fetchAllMyRequests: () => Promise<void>;

  // Parent actions
  fetchChildrenRequests: () => Promise<void>;

  // Teacher/Admin actions
  fetchClassRequests: (classId?: string) => Promise<void>;

  clearError: () => void;
}

export const usePaymentRequestsStore = create<PaymentRequestsState>((set) => ({
  myRequests: [],
  childrenRequests: [],
  classRequests: [],
  isLoading: false,
  error: null,

  fetchMyRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/payment-requests/my");
      set({ myRequests: response.data, isLoading: false });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi tải yêu cầu thanh toán";
      set({ isLoading: false, error: message });
    }
  },

  fetchAllMyRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/payment-requests/my/all");
      set({ myRequests: response.data, isLoading: false });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi tải yêu cầu thanh toán";
      set({ isLoading: false, error: message });
    }
  },

  fetchChildrenRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/payment-requests/my-children");
      set({ childrenRequests: response.data, isLoading: false });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi tải yêu cầu thanh toán";
      set({ isLoading: false, error: message });
    }
  },

  fetchClassRequests: async (classId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = classId
        ? `/payment-requests/class?classId=${classId}`
        : "/payment-requests/class";
      const response = await api.get(url);
      set({ classRequests: response.data, isLoading: false });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi tải yêu cầu thanh toán";
      set({ isLoading: false, error: message });
    }
  },

  clearError: () => set({ error: null }),
}));
