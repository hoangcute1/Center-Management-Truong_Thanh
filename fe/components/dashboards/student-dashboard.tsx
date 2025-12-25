"use client";
import { useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWindow from "@/components/chat-window";
import NotificationCenter from "@/components/notification-center";

interface StudentDashboardProps {
  user: { id: string; name: string; email: string; role: string };
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
};

type RankingCategory = "score" | "diligence" | "attendance";

const overviewCards = [
  { label: "Khóa học", value: 3, note: "Đang theo học" },
  { label: "Buổi học tới", value: 2, note: "Tuần này" },
  { label: "Điểm TB", value: 78.3, note: "Đạt kết quả tốt" },
  { label: "Bài tập", value: 12, note: "Chưa nộp" },
];

const streakCards = [
  {
    title: "Chuỗi điểm danh",
    value: "12 ngày",
    sub: "Kỷ lục: 18 ngày",
    hint: "Giữ vững thêm 3 buổi để nhận huy hiệu mới",
    bar: 70,
    tone: "emerald",
  },
  {
    title: "Streak làm bài tập",
    value: "7 ngày",
    sub: "Đã nộp 7/7 ngày",
    hint: "Nộp bài hôm nay trước 22:00 để giữ streak",
    bar: 50,
    tone: "blue",
  },
  {
    title: "Tần suất ôn luyện",
    value: "5 phiên/tuần",
    sub: "Mục tiêu: 6 phiên",
    hint: "Còn 1 phiên để đạt mục tiêu tuần",
    bar: 80,
    tone: "violet",
  },
];

const badges = [
  {
    title: "Chăm chỉ",
    desc: "5 ngày liên tục",
    earned: true,
  },
  {
    title: "Nộp bài đúng hạn",
    desc: "10 lần liên tục",
    earned: true,
  },
  {
    title: "Điểm cao",
    desc: "≥ 80 trong 3 bài",
    earned: false,
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
  { name: "Cô Trần Thị B", subject: "Dạy môn Toán" },
  { name: "Thầy Lê Văn E", subject: "Dạy môn Anh văn" },
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
  user: { name: string; email: string };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
      <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Cài đặt tài khoản
            </h2>
            <p className="text-sm text-gray-600">
              Chỉnh sửa thông tin cá nhân của bạn
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <label className="text-gray-700 font-medium">Họ và tên</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              defaultValue={user.name}
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-700 font-medium">Email</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              defaultValue={user.email}
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-700 font-medium">Số điện thoại</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              defaultValue="0901234567"
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-700 font-medium">Địa chỉ</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              defaultValue="123 Đường ABC, Quận 1, TPHCM"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">
                Mật khẩu hiện tại
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Mật khẩu mới</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">
                Xác nhận mật khẩu mới
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                type="password"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
              Lưu thay đổi
            </Button>
            <Button className="flex-1" variant="outline" onClick={onClose}>
              Hủy
            </Button>
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
  const [rankingView, setRankingView] = useState<RankingCategory>("score");

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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Trường Thành Education
            </h1>
            <p className="text-sm text-gray-500">Dashboard Học sinh</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter userRole={user.role} />
            <Button variant="ghost" onClick={() => setShowSettings(true)}>
              Cài đặt
            </Button>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full overflow-x-auto flex gap-2 rounded-2xl bg-gray-50 p-2 shadow-sm justify-start md:justify-center">
            <TabsTrigger
              value="overview"
              className="whitespace-nowrap px-3 py-2 text-sm"
            >
              Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="whitespace-nowrap px-3 py-2 text-sm"
            >
              Lịch học
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="whitespace-nowrap px-3 py-2 text-sm"
            >
              Tiến độ
            </TabsTrigger>
            <TabsTrigger
              value="grades"
              className="whitespace-nowrap px-3 py-2 text-sm"
            >
              Điểm số
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="whitespace-nowrap px-3 py-2 text-sm"
            >
              Bảng xếp hạng
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="whitespace-nowrap px-3 py-2 text-sm"
            >
              Liên hệ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4 md:grid-cols-4">
              {overviewCards.map((card) => (
                <Card key={card.label} className="p-4">
                  <p className="text-sm text-gray-600 mb-2">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500">{card.note}</p>
                </Card>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {streakCards.map((item) => (
                <Card key={item.title} className="p-4 border-gray-200 bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {item.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full bg-${item.tone}-100 text-${item.tone}-700`}
                    >
                      Streak
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full bg-${item.tone}-500`}
                      style={{ width: `${item.bar}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{item.hint}</p>
                </Card>
              ))}
            </div>

            <Card className="mt-4 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900">
                  Huy hiệu động viên
                </p>
                <p className="text-xs text-gray-500">
                  Thu thập để giữ động lực
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {badges.map((b) => (
                  <div
                    key={b.title}
                    className={`rounded-lg border px-4 py-3 ${
                      b.earned
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        b.earned ? "text-emerald-700" : "text-gray-700"
                      }`}
                    >
                      {b.title}
                    </p>
                    <p className="text-xs text-gray-600">{b.desc}</p>
                    {b.earned ? (
                      <span className="inline-flex mt-2 text-[11px] px-2 py-1 rounded-full bg-emerald-600 text-white">
                        Đã đạt
                      </span>
                    ) : (
                      <span className="inline-flex mt-2 text-[11px] px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                        Chưa đạt
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            <Card className="p-5 space-y-4">
              <p className="font-semibold text-gray-900 text-lg">
                Lịch học tuần này
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {scheduleWeek.map((slot) => {
                  const style = statusStyle(slot.status);

                  return (
                    <div
                      key={slot.day}
                      className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="bg-blue-600 text-white px-3 py-2 text-center">
                        <p className="text-xs font-semibold leading-tight">
                          {slot.day}
                        </p>
                        <p className="text-[11px] opacity-80 leading-tight">
                          {slot.date}
                        </p>
                      </div>

                      {slot.code ? (
                        <div className="flex-1 p-3 space-y-2 text-center">
                          <div className="text-sm font-semibold text-blue-700">
                            {slot.code}
                          </div>
                          <div className="text-xs text-gray-600">
                            tại {slot.room}
                          </div>
                          <div className="text-xs text-gray-800 font-medium">
                            {slot.time}
                          </div>
                          <div className="text-xs text-gray-600">
                            {slot.teacher}
                          </div>
                          <div className="space-y-2 pt-1">
                            <Button
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg"
                              onClick={() => setShowClassDetail(true)}
                            >
                              Xem tài liệu
                            </Button>
                            <Button
                              className={`w-full text-sm rounded-lg ${style.className}`}
                              variant="solid"
                            >
                              {style.label}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-sm text-gray-300 py-8">
                          -
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="mt-4">
            <Card className="p-4">
              <p className="font-semibold text-gray-900 mb-4">
                Tiến độ học tập
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={progressData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 12, fill: "#4b5563" }}
                    />
                    <YAxis
                      domain={[50, 90]}
                      tick={{ fontSize: 12, fill: "#4b5563" }}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="grades" className="mt-4">
            <Card className="p-4 space-y-3">
              <p className="font-semibold text-gray-900">Điểm số các môn</p>
              {grades.map((g) => (
                <div
                  key={g.subject}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{g.subject}</p>
                    <p className="text-xs text-gray-500">{g.status}</p>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${g.score}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-blue-700 w-16 text-right">
                    {g.score}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setSelectedGrade({ subject: g.subject, score: g.score })
                    }
                  >
                    Xem chi tiết
                  </Button>
                </div>
              ))}
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
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      rankingView === key
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

          <TabsContent value="contact" className="mt-4">
            <Card className="p-4 space-y-3">
              <p className="font-semibold text-gray-900">
                Liên hệ với giáo viên
              </p>
              {contacts.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.subject}</p>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() =>
                      setChatWith({ name: c.name, role: "teacher" })
                    }
                  >
                    Chat
                  </Button>
                </div>
              ))}
            </Card>
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
          user={{ name: user.name, email: user.email }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
