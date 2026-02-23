// API service for student grading

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface GradingSheetInfo {
  _id: string;
  title: string;
  category: string;
}

export interface StudentGradeRecord {
  _id: string;
  studentId: string;
  classId: {
    _id: string;
    name: string;
  };
  gradingSheetId?: GradingSheetInfo; // For new grading system
  assignmentId?: any; // For backward compatibility
  score: number;
  maxScore: number;
  type: string;
  category: string;
  gradedBy: {
    _id: string;
    name: string;
  };
  gradedAt: string;
  feedback?: string;
}

class StudentGradingService {
  private getToken() {
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.accessToken || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const fullUrl = `${API_BASE}${endpoint}`;

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      const rawText = await response.text();

      if (!response.ok) {
        let error;
        try {
          error = JSON.parse(rawText);
        } catch {
          error = { message: rawText || "Request failed" };
        }
        throw new Error(
          error.message || `Request failed with status ${response.status}`,
        );
      }

      try {
        return JSON.parse(rawText);
      } catch {
        return rawText;
      }
    } catch (error: any) {
      if (error.message && !error.message.includes("failed with status")) {
        throw new Error(
          `Network error: ${error.message}. Check if backend is running.`,
        );
      }
      throw error;
    }
  }

  // Get my grades
  async getMyGrades(studentId: string): Promise<StudentGradeRecord[]> {
    return this.request(`/grades/student/${studentId}`);
  }

  // Get my stats
  async getMyStats(studentId: string): Promise<any> {
    return this.request(`/grades/student/${studentId}/stats`);
  }

  // Get class ranking
  async getClassRanking(classId: string): Promise<ClassRankingItem[]> {
    return this.request(`/grades/class/${classId}/ranking`);
  }

  // Get student rank in class
  async getStudentRankInClass(
    studentId: string,
    classId: string,
  ): Promise<StudentRankInfo> {
    return this.request(`/grades/student/${studentId}/class/${classId}/rank`);
  }
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

export const studentGradingService = new StudentGradingService();
