"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 3000) => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }));

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Toast helper functions
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast("success", message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast("error", message, duration),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().addToast("warning", message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast("info", message, duration),
};

const TOAST_ICONS = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};

const TOAST_STYLES = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

// Toast Container Component
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toastItem) => (
        <div
          key={toastItem.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg
            animate-in slide-in-from-right duration-300
            ${TOAST_STYLES[toastItem.type]}
          `}
        >
          <span className="text-lg">{TOAST_ICONS[toastItem.type]}</span>
          <p className="flex-1 text-sm font-medium">{toastItem.message}</p>
          <button
            onClick={() => removeToast(toastItem.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
