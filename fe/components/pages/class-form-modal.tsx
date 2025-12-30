"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useClassesStore,
  type Class,
  type ClassSchedule,
} from "@/lib/stores/classes-store";

interface ClassFormModalProps {
  classData?: Class | null;
  branches: Array<{ _id: string; name: string }>;
  teachers: Array<{ _id: string; name: string; email: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ nhật" },
];

export default function ClassFormModal({
  classData,
  branches,
  teachers,
  onClose,
  onSuccess,
}: ClassFormModalProps) {
  const { createClass, updateClass, isLoading } = useClassesStore();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teacherId: "",
    branchId: "",
    maxStudents: 30,
    startDate: "",
    endDate: "",
    status: "active" as "active" | "inactive" | "completed",
  });

  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!classData;

  // Initialize form data when editing
  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || "",
        description: classData.description || "",
        teacherId: classData.teacherId || classData.teacher?._id || "",
        branchId: classData.branchId || classData.branch?._id || "",
        maxStudents: classData.maxStudents || 30,
        startDate: classData.startDate ? classData.startDate.split("T")[0] : "",
        endDate: classData.endDate ? classData.endDate.split("T")[0] : "",
        status: classData.status || "active",
      });
      setSchedules(classData.schedule || []);
    }
  }, [classData]);

  const handleAddSchedule = () => {
    setSchedules([
      ...schedules,
      { dayOfWeek: 1, startTime: "08:00", endTime: "10:00", room: "" },
    ]);
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (
    index: number,
    field: keyof ClassSchedule,
    value: string | number
  ) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên khóa học");
      return;
    }
    if (!formData.branchId) {
      setError("Vui lòng chọn chi nhánh");
      return;
    }
    if (!formData.teacherId) {
      setError("Vui lòng chọn giáo viên");
      return;
    }

    try {
      // Clean schedule data - remove _id and ensure dayOfWeek is number
      const cleanSchedules = schedules.map(
        ({ dayOfWeek, startTime, endTime, room }) => ({
          dayOfWeek:
            typeof dayOfWeek === "string" ? parseInt(dayOfWeek, 10) : dayOfWeek,
          startTime,
          endTime,
          room: room || undefined,
        })
      );

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        teacherId: formData.teacherId,
        branchId: formData.branchId,
        maxStudents: formData.maxStudents,
        schedule: cleanSchedules.length > 0 ? cleanSchedules : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        ...(isEditing && { status: formData.status }),
      };

      if (isEditing && classData) {
        await updateClass(classData._id, submitData);
      } else {
        await createClass(submitData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    }
  };

  // Filter teachers by selected branch
  const filteredTeachers = formData.branchId
    ? teachers.filter(
        (t: any) => !t.branchId || t.branchId === formData.branchId
      )
    : teachers;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
                {isEditing ? "✏️" : "➕"}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isEditing ? "Sửa khóa học" : "Thêm khóa học mới"}
                </h2>
                <p className="text-blue-100 text-sm">
                  {isEditing
                    ? "Cập nhật thông tin khóa học"
                    : "Điền thông tin để tạo khóa học"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]"
        >
          <div className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên khóa học <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="VD: Toán lớp 10 - Nâng cao"
                  className="rounded-xl"
                />
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Chi nhánh <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branchId: e.target.value,
                      teacherId: "", // Reset teacher when branch changes
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Giáo viên phụ trách <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) =>
                    setFormData({ ...formData, teacherId: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.branchId}
                >
                  <option value="">
                    {formData.branchId
                      ? "-- Chọn giáo viên --"
                      : "-- Chọn chi nhánh trước --"}
                  </option>
                  {filteredTeachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Students */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Số học sinh tối đa
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.maxStudents}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxStudents: parseInt(e.target.value) || 30,
                    })
                  }
                  className="rounded-xl"
                />
              </div>

              {/* Status (only when editing) */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as
                          | "active"
                          | "inactive"
                          | "completed",
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm dừng</option>
                    <option value="completed">Đã kết thúc</option>
                  </select>
                </div>
              )}

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ngày bắt đầu
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ngày kết thúc
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả chi tiết về khóa học..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Schedule Section */}
            <div className="border-t pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">Lịch học</h3>
                  <p className="text-xs text-gray-500">
                    Thêm các buổi học trong tuần
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleAddSchedule}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                >
                  ➕ Thêm buổi học
                </Button>
              </div>

              {schedules.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-sm">
                    Chưa có lịch học. Nhấn "Thêm buổi học" để thêm.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      {/* Day of Week */}
                      <select
                        value={schedule.dayOfWeek}
                        onChange={(e) =>
                          handleScheduleChange(
                            index,
                            "dayOfWeek",
                            parseInt(e.target.value)
                          )
                        }
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>

                      {/* Start Time */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Từ</span>
                        <Input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) =>
                            handleScheduleChange(
                              index,
                              "startTime",
                              e.target.value
                            )
                          }
                          className="w-28 rounded-lg text-sm"
                        />
                      </div>

                      {/* End Time */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Đến</span>
                        <Input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) =>
                            handleScheduleChange(
                              index,
                              "endTime",
                              e.target.value
                            )
                          }
                          className="w-28 rounded-lg text-sm"
                        />
                      </div>

                      {/* Room */}
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-xs text-gray-500">Phòng</span>
                        <Input
                          value={schedule.room || ""}
                          onChange={(e) =>
                            handleScheduleChange(index, "room", e.target.value)
                          }
                          placeholder="VD: P.101"
                          className="w-24 rounded-lg text-sm"
                        />
                      </div>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        onClick={() => handleRemoveSchedule(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        🗑️
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-5 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-xl"
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Đang xử lý...
                </span>
              ) : isEditing ? (
                "Cập nhật"
              ) : (
                "Tạo khóa học"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
