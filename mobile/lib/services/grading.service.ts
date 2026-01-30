import api from '../api';

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

export const gradingService = {
    getMyGrades: async (studentId: string): Promise<StudentGradeRecord[]> => {
        const response = await api.get(`/grades/student/${studentId}`);
        return response.data;
    },

    getMyStats: async (studentId: string) => {
        const response = await api.get(`/grades/student/${studentId}/stats`);
        return response.data;
    }
};
