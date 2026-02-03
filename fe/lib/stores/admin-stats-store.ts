import { create } from "zustand";
import api from "@/lib/api";

export interface OverviewStats {
  students: {
    total: number;
    newThisMonth: number;
    trend: string;
  };
  teachers: {
    total: number;
    active: number;
  };
  classes: {
    total: number;
    active: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    trend: string;
  };
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
}

export interface StudentsBySubject {
  name: string;
  value: number;
}

export interface DashboardOverviewResponse {
  overview: OverviewStats;
  attendanceRate: number;
  averageScore: number;
  newStudentsThisMonth: number;
  revenueByMonth: RevenueByMonth[];
  studentsBySubject: StudentsBySubject[];
}

interface AdminStatsState {
  // Data
  dashboardData: DashboardOverviewResponse | null;

  // Loading & Error states
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboardOverview: (branchId?: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useAdminStatsStore = create<AdminStatsState>((set) => ({
  dashboardData: null,
  loading: false,
  error: null,

  fetchDashboardOverview: async (branchId) => {
    set({ loading: true, error: null });
    try {
      const params = branchId ? `?branchId=${branchId}` : "";
      const res = await api.get(`/admin/stats/overview${params}`);
      set({ dashboardData: res.data, loading: false });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Lỗi khi tải dữ liệu thống kê";
      set({ error: message, loading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      dashboardData: null,
      loading: false,
      error: null,
    }),
}));
