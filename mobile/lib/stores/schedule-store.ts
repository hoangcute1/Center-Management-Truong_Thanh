import { create } from "zustand";
import api from "@/lib/api";
import { translateErrorMessage } from "./auth-store";

export interface Session {
  _id: string;
  classId: string;
  date: Date;
  startTime: string;
  endTime: string;
  topic?: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: Date;
}

export interface ScheduleItem {
  _id: string;
  classId: string;
  className: string;
  subject: string;
  teacherName: string;
  date: Date;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}

interface ScheduleState {
  sessions: Session[];
  schedule: ScheduleItem[];
  isLoading: boolean;
  error: string | null;

  fetchSchedule: (params?: {
    classId?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
  fetchMySessions: () => Promise<void>;
  clearError: () => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  sessions: [],
  schedule: [],
  isLoading: false,
  error: null,

  fetchSchedule: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/sessions", { params });
      set({ schedule: response.data, isLoading: false });
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tải lịch học"
      );
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchMySessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/sessions/my-sessions");
      set({ sessions: response.data, isLoading: false });
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tải buổi học"
      );
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
