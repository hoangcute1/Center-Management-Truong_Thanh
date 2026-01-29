// Documents Store - Quản lý tài liệu học tập
import { create } from "zustand";
import api from "@/lib/api";

export type DocumentVisibility = "class" | "community";

export interface DocumentClass {
  _id: string;
  name: string;
  subject?: string;
}

export interface DocumentOwner {
  _id: string;
  name: string;
  email: string;
}

export interface Document {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  originalFileName?: string;
  ownerTeacherId: DocumentOwner;
  classIds: DocumentClass[];
  visibility: DocumentVisibility;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentDto {
  title: string;
  description?: string;
  fileUrl?: string;
  classIds?: string[];
  visibility?: DocumentVisibility;
  branchId?: string;
}

export interface UploadDocumentDto {
  title: string;
  description?: string;
  classIds?: string[];
  visibility?: DocumentVisibility;
}

export interface UpdateDocumentDto extends Partial<CreateDocumentDto> { }

interface DocumentsState {
  documents: Document[];
  communityDocuments: Document[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMyDocuments: () => Promise<void>;
  fetchForStudent: () => Promise<void>;
  fetchCommunityDocuments: () => Promise<void>;
  fetchByClass: (classId: string) => Promise<Document[]>;
  uploadDocument: (file: File, data: UploadDocumentDto) => Promise<Document>;
  createDocument: (data: CreateDocumentDto) => Promise<Document>;
  updateDocument: (id: string, data: UpdateDocumentDto) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  shareToCommunity: (id: string) => Promise<Document>;
  restrictToClass: (id: string) => Promise<Document>;
  incrementDownload: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  communityDocuments: [],
  isLoading: false,
  error: null,

  fetchMyDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/documents/my");
      set({ documents: response.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi khi tải tài liệu";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchForStudent: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/documents/for-student");
      set({ documents: response.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi khi tải tài liệu";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchCommunityDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/documents/community");
      set({ communityDocuments: response.data, isLoading: false });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi tải tài liệu cộng đồng";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchByClass: async (classId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/documents/class/${classId}`);
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi tải tài liệu lớp";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  uploadDocument: async (file: File, data: UploadDocumentDto) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", data.title);
      if (data.description) {
        formData.append("description", data.description);
      }
      if (data.classIds && data.classIds.length > 0) {
        // Send classIds as JSON string to avoid array index issues in multipart
        formData.append("classIds", JSON.stringify(data.classIds));
      }
      if (data.visibility) {
        formData.append("visibility", data.visibility);
      }

      console.log("Uploading document:", {
        fileName: file.name,
        fileSize: file.size,
        title: data.title,
        classIds: data.classIds,
        visibility: data.visibility,
      });

      const response = await api.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const newDoc = response.data;
      set((state) => ({
        documents: [newDoc, ...state.documents],
        isLoading: false,
      }));
      return newDoc;
    } catch (error: any) {
      console.error("Upload error details:", error.response || error);
      const message =
        error.response?.data?.message || "Lỗi khi tải lên tài liệu";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createDocument: async (data: CreateDocumentDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/documents", data);
      const newDoc = response.data;
      set((state) => ({
        documents: [newDoc, ...state.documents],
        isLoading: false,
      }));
      return newDoc;
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi khi tạo tài liệu";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateDocument: async (id: string, data: UpdateDocumentDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/documents/${id}`, data);
      const updated = response.data;
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc._id === id ? updated : doc,
        ),
        isLoading: false,
      }));
      return updated;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi cập nhật tài liệu";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteDocument: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/documents/${id}`);
      set((state) => ({
        documents: state.documents.filter((doc) => doc._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi khi xóa tài liệu";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  shareToCommunity: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/documents/${id}/share-community`);
      const updated = response.data;
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc._id === id ? updated : doc,
        ),
        isLoading: false,
      }));
      return updated;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi chia sẻ tài liệu";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  restrictToClass: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/documents/${id}/restrict-class`);
      const updated = response.data;
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc._id === id ? updated : doc,
        ),
        isLoading: false,
      }));
      return updated;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi giới hạn tài liệu";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  incrementDownload: async (id: string) => {
    try {
      await api.patch(`/documents/${id}/download`);
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc._id === id
            ? { ...doc, downloadCount: doc.downloadCount + 1 }
            : doc,
        ),
      }));
    } catch (error) {
      console.error("Error incrementing download:", error);
    }
  },

  clearError: () => set({ error: null }),
}));
