import { create } from "zustand";
import api from "@/lib/api";

const calculatePercentage = (score?: number, maxScore?: number) => {
  if (typeof score !== "number" || typeof maxScore !== "number" || maxScore === 0) {
    return null;
  }
  return (score / maxScore) * 100;
};

export interface Assessment {
  _id: string;
  id?: string;
  studentId: string;
  classId: string;
  type: "assignment" | "test" | string;
  title: string;
  score: number;
  maxScore: number;
  weight?: number | null;
  percentage?: number | null;
  feedback?: string;
  assessedBy: string;
  assessedAt: string;
  createdAt: string;
  // Populated
  student?: {
    _id: string;
    name: string;
  };
  class?: {
    _id: string;
    name: string;
  };
}

interface AssessmentsState {
  assessments: Assessment[];
  isLoading: boolean;
  error: string | null;
  statistics: {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    totalAssessments: number;
    byType: Record<string, { count: number; average: number }>;
  } | null;
}

interface AssessmentsActions {
  fetchAssessments: (params?: FetchAssessmentsParams) => Promise<void>;
  createAssessment: (data: CreateAssessmentData) => Promise<Assessment>;
  updateAssessment: (
    id: string,
    data: UpdateAssessmentData
  ) => Promise<Assessment>;
  deleteAssessment: (id: string) => Promise<void>;
  fetchStatistics: (params: FetchStatisticsParams) => Promise<void>;
  clearError: () => void;
}

interface FetchAssessmentsParams {
  studentId?: string;
  classId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

interface CreateAssessmentData {
  studentId: string;
  classId: string;
  type: "assignment" | "test" | string;
  title: string;
  score: number;
  maxScore: number;
  weight: number;
  feedback?: string;
}

interface UpdateAssessmentData {
  score?: number;
  maxScore?: number;
  weight?: number;
  feedback?: string;
  title?: string;
}

interface FetchStatisticsParams {
  studentId?: string;
  classId?: string;
  startDate?: string;
  endDate?: string;
}

export const useAssessmentsStore = create<
  AssessmentsState & AssessmentsActions
>((set, get) => ({
  // State
  assessments: [],
  isLoading: false,
  error: null,
  statistics: null,

  // Actions
  fetchAssessments: async (params?: FetchAssessmentsParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/assessments", { params });
      const assessments = Array.isArray(response.data)
        ? response.data
        : response.data.assessments || [];

      set({
        assessments: assessments.map((a: Assessment) => ({
          ...a,
          id: a._id,
          percentage: calculatePercentage(a.score, a.maxScore) ?? null,
        })),
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi tải danh sách đánh giá";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  createAssessment: async (data: CreateAssessmentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/assessments", data);
      const newAssessment = {
        ...response.data,
        id: response.data._id,
        percentage: calculatePercentage(response.data.score, response.data.maxScore) ?? null,
      };

      set((state) => ({
        assessments: [...state.assessments, newAssessment],
        isLoading: false,
      }));

      return newAssessment;
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi khi tạo đánh giá";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  updateAssessment: async (id: string, data: UpdateAssessmentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/assessments/${id}`, data);
      const updatedAssessment = {
        ...response.data,
        id: response.data._id,
        percentage: calculatePercentage(response.data.score, response.data.maxScore) ?? null,
      };

      set((state) => ({
        assessments: state.assessments.map((a) =>
          a._id === id ? updatedAssessment : a
        ),
        isLoading: false,
      }));

      return updatedAssessment;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi cập nhật đánh giá";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  deleteAssessment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/assessments/${id}`);

      set((state) => ({
        assessments: state.assessments.filter((a) => a._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi khi xóa đánh giá";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  fetchStatistics: async (params: FetchStatisticsParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/assessments/statistics", { params });
      set({
        statistics: response.data,
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi tải thống kê điểm";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
