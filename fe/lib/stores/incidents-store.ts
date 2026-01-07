import { create } from "zustand";
import api from "@/lib/api";

// Incident types from backend
export type IncidentType =
  | "bug_error"
  | "ui_issue"
  | "performance_issue"
  | "feature_request"
  | "login_issue"
  | "data_issue"
  | "payment_issue"
  | "other";

export type IncidentStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "rejected";

export type IncidentPlatform = "web" | "mobile";

export interface Incident {
  _id: string;
  id?: string;
  reporterId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        role: string;
      };
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  reporterRole: string;
  type: IncidentType;
  description: string;
  platform: IncidentPlatform;
  status: IncidentStatus;
  adminNote?: string;
  resolvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  resolvedAt?: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IncidentStatistics {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  byType: Array<{ type: string; count: number }>;
  byPlatform: Array<{ platform: string; count: number }>;
}

interface IncidentsState {
  incidents: Incident[];
  myIncidents: Incident[];
  selectedIncident: Incident | null;
  statistics: IncidentStatistics | null;
  isLoading: boolean;
  error: string | null;
}

interface CreateIncidentData {
  type: IncidentType;
  description: string;
  platform?: IncidentPlatform;
  attachments?: string[];
}

interface UpdateIncidentData {
  status?: IncidentStatus;
  adminNote?: string;
}

interface IncidentsActions {
  fetchIncidents: (filters?: {
    status?: IncidentStatus;
    type?: string;
    reporterId?: string;
  }) => Promise<void>;
  fetchMyIncidents: () => Promise<void>;
  fetchIncidentById: (id: string) => Promise<Incident>;
  createIncident: (data: CreateIncidentData) => Promise<Incident>;
  updateIncident: (id: string, data: UpdateIncidentData) => Promise<Incident>;
  deleteIncident: (id: string) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  setSelectedIncident: (incident: Incident | null) => void;
  clearError: () => void;
}

// Incident type labels
export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  bug_error: "Lỗi hệ thống / Bug",
  ui_issue: "Vấn đề giao diện",
  performance_issue: "Hiệu suất chậm",
  feature_request: "Đề xuất tính năng",
  login_issue: "Vấn đề đăng nhập",
  data_issue: "Dữ liệu sai/mất",
  payment_issue: "Vấn đề thanh toán",
  other: "Khác",
};

// Incident status labels
export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  pending: "Chờ xử lý",
  in_progress: "Đang xử lý",
  resolved: "Đã giải quyết",
  rejected: "Từ chối",
};

// Incident platform labels
export const INCIDENT_PLATFORM_LABELS: Record<IncidentPlatform, string> = {
  web: "Web",
  mobile: "Mobile",
};

// Status colors
export const INCIDENT_STATUS_COLORS: Record<IncidentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const normalizeIncident = (incident: any): Incident => ({
  ...incident,
  id: incident._id,
});

export const useIncidentsStore = create<IncidentsState & IncidentsActions>(
  (set, get) => ({
    // State
    incidents: [],
    myIncidents: [],
    selectedIncident: null,
    statistics: null,
    isLoading: false,
    error: null,

    // Actions
    fetchIncidents: async (filters) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get("/incidents", { params: filters });
        const incidents = Array.isArray(response.data)
          ? response.data
          : response.data.incidents || [];

        set({
          incidents: incidents.map(normalizeIncident),
          isLoading: false,
        });
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi tải danh sách sự cố";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    fetchMyIncidents: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get("/incidents/my-incidents");
        const incidents = Array.isArray(response.data)
          ? response.data
          : response.data.incidents || [];

        set({
          myIncidents: incidents.map(normalizeIncident),
          isLoading: false,
        });
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi tải danh sách sự cố";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    fetchIncidentById: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get(`/incidents/${id}`);
        const incident = normalizeIncident(response.data);
        set({ selectedIncident: incident, isLoading: false });
        return incident;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi tải thông tin sự cố";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    createIncident: async (data: CreateIncidentData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post("/incidents", data);
        const newIncident = normalizeIncident(response.data);

        set((state) => ({
          myIncidents: [newIncident, ...state.myIncidents],
          isLoading: false,
        }));

        return newIncident;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi tạo báo cáo sự cố";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    updateIncident: async (id: string, data: UpdateIncidentData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.patch(`/incidents/${id}`, data);
        const updatedIncident = normalizeIncident(response.data);

        set((state) => ({
          incidents: state.incidents.map((i) =>
            i._id === id ? updatedIncident : i
          ),
          selectedIncident:
            state.selectedIncident?._id === id
              ? updatedIncident
              : state.selectedIncident,
          isLoading: false,
        }));

        return updatedIncident;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi cập nhật sự cố";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    deleteIncident: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await api.delete(`/incidents/${id}`);

        set((state) => ({
          incidents: state.incidents.filter((i) => i._id !== id),
          selectedIncident:
            state.selectedIncident?._id === id ? null : state.selectedIncident,
          isLoading: false,
        }));
      } catch (error: any) {
        const message = error.response?.data?.message || "Lỗi khi xóa sự cố";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    fetchStatistics: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get("/incidents/statistics");
        set({ statistics: response.data, isLoading: false });
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi khi tải thống kê sự cố";
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    setSelectedIncident: (incident: Incident | null) => {
      set({ selectedIncident: incident });
    },

    clearError: () => {
      set({ error: null });
    },
  })
);
