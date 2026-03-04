import { create } from "zustand";
import api from "@/lib/api";

export interface ChildInfo {
  _id: string;
  name: string;
  fullName?: string;
  email: string;
  avatarUrl?: string;
  studentCode?: string;
}

interface ChildrenState {
  children: ChildInfo[];
  selectedChild: ChildInfo | null;
  isLoading: boolean;

  fetchChildren: (parentId: string) => Promise<void>;
  setSelectedChild: (child: ChildInfo) => void;
  reset: () => void;
}

export const useChildrenStore = create<ChildrenState>((set, get) => ({
  children: [],
  selectedChild: null,
  isLoading: false,

  fetchChildren: async (parentId: string) => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const response = await api.get(`/users/parent/${parentId}/children`);
      const childrenData: ChildInfo[] = Array.isArray(response.data)
        ? response.data.map((c: any) => ({
            _id: c._id,
            name: c.fullName || c.name || "Học sinh",
            fullName: c.fullName,
            email: c.email,
            avatarUrl: c.avatarUrl,
            studentCode: c.studentCode,
          }))
        : [];

      // Nếu API trả về mảng rỗng, thử fallback với childEmail
      if (childrenData.length === 0) {
        // Sẽ được xử lý bởi component gọi
      }

      set({ children: childrenData });

      // Tự động chọn con đầu tiên nếu chưa chọn
      const current = get().selectedChild;
      if (!current && childrenData.length > 0) {
        set({ selectedChild: childrenData[0] });
      } else if (current) {
        // Kiểm tra con đã chọn còn tồn tại không
        const stillExists = childrenData.find((c) => c._id === current._id);
        if (!stillExists && childrenData.length > 0) {
          set({ selectedChild: childrenData[0] });
        }
      }
    } catch (error) {
      console.error("[CHILDREN] Error fetching children:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedChild: (child: ChildInfo) => {
    set({ selectedChild: child });
  },

  reset: () => {
    set({ children: [], selectedChild: null, isLoading: false });
  },
}));
