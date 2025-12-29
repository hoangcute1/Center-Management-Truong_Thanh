"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useScheduleStore,
  Session,
  SessionStatus,
  SessionType,
  CreateSessionData,
  UpdateSessionData,
} from "@/lib/stores/schedule-store";
import { Class } from "@/lib/stores/classes-store";

interface SessionFormModalProps {
  session: Session | null;
  classes: Class[];
  onClose: () => void;
}

export default function SessionFormModal({
  session,
  classes,
  onClose,
}: SessionFormModalProps) {
  const { createSession, updateSession, checkConflict, isLoading } =
    useScheduleStore();

  const [formData, setFormData] = useState({
    classId: "",
    date: "",
    startTime: "08:00",
    endTime: "09:30",
    type: SessionType.Regular,
    note: "",
  });

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when editing
  useEffect(() => {
    if (session) {
      const startDate = new Date(session.startTime);
      const endDate = new Date(session.endTime);

      setFormData({
        classId:
          typeof session.classId === "string"
            ? session.classId
            : session.classId._id,
        date: startDate.toISOString().split("T")[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        type: session.type,
        note: session.note || "",
      });
    }
  }, [session]);

  // Get teacher from selected class
  const selectedClass = classes.find((c) => c._id === formData.classId);
  const teacherId = selectedClass?.teacherId;

  // Check for conflicts when time changes
  useEffect(() => {
    const checkForConflicts = async () => {
      if (
        !teacherId ||
        !formData.date ||
        !formData.startTime ||
        !formData.endTime
      ) {
        setConflictWarning(null);
        return;
      }

      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      try {
        // Get teacherId as string
        let teacherIdStr: string;
        if (typeof teacherId === "string") {
          teacherIdStr = teacherId;
        } else if (
          teacherId &&
          typeof teacherId === "object" &&
          "_id" in teacherId
        ) {
          teacherIdStr = (teacherId as { _id: string })._id;
        } else {
          return;
        }

        const result = await checkConflict({
          teacherId: teacherIdStr,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          excludeSessionId: session?._id,
        });

        if (result.hasConflict) {
          setConflictWarning(
            `⚠️ Giáo viên đã có ${result.conflicts.length} buổi học trùng thời gian này!`
          );
        } else {
          setConflictWarning(null);
        }
      } catch (error) {
        console.error("Error checking conflict:", error);
      }
    };

    const debounceTimer = setTimeout(checkForConflicts, 500);
    return () => clearTimeout(debounceTimer);
  }, [
    teacherId,
    formData.date,
    formData.startTime,
    formData.endTime,
    session?._id,
    checkConflict,
  ]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.classId) {
      newErrors.classId = "Vui lòng chọn lớp học";
    }
    if (!formData.date) {
      newErrors.date = "Vui lòng chọn ngày";
    }
    if (!formData.startTime) {
      newErrors.startTime = "Vui lòng chọn giờ bắt đầu";
    }
    if (!formData.endTime) {
      newErrors.endTime = "Vui lòng chọn giờ kết thúc";
    }
    if (formData.startTime >= formData.endTime) {
      newErrors.endTime = "Giờ kết thúc phải sau giờ bắt đầu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    try {
      if (session) {
        // Update existing session
        const updateData: UpdateSessionData = {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          type: formData.type,
          note: formData.note || undefined,
        };
        await updateSession(session._id, updateData);
      } else {
        // Create new session
        const createData: CreateSessionData = {
          classId: formData.classId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          type: formData.type,
          note: formData.note || undefined,
        };
        await createSession(createData);
      }
      onClose();
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user changes value
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 bg-white shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg">
            📅
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {session ? "Chỉnh sửa buổi học" : "Thêm buổi học mới"}
            </h3>
            <p className="text-sm text-gray-500">
              {session
                ? "Cập nhật thông tin buổi học"
                : "Điền thông tin để tạo buổi học"}
            </p>
          </div>
        </div>

        {/* Conflict Warning */}
        {conflictWarning && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            {conflictWarning}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lớp học <span className="text-red-500">*</span>
            </label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              disabled={!!session} // Can't change class when editing
              className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.classId ? "border-red-300" : "border-gray-200"
              } ${session ? "bg-gray-100" : ""}`}
            >
              <option value="">-- Chọn lớp học --</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.teacher ? `- ${c.teacher.name}` : ""}
                </option>
              ))}
            </select>
            {errors.classId && (
              <p className="text-red-500 text-xs mt-1">{errors.classId}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`rounded-xl ${errors.date ? "border-red-300" : ""}`}
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date}</p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ bắt đầu <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={`rounded-xl ${
                  errors.startTime ? "border-red-300" : ""
                }`}
              />
              {errors.startTime && (
                <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ kết thúc <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className={`rounded-xl ${
                  errors.endTime ? "border-red-300" : ""
                }`}
              />
              {errors.endTime && (
                <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>
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
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={SessionType.Regular}>📚 Buổi học thường</option>
              <option value={SessionType.Makeup}>🔄 Học bù</option>
              <option value={SessionType.Exam}>📝 Kiểm tra</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Thêm ghi chú cho buổi học..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-200"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Đang xử lý...
                </>
              ) : session ? (
                "💾 Lưu thay đổi"
              ) : (
                "➕ Tạo buổi học"
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
      </Card>
    </div>
  );
}
