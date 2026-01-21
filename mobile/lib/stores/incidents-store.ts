import { create } from "zustand";
import api from "@/lib/api";

// Incident types
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

interface CreateIncidentData {
  type: IncidentType;
  description: string;
  platform?: IncidentPlatform;
  attachments?: string[];
}

interface IncidentsState {
  incidents: Incident[];
  myIncidents: Incident[];
  selectedIncident: Incident | null;
  statistics: IncidentStatistics | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchIncidents: (filters?: {
    status?: IncidentStatus;
    type?: string;
    reporterId?: string;
  }) => Promise<void>;
  fetchMyIncidents: () => Promise<void>;
  fetchIncidentById: (id: string) => Promise<Incident>;
  createIncident: (data: CreateIncidentData) => Promise<Incident>;
  updateIncident: (id: string, data: Partial<Incident>) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  setSelectedIncident: (incident: Incident | null) => void;
  clearError: () => void;
}

// Helper functions
export const getIncidentTypeLabel = (type: IncidentType): string => {
  const labels: Record<IncidentType, string> = {
    bug_error: "Lỗi hệ thống",
    ui_issue: "Vấn đề giao diện",
    performance_issue: "Hiệu suất chậm",
    feature_request: "Yêu cầu tính năng",
    login_issue: "Lỗi đăng nhập",
    data_issue: "Vấn đề dữ liệu",
    payment_issue: "Vấn đề thanh toán",
    other: "Khác",
  };
  return labels[type] || type;
};

export const getIncidentStatusLabel = (status: IncidentStatus): string => {
  const labels: Record<IncidentStatus, string> = {
    pending: "Chờ xử lý",
    in_progress: "Đang xử lý",
    resolved: "Đã giải quyết",
    rejected: "Từ chối",
  };
  return labels[status] || status;
};

export const getIncidentStatusColor = (
  status: IncidentStatus,
): { bg: string; text: string } => {
  const colors: Record<IncidentStatus, { bg: string; text: string }> = {
    pending: { bg: "#FEF3C7", text: "#D97706" },
    in_progress: { bg: "#DBEAFE", text: "#2563EB" },
    resolved: { bg: "#D1FAE5", text: "#059669" },
    rejected: { bg: "#FEE2E2", text: "#DC2626" },
  };
  return colors[status] || { bg: "#F3F4F6", text: "#6B7280" };
};

export const useIncidentsStore = create<IncidentsState>((set, get) => ({
  incidents: [],
  myIncidents: [],
  selectedIncident: null,
  statistics: null,
  isLoading: false,
  error: null,

  fetchIncidents: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/incidents", { params: filters });
      set({
        incidents: response.data.map((i: Incident) => ({ ...i, id: i._id })),
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi tải danh sách sự cố";
      set({ isLoading: false, error: message });
    }
  },

  fetchMyIncidents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/incidents/my-incidents");
      set({
        myIncidents: response.data.map((i: Incident) => ({ ...i, id: i._id })),
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi tải sự cố của bạn";
      set({ isLoading: false, error: message });
    }
  },

  fetchIncidentById: async (id: string) => {
    try {
      const response = await api.get(`/incidents/${id}`);
      const incident = { ...response.data, id: response.data._id };
      set({ selectedIncident: incident });
      return incident;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Lỗi tải chi tiết sự cố",
      );
    }
  },

  createIncident: async (data: CreateIncidentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/incidents", {
        ...data,
        platform: "mobile", // Always mobile for this app
      });
      const newIncident = { ...response.data, id: response.data._id };

      set((state) => ({
        myIncidents: [newIncident, ...state.myIncidents],
        isLoading: false,
      }));

      return newIncident;
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi tạo báo cáo sự cố";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  updateIncident: async (id: string, data: Partial<Incident>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/incidents/${id}`, data);
      const updatedIncident = { ...response.data, id: response.data._id };

      set((state) => ({
        incidents: state.incidents.map((i) =>
          i._id === id ? updatedIncident : i,
        ),
        myIncidents: state.myIncidents.map((i) =>
          i._id === id ? updatedIncident : i,
        ),
        selectedIncident:
          state.selectedIncident?._id === id
            ? updatedIncident
            : state.selectedIncident,
        isLoading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi cập nhật sự cố";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  fetchStatistics: async () => {
    try {
      const response = await api.get("/incidents/statistics");
      set({ statistics: response.data });
    } catch (error) {
      console.error("Error fetching incident statistics:", error);
    }
  },

  setSelectedIncident: (incident) => set({ selectedIncident: incident }),

  clearError: () => set({ error: null }),
}));
