// API service for teacher grading sheets

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export type GradeCategory = 'test_15p' | 'test_30p' | 'giua_ky' | 'cuoi_ky' | 'khac';

export const GRADE_CATEGORY_LABELS: Record<GradeCategory, string> = {
    'test_15p': 'Kiểm tra 15 phút',
    'test_30p': 'Kiểm tra 30 phút',
    'giua_ky': 'Giữa kỳ',
    'cuoi_ky': 'Cuối kỳ',
    'khac': 'Khác',
};

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

class TeacherGradingService {
    private getToken() {
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

        try {
            const response = await fetch(fullUrl, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
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
                    error = { message: rawText || 'Request failed' };
                }
                throw new Error(error.message || `Request failed with status ${response.status}`);
            }

            try {
                return JSON.parse(rawText);
            } catch {
                return rawText;
            }
        } catch (error: any) {
            if (error.message && !error.message.includes('failed with status')) {
                throw new Error(`Network error: ${error.message}. Check if backend is running.`);
            }
            throw error;
        }
    }

    // Get teacher's grading sheets
    async getGradingSheets(): Promise<GradingSheet[]> {
        return this.request('/grades/sheets');
    }

    // Create new grading sheet
    async createGradingSheet(data: CreateGradingSheetDto): Promise<GradingSheet> {
        return this.request('/grades/sheets', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Get grading sheet with students
    async getGradingSheetWithStudents(id: string): Promise<GradingSheetWithStudents> {
        return this.request(`/grades/sheets/${id}`);
    }

    // Bulk grade students
    async bulkGradeStudents(gradingSheetId: string, data: BulkGradeDto): Promise<any> {
        return this.request(`/grades/sheets/${gradingSheetId}/grade`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Get teacher's classes (for selection)
    async getMyClasses(): Promise<any[]> {
        return this.request('/classes');
    }

    // Get student grades in a class
    async getStudentGradesInClass(studentId: string, classId: string): Promise<any[]> {
        return this.request(`/grades/student/${studentId}/class/${classId}`);
    }

    // Get student grades
    async getStudentGrades(studentId: string): Promise<any[]> {
        return this.request(`/grades/student/${studentId}`);
    }
}

export const teacherGradingService = new TeacherGradingService();
