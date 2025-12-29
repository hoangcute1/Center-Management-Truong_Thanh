"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScheduleStore, SessionType } from "@/lib/stores/schedule-store";
import { Class } from "@/lib/stores/classes-store";

interface GenerateSessionsModalProps {
  classes: Class[];
  onClose: () => void;
}

export default function GenerateSessionsModal({
  classes,
  onClose,
}: GenerateSessionsModalProps) {
  const { generateSessions, isLoading } = useScheduleStore();

  const [formData, setFormData] = useState({
    classId: "",
    startDate: "",
    endDate: "",
    type: SessionType.Regular,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    message: string;
    count: number;
  } | null>(null);

  // Filter classes that have schedule defined
  const classesWithSchedule = classes.filter(
    (c) => c.schedule && c.schedule.length > 0
  );

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.classId) {
      newErrors.classId = "Vui lòng chọn lớp học";
    }
    if (!formData.startDate) {
      newErrors.startDate = "Vui lòng chọn ngày bắt đầu";
    }
    if (!formData.endDate) {
      newErrors.endDate = "Vui lòng chọn ngày kết thúc";
    }
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
      }
      // Check if range is too long (max 3 months)
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffDays = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays > 90) {
        newErrors.endDate = "Khoảng thời gian tối đa là 3 tháng";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await generateSessions({
        classId: formData.classId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        type: formData.type,
      });

      setResult({
        message: response.message,
        count: response.sessions.length,
      });
    } catch (error: any) {
      setErrors({
        submit: error.response?.data?.message || "Có lỗi xảy ra khi tạo lịch",
      });
    }
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Get selected class info
  const selectedClass = classes.find((c) => c._id === formData.classId);

  // Format schedule display
  const formatSchedule = (schedule: Class["schedule"]) => {
    if (!schedule) return "";
    const dayNames: Record<string, string> = {
      "0": "CN",
      "1": "T2",
      "2": "T3",
      "3": "T4",
      "4": "T5",
      "5": "T6",
      "6": "T7",
      monday: "T2",
      tuesday: "T3",
      wednesday: "T4",
      thursday: "T5",
      friday: "T6",
      saturday: "T7",
      sunday: "CN",
      "thứ 2": "T2",
      "thứ 3": "T3",
      "thứ 4": "T4",
      "thứ 5": "T5",
      "thứ 6": "T6",
      "thứ 7": "T7",
      "chủ nhật": "CN",
    };

    return schedule
      .map((s) => {
        const day =
          dayNames[s.dayOfWeek.toString().toLowerCase()] || s.dayOfWeek;
        return `${day}: ${s.startTime}-${s.endTime}${
          s.room ? ` (${s.room})` : ""
        }`;
      })
      .join(" | ");
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 bg-white shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-lg">
            ⚡
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Tạo lịch tự động
            </h3>
            <p className="text-sm text-gray-500">
              Tự động tạo các buổi học theo lịch đã định của lớp
            </p>
          </div>
        </div>

        {/* Success Result */}
        {result && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-700">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold">{result.message}</p>
                <p className="text-sm">Đã tạo {result.count} buổi học mới</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 rounded-xl"
            >
              Đóng
            </Button>
          </div>
        )}

        {/* Form */}
        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {errors.submit}
              </div>
            )}

            {/* Class Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lớp học <span className="text-red-500">*</span>
              </label>
              <select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.classId ? "border-red-300" : "border-gray-200"
                }`}
              >
                <option value="">-- Chọn lớp học --</option>
                {classesWithSchedule.length > 0 ? (
                  classesWithSchedule.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Không có lớp nào có lịch học</option>
                )}
              </select>
              {errors.classId && (
                <p className="text-red-500 text-xs mt-1">{errors.classId}</p>
              )}

              {/* Show class schedule info */}
              {selectedClass?.schedule && selectedClass.schedule.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 mb-1">
                    📅 Lịch học của lớp:
                  </p>
                  <p className="text-sm text-blue-600">
                    {formatSchedule(selectedClass.schedule)}
                  </p>
                </div>
              )}
            </div>

            {/* Info Box */}
            {classesWithSchedule.length === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Không có lớp nào có lịch học được định nghĩa. Vui lòng
                  thiết lập lịch học cho lớp trước khi sử dụng tính năng này.
                </p>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ ngày <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`rounded-xl ${
                    errors.startDate ? "border-red-300" : ""
                  }`}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.startDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến ngày <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`rounded-xl ${
                    errors.endDate ? "border-red-300" : ""
                  }`}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại buổi học
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={SessionType.Regular}>📚 Buổi học thường</option>
                <option value={SessionType.Makeup}>🔄 Học bù</option>
                <option value={SessionType.Exam}>📝 Kiểm tra</option>
              </select>
            </div>

            {/* Preview */}
            {formData.classId &&
              formData.startDate &&
              formData.endDate &&
              selectedClass?.schedule && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    📊 Dự kiến:
                  </p>
                  <p className="text-sm text-gray-600">
                    Hệ thống sẽ tạo các buổi học cho lớp{" "}
                    <strong>{selectedClass.name}</strong> từ ngày{" "}
                    <strong>
                      {new Date(formData.startDate).toLocaleDateString("vi-VN")}
                    </strong>{" "}
                    đến ngày{" "}
                    <strong>
                      {new Date(formData.endDate).toLocaleDateString("vi-VN")}
                    </strong>{" "}
                    theo lịch học đã định.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    * Các buổi học đã tồn tại sẽ không bị tạo trùng
                  </p>
                </div>
              )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading || classesWithSchedule.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-lg shadow-purple-200"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Đang tạo lịch...
                  </>
                ) : (
                  "⚡ Tạo lịch tự động"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl"
              >
                Hủy
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
