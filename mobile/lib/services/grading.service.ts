import api from "../api";

export type GradeCategory = 'test_15p' | 'test_30p' | 'giua_ky' | 'cuoi_ky' | 'khac';

export const GRADE_CATEGORY_LABELS: Record<GradeCategory, string> = {
  'test_15p': 'Kiểm tra 15 phút',
  'test_30p': 'Kiểm tra 30 phút',
  'giua_ky': 'Giữa kỳ',
  'cuoi_ky': 'Cuối kỳ',
  'khac': 'Khác',
};

export interface GradingSheetInfo {
  _id: string;
  title: string;
  category: string;
}

export interface GradingSheet {
  _id: string;
  title: string;
  description?: string;
  classId: {
    _id: string;
    name: string;
  };
  category: GradeCategory;
  maxScore: number;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export interface StudentGrade {
  _id: string;
  name: string;
  email: string;
  studentCode?: string;
  score: number | null;
  feedback: string | null;
  graded: boolean;
  gradedAt: string | null;
}

export interface GradingSheetWithStudents {
  gradingSheet: GradingSheet;
  students: StudentGrade[];
  summary: {
    total: number;
    graded: number;
    pending: number;
  };
}

export interface CreateGradingSheetDto {
  title: string;
  description?: string;
  classId: string;
  category: GradeCategory;
  maxScore: number;
}

export interface BulkGradeDto {
  grades: {
    studentId: string;
    score: number;
    feedback?: string;
  }[];
}

export interface StudentGradeRecord {
  _id: string;
  studentId: string;
  classId: {
    _id: string;
    name: string;
  };
  gradingSheetId?: GradingSheetInfo;
  assignmentId?: any;
  score: number;
  maxScore: number;
  type: string;
  category: string;
  gradedBy?: {
    _id: string;
    name: string;
  };
  gradedAt: string;
  feedback?: string;
}

export interface ClassRankingItem {
  studentId: string;
  studentName: string;
  studentCode?: string;
  avatar?: string;
  averageScore: number;
  totalGrades: number;
  rank: number;
}

export interface StudentRankInfo {
  rank: number | null;
  totalStudents: number;
  averageScore: number;
  totalGrades: number;
}

export const gradingService = {
  // Student methods
  getMyGrades: async (studentId: string): Promise<StudentGradeRecord[]> => {
    const response = await api.get(`/grades/student/${studentId}`);
    return response.data;
  },

  getMyStats: async (studentId: string) => {
    const response = await api.get(`/grades/student/${studentId}/stats`);
    return response.data;
  },

  getClassRanking: async (classId: string): Promise<ClassRankingItem[]> => {
    const response = await api.get(`/grades/class/${classId}/ranking`);
    return response.data;
  },

  getStudentRankInClass: async (
    studentId: string,
    classId: string,
  ): Promise<StudentRankInfo> => {
    const response = await api.get(
      `/grades/student/${studentId}/class/${classId}/rank`,
    );
    return response.data;
  },

  // Teacher methods
  getGradingSheets: async (): Promise<GradingSheet[]> => {
    const response = await api.get('/grades/sheets');
    return response.data;
  },

  createGradingSheet: async (data: CreateGradingSheetDto): Promise<GradingSheet> => {
    const response = await api.post('/grades/sheets', data);
    return response.data;
  },

  getGradingSheetWithStudents: async (id: string): Promise<GradingSheetWithStudents> => {
    const response = await api.get(`/grades/sheets/${id}`);
    return response.data;
  },

  bulkGradeStudents: async (gradingSheetId: string, data: BulkGradeDto): Promise<any> => {
    const response = await api.post(`/grades/sheets/${gradingSheetId}/grade`, data);
    return response.data;
  },
};

