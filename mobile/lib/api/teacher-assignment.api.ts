// API service for teacher assignments (Mobile)
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface Assignment {
  _id: string;
  title: string;
  description?: string;
  classId: {
    _id: string;
    name: string;
  };
  subjectId?: {
    _id: string;
    name: string;
  };
  type: 'assignment' | 'test';
  dueDate: string;
  maxScore: number;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export interface Submission {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  assignmentId: string;
  fileUrl: string;
  submittedAt: string;
  status: 'submitted' | 'late';
  graded: boolean;
  grade?: number;
  maxScore?: number;
}

class TeacherAssignmentAPI {
  private async getToken() {
    return await AsyncStorage.getItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async getMyAssignments(): Promise<Assignment[]> {
    return this.request('/assignments');
  }

  async createAssignment(data: any): Promise<Assignment> {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSubmissions(assignmentId: string): Promise<Submission[]> {
    return this.request(`/submissions/assignment/${assignmentId}`);
  }

  async gradeSubmission(submissionId: string, score: number, feedback?: string): Promise<any> {
    return this.request('/grades/assignment', {
      method: 'POST',
      body: JSON.stringify({ submissionId, score, feedback }),
    });
  }

  async getMyClasses(): Promise<any[]> {
    return this.request('/classes?teacherId=me');
  }
}

export const teacherAssignmentAPI = new TeacherAssignmentAPI();
