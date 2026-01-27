import api from '../api';

export interface Document {
    _id: string;
    title: string;
    description?: string;
    fileUrl: string;
    originalFileName?: string;
    ownerTeacherId: {
        _id: string;
        name: string;
        email: string;
    };
    classIds: Array<{
        _id: string;
        name: string;
        subject?: string;
    }>;
    visibility: 'class' | 'community';
    downloadCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface DocumentsApiModule {
    getMyDocuments: () => Promise<Document[]>;
    getForStudent: () => Promise<Document[]>;
    incrementDownload: (id: string) => Promise<void>;
    axiosInstance: any;
}

const documentsApi: DocumentsApiModule = {
    // Lấy tài liệu của giáo viên
    getMyDocuments: async (): Promise<Document[]> => {
        const response = await api.get('/documents/my');
        return response.data;
    },

    // Lấy tài liệu cho học sinh
    getForStudent: async (): Promise<Document[]> => {
        const response = await api.get('/documents/for-student');
        return response.data;
    },

    // Tăng download count
    incrementDownload: async (id: string): Promise<void> => {
        await api.patch(`/documents/${id}/download`);
    },
    axiosInstance: api,
};

export default documentsApi;
