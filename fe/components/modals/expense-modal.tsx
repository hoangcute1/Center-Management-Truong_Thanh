"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ExpenseModalProps {
  isOpen: boolean;
  branchId: string;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    description: string;
    expenseDate: string;
  }) => Promise<void>;
}

export default function ExpenseModal({
  isOpen,
  branchId,
  onClose,
  onSubmit,
}: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    const amount = Number(formData.amount);
    if (!amount || amount <= 0) {
      setError("Số tiền phải lớn hơn 0");
      return;
    }

    if (!formData.description.trim()) {
      setError("Vui lòng nhập nội dung chi phí");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        amount,
        description: formData.description.trim(),
        expenseDate: formData.expenseDate,
      });
      
      // Reset form
      setFormData({
        amount: "",
        description: "",
        expenseDate: new Date().toISOString().split("T")[0],
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: "",
      description: "",
      expenseDate: new Date().toISOString().split("T")[0],
    });
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-white shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">💰 Thêm chi phí</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền (VND) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="Ví dụ: 5000000"
              className="rounded-xl"
              min="1"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung chi phí <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ví dụ: Thuê văn phòng tháng 1"
              className="rounded-xl"
              required
            />
          </div>

          {/* Expense Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày chi
            </label>
            <Input
              type="date"
              value={formData.expenseDate}
              onChange={(e) =>
                setFormData({ ...formData, expenseDate: e.target.value })
              }
              className="rounded-xl"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">❌ {error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu chi phí"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
