import { create } from "zustand";
import { api } from "@/lib/api";

export interface ScoreLeaderboardItem {
  rank: number;
  studentId: string;
  studentName: string;
  studentCode?: string;
  avatarUrl?: string;
  averageScore: number;
  totalGrades: number;
  className?: string;
}

export interface AttendanceLeaderboardItem {
  rank: number;
  studentId: string;
  studentName: string;
  studentCode?: string;
  avatarUrl?: string;
  attendanceRate: number;
  presentCount: number;
  totalSessions: number;
  daysEnrolled: number;
}

export interface LeaderboardSummary {
  totalStudents: number;
  averageScore: number;
  averageAttendanceRate: number;
}

export interface LeaderboardResponse {
  score: ScoreLeaderboardItem[];
  attendance: AttendanceLeaderboardItem[];
  summary: LeaderboardSummary;
}

export interface MyRankResponse {
  scoreRank: number | null;
  attendanceRank: number | null;
  totalStudents: number;
}

interface LeaderboardState {
  // Data
  leaderboard: LeaderboardResponse | null;
  myRank: MyRankResponse | null;

  // Loading & Error states
  loading: boolean;
  error: string | null;

  // Actions
  fetchLeaderboard: (params?: {
    branchId?: string;
    classId?: string;
    limit?: number;
  }) => Promise<void>;

  fetchTeacherLeaderboard: (params?: {
    classId?: string;
    limit?: number;
  }) => Promise<void>;

  fetchMyRank: () => Promise<void>;

  clearError: () => void;
  reset: () => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  leaderboard: null,
  myRank: null,
  loading: false,
  error: null,

  fetchLeaderboard: async (params) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params?.branchId) queryParams.append("branchId", params.branchId);
      if (params?.classId) queryParams.append("classId", params.classId);
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const query = queryParams.toString();
      const url = `/grades/leaderboard${query ? `?${query}` : ""}`;

      const res = await api.get(url);
      set({ leaderboard: res.data, loading: false });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Lỗi khi tải bảng xếp hạng";
      set({ error: message, loading: false });
    }
  },

  fetchTeacherLeaderboard: async (params) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params?.classId) queryParams.append("classId", params.classId);
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const query = queryParams.toString();
      const url = `/grades/leaderboard/teacher${query ? `?${query}` : ""}`;

      const res = await api.get(url);
      set({ leaderboard: res.data, loading: false });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Lỗi khi tải bảng xếp hạng";
      set({ error: message, loading: false });
    }
  },

  fetchMyRank: async () => {
    try {
      const res = await api.get("/grades/leaderboard/my-rank");
      set({ myRank: res.data });
    } catch (error: any) {
      console.error("Failed to fetch my rank:", error);
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      leaderboard: null,
      myRank: null,
      loading: false,
      error: null,
    }),
}));
