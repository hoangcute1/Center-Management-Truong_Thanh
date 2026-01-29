// API service for teacher assignments and grading

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

export interface CreateAssignmentDto {
  title: string;
  description?: string;
  classId: string;
  subjectId?: string;
  type: 'assignment' | 'test';
  dueDate: string;
  maxScore: number;
}

export interface GradeSubmissionDto {
  submissionId: string;
  score: number;
  feedback?: string;
}

class TeacherAssignmentService {
  private getToken() {
    // Zustand persist stores data under "auth-storage" key as JSON
    const authStorage = localStorage.getItem('auth-storage');
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
    
    // Log request details
    console.log('🔍 API Request:', {
      url: fullUrl,
      method: options.method || 'GET',
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
    });

    // Log request body if present
    if (options.body) {
      console.log('📤 Request Body:', options.body);
      try {
        console.log('📤 Parsed Body:', JSON.parse(options.body as string));
      } catch {
        // Body is not JSON
      }
    }

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      // Read raw response
      const rawText = await response.text();
      
      console.log('🔥 API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        rawBody: rawText,
      });

      if (!response.ok) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          responseBody: rawText,
        };
        
        console.error('❌ API Error Details:');
        console.error('Status:', errorDetails.status);
        console.error('Status Text:', errorDetails.statusText);
        console.error('URL:', errorDetails.url);
        console.error('Response Body:', errorDetails.responseBody);
        console.error('Full Error:', JSON.stringify(errorDetails, null, 2));
        
        let error;
        try {
          error = JSON.parse(rawText);
        } catch {
          error = { message: rawText || 'Request failed' };
        }
        
        throw new Error(error.message || `Request failed with status ${response.status}`);
      }

      // Parse successful response
      try {
        return JSON.parse(rawText);
      } catch {
        console.warn('⚠️ Response is not JSON:', rawText);
        return rawText;
      }
    } catch (error: any) {
      // Network error or fetch failed
      if (error.message && !error.message.includes('failed with status')) {
        console.error('🚨 Network Error:', {
          message: error.message,
          url: fullUrl,
          type: 'Network/CORS Error',
        });
        throw new Error(`Network error: ${error.message}. Check if backend is running.`);
      }
      throw error;
    }
  }

  // Get assignments created by current teacher
  async getMyAssignments(classId?: string): Promise<Assignment[]> {
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    
    const endpoint = `/assignments${params.toString() ? `?${params}` : ''}`;
    return this.request(endpoint);
  }

  // Create new assignment
  async createAssignment(data: CreateAssignmentDto): Promise<Assignment> {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get submissions for an assignment
  async getSubmissions(assignmentId: string): Promise<Submission[]> {
    return this.request(`/submissions/assignment/${assignmentId}`);
  }

  // Grade a submission
  async gradeSubmission(data: GradeSubmissionDto): Promise<any> {
    return this.request('/grades/assignment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get teacher's classes (for filter)
  async getMyClasses(): Promise<any[]> {
    return this.request('/classes');
  }
}

export const teacherAssignmentService = new TeacherAssignmentService();
