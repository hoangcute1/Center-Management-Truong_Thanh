import api from "@/lib/api";

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

export interface Feedback {
  _id: string;
  teacherId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  studentId?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  classId?: {
    _id: string;
    name: string;
    branchId?: string;
  };
  evaluationPeriodId?: {
    _id: string;
    name: string;
    branchId?: string;
  };
  rating: number;
  criteria?: EvaluationCriteria;
  comment?: string;
  anonymous: boolean;
  status: "draft" | "submitted";
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
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

export interface PendingEvaluationsResponse {
  activePeriods: {
    _id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    branchName: string;
  }[];
  pendingEvaluations: PendingEvaluation[];
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

export interface TeacherStatistic {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherAvatar?: string;
  averageRating: number;
  totalFeedbacks: number;
  avgTeachingQuality: number;
  avgCommunication: number;
  avgPunctuality: number;
  avgMaterialPreparation: number;
  avgStudentInteraction: number;
}

export interface ClassStatistic {
  classId: string;
  className: string;
  branchId?: string;
  branchName?: string;
  teacherId?: string;
  teacherName?: string;
  teacherAvatar?: string;
  totalStudents: number;
  totalEvaluated: number;
  evaluationRate: number;
  averageRating: number;
  feedbacks: {
    _id: string;
    rating: number;
    criteria?: EvaluationCriteria;
    comment?: string;
    studentId?: string;
    studentName?: string;
    createdAt: string;
  }[];
}

export interface EvaluationPeriod {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  branchId?: { _id: string; name: string };
  classIds: { _id: string; name: string }[];
  teacherIds: { _id: string; name: string; email: string }[];
  status: "draft" | "active" | "closed";
  createdBy: { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluationPeriodDto {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  branchId?: string; // Optional - empty = all branches
  classIds?: string[];
  teacherIds?: string[];
  status?: "draft" | "active" | "closed";
}

export interface UpdateEvaluationPeriodDto {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  classIds?: string[];
  teacherIds?: string[];
  status?: "draft" | "active" | "closed";
}

// Criteria labels in Vietnamese
export const CRITERIA_LABELS: Record<keyof EvaluationCriteria, string> = {
  teachingQuality: "Chất lượng giảng dạy",
  communication: "Khả năng giao tiếp",
  punctuality: "Đúng giờ",
  materialPreparation: "Chuẩn bị bài giảng",
  studentInteraction: "Tương tác với học sinh",
};

class FeedbackService {
  // ==================== FEEDBACK ====================

  async createFeedback(dto: CreateFeedbackDto): Promise<Feedback> {
    const response = await api.post("/feedback", dto);
    return response.data;
  }

  async getPendingEvaluations(): Promise<PendingEvaluationsResponse> {
    const response = await api.get("/feedback/pending");
    return response.data;
  }

  async getMyRatings(): Promise<TeacherRating> {
    const response = await api.get("/feedback/my-ratings");
    return response.data;
  }

  async getStatistics(filters?: {
    periodId?: string;
    branchId?: string;
  }): Promise<TeacherStatistic[]> {
    const params: Record<string, string> = {};
    if (filters?.periodId) params.periodId = filters.periodId;
    if (filters?.branchId) params.branchId = filters.branchId;
    const response = await api.get("/feedback/statistics", { params });
    return response.data;
  }

  async getStatisticsByClass(filters?: {
    periodId?: string;
    branchId?: string;
  }): Promise<ClassStatistic[]> {
    const params: Record<string, string> = {};
    if (filters?.periodId) params.periodId = filters.periodId;
    if (filters?.branchId) params.branchId = filters.branchId;
    const response = await api.get("/feedback/statistics/by-class", { params });
    return response.data;
  }

  async getAllFeedbacks(filters?: {
    teacherId?: string;
    periodId?: string;
    branchId?: string;
    classId?: string;
  }): Promise<Feedback[]> {
    const params: Record<string, string> = {};
    if (filters?.teacherId) params.teacherId = filters.teacherId;
    if (filters?.periodId) params.periodId = filters.periodId;
    if (filters?.branchId) params.branchId = filters.branchId;
    if (filters?.classId) params.classId = filters.classId;
    const response = await api.get("/feedback", { params });
    return response.data;
  }

  // ==================== EVALUATION PERIODS ====================

  async createEvaluationPeriod(
    dto: CreateEvaluationPeriodDto,
  ): Promise<EvaluationPeriod> {
    const response = await api.post("/feedback/periods", dto);
    return response.data;
  }

  async getEvaluationPeriods(branchId?: string): Promise<EvaluationPeriod[]> {
    const params = branchId ? { branchId } : {};
    const response = await api.get("/feedback/periods", { params });
    return response.data;
  }

  async getActiveEvaluationPeriods(): Promise<EvaluationPeriod[]> {
    const response = await api.get("/feedback/periods/active");
    return response.data;
  }

  async getEvaluationPeriod(id: string): Promise<EvaluationPeriod> {
    const response = await api.get(`/feedback/periods/${id}`);
    return response.data;
  }

  async updateEvaluationPeriod(
    id: string,
    dto: UpdateEvaluationPeriodDto,
  ): Promise<EvaluationPeriod> {
    const response = await api.patch(`/feedback/periods/${id}`, dto);
    return response.data;
  }

  async deleteEvaluationPeriod(id: string): Promise<void> {
    await api.delete(`/feedback/periods/${id}`);
  }
}

export const feedbackService = new FeedbackService();
