"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { ChevronDown, Camera, ChevronRight } from "lucide-react";
import { Bounce, ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWindow from "@/components/chat-window";
import NotificationCenter from "@/components/notification-center";
import IncidentReportModal from "@/components/pages/incident-report-modal";
import { useStudentDashboardStore } from "@/lib/stores/student-dashboard-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAttendanceStore } from "@/lib/stores/attendance-store";
import { usePaymentRequestsStore } from "@/lib/stores/payment-requests-store";
import api from "@/lib/api";
import { AlertTriangle } from "lucide-react";

// Helper functions for week navigation
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}`;
};

const formatWeekRange = (startOfWeek: Date): string => {
  const endOfWeek = addDays(startOfWeek, 6);
  const startDay = startOfWeek.getDate().toString().padStart(2, "0");
  const startMonth = (startOfWeek.getMonth() + 1).toString().padStart(2, "0");
  const endDay = endOfWeek.getDate().toString().padStart(2, "0");
  const endMonth = (endOfWeek.getMonth() + 1).toString().padStart(2, "0");
  const year = startOfWeek.getFullYear();

  if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
    return `${startDay} - ${endDay}/${startMonth}/${year}`;
  }
  return `${startDay}/${startMonth} - ${endDay}/${endMonth}/${year}`;
};

const isSameWeek = (date1: Date, date2: Date): boolean => {
  const start1 = getStartOfWeek(date1);
  const start2 = getStartOfWeek(date2);
  return start1.getTime() === start2.getTime();
};

// Get all weeks in a year (from account creation to current date)
const getWeeksInYear = (
  year: number,
  accountCreatedAt: Date,
  currentDate: Date
): { value: string; label: string; startDate: Date }[] => {
  const weeks: { value: string; label: string; startDate: Date }[] = [];

  // Start from first Monday of the year
  let date = new Date(year, 0, 1);
  const day = date.getDay();
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  date.setDate(date.getDate() + diff);

  const accountStart = getStartOfWeek(accountCreatedAt);
  accountStart.setHours(0, 0, 0, 0);
  const currentWeekStart = getStartOfWeek(currentDate);
  currentWeekStart.setHours(0, 0, 0, 0);

  while (
    date.getFullYear() === year ||
    (date.getFullYear() === year + 1 &&
      date.getMonth() === 0 &&
      date.getDate() <= 7)
  ) {
    const weekStart = new Date(date);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = addDays(weekStart, 6);

    // Only include weeks from account creation to current week
    if (
      weekStart.getTime() >= accountStart.getTime() &&
      weekStart.getTime() <= currentWeekStart.getTime()
    ) {
      const startStr = `${weekStart.getDate().toString().padStart(2, "0")}/${(
        weekStart.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}`;
      const endStr = `${weekEnd.getDate().toString().padStart(2, "0")}/${(
        weekEnd.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}`;

      weeks.push({
        value: weekStart.toISOString(),
        label: `${startStr} To ${endStr}`,
        startDate: weekStart,
      });
    }

    date = addDays(date, 7);

    // Stop if we've passed the current date
    if (weekStart.getTime() > currentWeekStart.getTime()) break;
  }

  return weeks;
};

// Get available years from account creation to current
const getAvailableYears = (
  accountCreatedAt: Date,
  currentDate: Date
): number[] => {
  const years: number[] = [];
  const startYear = accountCreatedAt.getFullYear();
  const endYear = currentDate.getFullYear();

  for (let year = endYear; year >= startYear; year--) {
    years.push(year);
  }

  return years;
};

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_NAMES_VN = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

interface StudentDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    studentCode: string;
    gender: string;
  };
  onLogout: () => void;
}

type DaySchedule = {
  day: string;
  date: string;
  code: string;
  subject: string;
  teacher: string;
  room: string;
  time: string;
  status: "confirmed" | "pending" | "unconfirmed";
  sessionId?: string;
  attendanceStatus?: "present" | "absent" | "late" | "excused" | null;
};

type RankingCategory = "score" | "diligence" | "attendance";

const overviewCards = [
  {
    label: "Khóa học",
    value: 3,
    note: "Đang theo học",
    icon: "📚",
    color: "from-blue-500 to-blue-600",
  },
  {
    label: "Buổi học tới",
    value: 2,
    note: "Tuần này",
    icon: "📅",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    label: "Điểm TB",
    value: 78.3,
    note: "Đạt kết quả tốt",
    icon: "⭐",
    color: "from-amber-500 to-orange-500",
  },
  {
    label: "Bài tập",
    value: 12,
    note: "Chưa nộp",
    icon: "📝",
    color: "from-purple-500 to-purple-600",
  },
];

const streakCards = [
  {
    title: "Chuỗi điểm danh",
    value: "12 ngày",
    sub: "Kỷ lục: 18 ngày",
    hint: "Giữ vững thêm 3 buổi để nhận huy hiệu mới",
    bar: 70,
    tone: "emerald",
    icon: "🔥",
    bgGradient: "from-emerald-50 to-green-50",
    borderColor: "border-emerald-200",
  },
  {
    title: "Streak làm bài tập",
    value: "7 ngày",
    sub: "Đã nộp 7/7 ngày",
    hint: "Nộp bài hôm nay trước 22:00 để giữ streak",
    bar: 50,
    tone: "blue",
    icon: "✨",
    bgGradient: "from-blue-50 to-indigo-50",
    borderColor: "border-blue-200",
  },
  {
    title: "Tần suất ôn luyện",
    value: "5 phiên/tuần",
    sub: "Mục tiêu: 6 phiên",
    hint: "Còn 1 phiên để đạt mục tiêu tuần",
    bar: 80,
    tone: "violet",
    icon: "📖",
    bgGradient: "from-violet-50 to-purple-50",
    borderColor: "border-violet-200",
  },
];

const badges = [
  {
    title: "Chăm chỉ",
    desc: "5 ngày liên tục",
    earned: true,
    icon: "🏃",
  },
  {
    title: "Nộp bài đúng hạn",
    desc: "10 lần liên tục",
    earned: true,
    icon: "⏰",
  },
  {
    title: "Điểm cao",
    desc: "≥ 80 trong 3 bài",
    earned: false,
    icon: "🎯",
  },
];

const leaderboardOptions: Record<
  RankingCategory,
  { label: string; desc: string }
> = {
  score: { label: "Top điểm", desc: "Điểm trung bình cao" },
  attendance: { label: "Chuyên cần", desc: "Đi học đầy đủ" },
  diligence: { label: "Chăm chỉ", desc: "Hoàn thành bài tập" },
};

const leaderboardData: Record<
  RankingCategory,
  {
    rank: number;
    name: string;
    className: string;
    metric: string;
    detail: string;
  }[]
> = {
  score: [
    {
      rank: 1,
      name: "Nguyễn Văn A",
      className: "Lớp Toán 12A1",
      metric: "9.8",
      detail: "Top Điểm",
    },
    {
      rank: 2,
      name: "Trần Thị B",
      className: "Lớp Anh Văn 12B2",
      metric: "9.6",
      detail: "Top Điểm",
    },
    {
      rank: 3,
      name: "Lê Văn C",
      className: "Lớp Vật Lý 11C1",
      metric: "9.5",
      detail: "Top Điểm",
    },
    {
      rank: 4,
      name: "Phạm Minh D",
      className: "Lớp Hóa Học 10A2",
      metric: "9.2",
      detail: "Top Điểm",
    },
    {
      rank: 5,
      name: "Hoàng An E",
      className: "Lớp Toán 11B1",
      metric: "9.0",
      detail: "Top Điểm",
    },
  ],
  attendance: [
    {
      rank: 1,
      name: "Trần Minh T",
      className: "Đã theo học 240 ngày",
      metric: "100%",
      detail: "Chuyên cần",
    },
    {
      rank: 2,
      name: "Lê Hải Y",
      className: "Đã theo học 210 ngày",
      metric: "100%",
      detail: "Chuyên cần",
    },
    {
      rank: 3,
      name: "Nguyễn Công P",
      className: "Đã theo học 180 ngày",
      metric: "98%",
      detail: "Nghỉ 1 buổi có phép",
    },
    {
      rank: 4,
      name: "Đặng Thu H",
      className: "Đã theo học 150 ngày",
      metric: "97%",
      detail: "Nghỉ 1 buổi",
    },
    {
      rank: 5,
      name: "Vũ Gia K",
      className: "Đã theo học 130 ngày",
      metric: "96%",
      detail: "Nghỉ 1 buổi",
    },
  ],
  diligence: [
    {
      rank: 1,
      name: "Bùi Xuân H",
      className: "Hoàn thành 150 bài tập",
      metric: "Level 15",
      detail: "Chăm Chỉ",
    },
    {
      rank: 2,
      name: "Ngô Quốc B",
      className: "Hoàn thành 142 bài tập",
      metric: "Level 14",
      detail: "Chăm Chỉ",
    },
    {
      rank: 3,
      name: "Lý Gia L",
      className: "Hoàn thành 128 bài tập",
      metric: "Level 12",
      detail: "Chăm Chỉ",
    },
    {
      rank: 4,
      name: "Mai Thanh V",
      className: "Hoàn thành 125 bài tập",
      metric: "Level 12",
      detail: "Chăm Chỉ",
    },
    {
      rank: 5,
      name: "Đỗ Mạnh Q",
      className: "Hoàn thành 118 bài tập",
      metric: "Level 11",
      detail: "Chăm Chỉ",
    },
  ],
};

const scheduleWeek: DaySchedule[] = [
  {
    day: "MON",
    date: "05/01",
    code: "MATH101",
    subject: "Toán",
    teacher: "Cô Trần Thị B",
    room: "Phòng 604",
    time: "17:00-18:30",
    status: "confirmed",
  },
  {
    day: "TUE",
    date: "06/01",
    code: "ENG102",
    subject: "Anh văn",
    teacher: "Thầy Lê Văn E",
    room: "Phòng 417",
    time: "18:00-19:30",
    status: "confirmed",
  },
  {
    day: "WED",
    date: "07/01",
    code: "",
    subject: "",
    teacher: "",
    room: "",
    time: "",
    status: "unconfirmed",
  },
  {
    day: "THU",
    date: "08/01",
    code: "PHY103",
    subject: "Vật lý",
    teacher: "Thầy Nguyễn Văn F",
    room: "Phòng 608",
    time: "17:00-18:30",
    status: "pending",
  },
  {
    day: "FRI",
    date: "09/01",
    code: "MATH101",
    subject: "Toán",
    teacher: "Cô Trần Thị B",
    room: "Phòng 604",
    time: "17:00-18:30",
    status: "confirmed",
  },
  {
    day: "SAT",
    date: "10/01",
    code: "",
    subject: "",
    teacher: "",
    room: "",
    time: "",
    status: "unconfirmed",
  },
  {
    day: "SUN",
    date: "11/01",
    code: "",
    subject: "",
    teacher: "",
    room: "",
    time: "",
    status: "unconfirmed",
  },
];

const progressData = [
  { week: "Tuần 1", score: 65 },
  { week: "Tuần 2", score: 72 },
  { week: "Tuần 3", score: 78 },
  { week: "Tuần 4", score: 82 },
];

const grades = [
  { subject: "Toán", score: 82, status: "Tốt", detail: "Bài tập nâng cao" },
  { subject: "Anh văn", score: 78, status: "Tốt", detail: "Ôn ngữ pháp" },
  { subject: "Lý", score: 75, status: "Khá", detail: "Ôn phần điện" },
];

const contacts = [
  {
    name: "Cô Trần Thị B",
    subject: "Dạy môn Toán",
    avatar: "👩‍🏫",
    status: "online",
  },
  {
    name: "Thầy Lê Văn E",
    subject: "Dạy môn Anh văn",
    avatar: "👨‍🏫",
    status: "offline",
  },
];

const gradeBreakdown = {
  assignments: [
    {
      name: "Bài kiểm tra giữa kỳ",
      score: 8.5,
      weight: "30%",
      date: "15/01/2025",
    },
    { name: "Bài tập về nhà 1", score: 9.0, weight: "10%", date: "20/01/2025" },
    { name: "Bài tập về nhà 2", score: 8.0, weight: "10%", date: "25/01/2025" },
    { name: "Kiểm tra 15 phút", score: 7.5, weight: "20%", date: "28/01/2025" },
    { name: "Thi cuối kỳ", score: 8.8, weight: "30%", date: "05/02/2025" },
  ],
  attendance: "28/30 buổi (93.3%)",
  behavior: "Tốt - Em rất chăm chỉ và tích cực trong lớp",
  teacherComment:
    "Em học tập tốt, có tinh thần tự giác cao. Cần chú ý thêm vào phần bài tập nâng cao để phát triển tư duy.",
};

const classDetail = {
  subject: "Toán",
  day: "Thứ 2",
  time: "17:00-18:30",
  room: "Phòng A1",
  teacher: "Cô Trần Thị B",
  email: "teacher@daythempro.com",
  phone: "0123 456 789",
  content: [
    "Ôn tập kiến thức tuần trước",
    "Giới thiệu chuyên đề mới",
    "Bài tập thực hành",
    "Kiểm tra kiến thức",
  ],
  requirements: [
    "Mang theo vở ghi chép và bút chì",
    "Ôn tập bài cũ trước khi đến lớp",
    "Chuẩn bị máy tính (nếu cần thiết)",
    "Đến lớp 5 phút trước giờ bắt đầu",
  ],
  stats: { total: 12, attended: 11, absent: 1 },
};

function ClassDetailModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
      <Card className="w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Chi tiết lớp học</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4 bg-blue-50">
            <h3 className="font-semibold text-gray-900 mb-2">
              Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              <p>Môn học: {classDetail.subject}</p>
              <p>Ngày dạy: {classDetail.day}</p>
              <p>Giờ học: {classDetail.time}</p>
              <p>Phòng học: {classDetail.room}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 bg-purple-50">
            <h3 className="font-semibold text-gray-900 mb-2">
              Thông tin giáo viên
            </h3>
            <p className="text-sm text-gray-700">{classDetail.teacher}</p>
            <p className="text-sm text-gray-700">Email: {classDetail.email}</p>
            <p className="text-sm text-gray-700">SĐT: {classDetail.phone}</p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 bg-green-50">
            <h3 className="font-semibold text-gray-900 mb-2">
              Nội dung bài học
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {classDetail.content.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 bg-yellow-50">
            <h3 className="font-semibold text-gray-900 mb-2">
              Yêu cầu chuẩn bị
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {classDetail.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-500">Tổng buổi học</p>
              <p className="text-2xl font-bold text-gray-900">
                {classDetail.stats.total}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-500">Buổi đã học</p>
              <p className="text-2xl font-bold text-green-600">
                {classDetail.stats.attended}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-500">Vắng mặt</p>
              <p className="text-2xl font-bold text-red-600">
                {classDetail.stats.absent}
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

function GradeDetailModal({
  subject,
  score,
  onClose,
}: {
  subject: string;
  score: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
      <Card className="w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Chi tiết điểm số - {subject}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-700 mb-4">Điểm trung bình: {score}</p>

        <div className="space-y-3 mb-4">
          {gradeBreakdown.assignments.map((assignment) => (
            <div
              key={assignment.name}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-900">{assignment.name}</p>
                <p className="text-xs text-gray-600">
                  Ngày: {assignment.date} • Trọng số: {assignment.weight}
                </p>
              </div>
              <p className="text-lg font-semibold text-blue-700">
                {assignment.score}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-gray-800">
          Tình hình điểm danh: {gradeBreakdown.attendance}
        </div>
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-gray-800">
          Đánh giá thái độ: {gradeBreakdown.behavior}
        </div>
        <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-gray-800">
          Nhận xét giáo viên: {gradeBreakdown.teacherComment}
        </div>

        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={onClose}
        >
          Đóng
        </Button>
      </Card>
    </div>
  );
}

function SettingsModal({
  user,
  onClose,
}: {
  user: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    phone?: string;
    studentCode: string;
    parentName?: string;
    parentPhone?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  onClose: () => void;
}) {
  // State để hiển thị preview ảnh
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
    gender: user.gender || "",
  });

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
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const userId = user._id || user.id;
      if (!userId) {
        toast.error("Không tìm thấy thông tin người dùng");
        return;
      }

      await api.patch(`/users/${userId}`, {
        name: formData.name,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender
      });

      toast.success("Cập nhật thông tin thành công!");
      setIsEditing(false);
      // Reload page to reflect changes or rely on parent refetch
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3 animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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

            {isEditing && (
              <button
                onClick={handleEditAvatar}
                className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-200 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95"
                title="Đổi ảnh đại diện"
              >
                <Camera size={17} />
              </button>
            )}
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
                className={`w-full rounded-lg border px-3 py-2.5 transition-all ${isEditing
                  ? "border-blue-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  : "border-gray-300"
                  }`}
                value={isEditing ? formData.name : user.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                readOnly={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Giới tính</label>
              {isEditing ? (
                <select
                  className="w-full rounded-lg border border-blue-300 px-3 py-2.5 transition-all appearance-none"
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              ) : (
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none bg-gray-50 text-gray-700"
                  defaultValue={
                    user.gender === "male"
                      ? "Nam"
                      : user.gender === "female"
                        ? "Nữ"
                        : user.gender === "other"
                          ? "Khác"
                          : "Chưa cập nhật"
                  }
                  readOnly
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Ngày sinh</label>
              <input
                type={isEditing ? "date" : "text"}
                className={`w-full rounded-lg border px-3 py-2.5 transition-all ${isEditing
                  ? "border-blue-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  : "border-gray-300"
                  }`}
                value={
                  isEditing
                    ? formData.dateOfBirth
                    : user.dateOfBirth
                      ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN")
                      : "Chưa cập nhật"
                }
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                readOnly={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Số điện thoại</label>
              <input
                className={`w-full rounded-lg border px-3 py-2.5 transition-all ${isEditing
                  ? "border-blue-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  : "border-gray-300"
                  }`}
                value={isEditing ? formData.phone : (user.phone || "Chưa cập nhật")}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                readOnly={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-gray-700 font-medium">Mã số học sinh</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              defaultValue={user.studentCode || "Chưa có"}
              readOnly
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-700 font-medium">Email</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              defaultValue={user.email}
              readOnly
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Họ và tên phụ huynh</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                defaultValue={user.parentName || "Chưa có"}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Số điện thoại phụ huynh</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                defaultValue={user.parentPhone || "Chưa cập nhật"}
                readOnly
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
              >
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-round-pen-icon lucide-user-round-pen"><path d="M2 21a8 8 0 0 1 10.821-7.487" /><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /><circle cx="10" cy="8" r="5" /></svg>
                </span>
                Chỉnh Sửa
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user.name,
                      phone: user.phone || "",
                      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
                      gender: user.gender || "",
                    });
                  }}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function StudentDashboard({
  user,
  onLogout,
}: StudentDashboardProps) {
  const [chatWith, setChatWith] = useState<{
    name: string;
    role: string;
  } | null>(null);
  const [showClassDetail, setShowClassDetail] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<{
    subject: string;
    score: number;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    toast.info("Đang đăng xuất...", {
      position: "top-right",
      autoClose: 500,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "light",
      transition: Bounce,
    });
    setTimeout(() => {
      onLogout();
    }, 500);
  };

  //Dropdown Profile
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [rankingView, setRankingView] = useState<RankingCategory>("score");
  //Xử lý click ra ngoài để đóng menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Week navigation state
  const [selectedYear, setSelectedYear] = useState<number>(() =>
    new Date().getFullYear()
  );
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() =>
    getStartOfWeek(new Date())
  );

  // Fetch real data from API
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    fetchDashboardData,
  } = useStudentDashboardStore();
  const { user: authUser } = useAuthStore();

  const { records: attendanceRecords, fetchAttendance } = useAttendanceStore();
  const { myRequests, fetchMyRequests } = usePaymentRequestsStore();

  // State to hold full user details including sensitive/personal info not in initial props
  const [fullUserDetails, setFullUserDetails] = useState<any>(null);

  useEffect(() => {
    const fetchFullUserDetails = async () => {
      try {
        const userId = authUser?._id || user.id;
        if (userId) {
          const response = await api.get(`/users/${userId}`);
          setFullUserDetails(response.data);
          console.log("Data của user:", response.data)
        }
      } catch (error) {
        console.error("Failed to fetch full user details:", error);
      }
    };
    fetchFullUserDetails();
  }, [authUser, user.id]);

  useEffect(() => {
    if (user || authUser) {
      fetchMyRequests();
    }
  }, [user, authUser, fetchMyRequests]);

  const pendingPayments = myRequests.filter(r => r.status === 'pending' || r.status === 'overdue');
  const paidPayments = myRequests.filter(r => r.status === 'paid');
  const totalPendingAmount = pendingPayments.reduce((sum, r) => sum + r.finalAmount, 0);
  const totalPaidAmount = paidPayments.reduce((sum, r) => sum + r.finalAmount, 0);

  // Calculate the earliest date (account creation date)
  const accountCreatedAt = useMemo(() => {
    const createdAt = authUser?.createdAt;
    if (createdAt) {
      return getStartOfWeek(new Date(createdAt));
    }
    // Default to 1 year ago if no createdAt
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return getStartOfWeek(oneYearAgo);
  }, [authUser?.createdAt]);

  // Current week start for comparison
  const currentWeekStart = useMemo(() => getStartOfWeek(new Date()), []);
  const currentDate = useMemo(() => new Date(), []);

  // Get available years and weeks
  const availableYears = useMemo(
    () => getAvailableYears(accountCreatedAt, currentDate),
    [accountCreatedAt, currentDate]
  );

  const weeksInSelectedYear = useMemo(
    () => getWeeksInYear(selectedYear, accountCreatedAt, currentDate),
    [selectedYear, accountCreatedAt, currentDate]
  );

  // Check if current week is selected
  const isCurrentWeek = isSameWeek(selectedWeekStart, new Date());

  // Handle year change
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    // Auto-select the latest week in that year
    const weeks = getWeeksInYear(year, accountCreatedAt, currentDate);
    if (weeks.length > 0) {
      // If it's current year, select current week; otherwise select last week of that year
      if (year === currentDate.getFullYear()) {
        setSelectedWeekStart(currentWeekStart);
      } else {
        setSelectedWeekStart(weeks[weeks.length - 1].startDate);
      }
    }
  };

  // Handle week change
  const handleWeekChange = (weekValue: string) => {
    setSelectedWeekStart(new Date(weekValue));
  };

  // Go to current week
  const goToCurrentWeek = () => {
    setSelectedYear(currentDate.getFullYear());
    setSelectedWeekStart(currentWeekStart);
  };

  // Helper function to get attendance status for a session or by date
  const getAttendanceForSession = (sessionId: string) => {
    const record = attendanceRecords.find((r) => {
      // sessionId might be a string or populated object
      const sid =
        typeof r.sessionId === "string"
          ? r.sessionId
          : (r.sessionId as any)?._id;
      return sid === sessionId;
    });
    return record?.status || null;
  };

  // Helper function to get attendance by date and class
  const getAttendanceByDateAndClass = (date: Date, classId?: string) => {
    // Format date to compare (YYYY-MM-DD)
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();
    const targetDay = date.getDate();

    const record = attendanceRecords.find((r) => {
      // Check if sessionId is populated with date info
      const session = r.sessionId as any;
      if (session?.startTime) {
        const sessionDate = new Date(session.startTime);
        const sessionYear = sessionDate.getFullYear();
        const sessionMonth = sessionDate.getMonth();
        const sessionDay = sessionDate.getDate();

        if (
          sessionYear === targetYear &&
          sessionMonth === targetMonth &&
          sessionDay === targetDay
        ) {
          // If classId provided, match it too
          if (classId && session.classId) {
            const sessionClassId =
              typeof session.classId === "string"
                ? session.classId
                : session.classId._id;
            return sessionClassId === classId;
          }
          return true;
        }
      }
      // Also check createdAt if sessionId is not populated
      if (r.createdAt) {
        const recordDate = new Date(r.createdAt);
        const recordYear = recordDate.getFullYear();
        const recordMonth = recordDate.getMonth();
        const recordDay = recordDate.getDate();

        if (
          recordYear === targetYear &&
          recordMonth === targetMonth &&
          recordDay === targetDay
        ) {
          return true;
        }
      }
      return false;
    });
    return record?.status || null;
  };

  // Generate schedule for selected week
  const weekSchedule = useMemo(() => {
    const schedule: DaySchedule[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(selectedWeekStart, i);
      const dayName = DAY_NAMES[i];
      const dateStr = formatDate(dayDate);
      const isPast = dayDate < today;
      const isToday = dayDate.getTime() === today.getTime();

      // Check if there's a session from API data for this day
      let sessionForDay = null;
      if (dashboardData?.upcomingSessions) {
        sessionForDay = dashboardData.upcomingSessions.find((session) => {
          const sessionDate = new Date(session.date);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === dayDate.getTime();
        });
      }

      // Also check class schedules from API
      let classForDay = null;
      if (dashboardData?.classes) {
        const dayOfWeek = dayDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        for (const cls of dashboardData.classes) {
          const matchingSchedule = cls.schedule?.find(
            (s) => s.dayOfWeek === dayOfWeek
          );
          if (matchingSchedule) {
            classForDay = { class: cls, schedule: matchingSchedule };
            break;
          }
        }
      }

      // Get attendance status - try by sessionId first, then by date
      const sessionId = sessionForDay?._id;
      let attendanceStatus = sessionId
        ? getAttendanceForSession(sessionId)
        : null;

      // If no attendance found by sessionId, try by date and class
      if (!attendanceStatus && classForDay) {
        attendanceStatus = getAttendanceByDateAndClass(
          dayDate,
          classForDay.class._id
        );
      } else if (!attendanceStatus) {
        attendanceStatus = getAttendanceByDateAndClass(dayDate);
      }

      if (sessionForDay) {
        schedule.push({
          day: dayName,
          date: dateStr,
          code:
            sessionForDay.class?.name?.substring(0, 7).toUpperCase() || "CLASS",
          subject: sessionForDay.class?.name || "Lớp học",
          teacher: sessionForDay.class?.teacher?.name || "Giáo viên",
          room: "Phòng học",
          time: `${sessionForDay.startTime}-${sessionForDay.endTime}`,
          status: isPast
            ? "confirmed"
            : sessionForDay.status === "scheduled"
              ? "pending"
              : "confirmed",
          sessionId: sessionForDay._id,
          attendanceStatus,
        });
      } else if (classForDay) {
        schedule.push({
          day: dayName,
          date: dateStr,
          code: classForDay.class.name.substring(0, 7).toUpperCase(),
          subject: classForDay.class.name,
          teacher: classForDay.class.teacherName,
          room: classForDay.schedule.room || "Phòng học",
          time: `${classForDay.schedule.startTime}-${classForDay.schedule.endTime}`,
          status: isPast ? "confirmed" : "pending",
          attendanceStatus,
        });
      } else {
        // Find matching static schedule data for demo
        const staticSlot = scheduleWeek.find((s) => s.day === dayName);
        if (staticSlot && staticSlot.code) {
          schedule.push({
            ...staticSlot,
            date: dateStr,
            status: isPast ? "confirmed" : staticSlot.status,
          });
        } else {
          schedule.push({
            day: dayName,
            date: dateStr,
            code: "",
            subject: "",
            teacher: "",
            room: "",
            time: "",
            status: "unconfirmed",
          });
        }
      }
    }

    return schedule;
  }, [selectedWeekStart, dashboardData, attendanceRecords]);

  // Debug: log attendance records
  useEffect(() => {
    if (attendanceRecords.length > 0) {
      console.log("Attendance Records loaded:", attendanceRecords);
      attendanceRecords.forEach((r) => {
        const session = r.sessionId as any;
        console.log("Record:", {
          status: r.status,
          sessionId: r.sessionId,
          sessionStartTime: session?.startTime,
          sessionClassId: session?.classId,
          createdAt: r.createdAt,
        });
      });
    }
  }, [attendanceRecords]);

  useEffect(() => {
    // Fetch dashboard data when component mounts
    const studentId = authUser?._id || user.id;
    if (studentId) {
      fetchDashboardData(studentId).catch(console.error);
      // Fetch attendance records for this student
      fetchAttendance({ studentId }).catch(console.error);
    }
    console.log("studentId: ", studentId);
  }, [authUser, user.id, fetchDashboardData, fetchAttendance]);

  // Compute dynamic overview cards based on real data
  const dynamicOverviewCards = dashboardData
    ? [
      {
        label: "Khóa học",
        value: dashboardData.classes.length,
        note: "Đang theo học",
        icon: "📚",
        color: "from-blue-500 to-blue-600",
      },
      {
        label: "Buổi học tới",
        value: dashboardData.upcomingSessions.length,
        note: "Sắp diễn ra",
        icon: "📅",
        color: "from-emerald-500 to-emerald-600",
      },
      {
        label: "Điểm TB",
        value:
          dashboardData.recentGrades.length > 0
            ? (
              dashboardData.recentGrades.reduce(
                (acc, g) => acc + g.percentage,
                0
              ) / dashboardData.recentGrades.length
            ).toFixed(1)
            : "N/A",
        note:
          dashboardData.recentGrades.length > 0
            ? "Đạt kết quả"
            : "Chưa có điểm",
        icon: "⭐",
        color: "from-amber-500 to-orange-500",
      },
      {
        label: "Chuyên cần",
        value: `${dashboardData.attendanceStats.rate || 0}%`,
        note: `${dashboardData.attendanceStats.present}/${dashboardData.attendanceStats.total} buổi`,
        icon: "✅",
        color: "from-purple-500 to-purple-600",
      },
    ]
    : overviewCards;

  const tabIcons: Record<RankingCategory, string> = {
    score: "🏆",
    attendance: "👥",
    diligence: "⚡",
  };

  const statusStyle = (status: DaySchedule["status"]) => {
    if (status === "confirmed")
      return {
        label: "Đã xác nhận",
        className: "bg-emerald-500 hover:bg-emerald-600 text-white",
      };
    if (status === "pending")
      return {
        label: "Chưa xác nhận",
        className: "bg-amber-400 hover:bg-amber-500 text-white",
      };
    return {
      label: "Chưa xác nhận",
      className: "bg-gray-200 text-gray-700 hover:bg-gray-200",
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <ToastContainer />
      {/* Header với thiết kế hiện đại */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
              T
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Trường Thành Education
              </h1>
              <p className="text-xs text-gray-500">Dashboard Học sinh</p>
            </div>
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
                    onClick={handleLogout}
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
        {pendingPayments.length > 0 && (
          <div
            onClick={() => window.location.href = '/payment'}
            className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r cursor-pointer hover:bg-red-100 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-bold text-red-700">Thông báo học phí</p>
                  <p className="text-sm text-red-600">
                    Bạn có <span className="font-bold">{pendingPayments.length}</span> khoản cần thanh toán.
                    Tổng tiền: <span className="font-bold text-red-800">{totalPendingAmount.toLocaleString('vi-VN')} đ</span>
                  </p>
                </div>
              </div>
              <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700">
                Thanh toán ngay
              </Button>
            </div>
          </div>
        )}
        {/* Lời chào thân thiện */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Xin chào 👋</p>
              <h2 className="text-2xl font-bold mt-1">{user.name}</h2>
              <p className="text-blue-100 mt-2 text-sm">
                Hôm nay là một ngày tuyệt vời để học tập!
              </p>
            </div>
            <div className="hidden md:block text-6xl opacity-80">🎓</div>
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
              value="schedule"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              📅 Lịch học
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              📈 Tiến độ
            </TabsTrigger>
            <TabsTrigger
              value="grades"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              🏆 Điểm số
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              🥇 Bảng xếp hạng
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              💬 Liên hệ
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              💳 Thanh toán
            </TabsTrigger>
            <TabsTrigger
              value="incidents"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              🐛 Sự cố
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {/* Loading state */}
            {dashboardLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Đang tải dữ liệu...</p>
                </div>
              </div>
            )}

            {/* Overview Cards với gradient */}
            {!dashboardLoading && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {dynamicOverviewCards.map((card) => (
                    <Card
                      key={card.label}
                      className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-90`}
                      />
                      <div className="relative p-5 text-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-white/80 text-sm font-medium">
                              {card.label}
                            </p>
                            <p className="text-3xl font-bold mt-2">
                              {card.value}
                            </p>
                            <p className="text-white/70 text-xs mt-1">
                              {card.note}
                            </p>
                          </div>
                          <span className="text-4xl opacity-80">
                            {card.icon}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Financial Summary Card */}
            <Card className="rounded-2xl shadow-sm border border-gray-100 p-6 bg-white mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  💰 Thông tin học phí
                </h2>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/payment'}>
                  Chi tiết <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-600">Cần thanh toán</p>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      {pendingPayments.length} khoản
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 truncate">
                    {totalPendingAmount.toLocaleString('vi-VN')} đ
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-600">Đã thanh toán</p>
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                      {paidPayments.length} khoản
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 truncate">
                    {totalPaidAmount.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>
            </Card>

            {/* Streak Cards cải tiến */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {streakCards.map((item) => (
                <Card
                  key={item.title}
                  className={`p-5 bg-gradient-to-br ${item.bgGradient} ${item.borderColor} border-2 hover:shadow-lg transition-all duration-300`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          {item.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-0.5">
                          {item.value}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-3 py-1.5 rounded-full bg-${item.tone}-100 text-${item.tone}-700 font-semibold`}
                    >
                      🔥 Streak
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">{item.sub}</p>
                  <div className="mt-3 h-2.5 w-full rounded-full bg-white/80 overflow-hidden shadow-inner">
                    <div
                      className={`h-full bg-gradient-to-r from-${item.tone}-400 to-${item.tone}-600 rounded-full transition-all duration-500`}
                      style={{ width: `${item.bar}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-3 bg-white/60 rounded-lg px-3 py-2">
                    💡 {item.hint}
                  </p>
                </Card>
              ))}
            </div>

            {/* Badges Section cải tiến */}
            <Card className="mt-6 p-6 bg-white border-0 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎖️</span>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      Huy hiệu động viên
                    </p>
                    <p className="text-xs text-gray-500">
                      Thu thập để giữ động lực học tập
                    </p>
                  </div>
                </div>
                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-full">
                  {badges.filter((b) => b.earned).length}/{badges.length} đã đạt
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {badges.map((b) => (
                  <div
                    key={b.title}
                    className={`rounded-2xl border-2 px-5 py-4 transition-all duration-300 hover:scale-[1.02] ${b.earned
                      ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-md shadow-emerald-100"
                      : "border-gray-100 bg-gray-50"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-3xl ${b.earned ? "" : "grayscale opacity-50"
                          }`}
                      >
                        {b.icon}
                      </span>
                      <div>
                        <p
                          className={`font-bold ${b.earned ? "text-emerald-700" : "text-gray-500"
                            }`}
                        >
                          {b.title}
                        </p>
                        <p className="text-xs text-gray-500">{b.desc}</p>
                      </div>
                    </div>
                    {b.earned ? (
                      <span className="inline-flex mt-3 text-xs px-3 py-1.5 rounded-full bg-emerald-600 text-white font-semibold shadow-sm">
                        ✓ Đã đạt
                      </span>
                    ) : (
                      <span className="inline-flex mt-3 text-xs px-3 py-1.5 rounded-full bg-gray-200 text-gray-600 font-medium">
                        Chưa đạt
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card className="p-6 space-y-5 bg-white border-0 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {isCurrentWeek ? "Lịch học tuần này" : "Lịch học"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isCurrentWeek
                        ? "Theo dõi các buổi học sắp tới"
                        : `Tuần ${formatWeekRange(selectedWeekStart)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Year Selector */}
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(Number(e.target.value))}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>

                  {/* Week Selector */}
                  <select
                    value={
                      weeksInSelectedYear.find(
                        (w) =>
                          w.startDate.toDateString() ===
                          selectedWeekStart.toDateString()
                      )?.value || ""
                    }
                    onChange={(e) => handleWeekChange(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[140px]"
                  >
                    {weeksInSelectedYear.map((week) => (
                      <option key={week.value} value={week.value}>
                        {week.label}
                      </option>
                    ))}
                  </select>

                  {/* Current Week Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToCurrentWeek}
                    className="text-sm border-gray-200 hover:bg-gray-50"
                  >
                    Tuần hiện tại
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {weekSchedule.map((slot) => {
                  const style = statusStyle(slot.status);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const slotDate = addDays(
                    selectedWeekStart,
                    DAY_NAMES.indexOf(slot.day)
                  );
                  const isToday = slotDate.getTime() === today.getTime();
                  const isPast = slotDate < today;

                  return (
                    <div
                      key={slot.day}
                      className={`rounded-2xl border-2 bg-white shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md ${isToday
                        ? "border-blue-400 ring-2 ring-blue-100"
                        : isPast
                          ? "border-gray-200 opacity-80"
                          : "border-gray-100"
                        }`}
                    >
                      <div
                        className={`px-3 py-3 text-center ${isToday
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                          : isPast
                            ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                            : "bg-gradient-to-r from-gray-700 to-gray-800 text-white"
                          }`}
                      >
                        <p className="text-xs font-bold leading-tight">
                          {slot.day}
                        </p>
                        <p className="text-lg font-bold leading-tight">
                          {slot.date.split("/")[0]}
                        </p>
                        {isToday && (
                          <p className="text-[10px] mt-0.5 text-blue-200">
                            Hôm nay
                          </p>
                        )}
                        {isPast && !isToday && (
                          <p className="text-[10px] mt-0.5 text-gray-300">
                            Đã qua
                          </p>
                        )}
                      </div>

                      {slot.code ? (
                        <div className="flex-1 p-3 space-y-2 text-center">
                          <div
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${isPast
                              ? "bg-gray-100 text-gray-600"
                              : "bg-blue-100 text-blue-700"
                              }`}
                          >
                            {slot.code}
                          </div>
                          <div className="text-xs text-gray-500">
                            📍 {slot.room}
                          </div>
                          <div className="text-sm text-gray-900 font-bold">
                            {slot.time}
                          </div>
                          <div className="text-xs text-gray-600">
                            👨‍🏫 {slot.teacher}
                          </div>
                          <div className="space-y-2 pt-2">
                            <Button
                              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs rounded-xl shadow-md"
                              onClick={() => setShowClassDetail(true)}
                            >
                              📄 Tài liệu
                            </Button>
                            {/* Attendance Status */}
                            {slot.attendanceStatus ? (
                              <div
                                className={`w-full text-xs rounded-xl py-2 px-3 font-medium ${slot.attendanceStatus === "present"
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  : slot.attendanceStatus === "absent"
                                    ? "bg-red-100 text-red-700 border border-red-200"
                                    : slot.attendanceStatus === "late"
                                      ? "bg-amber-100 text-amber-700 border border-amber-200"
                                      : slot.attendanceStatus === "excused"
                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                        : "bg-gray-100 text-gray-600"
                                  }`}
                              >
                                {slot.attendanceStatus === "present" &&
                                  "✅ Có mặt"}
                                {slot.attendanceStatus === "absent" &&
                                  "❌ Nghỉ học"}
                                {slot.attendanceStatus === "late" &&
                                  "⏰ Đi muộn"}
                                {slot.attendanceStatus === "excused" &&
                                  "📝 Nghỉ phép"}
                              </div>
                            ) : (isPast || isToday) && slot.code ? (
                              <div className="w-full text-xs rounded-xl py-2 px-3 font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                ⏳ Chưa điểm danh
                              </div>
                            ) : (
                              <Button
                                className={`w-full text-xs rounded-xl ${style.className}`}
                                variant="solid"
                              >
                                {slot.status === "confirmed" ? "✓ " : ""}
                                {style.label}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 py-8">
                          <span className="text-3xl mb-2">😴</span>
                          <span className="text-xs">Nghỉ</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 p-6 bg-white border-0 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">📈</span>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      Tiến độ học tập
                    </p>
                    <p className="text-xs text-gray-500">
                      Theo dõi sự tiến bộ của bạn qua từng tuần
                    </p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={progressData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorScore"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 12, fill: "#4b5563" }}
                      />
                      <YAxis
                        domain={[50, 90]}
                        tick={{ fontSize: 12, fill: "#4b5563" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#colorScore)"
                        dot={{
                          r: 6,
                          fill: "#3b82f6",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 bg-white border-0 shadow-lg">
                <p className="font-bold text-gray-900 text-lg mb-4">
                  📊 Thống kê nhanh
                </p>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium">
                      Điểm tuần này
                    </p>
                    <p className="text-2xl font-bold text-blue-700">82</p>
                    <p className="text-xs text-green-600 mt-1">
                      ↑ +4 so với tuần trước
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-medium">
                      Tỉ lệ hoàn thành
                    </p>
                    <p className="text-2xl font-bold text-emerald-700">93%</p>
                    <p className="text-xs text-gray-500 mt-1">
                      28/30 bài đã nộp
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                    <p className="text-xs text-amber-600 font-medium">
                      Xếp hạng lớp
                    </p>
                    <p className="text-2xl font-bold text-amber-700">#5</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Trong 30 học sinh
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="grades" className="mt-6">
            <Card className="p-6 space-y-4 bg-white border-0 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      Điểm số các môn
                    </p>
                    <p className="text-xs text-gray-500">
                      Theo dõi kết quả học tập của bạn
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Điểm trung bình</p>
                  <p className="text-2xl font-bold text-blue-600">78.3</p>
                </div>
              </div>
              <div className="space-y-3">
                {grades.map((g) => (
                  <div
                    key={g.subject}
                    className="flex items-center gap-4 rounded-2xl border-2 border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                      {g.subject.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{g.subject}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${g.status === "Tốt"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                            }`}
                        >
                          {g.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{g.detail}</p>
                      <div className="mt-2 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${g.score >= 80
                            ? "bg-gradient-to-r from-emerald-400 to-green-500"
                            : g.score >= 70
                              ? "bg-gradient-to-r from-blue-400 to-blue-500"
                              : "bg-gradient-to-r from-amber-400 to-orange-500"
                            }`}
                          style={{ width: `${g.score}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {g.score}
                      </p>
                      <p className="text-xs text-gray-400">điểm</p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl"
                      onClick={() =>
                        setSelectedGrade({ subject: g.subject, score: g.score })
                      }
                    >
                      Chi tiết →
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
            <Card className="p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900">Bảng Xếp Hạng</p>
                <p className="text-sm text-gray-600">
                  Vinh danh những nỗ lực xuất sắc
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
                {Object.entries(leaderboardOptions).map(([key, opt]) => (
                  <button
                    key={key}
                    onClick={() => setRankingView(key as RankingCategory)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${rankingView === key
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-white"
                      }`}
                  >
                    <span className="text-base leading-none">
                      {tabIcons[key as RankingCategory]}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {leaderboardData[rankingView].map((row) => (
                  <div
                    key={`${rankingView}-${row.rank}-${row.name}`}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-lg">
                        {row.rank === 1 && (
                          <span className="text-amber-500">🏆</span>
                        )}
                        {row.rank === 2 && (
                          <span className="text-gray-400">🥈</span>
                        )}
                        {row.rank === 3 && (
                          <span className="text-orange-400">🥉</span>
                        )}
                        {row.rank > 3 && (
                          <span className="text-sm font-semibold text-gray-700">
                            {row.rank}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 leading-tight">
                          {row.name}
                        </p>
                        <p className="text-xs text-gray-500 leading-tight">
                          {row.className}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-700">
                        {row.metric}
                      </p>
                      <p className="text-xs text-gray-500">{row.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-blue-50 text-blue-700 text-sm text-center px-4 py-3">
                Vị trí hiện tại của bạn:{" "}
                <span className="font-semibold">Hạng 12</span> trong{" "}
                {leaderboardOptions[rankingView].label}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Card className="p-6 space-y-4 bg-white border-0 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    Liên hệ với giáo viên
                  </p>
                  <p className="text-xs text-gray-500">
                    Nhắn tin trực tiếp với giáo viên của bạn
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {contacts.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between rounded-2xl border-2 border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-3xl">
                          {c.avatar}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${c.status === "online"
                            ? "bg-emerald-500"
                            : "bg-gray-300"
                            }`}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{c.name}</p>
                        <p className="text-sm text-gray-500">{c.subject}</p>
                        <p
                          className={`text-xs mt-0.5 ${c.status === "online"
                            ? "text-emerald-600"
                            : "text-gray-400"
                            }`}
                        >
                          {c.status === "online"
                            ? "● Đang hoạt động"
                            : "○ Không hoạt động"}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-6 shadow-md shadow-blue-200"
                      onClick={() =>
                        setChatWith({ name: c.name, role: "teacher" })
                      }
                    >
                      💬 Chat
                    </Button>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Hỗ trợ nhanh
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-center">
                    <span className="text-2xl">📞</span>
                    <p className="text-xs text-gray-700 mt-1 font-medium">
                      Gọi hotline
                    </p>
                  </button>
                  <button className="p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors text-center">
                    <span className="text-2xl">📧</span>
                    <p className="text-xs text-gray-700 mt-1 font-medium">
                      Gửi email
                    </p>
                  </button>
                  <button className="p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors text-center">
                    <span className="text-2xl">❓</span>
                    <p className="text-xs text-gray-700 mt-1 font-medium">
                      Câu hỏi thường gặp
                    </p>
                  </button>
                  <button className="p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors text-center">
                    <span className="text-2xl">📋</span>
                    <p className="text-xs text-gray-700 mt-1 font-medium">
                      Góp ý
                    </p>
                  </button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="mt-6">
            <Card className="p-6 border-0 shadow-lg rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-green-200">
                    💳
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Thanh toán học phí
                    </h2>
                    <p className="text-sm text-gray-500">
                      Quản lý các yêu cầu đóng tiền của bạn
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => window.location.href = '/payment'}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  Xem tất cả →
                </Button>
              </div>

              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl text-white">
                  <p className="text-sm opacity-90">Chờ thanh toán</p>
                  <p className="text-2xl font-bold">{totalPendingAmount.toLocaleString('vi-VN')} đ</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                  <p className="text-sm opacity-90">Đã thanh toán</p>
                  <p className="text-2xl font-bold">{totalPaidAmount.toLocaleString('vi-VN')} đ</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                  <p className="text-sm opacity-90">Học bổng</p>
                  <p className="text-2xl font-bold">{(authUser as any)?.scholarshipPercent || 0}%</p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <div className="text-5xl mb-4">💰</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Quản lý thanh toán học phí
                </h3>
                <p className="text-gray-500 mb-4">
                  Xem và thanh toán các yêu cầu đóng tiền từ trung tâm
                </p>
                <Button
                  onClick={() => window.location.href = '/payment'}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  size="lg"
                >
                  Vào trang thanh toán
                </Button>
              </div>
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

      {showClassDetail && (
        <ClassDetailModal onClose={() => setShowClassDetail(false)} />
      )}
      {selectedGrade && (
        <GradeDetailModal
          subject={selectedGrade.subject}
          score={selectedGrade.score}
          onClose={() => setSelectedGrade(null)}
        />
      )}
      {showSettings && (
        <SettingsModal
          user={fullUserDetails || user}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
