import { create } from "zustand";
import api from "@/lib/api";
import { translateErrorMessage } from "./auth-store";

export interface AttendanceRecord {
  _id: string;
  sessionId: string;
  studentId:
    | string
    | {
        _id: string;
        fullName: string;
      };
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  createdAt: Date;
}

interface AttendanceState {
  attendance: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;

  fetchAttendance: (params?: {
    sessionId?: string;
    studentId?: string;
  }) => Promise<void>;
  fetchSessionAttendance: (sessionId: string) => Promise<AttendanceRecord[]>;
  updateAttendance: (
    sessionId: string,
    studentId: string,
    status: AttendanceRecord["status"]
  ) => Promise<void>;
  clearError: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendance: [],
  isLoading: false,
  error: null,

  fetchAttendance: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/attendance", { params });
      set({ attendance: response.data, isLoading: false });
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tải điểm danh"
      );
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchSessionAttendance: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/attendance/session/${sessionId}`);
      const data = response.data.data || response.data || [];
      set({ attendance: data, isLoading: false });
      return data;
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tải điểm danh buổi học"
      );
      set({ error: errorMessage, isLoading: false });
      return [];
    }
  },

  updateAttendance: async (sessionId, studentId, status) => {
    try {
      await api.post("/attendance", { sessionId, studentId, status });
      // Refresh attendance after update
      await get().fetchAttendance({ sessionId });
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể cập nhật điểm danh"
      );
      set({ error: errorMessage });
    }
  },

  clearError: () => set({ error: null }),
}));
