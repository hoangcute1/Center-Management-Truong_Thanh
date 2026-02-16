import { create } from "zustand";
import api from "../api";

export interface FinanceDashboard {
  branchId: string;
  year: number;
  summary: {
    totalRevenue: number;
    totalExpense: number;
    profit: number;
  };
  chart: {
    revenueByMonth: Array<{ month: number; amount: number }>;
    expenseByMonth: Array<{ month: number; amount: number }>;
  };
  revenueBySubject: Array<{ subject: string; amount: number }>;
  detailByMonth: Array<{
    month: number;
    revenue: number;
    expense: number;
    profit: number;
  }>;
}

export interface Expense {
  _id: string;
  branchId: string;
  amount: number;
  description: string;
  expenseDate: string;
  createdAt: string;
  createdBy?: { _id: string; name: string };
}

export interface CreateExpenseDto {
  branchId: string;
  amount: number;
  description: string;
  expenseDate?: string;
}

interface FinanceState {
  dashboard: FinanceDashboard | null;
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  fetchDashboard: (branchId: string, year: number) => Promise<void>;
  fetchExpenses: (branchId: string) => Promise<void>;
  createExpense: (data: CreateExpenseDto) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  dashboard: null,
  expenses: [],
  isLoading: false,
  error: null,

  fetchDashboard: async (branchId, year) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(
        `/admin/finance/dashboard?branchId=${branchId}&year=${year}`
      );
      set({ dashboard: response.data, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error:
          error.response?.data?.message || "Lỗi tải dashboard tài chính",
      });
    }
  },

  fetchExpenses: async (branchId) => {
    if (branchId === "ALL") {
      set({ expenses: [] });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(
        `/admin/finance/expenses?branchId=${branchId}`
      );
      set({ expenses: response.data.expenses || [], isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error:
          error.response?.data?.message || "Lỗi tải danh sách chi phí",
      });
    }
  },

  createExpense: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/admin/finance/expenses", data);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Lỗi tạo chi phí",
      });
      throw error;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/admin/finance/expenses/${id}`);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Lỗi xóa chi phí",
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
