import { create } from "zustand";
import { api } from "../api";

// Types
export interface EvaluationCriteria {
  teachingQuality: number;
  communication: number;
  punctuality: number;
  materialPreparation: number;
  studentInteraction: number;
}

export interface CreateFeedbackDto {
  teacherId: string;
  classId?: string;
  evaluationPeriodId?: string;
  rating: number;
  criteria?: EvaluationCriteria;
  comment?: string;
  anonymous?: boolean;
  status?: "draft" | "submitted";
}

export interface PendingEvaluation {
  classId: string;
  className: string;
  periodId: string;
  periodName: string;
  teacher: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface ActivePeriod {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  branchName?: string;
}

export interface TeacherRating {
  feedbacks: {
    _id: string;
    rating: number;
    criteria?: EvaluationCriteria;
    comment?: string;
    className?: string;
    periodName?: string;
    createdAt: string;
  }[];
  stats: {
    averageRating: number;
    averageCriteria: EvaluationCriteria | null;
  };
  totalFeedbacks: number;
}

// Labels for criteria in Vietnamese
export const CRITERIA_LABELS: Record<keyof EvaluationCriteria, string> = {
  teachingQuality: "Chất lượng giảng dạy",
  communication: "Khả năng giao tiếp",
  punctuality: "Đúng giờ",
  materialPreparation: "Chuẩn bị bài giảng",
  studentInteraction: "Tương tác với học sinh",
};

interface FeedbackState {
  pendingEvaluations: PendingEvaluation[];
  activePeriods: ActivePeriod[];
  myRatings: TeacherRating | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchPendingEvaluations: () => Promise<void>;
  fetchMyRatings: () => Promise<void>;
  submitFeedback: (dto: CreateFeedbackDto) => Promise<void>;
  reset: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  pendingEvaluations: [],
  activePeriods: [],
  myRatings: null,
  loading: false,
  error: null,

  fetchPendingEvaluations: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/feedback/pending");
      set({
        pendingEvaluations: response.data.pendingEvaluations || [],
        activePeriods: response.data.activePeriods || [],
        loading: false,
      });
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || "Không thể tải danh sách đánh giá",
        loading: false,
      });
    }
  },

  fetchMyRatings: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/feedback/my-ratings");
      set({
        myRatings: response.data,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Không thể tải đánh giá",
        loading: false,
      });
    }
  },

  submitFeedback: async (dto: CreateFeedbackDto) => {
    set({ loading: true, error: null });
    try {
      await api.post("/feedback", dto);
      // Reload pending evaluations after submitting
      await get().fetchPendingEvaluations();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Không thể gửi đánh giá",
        loading: false,
      });
      throw error;
    }
  },

  reset: () => {
    set({
      pendingEvaluations: [],
      activePeriods: [],
      myRatings: null,
      loading: false,
      error: null,
    });
  },
}));
