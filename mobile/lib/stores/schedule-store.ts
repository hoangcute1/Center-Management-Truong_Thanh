import { create } from "zustand";
import api from "@/lib/api";
import { translateErrorMessage } from "./auth-store";

export interface Session {
  _id: string;
  classId:
    | string
    | {
        _id: string;
        name: string;
        subject?: string;
      };
  startTime: string;
  endTime: string;
  topic?: string;
  notes?: string;
  note?: string;
  status: "pending" | "approved" | "cancelled";
  type?: "regular" | "makeup" | "exam";
  room?: string;
  createdAt?: string;
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
  attendanceStatus?: string;
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
  fetchTeacherSchedule: (
    teacherId: string,
    startDate: string,
    endDate: string
  ) => Promise<void>;
  fetchStudentSchedule: (
    studentId: string,
    startDate: string,
    endDate: string
  ) => Promise<void>;
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

  fetchTeacherSchedule: async (
    teacherId: string,
    startDate: string,
    endDate: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(
        `/sessions/teacher/${teacherId}?startDate=${startDate}&endDate=${endDate}`
      );
      set({ sessions: response.data, isLoading: false });
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tải lịch dạy"
      );
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchStudentSchedule: async (
    studentId: string,
    startDate: string,
    endDate: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(
        `/sessions/student/${studentId}?startDate=${startDate}&endDate=${endDate}`
      );
      set({ sessions: response.data, isLoading: false });
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tải lịch học"
      );
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
