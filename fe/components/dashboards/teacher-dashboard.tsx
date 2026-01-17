"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { ChevronDown, Camera } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWindow from "@/components/chat-window";
import NotificationCenter from "@/components/notification-center";
import IncidentReportModal from "@/components/pages/incident-report-modal";
import { useClassesStore, Class } from "@/lib/stores/classes-store";
import {
  useScheduleStore,
  Session,
  SessionStatus,
} from "@/lib/stores/schedule-store";
import { useAttendanceStore } from "@/lib/stores/attendance-store";
import api from "@/lib/api";

interface TeacherDashboardProps {
  user: { id: string; name: string; email: string; role: string };
  onLogout: () => void;
}

// Mock data for teaching documents
const teachingDocuments = [
  {
    id: "doc1",
    name: "Tài liệu Toán 10 - Chương 1",
    type: "PDF",
    size: "2.4 MB",
    uploadDate: "05/01/2025",
    className: "Toán 10A",
    downloads: 24,
  },
  {
    id: "doc2",
    name: "Bài tập Toán 10 - Tuần 2",
    type: "DOCX",
    size: "1.1 MB",
    uploadDate: "08/01/2025",
    className: "Toán 10A",
    downloads: 18,
  },
  {
    id: "doc3",
    name: "Tài liệu Toán 10B - Đại số",
    type: "PDF",
    size: "3.2 MB",
    uploadDate: "09/01/2025",
    className: "Toán 10B",
    downloads: 32,
  },
  {
    id: "doc4",
    name: "Slide bài giảng - Hình học",
    type: "PPTX",
    size: "5.8 MB",
    uploadDate: "10/01/2025",
    className: "Toán 10A",
    downloads: 15,
  },
];

const evaluationSummary = {
  total: 3,
  average: 4.7,
  five: 2,
  four: 1,
  list: [
    {
      id: 1,
      title: "Giáo viên giải thích rất rõ ràng, dễ hiểu.",
      detail: "Thích cách dạy của cô.",
      stars: 5,
      date: "15/1/2024",
    },
    {
      id: 2,
      title: "Bài giảng hay, nhưng muốn có nhiều bài tập thực hành hơn.",
      detail: "",
      stars: 4,
      date: "10/1/2024",
    },
    {
      id: 3,
      title: "Giáo viên nhiệt tình và tận tâm. Trả lời câu hỏi rất chi tiết.",
      detail: "",
      stars: 5,
      date: "5/1/2024",
    },
  ],
};

const studentDetailMock = {
  id: "HS001",
  name: "Nguyễn Văn A",
  status: "Tốt",
  email: "student@mail.com",
  phone: "0987 654 321",
  parent: "Nguyễn Văn X",
  subject: "Toán",
  progress: [
    { week: "Tuần 1", score: 65 },
    { week: "Tuần 2", score: 70 },
    { week: "Tuần 3", score: 75 },
    { week: "Tuần 4", score: 78 },
    { week: "Tuần 5", score: 82 },
  ],
  midterm: 85,
  final: 82,
  average: 82,
  teacherNote:
    "Học sinh có tiến độ học tập tốt, nắm vững kiến thức cơ bản, hoạt động tích cực trong lớp. Cần tăng cường luyện tập các bài toán nâng cao để phát triển kỹ năng giải quyết vấn đề.",
  attendance: "11/12",
  homework: "10/12",
};

interface StudentItem {
  _id: string;
  name: string;
  email: string;
}

function StudentDetailModal({
  student,
  onClose,
}: {
  student: StudentItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-3">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Chi tiết học sinh
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Card className="p-4 bg-blue-50 border-blue-100">
              <p className="text-xs text-gray-500">Tên học sinh</p>
              <p className="font-semibold text-gray-900">{student.name}</p>
              <p className="text-xs text-gray-500 mt-2">Mã HS</p>
              <p className="font-semibold text-gray-900">{student._id}</p>
              <p className="text-xs text-gray-500 mt-2">Email</p>
              <p className="text-sm text-gray-800">{student.email}</p>
            </Card>
            <Card className="p-4 bg-purple-50 border-purple-100">
              <p className="text-xs text-gray-500">Môn học</p>
              <p className="text-sm text-gray-900">
                {studentDetailMock.subject}
              </p>
              <p className="text-xs text-gray-500 mt-2">SĐT</p>
              <p className="text-sm text-gray-900">{studentDetailMock.phone}</p>
              <p className="text-xs text-gray-500 mt-2">Phụ huynh</p>
              <p className="text-sm text-gray-900">
                {studentDetailMock.parent}
              </p>
            </Card>
          </div>

          <Card className="p-4 bg-green-50 border-green-100">
            <p className="font-semibold text-gray-900 mb-2">
              Biểu đồ tiến độ học tập
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={studentDetailMock.progress}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 12, fill: "#047857" }}
                  />
                  <YAxis
                    domain={[50, 100]}
                    tick={{ fontSize: 12, fill: "#047857" }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4 bg-amber-50 border-amber-100">
            <p className="font-semibold text-gray-900 mb-2">Điểm chi tiết</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Điểm kiểm tra giữa kỳ:</p>
                <p className="font-bold text-gray-900">
                  {studentDetailMock.midterm}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Điểm cuối kỳ:</p>
                <p className="font-bold text-gray-900">
                  {studentDetailMock.final}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Điểm trung bình:</p>
                <p className="font-bold text-green-700">
                  {studentDetailMock.average}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-blue-50 border-blue-100">
            <p className="font-semibold text-gray-900 mb-2">
              Nhận xét của giáo viên
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">
              {studentDetailMock.teacherNote}
            </p>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600">Buổi học dự</p>
              <p className="text-2xl font-bold text-gray-900">
                {studentDetailMock.attendance}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600">Bài tập nộp</p>
              <p className="text-2xl font-bold text-gray-900">
                {studentDetailMock.homework}
              </p>
            </Card>
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </Card>
    </div>
  );
}

interface AttendanceRow {
  studentId: string;
  name: string;
  email: string;
  status: "present" | "absent" | "late" | "excused" | null;
}

function AttendanceModal({
  session,
  classData,
  onClose,
  onSave,
}: {
  session: Session;
  classData: Class;
  onClose: () => void;
  onSave: (records: AttendanceRow[], note: string) => Promise<void>;
}) {
  const students = classData.students || [];
  const [rows, setRows] = useState<AttendanceRow[]>(
    students.map((s) => ({
      studentId: s._id,
      name: s.name,
      email: s.email,
      status: null,
    }))
  );
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const attended = rows.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const absent = rows.filter((r) => r.status === "absent").length;

  const update = (studentId: string, value: AttendanceRow["status"]) => {
    setRows(
      rows.map((r) => (r.studentId === studentId ? { ...r, status: value } : r))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(rows, note);
      onClose();
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Format session time
  const sessionTime = new Date(session.startTime).toLocaleString("vi-VN", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-3">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Điểm danh</h2>
            <p className="text-sm text-gray-600">
              {classData.name} - {sessionTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="p-3 bg-blue-50 border-blue-100 text-center">
            <p className="text-sm text-gray-600">Tổng học sinh</p>
            <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
          </Card>
          <Card className="p-3 bg-green-50 border-green-100 text-center">
            <p className="text-sm text-gray-600">Có mặt</p>
            <p className="text-2xl font-bold text-green-700">{attended}</p>
          </Card>
          <Card className="p-3 bg-red-50 border-red-100 text-center">
            <p className="text-sm text-gray-600">Vắng mặt</p>
            <p className="text-2xl font-bold text-red-600">{absent}</p>
          </Card>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Lớp học chưa có học sinh nào
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {rows.map((r) => (
              <div
                key={r.studentId}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.email}</p>
                </div>
                <div className="flex gap-2 text-sm">
                  <Button
                    variant={r.status === "present" ? "solid" : "outline"}
                    className={
                      r.status === "present"
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }
                    onClick={() => update(r.studentId, "present")}
                  >
                    ✓ Có mặt
                  </Button>
                  <Button
                    variant={r.status === "absent" ? "solid" : "outline"}
                    className={
                      r.status === "absent" ? "bg-red-500 hover:bg-red-600" : ""
                    }
                    onClick={() => update(r.studentId, "absent")}
                  >
                    ✕ Vắng
                  </Button>
                  <Button
                    variant={r.status === "late" ? "solid" : "outline"}
                    className={
                      r.status === "late"
                        ? "bg-amber-500 hover:bg-amber-600"
                        : ""
                    }
                    onClick={() => update(r.studentId, "late")}
                  >
                    Đi muộn
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Ghi chú buổi học
          </p>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={3}
            placeholder="Ghi chú về buổi học, nội dung dạy, bài tập giao, v.v..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleSave}
            disabled={isSaving || rows.length === 0}
          >
            {isSaving ? "Đang lưu..." : "Lưu điểm danh"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Hủy
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Helper function to check if current time is within class schedule time
function isWithinClassTime(
  scheduleDate: Date,
  startTime: string,
  endTime: string
): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const schedDay = new Date(
    scheduleDate.getFullYear(),
    scheduleDate.getMonth(),
    scheduleDate.getDate()
  );

  // Check if same day
  if (today.getTime() !== schedDay.getTime()) {
    return false;
  }

  // Parse times
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  const currentMinutes = currentHour * 60 + currentMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Allow 15 minutes before and after class time
  return (
    currentMinutes >= startMinutes - 15 && currentMinutes <= endMinutes + 15
  );
}

function TimetableAttendanceModal({
  schedule,
  classData,
  fullDate,
  onClose,
  onSave,
}: {
  schedule: {
    classId: string;
    className: string;
    subject: string;
    startTime: string;
    endTime: string;
    room?: string;
  };
  classData: Class;
  fullDate: Date;
  onClose: () => void;
  onSave: (records: AttendanceRow[], note: string) => Promise<void>;
}) {
  const students = classData.students || [];
  const [rows, setRows] = useState<AttendanceRow[]>(
    students.map((s) => ({
      studentId: s._id,
      name: s.name,
      email: s.email,
      status: null,
    }))
  );
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

  // Fetch existing attendance records on mount
  useEffect(() => {
    const fetchExistingAttendance = async () => {
      try {
        const response = await api.get("/attendance/by-class-date", {
          params: {
            classId: schedule.classId,
            date: fullDate.toISOString(),
          },
        });
        const existingRecords = response.data || [];

        if (existingRecords.length > 0) {
          // Update rows with existing attendance status
          setRows((prevRows) =>
            prevRows.map((row) => {
              const existingRecord = existingRecords.find(
                (r: any) =>
                  r.studentId === row.studentId ||
                  r.studentId?._id === row.studentId
              );
              if (existingRecord) {
                return { ...row, status: existingRecord.status };
              }
              return row;
            })
          );
        }
      } catch (error) {
        console.error("Error fetching existing attendance:", error);
      } finally {
        setIsLoadingExisting(false);
      }
    };

    fetchExistingAttendance();
  }, [schedule.classId, fullDate]);

  const canEdit = isWithinClassTime(
    fullDate,
    schedule.startTime,
    schedule.endTime
  );

  const attended = rows.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const absent = rows.filter((r) => r.status === "absent").length;

  const update = (studentId: string, value: AttendanceRow["status"]) => {
    if (!canEdit) return;
    setRows(
      rows.map((r) => (r.studentId === studentId ? { ...r, status: value } : r))
    );
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setIsSaving(true);
    try {
      await onSave(rows, note);
      onClose();
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Format date
  const formattedDate = fullDate.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-3">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Điểm danh</h2>
            <p className="text-sm text-gray-600">
              {schedule.className} - {formattedDate}
            </p>
            <p className="text-sm text-gray-500">
              {schedule.startTime} - {schedule.endTime}
              {schedule.room && ` | Phòng: ${schedule.room}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ×
          </button>
        </div>

        {isLoadingExisting && (
          <div className="mb-4 p-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-gray-600">Đang tải dữ liệu điểm danh...</span>
          </div>
        )}

        {!canEdit && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              ⚠️ Chỉ có thể điểm danh trong thời gian học ({schedule.startTime}{" "}
              - {schedule.endTime}). Hiện tại ngoài giờ học nên không thể chỉnh
              sửa.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="p-3 bg-blue-50 border-blue-100 text-center">
            <p className="text-sm text-gray-600">Tổng học sinh</p>
            <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
          </Card>
          <Card className="p-3 bg-green-50 border-green-100 text-center">
            <p className="text-sm text-gray-600">Có mặt</p>
            <p className="text-2xl font-bold text-green-700">{attended}</p>
          </Card>
          <Card className="p-3 bg-red-50 border-red-100 text-center">
            <p className="text-sm text-gray-600">Vắng mặt</p>
            <p className="text-2xl font-bold text-red-600">{absent}</p>
          </Card>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Lớp học chưa có học sinh nào
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {rows.map((r) => (
              <div
                key={r.studentId}
                className={`flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 ${!canEdit ? "opacity-60" : ""
                  }`}
              >
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.email}</p>
                </div>
                <div className="flex gap-2 text-sm">
                  <Button
                    variant={r.status === "present" ? "solid" : "outline"}
                    className={
                      r.status === "present"
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }
                    onClick={() => update(r.studentId, "present")}
                    disabled={!canEdit}
                  >
                    ✓ Có mặt
                  </Button>
                  <Button
                    variant={r.status === "absent" ? "solid" : "outline"}
                    className={
                      r.status === "absent" ? "bg-red-500 hover:bg-red-600" : ""
                    }
                    onClick={() => update(r.studentId, "absent")}
                    disabled={!canEdit}
                  >
                    ✕ Vắng
                  </Button>
                  <Button
                    variant={r.status === "late" ? "solid" : "outline"}
                    className={
                      r.status === "late"
                        ? "bg-amber-500 hover:bg-amber-600"
                        : ""
                    }
                    onClick={() => update(r.studentId, "late")}
                    disabled={!canEdit}
                  >
                    Đi muộn
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Ghi chú buổi học
          </p>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={3}
            placeholder="Ghi chú về buổi học, nội dung dạy, bài tập giao, v.v..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={!canEdit}
          />
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleSave}
            disabled={isSaving || rows.length === 0 || !canEdit}
          >
            {isSaving ? "Đang lưu..." : "Lưu điểm danh"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </Card>
    </div>
  );
}

function TeacherEvaluationModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-3">
      <Card className="w-full max-w-2xl p-6 bg-white">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Đánh giá từ học sinh (Ẩn danh)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ×
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6 text-center text-sm">
          <Card className="p-3">
            <p className="text-gray-600">Tổng đánh giá</p>
            <p className="text-2xl font-bold text-gray-900">
              {evaluationSummary.total}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-gray-600">Điểm TB</p>
            <p className="text-2xl font-bold text-amber-500">
              {evaluationSummary.average} ★
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-gray-600">Đánh giá 5 sao</p>
            <p className="text-2xl font-bold text-gray-900">
              {evaluationSummary.five}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-gray-600">Đánh giá 4 sao</p>
            <p className="text-2xl font-bold text-gray-900">
              {evaluationSummary.four}
            </p>
          </Card>
        </div>
        <div className="space-y-3">
          {evaluationSummary.list.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                </div>
                <p className="text-amber-500 text-sm">
                  {"★".repeat(item.stars)}
                </p>
              </div>
              {item.detail && (
                <p className="text-sm text-gray-700 mt-2">{item.detail}</p>
              )}
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TeacherProfileModal({
  user,
  onClose,
}: {
  user: { id: string; name: string; email: string; role: string; phone?: string; qualification?: string; teacherNote?: string };
  onClose: () => void;
}) {
  // State để hiển thị preview ảnh
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi chọn file ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  // Hàm kích hoạt input file
  const handleEditAvatar = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3 animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl p-6 min-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Thông tin</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden border-[4px] border-white shadow-lg ring-2 ring-blue-100 bg-gray-100 flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl font-bold select-none">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <button
              onClick={handleEditAvatar}
              className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-200 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95"
              title="Đổi ảnh đại diện"
            >
              <Camera size={17} />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Form Inputs */}
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Họ và tên</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                defaultValue={user.name}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Số điện thoại</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                defaultValue={user.phone || "?"}
                readOnly
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-gray-700 font-medium">Email</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              defaultValue={user.email}
              readOnly
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-700 font-medium">Bằng cấp/Chứng chỉ</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              defaultValue={user.qualification || "?"}
              readOnly
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-700 font-medium">Ghi chú cá nhân</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              defaultValue={user.teacherNote || "?"}
              readOnly
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-round-pen-icon lucide-user-round-pen"><path d="M2 21a8 8 0 0 1 10.821-7.487" /><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /><circle cx="10" cy="8" r="5" /></svg>
              </span>
              Chỉnh Sửa
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V7.875L14.25 1.5H5.625zM14.25 3.75v3.375c0 .621.504 1.125 1.125 1.125h3.375L14.25 3.75zM9 11.25a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9zm-.75 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Helper function to get week date range
function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { startDate: monday.toISOString(), endDate: sunday.toISOString() };
}

// Helper to format day of week
const dayNames = [
  "CHỦ NHẬT",
  "THỨ HAI",
  "THỨ BA",
  "THỨ TƯ",
  "THỨ NĂM",
  "THỨ SÁU",
  "THỨ BẢY",
];

export default function TeacherDashboard({
  user,
  onLogout,
}: TeacherDashboardProps) {
  const [chatWith, setChatWith] = useState<{
    name: string;
    role: string;
  } | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(
    null
  );
  const [attendanceSession, setAttendanceSession] = useState<{
    session: Session;
    classData: Class;
  } | null>(null);
  const [timetableAttendance, setTimetableAttendance] = useState<{
    schedule: {
      classId: string;
      className: string;
      subject: string;
      startTime: string;
      endTime: string;
      room?: string;
    };
    classData: Class;
    fullDate: Date;
  } | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Stores
  const {
    classes,
    fetchClasses,
    isLoading: classesLoading,
  } = useClassesStore();
  const {
    sessions,
    fetchTeacherSchedule,
    isLoading: scheduleLoading,
  } = useScheduleStore();
  const { markAttendance, markTimetableAttendance } = useAttendanceStore();

  // Fetch data on mount
  useEffect(() => {
    // Fetch classes taught by this teacher
    fetchClasses({ teacherId: user.id });

    // Fetch schedule for this week (sessions)
    const { startDate, endDate } = getWeekRange();
    fetchTeacherSchedule(user.id, startDate, endDate);
  }, [user.id, fetchClasses, fetchTeacherSchedule]);

  // Set first class as selected when classes load
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  // Build timetable from class schedules (thời khoá biểu)
  const timetableByDay = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayIndex = date.getDay();

      // Find all class schedules for this day
      const daySchedules: Array<{
        classId: string;
        className: string;
        subject: string;
        startTime: string;
        endTime: string;
        room?: string;
      }> = [];

      classes.forEach((cls) => {
        if (cls.schedule && cls.schedule.length > 0) {
          cls.schedule.forEach((sch) => {
            if (sch.dayOfWeek === dayIndex) {
              daySchedules.push({
                classId: cls._id,
                className: cls.name,
                subject: cls.subject || "Chưa xác định",
                startTime: sch.startTime,
                endTime: sch.endTime,
                room: sch.room,
              });
            }
          });
        }
      });

      // Sort by start time
      daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));

      days.push({
        day: dayNames[dayIndex],
        date: date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        schedules: daySchedules,
        fullDate: date,
      });
    }

    // Reorder so Monday is first
    const mondayIndex = days.findIndex((d) => d.day === "THỨ HAI");
    return [...days.slice(mondayIndex), ...days.slice(0, mondayIndex)];
  }, [classes]);

  // Count total weekly sessions from timetable
  const totalWeeklySchedules = useMemo(() => {
    return timetableByDay.reduce((sum, day) => sum + day.schedules.length, 0);
  }, [timetableByDay]);

  // Overview statistics
  const overviewCards = useMemo(() => {
    const totalStudents = classes.reduce(
      (sum, c) => sum + (c.studentIds?.length || 0),
      0
    );

    return [
      {
        label: "Lớp dạy",
        value: classes.length,
        note: "Khóa học",
        icon: "📚",
        color: "from-blue-500 to-blue-600",
      },
      {
        label: "Tổng học sinh",
        value: totalStudents,
        note: "Đang theo học",
        icon: "👨‍🎓",
        color: "from-emerald-500 to-emerald-600",
      },
      {
        label: "Buổi dạy tuần",
        value: totalWeeklySchedules,
        note: "Tiết học",
        icon: "📅",
        color: "from-amber-500 to-orange-500",
      },
      {
        label: "Trạng thái",
        value: classes.filter((c) => c.status === "active").length,
        note: "Lớp đang hoạt động",
        icon: "⭐",
        color: "from-purple-500 to-purple-600",
      },
    ];
  }, [classes, totalWeeklySchedules]);

  // Bar data for chart
  const barData = useMemo(() => {
    return timetableByDay.slice(0, 5).map((d) => ({
      day: d.day.replace("THỨ ", "T"),
      students: d.schedules.reduce((sum, sch) => {
        const cls = classes.find((c) => c._id === sch.classId);
        return sum + (cls?.studentIds?.length || 0);
      }, 0),
    }));
  }, [timetableByDay, classes]);

  // Handle attendance save
  const handleSaveAttendance = async (
    records: AttendanceRow[],
    note: string
  ) => {
    if (!attendanceSession) return;

    const { session, classData } = attendanceSession;

    // Save attendance for each student
    for (const record of records) {
      if (record.status) {
        await markAttendance({
          studentId: record.studentId,
          classId: classData._id,
          sessionId: session._id,
          status: record.status,
          notes: note,
        });
      }
    }

    // Send notifications to students
    for (const record of records) {
      if (record.status) {
        const statusText =
          record.status === "present"
            ? "có mặt"
            : record.status === "absent"
              ? "vắng mặt"
              : record.status === "late"
                ? "đi muộn"
                : "được phép nghỉ";

        await api.post("/notifications", {
          userId: record.studentId,
          title: "Điểm danh buổi học",
          message: `Bạn đã được điểm danh "${statusText}" cho buổi học ${classData.name
            } ngày ${new Date(session.startTime).toLocaleDateString("vi-VN")}`,
          type: record.status === "absent" ? "warning" : "info",
          category: "attendance",
        });
      }
    }
  };

  // Handle timetable attendance save
  const handleSaveTimetableAttendance = async (
    records: AttendanceRow[],
    note: string
  ) => {
    if (!timetableAttendance) return;

    const { schedule, classData, fullDate } = timetableAttendance;

    // Check time restriction
    if (!isWithinClassTime(fullDate, schedule.startTime, schedule.endTime)) {
      alert(
        "❌ Đã hết giờ điểm danh!\n\nBạn chỉ có thể điểm danh trong khoảng thời gian buổi học (±15 phút)."
      );
      return;
    }

    try {
      // Filter records that have status
      const attendanceRecords = records
        .filter((r) => r.status)
        .map((r) => ({
          studentId: r.studentId,
          status: r.status!,
        }));

      if (attendanceRecords.length === 0) {
        alert(
          "⚠️ Vui lòng chọn trạng thái điểm danh cho ít nhất một học sinh."
        );
        return;
      }

      // Use new timetable attendance API
      await markTimetableAttendance({
        classId: classData._id,
        date: fullDate.toISOString(),
        records: attendanceRecords,
        note: note || undefined,
      });

      // Send notifications to students
      for (const record of records) {
        if (record.status) {
          const statusText =
            record.status === "present"
              ? "có mặt"
              : record.status === "absent"
                ? "vắng mặt"
                : record.status === "late"
                  ? "đi muộn"
                  : "được phép nghỉ";

          try {
            await api.post("/notifications", {
              userId: record.studentId,
              title: "Điểm danh buổi học",
              body: `Bạn đã được điểm danh "${statusText}" cho buổi học ${schedule.className
                } ngày ${fullDate.toLocaleDateString("vi-VN")}`,
              type: record.status === "absent" ? "warning" : "info",
            });
          } catch (notifError) {
            console.error("Error sending notification:", notifError);
          }
        }
      }

      alert("✅ Điểm danh thành công!");
      setTimetableAttendance(null);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi khi điểm danh";
      alert(`❌ Lỗi: ${errorMessage}`);
    }
  };

  // Status style helper
  const statusStyle = (status: SessionStatus) => {
    if (status === SessionStatus.Approved)
      return {
        label: "Đã xác nhận",
        className: "bg-emerald-500 hover:bg-emerald-600 text-white",
      };
    if (status === SessionStatus.Cancelled)
      return {
        label: "Đã hủy",
        className: "bg-red-500 hover:bg-red-600 text-white",
      };
    return {
      label: "Chờ duyệt",
      className: "bg-amber-400 hover:bg-amber-500 text-white",
    };
  };

  // Get class info for a session
  const getSessionClass = (session: Session): Class | undefined => {
    const classId =
      typeof session.classId === "object"
        ? session.classId._id
        : session.classId;
    return classes.find((c) => c._id === classId);
  };

  // Get all students from all classes for contact
  const allStudents = useMemo(() => {
    const studentMap = new Map<string, StudentItem & { className: string }>();
    classes.forEach((c) => {
      c.students?.forEach((s) => {
        if (!studentMap.has(s._id)) {
          studentMap.set(s._id, { ...s, className: c.name });
        }
      });
    });
    return Array.from(studentMap.values());
  }, [classes]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Trường Thành Education
            </h1>
            <p className="text-sm text-gray-500">Dashboard Giáo viên</p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationCenter userRole={user.role} />
            {/* Use Dropdown in Profile */}
            <div className="relative ml-3" ref={dropdownRef}>
              {/* Avatar */}
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="relative group focus:outline-none"
              >
                {/* Avatar chính */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-semibold text-sm shadow-md flex items-center justify-center transition-transform ring-2 ring-transparent group-focus:ring-blue-500">
                  {user.name.charAt(0)}
                </div>

                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center border-[1.5px] border-white text-white shadow-sm">
                  <ChevronDown size={10} strokeWidth={3} />
                </div>
              </button>

              {/* Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                  {/* Thông tin user tóm tắt */}
                  <div className="px-4 py-3 border-b border-gray-100 mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                  >
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user-round-icon lucide-circle-user-round"><path d="M18 20a6 6 0 0 0-12 0" /><circle cx="12" cy="10" r="4" /><circle cx="12" cy="12" r="10" /></svg>
                    </span>
                    Hồ sơ
                  </button>

                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                  >
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out-icon lucide-log-out"><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg>
                    </span>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Xin chào 👋</p>
              <h2 className="text-2xl font-bold mt-1">{user.name}</h2>
              <p className="text-blue-100 mt-2 text-sm">
                Chào mừng bạn quay trở lại bảng điều khiển giáo viên!
              </p>
            </div>
            <div className="hidden md:block text-6xl opacity-80">👨‍🏫</div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full overflow-x-auto flex gap-1 rounded-2xl bg-white p-1.5 shadow-sm border border-gray-100 justify-start md:justify-center">
            <TabsTrigger
              value="overview"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              📊 Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value="classes"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              📚 Lớp học
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              📅 Lịch dạy
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              📄 Tài liệu
            </TabsTrigger>
            <TabsTrigger
              value="evaluation"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              ⭐ Đánh giá
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              💬 Liên hệ
            </TabsTrigger>
            <TabsTrigger
              value="incidents"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              🐛 Sự cố
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-4">
            {classesLoading || scheduleLoading ? (
              <div className="text-center py-8 text-gray-500">
                Đang tải dữ liệu...
              </div>
            ) : (
              <>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                  {overviewCards.map((item) => (
                    <Card
                      key={item.label}
                      className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-90`}
                      />
                      <div className="relative p-5 text-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-white/80 text-sm font-medium">
                              {item.label}
                            </p>
                            <p className="text-3xl font-bold mt-2">
                              {item.value}
                            </p>
                            <p className="text-white/70 text-xs mt-1">
                              {item.note}
                            </p>
                          </div>
                          <span className="text-4xl opacity-80">
                            {item.icon}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="p-4">
                  <p className="font-semibold text-gray-900 mb-3">
                    Thống kê số học sinh theo ngày
                  </p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barData}
                        margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 12, fill: "#4b5563" }}
                        />
                        <YAxis tick={{ fontSize: 12, fill: "#4b5563" }} />
                        <Tooltip />
                        <Bar
                          dataKey="students"
                          fill="#1d4ed8"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="classes" className="mt-6 space-y-3">
            {classesLoading ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : classes.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                Bạn chưa được phân công lớp nào
              </Card>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {classes.map((c) => (
                    <Button
                      key={c._id}
                      variant={
                        selectedClass?._id === c._id ? "solid" : "outline"
                      }
                      className={
                        selectedClass?._id === c._id
                          ? "bg-blue-600 hover:bg-blue-700"
                          : ""
                      }
                      onClick={() => setSelectedClass(c)}
                    >
                      {c.name}
                    </Button>
                  ))}
                </div>

                {selectedClass && (
                  <Card className="p-4 space-y-3">
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                      <p className="font-semibold text-gray-900">
                        {selectedClass.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        Môn: {selectedClass.subject || "Chưa xác định"} | Khối:{" "}
                        {selectedClass.grade || "Chưa xác định"} | Số học sinh:{" "}
                        {selectedClass.studentIds?.length || 0}/
                        {selectedClass.maxStudents}
                      </p>
                      {selectedClass.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {selectedClass.description}
                        </p>
                      )}
                    </div>

                    {/* Schedule info */}
                    {selectedClass.schedule &&
                      selectedClass.schedule.length > 0 && (
                        <div className="rounded-lg bg-green-50 border border-green-100 p-4">
                          <p className="font-semibold text-gray-900 mb-2">
                            Lịch học
                          </p>
                          <div className="space-y-1">
                            {selectedClass.schedule.map((s, idx) => (
                              <p key={idx} className="text-sm text-gray-600">
                                {dayNames[s.dayOfWeek]}: {s.startTime} -{" "}
                                {s.endTime}
                                {s.room && ` (${s.room})`}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Students list */}
                    <div className="space-y-3">
                      <p className="font-semibold text-gray-900">
                        Danh sách học sinh (
                        {selectedClass.students?.length || 0})
                      </p>
                      {!selectedClass.students ||
                        selectedClass.students.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          Lớp chưa có học sinh nào
                        </p>
                      ) : (
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                          {selectedClass.students.map((s) => (
                            <div
                              key={s._id}
                              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {s.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {s.email}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedStudent(s)}
                              >
                                Chi tiết
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-900 text-lg">
                  Thời khoá biểu tuần này
                </p>
                <p className="text-sm text-gray-500">
                  Click vào tiết học để điểm danh
                </p>
              </div>
              {classesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Đang tải lịch dạy...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                  {timetableByDay.map((day) => (
                    <div
                      key={day.day}
                      className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="bg-blue-600 text-white px-3 py-2 text-center">
                        <p className="text-xs font-semibold leading-tight">
                          {day.day}
                        </p>
                        <p className="text-[11px] opacity-80 leading-tight">
                          {day.date}
                        </p>
                      </div>

                      {day.schedules.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-sm text-gray-300 py-8">
                          -
                        </div>
                      ) : (
                        <div className="flex-1 p-3 space-y-3">
                          {day.schedules.map((sch, idx) => {
                            const classData = classes.find(
                              (c) => c._id === sch.classId
                            );
                            const canAttend = isWithinClassTime(
                              day.fullDate,
                              sch.startTime,
                              sch.endTime
                            );

                            return (
                              <div
                                key={`${sch.classId}-${idx}`}
                                className={`rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 space-y-2 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow ${canAttend ? "ring-2 ring-green-400" : ""
                                  }`}
                                onClick={() => {
                                  if (classData) {
                                    setTimetableAttendance({
                                      schedule: sch,
                                      classData,
                                      fullDate: day.fullDate,
                                    });
                                  }
                                }}
                              >
                                <div className="text-sm font-semibold text-blue-700">
                                  {sch.className}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {sch.subject}
                                </div>
                                {sch.room && (
                                  <div className="text-xs text-gray-500">
                                    📍 {sch.room}
                                  </div>
                                )}
                                <div className="text-xs text-gray-800 font-medium bg-white rounded-md py-1 px-2">
                                  🕐 {sch.startTime} - {sch.endTime}
                                </div>
                                {classData && (
                                  <div className="text-xs text-gray-500">
                                    👥 {classData.studentIds?.length || 0} học
                                    sinh
                                  </div>
                                )}
                                {canAttend && (
                                  <div className="text-xs text-green-600 font-medium">
                                    ✅ Đang trong giờ học
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6 space-y-4">
            <Card className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    Tài liệu học tập
                  </p>
                  <p className="text-sm text-gray-500">
                    Quản lý và chia sẻ tài liệu với học sinh
                  </p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                  <UploadIcon className="h-4 w-4" />
                  Tải lên tài liệu mới
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 bg-blue-50 border-blue-100">
                    <p className="text-sm text-gray-600">Tổng tài liệu</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {teachingDocuments.length}
                    </p>
                  </Card>
                  <Card className="p-4 bg-green-50 border-green-100">
                    <p className="text-sm text-gray-600">Lượt tải xuống</p>
                    <p className="text-2xl font-bold text-green-600">
                      {teachingDocuments.reduce(
                        (sum, doc) => sum + doc.downloads,
                        0
                      )}
                    </p>
                  </Card>
                  <Card className="p-4 bg-orange-50 border-orange-100">
                    <p className="text-sm text-gray-600">Lớp được chia sẻ</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {new Set(teachingDocuments.map((d) => d.className)).size}
                    </p>
                  </Card>
                </div>

                <div className="space-y-3">
                  {teachingDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-12 w-12 rounded-lg flex items-center justify-center ${doc.type === "PDF"
                            ? "bg-red-100"
                            : doc.type === "DOCX"
                              ? "bg-blue-100"
                              : doc.type === "PPTX"
                                ? "bg-orange-100"
                                : "bg-gray-100"
                            }`}
                        >
                          <FileIcon
                            className={`h-6 w-6 ${doc.type === "PDF"
                              ? "text-red-600"
                              : doc.type === "DOCX"
                                ? "text-blue-600"
                                : doc.type === "PPTX"
                                  ? "text-orange-600"
                                  : "text-gray-600"
                              }`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{doc.type}</span>
                            <span>•</span>
                            <span>{doc.size}</span>
                            <span>•</span>
                            <span>{doc.className}</span>
                            <span>•</span>
                            <span>{doc.uploadDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-semibold text-gray-900">
                            {doc.downloads} lượt tải
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <DownloadIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Tải xuống</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            Xoá
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Card className="p-4 border-dashed border-2 border-gray-300 bg-gray-50">
                  <div className="text-center py-8">
                    <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">
                      Kéo thả tài liệu vào đây
                    </p>
                    <p className="text-sm text-gray-500">
                      hoặc click để chọn file từ máy tính
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Hỗ trợ: PDF, DOCX, PPTX, XLSX (tối đa 50MB)
                    </p>
                  </div>
                </Card>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="evaluation" className="mt-6">
            <Card className="p-4">
              <p className="font-semibold text-gray-900 mb-2">
                Đánh giá từ học sinh
              </p>
              <p className="text-sm text-gray-700 mb-4">
                Xem các đánh giá ẩn danh từ học sinh về chất lượng giảng dạy của
                bạn. Những phản hồi này giúp bạn cải thiện phương pháp giảng
                dạy.
              </p>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowEvaluation(true)}
              >
                Xem đánh giá
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Card className="p-4 space-y-3">
              <p className="font-semibold text-gray-900">
                Liên hệ với học sinh
              </p>
              {allStudents.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Chưa có học sinh nào trong các lớp của bạn
                </p>
              ) : (
                allStudents.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.className}</p>
                    </div>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() =>
                        setChatWith({ name: s.name, role: "student" })
                      }
                    >
                      Chat
                    </Button>
                  </div>
                ))
              )}
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="mt-6">
            <IncidentReportModal
              isOpen={true}
              onClose={() => { }}
              userName={user.name}
              userEmail={user.email}
              userRole={user.role}
              isEmbedded={true}
            />
          </TabsContent>
        </Tabs>
      </main>

      {chatWith && (
        <ChatWindow
          recipientName={chatWith.name}
          recipientRole={chatWith.role}
          currentUserName={user.name}
          onClose={() => setChatWith(null)}
        />
      )}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
      {attendanceSession && (
        <AttendanceModal
          session={attendanceSession.session}
          classData={attendanceSession.classData}
          onClose={() => setAttendanceSession(null)}
          onSave={handleSaveAttendance}
        />
      )}
      {timetableAttendance && (
        <TimetableAttendanceModal
          schedule={timetableAttendance.schedule}
          classData={timetableAttendance.classData}
          fullDate={timetableAttendance.fullDate}
          onClose={() => setTimetableAttendance(null)}
          onSave={handleSaveTimetableAttendance}
        />
      )}
      {showEvaluation && (
        <TeacherEvaluationModal onClose={() => setShowEvaluation(false)} />
      )}
      {showSettings && (
        <TeacherProfileModal
          user={user}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
