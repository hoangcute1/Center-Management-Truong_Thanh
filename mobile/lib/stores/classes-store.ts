import { create } from "zustand";
import api from "@/lib/api";
import { translateErrorMessage } from "./auth-store";

export interface Class {
  _id: string;
  name: string;
  subject: string;
  branchId: string;
  teacherId: string;
  studentIds: string[];
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  startDate: Date;
  endDate: Date;
  maxStudents: number;
  tuitionFee: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ClassesState {
  classes: Class[];
  currentClass: Class | null;
  isLoading: boolean;
  error: string | null;

  fetchClasses: (branchId?: string) => Promise<void>;
  fetchClassById: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useClassesStore = create<ClassesState>((set) => ({
  classes: [],
  currentClass: null,
  isLoading: false,
  error: null,

  fetchClasses: async (branchId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = branchId ? { branchId } : {};
      const response = await api.get("/classes", { params });
      set({ classes: response.data, isLoading: false });
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tải danh sách lớp học"
      );
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchClassById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/classes/${id}`);
      set({ currentClass: response.data, isLoading: false });
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tải thông tin lớp học"
      );
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
