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
import { User } from "@/lib/stores/auth-store";

interface SessionFormModalProps {
  session: Session | null;
  classes: Class[];
  teachers?: User[];
  onClose: () => void;
}

export default function SessionFormModal({
  session,
  classes,
  teachers = [],
  onClose,
}: SessionFormModalProps) {
  const { createSession, updateSession, checkConflict, isLoading } =
    useScheduleStore();

  const [formData, setFormData] = useState({
    teacherId: "",
    subject: "", // Môn học được chọn
    title: "",
    room: "",
    date: "",
    startTime: "08:00",
    endTime: "09:30",
    type: SessionType.Makeup, // Default to makeup since we removed regular
    note: "",
  });

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get subjects that the selected teacher is authorized to teach
  const teacherSubjects = formData.teacherId
    ? teachers.find((t) => t._id === formData.teacherId)?.subjects || []
    : [];

  // Get selected teacher info
  const selectedTeacher = teachers.find((t) => t._id === formData.teacherId);

  // Initialize form data when editing
  useEffect(() => {
    if (session) {
      const startDate = new Date(session.startTime);
      const endDate = new Date(session.endTime);

      // Get teacherId directly from session or from classId
      let teacherId = "";
      let subject = "";

      // First try to get from session directly (new format)
      if (session.teacherId) {
        teacherId =
          typeof session.teacherId === "string"
            ? session.teacherId
            : session.teacherId._id;
      }
      if (session.subject) {
        subject = session.subject;
      }

      // Fallback to classId if not found (old format)
      if (!teacherId || !subject) {
        const classInfo =
          typeof session.classId === "string"
            ? classes.find((c) => c._id === session.classId)
            : session.classId;

        if (classInfo && typeof classInfo !== "string") {
          if (!teacherId && classInfo.teacherId) {
            teacherId =
              typeof classInfo.teacherId === "string"
                ? classInfo.teacherId
                : classInfo.teacherId._id;
          }
          if (!subject) {
            subject = (classInfo as any).subject || classInfo.name || "";
          }
        }
      }

      setFormData({
        teacherId: teacherId,
        subject: subject,
        title: session.title || "",
        room: session.room || "",
        date: startDate.toISOString().split("T")[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        type: session.type,
        note: session.note || "",
      });
    }
  }, [session, classes]);

  // Check for conflicts when time changes
  useEffect(() => {
    const checkForConflicts = async () => {
      if (
        !formData.teacherId ||
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
        const result = await checkConflict({
          teacherId: formData.teacherId,
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
    formData.teacherId,
    formData.date,
    formData.startTime,
    formData.endTime,
    session?._id,
    checkConflict,
  ]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.teacherId) {
      newErrors.teacherId = "Vui lòng chọn giáo viên";
    }
    if (!formData.subject) {
      newErrors.subject = "Vui lòng chọn môn học";
    }
    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tiêu đề buổi học";
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
        const createData: CreateSessionData & {
          title?: string;
          room?: string;
          teacherId?: string;
          subject?: string;
        } = {
          classId: "", // Will be handled by backend based on subject
          teacherId: formData.teacherId,
          subject: formData.subject,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          type: formData.type,
          note: formData.note || undefined,
          title: formData.title || undefined,
          room: formData.room || undefined,
        };
        await createSession(createData as CreateSessionData);
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
    // Reset subject when teacher changes
    if (name === "teacherId") {
      setFormData((prev) => ({
        ...prev,
        teacherId: value,
        subject: "",
      }));
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
              {session ? "Chỉnh sửa buổi học" : "Thêm buổi học bất thường"}
            </h3>
            <p className="text-sm text-gray-500">
              {session
                ? "Cập nhật thông tin buổi học"
                : "Tạo buổi học bù hoặc kiểm tra"}
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
          {/* Teacher Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giáo viên <span className="text-red-500">*</span>
            </label>
            <select
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              disabled={!!session}
              className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.teacherId ? "border-red-300" : "border-gray-200"
              } ${session ? "bg-gray-100" : ""}`}
            >
              <option value="">-- Chọn giáo viên --</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  👨‍🏫 {t.name}{" "}
                  {t.subjects && t.subjects.length > 0
                    ? `(${t.subjects.join(", ")})`
                    : ""}
                </option>
              ))}
            </select>
            {errors.teacherId && (
              <p className="text-red-500 text-xs mt-1">{errors.teacherId}</p>
            )}
            {/* Hiển thị thông tin giáo viên */}
            {selectedTeacher && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">👨‍🏫 {selectedTeacher.name}</span>
                  {selectedTeacher.phone && (
                    <span className="text-blue-600 ml-2">
                      • 📞 {selectedTeacher.phone}
                    </span>
                  )}
                </p>
                {selectedTeacher.subjects &&
                  selectedTeacher.subjects.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      <span className="font-medium">Môn dạy:</span>{" "}
                      {selectedTeacher.subjects.join(", ")}
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Subject Selection - based on teacher's authorized subjects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Môn học <span className="text-red-500">*</span>
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              disabled={!!session || !formData.teacherId}
              className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.subject ? "border-red-300" : "border-gray-200"
              } ${session || !formData.teacherId ? "bg-gray-100" : ""}`}
            >
              <option value="">
                {!formData.teacherId
                  ? "-- Chọn giáo viên trước --"
                  : "-- Chọn môn học --"}
              </option>
              {teacherSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  📖 {subject}
                </option>
              ))}
            </select>
            {errors.subject && (
              <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
            )}
            {formData.teacherId && teacherSubjects.length === 0 && (
              <p className="text-amber-600 text-xs mt-1">
                ⚠️ Giáo viên này chưa được cấp quyền dạy môn nào
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề buổi học <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Bài 5 - Phương trình bậc 2"
              className={`rounded-xl ${errors.title ? "border-red-300" : ""}`}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phòng học
            </label>
            <Input
              type="text"
              name="room"
              value={formData.room}
              onChange={handleChange}
              placeholder="VD: Phòng 101, Tầng 1"
              className="rounded-xl"
            />
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
              <option value={SessionType.Makeup}>🔄 Học bù</option>
              <option value={SessionType.Exam}>📝 Kiểm tra</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Chỉ tạo buổi học bất thường tại đây. Buổi học thường được tự động
              tạo từ lịch học của lớp.
            </p>
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
                "➕ Tạo buổi học bất thường"
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
