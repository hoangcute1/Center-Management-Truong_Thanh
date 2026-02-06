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

export interface UploadDocumentDto {
    file: any; // expo-document-picker result
    title: string;
    description?: string;
    classIds?: string[];
    visibility: 'class' | 'community';
}

export interface DocumentsApiModule {
    getMyDocuments: () => Promise<Document[]>;
    getForStudent: () => Promise<Document[]>;
    incrementDownload: (id: string) => Promise<void>;
    uploadDocument: (data: UploadDocumentDto) => Promise<Document>;
    deleteDocument: (id: string) => Promise<void>;
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

    // Upload tài liệu mới (teacher only)
    uploadDocument: async (data: UploadDocumentDto): Promise<Document> => {
        const formData = new FormData();

        // Append file
        formData.append('file', {
            uri: data.file.uri,
            type: data.file.mimeType || 'application/octet-stream',
            name: data.file.name || 'document',
        } as any);

        // Append other fields
        formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        formData.append('visibility', data.visibility);
        if (data.classIds && data.classIds.length > 0) {
            data.classIds.forEach((id) => formData.append('classIds', id));
        }

        const response = await api.post('/documents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Xóa tài liệu
    deleteDocument: async (id: string): Promise<void> => {
        await api.delete(`/documents/${id}`);
    },

    axiosInstance: api,
};

export default documentsApi;

