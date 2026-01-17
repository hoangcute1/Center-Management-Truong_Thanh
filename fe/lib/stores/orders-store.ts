import { create } from "zustand";
import api from "../api";

export interface OrderItem {
  classId: string;
  className: string;
  classFee: number;
}

export interface Order {
  _id: string;
  studentId: string;
  items: OrderItem[];
  baseAmount: number;
  scholarshipPercent: number;
  discountAmount: number;
  finalAmount: number;
  status: "pending_payment" | "paid" | "failed" | "cancelled";
  paymentMethod?: string;
  paymentId?: string;
  requestIds: string[];
  createdAt: string;
  paidAt?: string;
}

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;

  fetchMyOrders: () => Promise<void>;
  createOrder: (classIds: string[]) => Promise<Order>;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  fetchMyOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/orders/my");
      set({ orders: response.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi tải đơn hàng";
      set({ isLoading: false, error: message });
    }
  },

  createOrder: async (classIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/orders/create", { classIds });
      const newOrder = response.data;
      set((state) => ({
        orders: [newOrder, ...state.orders],
        currentOrder: newOrder,
        isLoading: false,
      }));
      return newOrder;
    } catch (error: any) {
      const message = error.response?.data?.message || "Lỗi tạo đơn hàng";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },
}));
