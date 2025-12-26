import { create } from "zustand";
import api from "@/lib/api";

export interface Class {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  teacherId: string;
  branchId: string;
  schedule: ClassSchedule[];
  studentIds: string[];
  maxStudents: number;
  status: "active" | "inactive" | "completed";
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  // Populated fields
  teacher?: {
    _id: string;
    name: string;
    email: string;
  };
  branch?: {
    _id: string;
    name: string;
  };
  students?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
}

export interface ClassSchedule {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  room?: string;
}

interface ClassesState {
  classes: Class[];
  selectedClass: Class | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ClassesActions {
  fetchClasses: (params?: FetchClassesParams) => Promise<void>;
  fetchClassById: (id: string) => Promise<Class>;
  createClass: (data: CreateClassData) => Promise<Class>;
  updateClass: (id: string, data: UpdateClassData) => Promise<Class>;
  deleteClass: (id: string) => Promise<void>;
  addStudentToClass: (classId: string, studentId: string) => Promise<void>;
  removeStudentFromClass: (classId: string, studentId: string) => Promise<void>;
  setSelectedClass: (classData: Class | null) => void;
  clearError: () => void;
}

interface FetchClassesParams {
  page?: number;
  limit?: number;
  teacherId?: string;
  branchId?: string;
  status?: "active" | "inactive" | "completed";
  search?: string;
}

interface CreateClassData {
  name: string;
  description?: string;
  teacherId: string;
  branchId: string;
  schedule?: ClassSchedule[];
  maxStudents?: number;
  startDate?: string;
  endDate?: string;
}

interface UpdateClassData {
  name?: string;
  description?: string;
  teacherId?: string;
  branchId?: string;
  schedule?: ClassSchedule[];
  maxStudents?: number;
  status?: "active" | "inactive" | "completed";
  startDate?: string;
  endDate?: string;
}

export const useClassesStore = create<ClassesState & ClassesActions>(
  (set, get) => ({
    // State
    classes: [],
    selectedClass: null,
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
    },

    // Actions
    fetchClasses: async (params?: FetchClassesParams) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get("/classes", { params });
        const classes = Array.isArray(response.data)
          ? response.data
          : response.data.classes || [];

        set({
          classes: classes.map((c: Class) => ({ ...c, id: c._id })),
          isLoading: false,
          pagination: {
            ...get().pagination,
            total: response.data.total || classes.length,
          },
        });
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi tải danh sách lớp học";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    fetchClassById: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get(`/classes/${id}`);
        const classData = { ...response.data, id: response.data._id };
        set({ selectedClass: classData, isLoading: false });
        return classData;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi tải thông tin lớp học";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    createClass: async (data: CreateClassData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post("/classes", data);
        const newClass = { ...response.data, id: response.data._id };

        set((state) => ({
          classes: [...state.classes, newClass],
          isLoading: false,
        }));

        return newClass;
      } catch (error: any) {
        const message = error.response?.data?.message || "Lỗi khi tạo lớp học";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    updateClass: async (id: string, data: UpdateClassData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.patch(`/classes/${id}`, data);
        const updatedClass = { ...response.data, id: response.data._id };

        set((state) => ({
          classes: state.classes.map((c) => (c._id === id ? updatedClass : c)),
          selectedClass:
            state.selectedClass?._id === id
              ? updatedClass
              : state.selectedClass,
          isLoading: false,
        }));

        return updatedClass;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi cập nhật lớp học";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    deleteClass: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await api.delete(`/classes/${id}`);

        set((state) => ({
          classes: state.classes.filter((c) => c._id !== id),
          selectedClass:
            state.selectedClass?._id === id ? null : state.selectedClass,
          isLoading: false,
        }));
      } catch (error: any) {
        const message = error.response?.data?.message || "Lỗi khi xóa lớp học";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    addStudentToClass: async (classId: string, studentId: string) => {
      set({ isLoading: true, error: null });
      try {
        await api.post(`/classes/${classId}/students`, { studentId });

        // Refetch the class to get updated student list
        const response = await api.get(`/classes/${classId}`);
        const updatedClass = { ...response.data, id: response.data._id };

        set((state) => ({
          classes: state.classes.map((c) =>
            c._id === classId ? updatedClass : c
          ),
          selectedClass:
            state.selectedClass?._id === classId
              ? updatedClass
              : state.selectedClass,
          isLoading: false,
        }));
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi thêm học sinh vào lớp";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    removeStudentFromClass: async (classId: string, studentId: string) => {
      set({ isLoading: true, error: null });
      try {
        await api.delete(`/classes/${classId}/students/${studentId}`);

        // Refetch the class to get updated student list
        const response = await api.get(`/classes/${classId}`);
        const updatedClass = { ...response.data, id: response.data._id };

        set((state) => ({
          classes: state.classes.map((c) =>
            c._id === classId ? updatedClass : c
          ),
          selectedClass:
            state.selectedClass?._id === classId
              ? updatedClass
              : state.selectedClass,
          isLoading: false,
        }));
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi xóa học sinh khỏi lớp";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    setSelectedClass: (classData: Class | null) => {
      set({ selectedClass: classData });
    },

    clearError: () => {
      set({ error: null });
    },
  })
);
