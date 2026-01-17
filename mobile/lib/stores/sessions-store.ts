import { create } from "zustand";
import api from "@/lib/api";
import { translateErrorMessage } from "./auth-store";

export interface Session {
  _id: string;
  classId?: {
    _id: string;
    name: string;
    subject?: string;
  };
  teacherId?: {
    _id: string;
    fullName: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  topic?: string;
  status?: "scheduled" | "completed" | "cancelled";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SessionsState {
  sessions: Session[];
  selectedSession: Session | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSessions: (params?: {
    classId?: string;
    teacherId?: string;
    date?: string;
    status?: string;
  }) => Promise<void>;
  fetchSessionById: (id: string) => Promise<Session>;
  createSession: (data: Partial<Session>) => Promise<Session>;
  updateSession: (id: string, data: Partial<Session>) => Promise<void>;
  setSelectedSession: (session: Session | null) => void;
  clearError: () => void;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  selectedSession: null,
  isLoading: false,
  error: null,

  fetchSessions: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/sessions", { params });
      const data = response.data.data || response.data || [];
      set({
        sessions: Array.isArray(data) ? data : [],
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tải danh sách buổi học"
      );
      set({ error: errorMessage, isLoading: false, sessions: [] });
    }
  },

  fetchSessionById: async (id: string) => {
    try {
      const response = await api.get(`/sessions/${id}`);
      const session = response.data;
      set({ selectedSession: session });
      return session;
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tải chi tiết buổi học"
      );
      throw new Error(errorMessage);
    }
  },

  createSession: async (data: Partial<Session>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/sessions", data);
      const newSession = response.data;

      set((state) => ({
        sessions: [...state.sessions, newSession],
        isLoading: false,
      }));

      return newSession;
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tạo buổi học"
      );
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateSession: async (id: string, data: Partial<Session>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/sessions/${id}`, data);
      const updatedSession = response.data;

      set((state) => ({
        sessions: state.sessions.map((s) =>
          s._id === id ? updatedSession : s
        ),
        selectedSession:
          state.selectedSession?._id === id
            ? updatedSession
            : state.selectedSession,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể cập nhật buổi học"
      );
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  setSelectedSession: (session) => set({ selectedSession: session }),

  clearError: () => set({ error: null }),
}));
