import { create } from "zustand";
import api from "@/lib/api";
import { translateErrorMessage } from "./auth-store";

export interface Notification {
  _id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "error";
  userId: string;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/notifications");
      const notifications = response.data;
      const unreadCount = notifications.filter(
        (n: Notification) => !n.isRead
      ).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error: any) {
      const errorMessage = translateErrorMessage(
        error,
        "Không thể tải thông báo"
      );
      set({ error: errorMessage, isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      const { notifications } = get();
      const updated = notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      );
      const unreadCount = updated.filter((n) => !n.isRead).length;
      set({ notifications: updated, unreadCount });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch("/notifications/read-all");
      const { notifications } = get();
      const updated = notifications.map((n) => ({ ...n, isRead: true }));
      set({ notifications: updated, unreadCount: 0 });
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
    }
  },

  clearError: () => set({ error: null }),
}));
