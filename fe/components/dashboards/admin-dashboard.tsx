"use client";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationCenter from "@/components/notification-center";
import ImportUsersModal from "@/components/pages/import-users-modal";
import ImportStudentsModal from "@/components/pages/import-students-modal";
import ClassFormModal from "@/components/pages/class-form-modal";
import ClassStudentsModal from "@/components/pages/class-students-modal";
import ScheduleManager from "@/components/pages/schedule-manager";
import AttendanceManager from "@/components/pages/attendance-manager";
import IncidentsManager from "@/components/pages/incidents-manager";
import { useBranchesStore } from "@/lib/stores/branches-store";
import { useClassesStore } from "@/lib/stores/classes-store";
import { useUsersStore, type ImportResponse } from "@/lib/stores/users-store";

interface AdminDashboardProps {
  user: { id: string; name: string; email: string; role: string };
  onLogout: () => void;
}

type RankingCategory = "score" | "attendance" | "diligence";

const overviewStats = [
  {
    label: "Học sinh",
    value: 248,
    trend: "+12% so với tháng trước",
    positive: true,
    icon: "👨‍🎓",
    color: "from-blue-500 to-blue-600",
  },
  {
    label: "Giáo viên",
    value: 18,
    trend: "Hoạt động",
    positive: true,
    icon: "👨‍🏫",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    label: "Doanh thu tháng",
    value: "75 Tr",
    trend: "+29% so với tháng trước",
    positive: true,
    icon: "💰",
    color: "from-amber-500 to-orange-500",
  },
  {
    label: "Khóa học",
    value: 12,
    trend: "Đang mở",
    positive: true,
    icon: "📚",
    color: "from-purple-500 to-purple-600",
  },
];

const revenueByMonth = [
  { month: "Tháng 1", revenue: 52 },
  { month: "Tháng 2", revenue: 60 },
  { month: "Tháng 3", revenue: 58 },
  { month: "Tháng 4", revenue: 72 },
  { month: "Tháng 5", revenue: 68 },
  { month: "Tháng 6", revenue: 75 },
];

const financeSummary = [
  {
    label: "Tổng doanh thu",
    value: "720 Tr",
    trend: "+8% so với quý trước",
    color: "text-green-600",
    icon: "📈",
    bgColor: "from-green-500 to-emerald-600",
  },
  {
    label: "Chi phí",
    value: "185 Tr",
    trend: "+5% so với quý trước",
    color: "text-red-500",
    icon: "📉",
    bgColor: "from-red-500 to-rose-600",
  },
  {
    label: "Lợi nhuận ròng",
    value: "535 Tr",
    trend: "+10% so với quý trước",
    color: "text-green-600",
    icon: "💎",
    bgColor: "from-indigo-500 to-purple-600",
  },
];

const financeChart = [
  { month: "Tháng 1", revenue: 50, cost: 20 },
  { month: "Tháng 2", revenue: 62, cost: 22 },
  { month: "Tháng 3", revenue: 58, cost: 20 },
  { month: "Tháng 4", revenue: 75, cost: 25 },
  { month: "Tháng 5", revenue: 68, cost: 23 },
  { month: "Tháng 6", revenue: 82, cost: 28 },
];

const accounts = {
  students: [
    {
      name: "Nguyễn Văn A",
      email: "nguyenvana@email.com",
      phone: "+84 123 456 789",
      code: "HS001",
      date: "2025-01-15",
      avatar: "👨‍🎓",
    },
    {
      name: "Trần Thị B",
      email: "tranthib@email.com",
      phone: "+84 987 654 321",
      code: "HS002",
      date: "2025-01-16",
      avatar: "👩‍🎓",
    },
    {
      name: "Lê Văn C",
      email: "levanc@email.com",
      phone: "+84 555 666 777",
      code: "HS003",
      date: "2025-01-17",
      avatar: "👨‍🎓",
    },
  ],
  parents: [
    {
      name: "Nguyễn Văn Anh",
      email: "nguyenvanh@email.com",
      phone: "+84 111 222 333",
      children: "2 con",
      date: "2025-01-10",
      avatar: "👨",
    },
    {
      name: "Trần Thị Mai",
      email: "tranthimai@email.com",
      phone: "+84 222 333 444",
      children: "1 con",
      date: "2025-01-12",
      avatar: "👩",
    },
  ],
  teachers: [
    {
      name: "Cô Nguyễn Thị C",
      email: "cothic@email.com",
      phone: "+84 444 555 666",
      subject: "Toán",
      experience: "5 năm kinh nghiệm",
      date: "2025-01-05",
      avatar: "👩‍🏫",
    },
    {
      name: "Thầy Trần Văn D",
      email: "thaytrand@email.com",
      phone: "+84 777 888 999",
      subject: "Anh Văn",
      experience: "8 năm kinh nghiệm",
      date: "2025-01-05",
      avatar: "👨‍🏫",
    },
  ],
};

const pieData = [
  { name: "Toán", value: 40 },
  { name: "Anh Văn", value: 35 },
  { name: "Vật Lý", value: 15 },
  { name: "Khác", value: 10 },
];

const pieColors = ["#3b82f6", "#f97316", "#10b981", "#8b5cf6"];

// Leaderboard data
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

const tabIcons: Record<RankingCategory, string> = {
  score: "🏆",
  attendance: "👥",
  diligence: "⚡",
};

interface BranchOption {
  _id: string;
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  status?: "active" | "inactive";
}

// Modal chi tiết tài khoản
interface UserDetail {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  branchId?: string;
  status?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  subjects?: string[];
  teacherNote?: string;
  qualification?: string;
  // Mã số
  studentCode?: string;
  teacherCode?: string;
  parentCode?: string;
  // Thông tin phụ huynh của học sinh
  parentName?: string;
  parentPhone?: string;
  childEmail?: string;
  // Thông tin học bổng (cho học sinh)
  hasScholarship?: boolean;
  scholarshipType?: "teacher_child" | "poor_family" | "orphan";
  scholarshipPercent?: number;
}

function UserDetailModal({
  user,
  branchName,
  onClose,
  onEdit,
  onDelete,
}: {
  user: UserDetail;
  branchName: string;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { fetchParentChildren } = useUsersStore();
  const [children, setChildren] = useState<UserDetail[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);

  // Fetch children if user is parent
  useEffect(() => {
    if (user.role === "parent" && user._id) {
      setLoadingChildren(true);
      fetchParentChildren(user._id)
        .then((data) => setChildren(data))
        .catch((err) => console.error("Error fetching children:", err))
        .finally(() => setLoadingChildren(false));
    }
  }, [user._id, user.role, fetchParentChildren]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "student":
        return {
          label: "Học sinh",
          icon: "👨‍🎓",
          color: "bg-blue-100 text-blue-700",
        };
      case "parent":
        return {
          label: "Phụ huynh",
          icon: "👨‍👩‍👧",
          color: "bg-emerald-100 text-emerald-700",
        };
      case "teacher":
        return {
          label: "Giáo viên",
          icon: "👨‍🏫",
          color: "bg-purple-100 text-purple-700",
        };
      case "admin":
        return {
          label: "Quản trị",
          icon: "👑",
          color: "bg-amber-100 text-amber-700",
        };
      default:
        return { label: role, icon: "👤", color: "bg-gray-100 text-gray-700" };
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "active":
        return { label: "Hoạt động", color: "bg-green-100 text-green-700" };
      case "pending":
        return { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" };
      case "inactive":
        return { label: "Ngừng hoạt động", color: "bg-red-100 text-red-700" };
      default:
        return { label: "Không xác định", color: "bg-gray-100 text-gray-700" };
    }
  };

  const roleInfo = getRoleLabel(user.role);
  const statusInfo = getStatusLabel(user.status);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-3">
      <Card className="w-full max-w-lg p-6 bg-white shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl shadow-lg">
              {roleInfo.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}
                >
                  {roleInfo.label}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Thông tin cơ bản */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <span>📋</span> Thông tin cơ bản
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Số điện thoại</p>
                <p className="font-medium text-gray-900">
                  {user.phone || "Chưa cập nhật"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Ngày sinh</p>
                <p className="font-medium text-gray-900">
                  {user.dateOfBirth
                    ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN")
                    : "Chưa cập nhật"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Giới tính</p>
                <p className="font-medium text-gray-900">
                  {user.gender === "male"
                    ? "Nam"
                    : user.gender === "female"
                    ? "Nữ"
                    : user.gender === "other"
                    ? "Khác"
                    : "Chưa cập nhật"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Cơ sở</p>
                <p className="font-medium text-gray-900">🏢 {branchName}</p>
              </div>
            </div>
          </div>

          {/* Thông tin phụ huynh (cho học sinh) */}
          {user.role === "student" && (user.parentName || user.parentPhone) && (
            <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                <span>👨‍👩‍👧</span> Thông tin phụ huynh
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Họ tên phụ huynh</p>
                  <p className="font-medium text-gray-900">
                    {user.parentName || "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">SĐT phụ huynh</p>
                  <p className="font-medium text-gray-900">
                    {user.parentPhone || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Thông tin học bổng (cho học sinh) */}
          {user.role === "student" && (
            <div className={`rounded-xl p-4 space-y-3 ${user.hasScholarship ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold flex items-center gap-2 ${user.hasScholarship ? 'text-amber-800' : 'text-gray-600'}`}>
                <span>🎓</span> Học bổng
              </h4>
              {user.hasScholarship ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Loại học bổng</p>
                    <p className="font-medium text-gray-900">
                      {user.scholarshipType === 'teacher_child' ? '👨‍🏫 Con giáo viên' :
                       user.scholarshipType === 'poor_family' ? '🏠 Hộ nghèo' :
                       user.scholarshipType === 'orphan' ? '💙 Con mồ côi' : 'Không xác định'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phần trăm giảm</p>
                    <p className="font-medium text-amber-600 text-lg">
                      🏷️ {user.scholarshipPercent || 0}%
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="bg-amber-100 rounded-lg p-2">
                      <p className="text-sm text-amber-800">
                        💡 Học sinh được giảm <strong>{user.scholarshipPercent || 0}%</strong> học phí do thuộc diện <strong>
                        {user.scholarshipType === 'teacher_child' ? 'Con giáo viên' :
                         user.scholarshipType === 'poor_family' ? 'Hộ nghèo' :
                         user.scholarshipType === 'orphan' ? 'Con mồ côi' : ''}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Học sinh không có học bổng</p>
              )}
            </div>
          )}

          {/* Thông tin giáo viên */}
          {user.role === "teacher" && (
            <div className="bg-purple-50 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                <span>📚</span> Thông tin giảng dạy
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Môn dạy</p>
                  <p className="font-medium text-gray-900">
                    {user.subjects && user.subjects.length > 0
                      ? user.subjects.join(", ")
                      : "Chưa phân công"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Trình độ</p>
                  <p className="font-medium text-gray-900">
                    {user.qualification || "Chưa cập nhật"}
                  </p>
                </div>
                {user.teacherNote && (
                  <div className="sm:col-span-2">
                    <p className="text-gray-500">Ghi chú</p>
                    <p className="font-medium text-gray-900">
                      {user.teacherNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Thông tin con (cho phụ huynh) */}
          {user.role === "parent" && (
            <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-indigo-800 flex items-center gap-2">
                <span>👧</span> Thông tin con
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-200 text-indigo-800">
                  {loadingChildren ? "Đang tải..." : `${children.length} con`}
                </span>
              </h4>

              {loadingChildren ? (
                <div className="text-center py-4 text-gray-500">
                  <span className="animate-spin inline-block mr-2">⏳</span>
                  Đang tải thông tin...
                </div>
              ) : children.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  Chưa tìm thấy học sinh liên kết với phụ huynh này
                </p>
              ) : (
                <div className="space-y-2">
                  {children.map((child, index) => (
                    <div
                      key={child._id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                          {child.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {index + 1}. {child.name}
                          </p>
                          <p className="text-xs text-gray-500">{child.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {child.studentCode || "Chưa có mã"}
                        </span>
                        {child.status === "active" && (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Đang học
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Thông tin hệ thống */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-blue-800 flex items-center gap-2">
              <span>🔧</span> Thông tin hệ thống
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">
                  {user.role === "student"
                    ? "Mã số học sinh"
                    : user.role === "teacher"
                    ? "Mã số giáo viên"
                    : user.role === "parent"
                    ? "Mã số phụ huynh"
                    : "Mã tài khoản"}
                </p>
                <p className="font-medium text-gray-900 font-mono text-lg">
                  {user.role === "student" && user.studentCode
                    ? user.studentCode
                    : user.role === "teacher" && user.teacherCode
                    ? user.teacherCode
                    : user.role === "parent" && user.parentCode
                    ? user.parentCode
                    : `#${user._id.slice(-8).toUpperCase()}`}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Ngày tạo</p>
                <p className="font-medium text-gray-900">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Không xác định"}
                </p>
              </div>
              {(user.role === "student" || user.role === "parent") &&
                user.expiresAt && (
                  <div>
                    <p className="text-gray-500">Hết hạn</p>
                    <p className="font-medium text-gray-900">
                      {new Date(user.expiresAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              <div>
                <p className="text-gray-500">Cập nhật lần cuối</p>
                <p className="font-medium text-gray-900">
                  {user.updatedAt
                    ? new Date(user.updatedAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Không xác định"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {onEdit && (
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg"
              onClick={onEdit}
            >
              ✏️ Chỉnh sửa
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
              onClick={onDelete}
            >
              🗑️ Xóa tài khoản
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Modal chỉnh sửa tài khoản
function EditUserModal({
  user,
  branches,
  onClose,
  onSave,
  isLoading,
  error,
}: {
  user: UserDetail;
  branches: BranchOption[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    branchId: user.branchId || "",
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
    gender: user.gender || "",
    status: user.status || "active",
    // Student fields
    parentName: user.parentName || "",
    parentPhone: user.parentPhone || "",
    hasScholarship: user.hasScholarship || false,
    scholarshipType: user.scholarshipType || "",
    scholarshipPercent: user.scholarshipPercent || 0,
    // Teacher fields
    subjects: user.subjects || [],
    qualification: user.qualification || "",
    teacherNote: user.teacherNote || "",
    // Parent fields
    childEmail: user.childEmail || "",
  });

  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  const isStudent = user.role === "student";
  const isTeacher = user.role === "teacher";
  const isParent = user.role === "parent";

  const toggleSubject = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const toggleCategory = (subjects: string[]) => {
    const allSelected = subjects.every((s) => formData.subjects.includes(s));
    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => !subjects.includes(s)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        subjects: [...new Set([...prev.subjects, ...subjects])],
      }));
    }
  };

  const handleSubmit = async () => {
    const updateData: any = {
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      branchId: formData.branchId || undefined,
      status: formData.status,
    };

    // Không update email vì email là unique identifier
    
    if (!isParent) {
      if (formData.dateOfBirth) {
        updateData.dateOfBirth = new Date(formData.dateOfBirth);
      }
      if (formData.gender) {
        updateData.gender = formData.gender;
      }
    }

    if (isStudent) {
      updateData.parentName = formData.parentName.trim() || undefined;
      updateData.parentPhone = formData.parentPhone.trim() || undefined;
      updateData.hasScholarship = formData.hasScholarship;
      if (formData.hasScholarship) {
        updateData.scholarshipType = formData.scholarshipType || undefined;
        updateData.scholarshipPercent = formData.scholarshipPercent;
      } else {
        updateData.scholarshipType = undefined;
        updateData.scholarshipPercent = 0;
      }
    }

    if (isTeacher) {
      updateData.subjects = formData.subjects;
      updateData.qualification = formData.qualification.trim() || undefined;
      updateData.teacherNote = formData.teacherNote.trim() || undefined;
    }

    if (isParent) {
      updateData.childEmail = formData.childEmail.trim().toLowerCase() || undefined;
    }

    await onSave(updateData);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "student": return { label: "Học sinh", icon: "👨‍🎓" };
      case "parent": return { label: "Phụ huynh", icon: "👨‍👩‍👧" };
      case "teacher": return { label: "Giáo viên", icon: "👨‍🏫" };
      default: return { label: role, icon: "👤" };
    }
  };

  const roleInfo = getRoleLabel(user.role);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-3">
      <Card className="w-full max-w-lg p-6 bg-white shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg">
            ✏️
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Chỉnh sửa {roleInfo.label.toLowerCase()}</h3>
            <p className="text-sm text-gray-500">{roleInfo.icon} {user.name}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Cơ sở */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Cơ sở</label>
            <select
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn cơ sở --</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>{branch.name}</option>
              ))}
            </select>
          </div>

          {/* Họ tên */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Họ tên <span className="text-red-500">*</span></label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="rounded-xl border-gray-200"
            />
          </div>

          {/* Email (readonly) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              value={formData.email}
              disabled
              className="rounded-xl border-gray-200 bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400">Email không thể thay đổi</p>
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="rounded-xl border-gray-200"
            />
          </div>

          {/* Ngày sinh + Giới tính (không cho phụ huynh) */}
          {!isParent && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Ngày sinh</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Giới tính</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
          )}

          {/* Trạng thái */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Hoạt động</option>
              <option value="pending">Chờ duyệt</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>

          {/* === STUDENT SPECIFIC === */}
          {isStudent && (
            <>
              {/* Thông tin phụ huynh */}
              <div className="border rounded-xl p-3 space-y-3 bg-emerald-50">
                <h4 className="text-sm font-semibold text-emerald-800">👨‍👩‍👧 Thông tin phụ huynh</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Tên phụ huynh</label>
                    <Input
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="rounded-lg border-gray-200 text-sm"
                      placeholder="Nhập tên"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">SĐT phụ huynh</label>
                    <Input
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="rounded-lg border-gray-200 text-sm"
                      placeholder="Nhập SĐT"
                    />
                  </div>
                </div>
              </div>

              {/* Học bổng */}
              <div className="border rounded-xl p-3 space-y-3 bg-amber-50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-amber-800">🎓 Học bổng</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasScholarship}
                      onChange={(e) => setFormData({ ...formData, hasScholarship: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                {formData.hasScholarship && (
                  <div className="space-y-3 pt-2 border-t border-amber-200">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Loại học bổng <span className="text-red-500">*</span></label>
                      <select
                        value={formData.scholarshipType}
                        onChange={(e) => setFormData({ ...formData, scholarshipType: e.target.value as any })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">-- Chọn loại --</option>
                        <option value="teacher_child">Con giáo viên</option>
                        <option value="poor_family">Hộ nghèo</option>
                        <option value="orphan">Con mồ côi</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Phần trăm (%)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={formData.scholarshipPercent}
                          onChange={(e) => setFormData({ ...formData, scholarshipPercent: parseInt(e.target.value) })}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.scholarshipPercent}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                            setFormData({ ...formData, scholarshipPercent: val });
                          }}
                          className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center"
                        />
                        <span className="text-sm font-semibold text-amber-600">%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* === TEACHER SPECIFIC === */}
          {isTeacher && (
            <>
              {/* Môn dạy */}
              <div className="border rounded-xl p-3 space-y-3 bg-purple-50">
                <h4 className="text-sm font-semibold text-purple-800">📚 Môn dạy</h4>
                <div
                  onClick={() => setShowSubjectPicker(!showSubjectPicker)}
                  className="w-full min-h-[42px] rounded-xl border border-gray-200 px-3 py-2 text-sm cursor-pointer bg-white hover:border-purple-400"
                >
                  {formData.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.subjects.map((subject) => (
                        <span key={subject} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          #{subject}
                          <button type="button" onClick={(e) => { e.stopPropagation(); toggleSubject(subject); }} className="hover:text-purple-900">×</button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">Nhấn để chọn môn dạy...</span>
                  )}
                </div>
                {showSubjectPicker && (
                  <div className="border border-gray-200 rounded-xl p-3 bg-white max-h-[200px] overflow-y-auto">
                    {SUBJECT_OPTIONS.map((cat) => (
                      <div key={cat.category} className="mb-2 last:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            type="button"
                            onClick={() => toggleCategory(cat.subjects)}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                              cat.subjects.every((s) => formData.subjects.includes(s))
                                ? "bg-purple-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {cat.category}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 ml-1">
                          {cat.subjects.map((subject) => (
                            <button
                              key={subject}
                              type="button"
                              onClick={() => toggleSubject(subject)}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                                formData.subjects.includes(subject)
                                  ? "bg-purple-500 text-white"
                                  : "bg-white text-gray-600 border border-gray-200 hover:border-purple-400"
                              }`}
                            >
                              #{subject}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Trình độ & Ghi chú */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Trình độ</label>
                  <select
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn --</option>
                    <option value="Cử nhân">Cử nhân</option>
                    <option value="Thạc sĩ">Thạc sĩ</option>
                    <option value="Tiến sĩ">Tiến sĩ</option>
                    <option value="Giáo sư">Giáo sư</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                  <textarea
                    value={formData.teacherNote}
                    onChange={(e) => setFormData({ ...formData, teacherNote: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none"
                    placeholder="Ghi chú về giáo viên..."
                  />
                </div>
              </div>
            </>
          )}

          {/* === PARENT SPECIFIC === */}
          {isParent && (
            <div className="border rounded-xl p-3 space-y-3 bg-indigo-50">
              <h4 className="text-sm font-semibold text-indigo-800">👧 Email con (học sinh)</h4>
              <Input
                type="email"
                value={formData.childEmail}
                onChange={(e) => setFormData({ ...formData, childEmail: e.target.value })}
                className="rounded-lg border-gray-200"
                placeholder="email.hocsinh@example.com"
              />
              <p className="text-xs text-gray-500">Nhập email của học sinh để liên kết tài khoản</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Đang lưu..." : "💾 Lưu thay đổi"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Danh sách môn dạy theo khối
const SUBJECT_OPTIONS = [
  { category: "Toán", subjects: ["Toán 10", "Toán 11", "Toán 12"] },
  { category: "Văn", subjects: ["Văn 10", "Văn 11", "Văn 12"] },
  { category: "Anh Văn", subjects: ["Anh Văn 10", "Anh Văn 11", "Anh Văn 12"] },
  { category: "Vật Lý", subjects: ["Lý 10", "Lý 11", "Lý 12"] },
  { category: "Hóa Học", subjects: ["Hóa 10", "Hóa 11", "Hóa 12"] },
  { category: "Sinh Học", subjects: ["Sinh 10", "Sinh 11", "Sinh 12"] },
  { category: "Lịch Sử", subjects: ["Sử 10", "Sử 11", "Sử 12"] },
  { category: "Địa Lý", subjects: ["Địa 10", "Địa 11", "Địa 12"] },
  { category: "GDCD", subjects: ["GDCD 10", "GDCD 11", "GDCD 12"] },
  { category: "Tin Học", subjects: ["Tin 10", "Tin 11", "Tin 12"] },
];

function AddModal({
  title,
  fields,
  branches,
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  title: string;
  fields: string[];
  branches: BranchOption[];
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => void;
  isLoading?: boolean;
  error?: string | null;
}) {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [selectedGender, setSelectedGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  // State học bổng (dành cho học sinh)
  const [hasScholarship, setHasScholarship] = useState(false);
  const [scholarshipType, setScholarshipType] = useState("");
  const [scholarshipPercent, setScholarshipPercent] = useState(0);

  // Check if this is teacher/student/parent form
  const isTeacherForm = title.includes("giáo viên");
  const isStudentForm = title.includes("học sinh");
  const isParentForm = title.includes("phụ huynh");

  // Toggle subject selection
  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  // Select all subjects in a category
  const toggleCategory = (subjects: string[]) => {
    const allSelected = subjects.every((s) => selectedSubjects.includes(s));
    if (allSelected) {
      setSelectedSubjects((prev) => prev.filter((s) => !subjects.includes(s)));
    } else {
      setSelectedSubjects((prev) => [...new Set([...prev, ...subjects])]);
    }
  };

  const handleSubmit = () => {
    console.log("=== AddModal SUBMIT ===", {
      selectedBranch,
      formData,
      selectedSubjects,
      selectedGender,
      dateOfBirth,
      hasScholarship,
      scholarshipType,
      scholarshipPercent,
    });
    const submitData = { ...formData, branchId: selectedBranch };
    if (isTeacherForm && selectedSubjects.length > 0) {
      submitData["Môn dạy"] = selectedSubjects.join(", ");
    }
    // Thêm giới tính (không áp dụng cho phụ huynh)
    if (!isParentForm && selectedGender) {
      submitData["Giới tính"] = selectedGender;
    }
    // Thêm ngày sinh (không áp dụng cho phụ huynh)
    if (!isParentForm && dateOfBirth) {
      submitData["Ngày sinh"] = dateOfBirth;
    }
    // Thêm thông tin học bổng (chỉ cho học sinh)
    if (isStudentForm) {
      submitData["hasScholarship"] = hasScholarship ? "true" : "false";
      if (hasScholarship && scholarshipType) {
        submitData["scholarshipType"] = scholarshipType;
        submitData["scholarshipPercent"] = scholarshipPercent.toString();
      }
    }
    onSubmit(submitData);
  };

  // Filter out "Môn dạy" from fields for teacher form (we'll handle it separately)
  // Also filter out fields we handle separately
  const displayFields = fields.filter((f) => {
    if (isTeacherForm && f === "Môn dạy") return false;
    if (f === "Giới tính" || f === "Ngày sinh") return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-3">
      <Card className="w-full max-w-md p-6 bg-white shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg">
            ➕
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <div className="space-y-3 mb-5">
          {/* Dropdown chọn cơ sở */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Chọn cơ sở --</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
          {displayFields.map((f) => (
            <Input
              key={f}
              placeholder={f}
              className="rounded-xl border-gray-200"
              value={formData[f] || ""}
              onChange={(e) =>
                setFormData({ ...formData, [f]: e.target.value })
              }
            />
          ))}

          {/* Ngày sinh (không áp dụng cho phụ huynh) */}
          {!isParentForm && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Ngày sinh
              </label>
              <Input
                type="date"
                className="rounded-xl border-gray-200"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
          )}

          {/* Giới tính (không áp dụng cho phụ huynh) */}
          {!isParentForm && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Giới tính
              </label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn giới tính --</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          )}

          {/* Học bổng (chỉ áp dụng cho học sinh) */}
          {isStudentForm && (
            <div className="border rounded-xl p-3 space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  🎓 Học bổng
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasScholarship}
                    onChange={(e) => {
                      setHasScholarship(e.target.checked);
                      if (!e.target.checked) {
                        setScholarshipType("");
                        setScholarshipPercent(0);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {hasScholarship && (
                <div className="space-y-3 pt-2 border-t border-gray-200">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Loại học bổng <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={scholarshipType}
                      onChange={(e) => setScholarshipType(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Chọn loại học bổng --</option>
                      <option value="teacher_child">Con giáo viên</option>
                      <option value="poor_family">Hộ nghèo</option>
                      <option value="orphan">Con mồ côi</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Phần trăm học bổng (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={scholarshipPercent}
                        onChange={(e) => setScholarshipPercent(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scholarshipPercent}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                          setScholarshipPercent(val);
                        }}
                        className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center"
                      />
                      <span className="text-sm font-semibold text-blue-600">%</span>
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      Học sinh được giảm {scholarshipPercent}% học phí
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subject Picker for Teachers */}
          {isTeacherForm && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Môn dạy <span className="text-gray-400">(chọn nhiều)</span>
              </label>

              {/* Selected subjects display */}
              <div
                onClick={() => setShowSubjectPicker(!showSubjectPicker)}
                className="w-full min-h-[42px] rounded-xl border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectedSubjects.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSubjects.map((subject) => (
                      <span
                        key={subject}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                      >
                        #{subject}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubject(subject);
                          }}
                          className="hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">Nhấn để chọn môn dạy...</span>
                )}
              </div>

              {/* Subject Picker Dropdown */}
              {showSubjectPicker && (
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 max-h-[250px] overflow-y-auto">
                  {SUBJECT_OPTIONS.map((cat) => (
                    <div key={cat.category} className="mb-3 last:mb-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat.subjects)}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                            cat.subjects.every((s) =>
                              selectedSubjects.includes(s)
                            )
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {cat.category}
                        </button>
                        <span className="text-xs text-gray-400">
                          {
                            cat.subjects.filter((s) =>
                              selectedSubjects.includes(s)
                            ).length
                          }
                          /{cat.subjects.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 ml-1">
                        {cat.subjects.map((subject) => (
                          <button
                            key={subject}
                            type="button"
                            onClick={() => toggleSubject(subject)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                              selectedSubjects.includes(subject)
                                ? "bg-blue-500 text-white shadow-sm"
                                : "bg-white text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-600"
                            }`}
                          >
                            #{subject}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowSubjectPicker(false)}
                    className="w-full mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ✓ Xong
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-200"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Đang thêm..." : "Thêm"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Modal thêm/sửa cơ sở
function BranchModal({
  isOpen,
  branch,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  branch: BranchOption | null;
  onClose: () => void;
  onSave: (data: { name: string; address: string; phone?: string }) => void;
}) {
  const [name, setName] = useState(branch?.name || "");
  const [address, setAddress] = useState(branch?.address || "");
  const [phone, setPhone] = useState(branch?.phone || "");

  useEffect(() => {
    if (branch) {
      setName(branch.name || "");
      setAddress(branch.address || "");
      setPhone(branch.phone || "");
    } else {
      setName("");
      setAddress("");
      setPhone("");
    }
  }, [branch, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      alert("Vui lòng điền đầy đủ tên và địa chỉ cơ sở");
      return;
    }
    onSave({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-3">
      <Card className="w-full max-w-md p-6 bg-white shadow-2xl border-0">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg">
            🏢
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {branch ? "Sửa cơ sở" : "Thêm cơ sở mới"}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tên cơ sở <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Cơ sở Quận 1"
              className="rounded-xl border-gray-200"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: 123 Nguyễn Huệ, Quận 1, TPHCM"
              className="rounded-xl border-gray-200"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Số điện thoại
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0123 456 789"
              className="rounded-xl border-gray-200"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-200"
            >
              {branch ? "💾 Lưu thay đổi" : "➕ Thêm cơ sở"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
            >
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function AdminDashboard({
  user,
  onLogout,
}: AdminDashboardProps) {
  const [activeAccountTab, setActiveAccountTab] = useState<
    "students" | "parents" | "teachers"
  >("students");
  const [showModal, setShowModal] = useState<null | {
    title: string;
    fields: string[];
  }>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportStudentsModal, setShowImportStudentsModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchOption | null>(null);
  const [rankingView, setRankingView] = useState<RankingCategory>("score");
  const [selectedUserDetail, setSelectedUserDetail] =
    useState<UserDetail | null>(null);
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserError, setEditUserError] = useState<string | null>(null);
  const [classStudentsModal, setClassStudentsModal] = useState<any>(null);
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Stores
  const {
    branches,
    fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    isLoading: branchesLoading,
  } = useBranchesStore();
  const { classes, fetchClasses } = useClassesStore();
  const {
    users,
    importUsers,
    downloadTemplate,
    createUser,
    fetchUsers,
    isLoading: usersLoading,
  } = useUsersStore();

  // State for add user modal
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  // Kiểm tra xem user có phải admin không
  const isAdmin = user.role === "admin";

  // State for branch filter - Nếu không phải admin, mặc định là branchId của user
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("");

  // State for search
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Effective branch filter - non-admin users chỉ xem được chi nhánh của mình
  const effectiveBranchFilter = isAdmin
    ? selectedBranchFilter
    : (user as any).branchId || "";

  // Filter users by role and branch from API
  const filteredUsers = effectiveBranchFilter
    ? users.filter((u) => u.branchId === effectiveBranchFilter)
    : users;

  // Apply search filter
  const searchFilteredUsers = searchQuery.trim()
    ? filteredUsers.filter((u) => {
        const query = searchQuery.toLowerCase().trim();
        return (
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phone?.toLowerCase().includes(query)
        );
      })
    : filteredUsers;

  const apiStudents = searchFilteredUsers.filter((u) => u.role === "student");
  const apiParents = searchFilteredUsers.filter((u) => u.role === "parent");
  const apiTeachers = searchFilteredUsers.filter((u) => u.role === "teacher");

  // Get branch name by id
  const getBranchName = (branchId?: string) => {
    if (!branchId) return "Chưa phân cơ sở";
    const branch = branches.find((b) => b._id === branchId);
    return branch?.name || "Không xác định";
  };

  // Fetch branches and users on mount
  useEffect(() => {
    fetchBranches().catch(() => {
      console.log("Could not fetch branches - make sure backend is running");
    });
    fetchUsers().catch(() => {
      console.log("Could not fetch users - make sure backend is running");
    });
    fetchClasses().catch(() => {
      console.log("Could not fetch classes - make sure backend is running");
    });
  }, [fetchBranches, fetchUsers, fetchClasses]);

  // Handlers for branches
  const handleAddBranch = () => {
    setEditingBranch(null);
    setShowBranchModal(true);
  };

  const handleEditBranch = (branch: BranchOption) => {
    setEditingBranch(branch);
    setShowBranchModal(true);
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (
      confirm(
        "Bạn có chắc muốn xóa cơ sở này? Hành động này không thể hoàn tác."
      )
    ) {
      try {
        await deleteBranch(branchId);
      } catch (error) {
        console.error("Error deleting branch:", error);
      }
    }
  };

  const handleSaveBranch = async (data: {
    name: string;
    address: string;
    phone?: string;
  }) => {
    try {
      if (editingBranch) {
        await updateBranch(editingBranch._id, data);
      } else {
        await createBranch(data);
      }
      setShowBranchModal(false);
      setEditingBranch(null);
    } catch (error) {
      console.error("Error saving branch:", error);
    }
  };

  // Handlers for import
  const handleImportUsers = async (
    file: File,
    role: "student" | "teacher" | "parent",
    branchId: string
  ): Promise<ImportResponse> => {
    return await importUsers(file, role, branchId);
  };

  const handleDownloadTemplate = (role: "student" | "teacher" | "parent") => {
    downloadTemplate(role);
  };

  // Handler để thêm user từ AddModal
  const handleAddUser = async (data: Record<string, string>) => {
    console.log("=== handleAddUser called ===", data);
    setAddUserError(null);
    setAddUserLoading(true);

    try {
      // Validate
      if (!data.branchId) {
        throw new Error("Vui lòng chọn chi nhánh");
      }
      const name = data["Họ và tên"] || data["Họ tên"];
      const email = data["Email"];
      const phone = data["Số điện thoại"];

      if (!name?.trim()) {
        throw new Error("Vui lòng nhập họ tên");
      }
      if (!email?.trim()) {
        throw new Error("Vui lòng nhập email");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error("Email không hợp lệ");
      }

      // Determine role from modal title
      let role: "student" | "parent" | "teacher" = "student";
      if (showModal?.title.includes("giáo viên")) {
        role = "teacher";
      } else if (showModal?.title.includes("phụ huynh")) {
        role = "parent";
      }

      // Prepare API data
      const apiData: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || undefined,
        password: "123456",
        role,
        branchId: data.branchId,
      };

      // Add date of birth and gender (not for parent)
      if (role !== "parent") {
        if (data["Ngày sinh"]) {
          apiData.dateOfBirth = new Date(data["Ngày sinh"]);
        }
        if (data["Giới tính"]) {
          apiData.gender = data["Giới tính"];
        }
      }

      // Add student specific fields (parent info)
      if (role === "student") {
        const parentName = data["Tên phụ huynh"];
        const parentPhone = data["SĐT phụ huynh"];
        if (parentName) apiData.parentName = parentName.trim();
        if (parentPhone) apiData.parentPhone = parentPhone.trim();

        // Thêm thông tin học bổng
        apiData.hasScholarship = data["hasScholarship"] === "true";
        if (apiData.hasScholarship && data["scholarshipType"]) {
          apiData.scholarshipType = data["scholarshipType"];
          apiData.scholarshipPercent = parseInt(data["scholarshipPercent"]) || 0;
        }
      }

      // Add teacher specific fields
      if (role === "teacher") {
        const subjects = data["Môn dạy"];
        if (subjects) {
          apiData.subjects = subjects.split(",").map((s: string) => s.trim());
        }
      }

      // Add parent specific fields (child email)
      if (role === "parent") {
        const childEmail = data["Email con (học sinh)"];
        if (childEmail) apiData.childEmail = childEmail.trim().toLowerCase();
      }

      console.log("Creating user with:", apiData);
      await createUser(apiData);
      console.log("User created successfully!");

      // Refresh users list
      await fetchUsers();

      // Close modal
      setShowModal(null);
    } catch (err: any) {
      console.error("Error creating user:", err);

      // Lấy message từ error đã được dịch trong users-store
      const message = err?.message || "Lỗi khi tạo người dùng";
      setAddUserError(message);
    } finally {
      setAddUserLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header với thiết kế hiện đại */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
              T
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Trường Thành Education
              </h1>
              <p className="text-xs text-gray-500">Dashboard Quản trị</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationCenter userRole={user.role} />
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Button
                variant="outline"
                onClick={onLogout}
                className="text-sm border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Xin chào 👋</p>
              <h2 className="text-2xl font-bold mt-1">{user.name}</h2>
              <p className="text-blue-100 mt-2 text-sm">
                Chào mừng bạn quay trở lại bảng điều khiển quản trị!
              </p>
            </div>
            <div className="hidden md:block text-6xl opacity-80">🎯</div>
          </div>
        </div>

        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            // Refetch data when switching tabs to ensure fresh data
            if (value === "courses") {
              fetchClasses().catch(console.error);
            } else if (value === "accounts") {
              fetchUsers().catch(console.error);
            } else if (value === "branches") {
              fetchBranches().catch(console.error);
            }
          }}
          className="w-full"
        >
          <TabsList className="w-full overflow-x-auto flex gap-1 rounded-2xl bg-white p-1.5 shadow-sm border border-gray-100 justify-start md:justify-center">
            <TabsTrigger
              value="overview"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              📊 Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value="courses"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              📚 Khóa học
            </TabsTrigger>
            <TabsTrigger
              value="accounts"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              👥 Tài khoản
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              🥇 Bảng xếp hạng
            </TabsTrigger>
            <TabsTrigger
              value="finance"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              💰 Tài chính
            </TabsTrigger>
            <TabsTrigger
              value="branches"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              🏢 Cơ sở
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              📅 Lịch dạy học
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              📋 Điểm danh
            </TabsTrigger>
            <TabsTrigger
              value="incidents"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              🐛 Sự cố
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              ⚙️ Cài đặt
            </TabsTrigger>
          </TabsList>

          {/* Tab Tổng quan */}
          <TabsContent value="overview" className="mt-6">
            {/* Overview Cards với gradient */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {overviewStats.map((stat) => (
                <Card
                  key={stat.label}
                  className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-90`}
                  />
                  <div className="relative p-5 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/80 text-sm font-medium">
                          {stat.label}
                        </p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                        <p className="text-white/70 text-xs mt-1">
                          {stat.trend}
                        </p>
                      </div>
                      <span className="text-4xl opacity-80">{stat.icon}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2 mt-6">
              <Card className="p-6 bg-white border-0 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📈</span>
                  <div>
                    <p className="font-bold text-gray-900">
                      Doanh thu theo tháng
                    </p>
                    <p className="text-xs text-gray-500">
                      Biểu đồ doanh thu 6 tháng gần nhất
                    </p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueByMonth}>
                      <defs>
                        <linearGradient
                          id="colorRevenue"
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
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 bg-white border-0 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-bold text-gray-900">Phân bổ học sinh</p>
                    <p className="text-xs text-gray-500">Theo môn học</p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={pieColors[idx]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3 mt-6">
              <Card className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">✅</span>
                  <div>
                    <p className="text-sm text-gray-600">Tỷ lệ đi học</p>
                    <p className="text-2xl font-bold text-emerald-700">95.2%</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📊</span>
                  <div>
                    <p className="text-sm text-gray-600">Điểm TB toàn trường</p>
                    <p className="text-2xl font-bold text-blue-700">8.2</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎓</span>
                  <div>
                    <p className="text-sm text-gray-600">
                      Học sinh mới tháng này
                    </p>
                    <p className="text-2xl font-bold text-amber-700">+24</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Khóa học */}
          <TabsContent value="courses" className="mt-6">
            <Card className="p-6 space-y-5 bg-white border-0 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📚</span>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      Danh sách khóa học
                    </p>
                    <p className="text-xs text-gray-500">
                      Quản lý các khóa học đang hoạt động
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowImportStudentsModal(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg shadow-green-200"
                  >
                    📥 Import học sinh
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingClass(null);
                      setShowClassModal(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-200"
                  >
                    ➕ Thêm khóa học
                  </Button>
                </div>
              </div>

              {/* Search Bar for Classes */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
                <Input
                  type="text"
                  placeholder="Tìm kiếm khóa học theo tên, giáo viên, môn học..."
                  value={classSearchQuery}
                  onChange={(e) => setClassSearchQuery(e.target.value)}
                  className="pl-9 pr-8 w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500"
                />
                {classSearchQuery && (
                  <button
                    onClick={() => setClassSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {classes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg mb-2">📚</p>
                    <p>Chưa có khóa học nào</p>
                    <p className="text-sm">Nhấn "Thêm khóa học" để tạo mới</p>
                  </div>
                ) : (
                  classes
                    .filter((course) => {
                      if (!classSearchQuery.trim()) return true;
                      const query = classSearchQuery.toLowerCase();
                      return (
                        course.name?.toLowerCase().includes(query) ||
                        course.teacher?.name?.toLowerCase().includes(query) ||
                        course.branch?.name?.toLowerCase().includes(query) ||
                        (course as any).subject?.toLowerCase().includes(query)
                      );
                    })
                    .map((course) => (
                      <div
                        key={course._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border-2 border-gray-100 px-5 py-4 bg-gradient-to-r from-white to-gray-50 hover:border-blue-200 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl shadow-md">
                            📖
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {course.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Giáo viên:{" "}
                              {course.teacher?.name || "Chưa phân công"}
                            </p>
                            {course.branch && (
                              <p className="text-xs text-blue-500">
                                Chi nhánh: {course.branch.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 sm:mt-0">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Học sinh</p>
                            <p className="font-bold text-gray-900">
                              {course.studentIds?.length || 0}/
                              {course.maxStudents || 30}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Lịch học</p>
                            <p className="font-bold text-blue-600">
                              {course.schedule?.length || 0} buổi/tuần
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              course.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : course.status === "completed"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {course.status === "active"
                              ? "Đang mở"
                              : course.status === "completed"
                              ? "Đã kết thúc"
                              : "Tạm dừng"}
                          </span>
                          <Button
                            variant="outline"
                            className="rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => setClassStudentsModal(course)}
                          >
                            👥 Danh sách
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                              setEditingClass(course);
                              setShowClassModal(true);
                            }}
                          >
                            ✏️ Sửa
                          </Button>
                        </div>
                      </div>
                    ))
                )}
                {classSearchQuery &&
                  classes.filter((course) => {
                    const query = classSearchQuery.toLowerCase();
                    return (
                      course.name?.toLowerCase().includes(query) ||
                      course.teacher?.name?.toLowerCase().includes(query) ||
                      course.branch?.name?.toLowerCase().includes(query) ||
                      (course as any).subject?.toLowerCase().includes(query)
                    );
                  }).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg mb-2">🔍</p>
                      <p>Không tìm thấy khóa học nào phù hợp</p>
                      <p className="text-sm">Thử tìm kiếm với từ khóa khác</p>
                    </div>
                  )}
              </div>
            </Card>
          </TabsContent>

          {/* Tab Tài khoản */}
          <TabsContent value="accounts" className="mt-6">
            <Card className="p-6 space-y-5 bg-white border-0 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      Quản lý tài khoản
                    </p>
                    <p className="text-xs text-gray-500">
                      Học sinh, phụ huynh và giáo viên
                      {!isAdmin && effectiveBranchFilter && (
                        <span className="ml-2 text-blue-600 font-medium">
                          • {getBranchName(effectiveBranchFilter)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Branch Filter - Chỉ hiển thị cho Admin */}
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">
                        🏢 Cơ sở:
                      </span>
                      <select
                        value={selectedBranchFilter}
                        onChange={(e) =>
                          setSelectedBranchFilter(e.target.value)
                        }
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                      >
                        <option value="">Tất cả cơ sở</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedBranchFilter && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Đang lọc: {getBranchName(selectedBranchFilter)}
                      </span>
                    )}
                  </div>
                )}

                {/* Badge hiển thị chi nhánh cho non-admin */}
                {!isAdmin && effectiveBranchFilter && (
                  <div className="flex items-center">
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                      🏢 {getBranchName(effectiveBranchFilter)}
                    </span>
                  </div>
                )}

                {/* Thanh tìm kiếm */}
                <div className="w-full sm:w-auto">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      🔍
                    </span>
                    <Input
                      type="text"
                      placeholder="Tìm kiếm theo tên, email, SĐT..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-8 w-full sm:w-[280px] rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <p className="text-xs text-gray-500 mt-1">
                      Tìm thấy:{" "}
                      {apiStudents.length +
                        apiParents.length +
                        apiTeachers.length}{" "}
                      kết quả
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl border-green-500 text-green-600 hover:bg-green-50"
                    onClick={() => setShowImportModal(true)}
                  >
                    📤 Import Excel
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-200"
                    onClick={() =>
                      setShowModal(
                        activeAccountTab === "students"
                          ? {
                              title: "Thêm học sinh",
                              fields: [
                                "Họ và tên",
                                "Email",
                                "Số điện thoại",
                                "Tên phụ huynh",
                                "SĐT phụ huynh",
                              ],
                            }
                          : activeAccountTab === "parents"
                          ? {
                              title: "Thêm phụ huynh",
                              fields: [
                                "Họ và tên",
                                "Email",
                                "Số điện thoại",
                                "Email con (học sinh)",
                              ],
                            }
                          : {
                              title: "Thêm giáo viên",
                              fields: [
                                "Họ và tên",
                                "Email",
                                "Số điện thoại",
                                "Môn dạy",
                              ],
                            }
                      )
                    }
                  >
                    ➕ Thêm mới
                  </Button>
                </div>
              </div>

              {/* Account Type Tabs */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
                <button
                  onClick={() => setActiveAccountTab("students")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    activeAccountTab === "students"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-white/50"
                  }`}
                >
                  <span>👨‍🎓</span>
                  <span>Học sinh ({apiStudents.length})</span>
                </button>
                <button
                  onClick={() => setActiveAccountTab("parents")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    activeAccountTab === "parents"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-white/50"
                  }`}
                >
                  <span>👨‍👩‍👧</span>
                  <span>Phụ huynh ({apiParents.length})</span>
                </button>
                <button
                  onClick={() => setActiveAccountTab("teachers")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    activeAccountTab === "teachers"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-white/50"
                  }`}
                >
                  <span>👨‍🏫</span>
                  <span>Giáo viên ({apiTeachers.length})</span>
                </button>
              </div>

              {/* Account List */}
              <div className="space-y-3">
                {usersLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    Đang tải...
                  </div>
                ) : (
                  <>
                    {activeAccountTab === "students" &&
                      (apiStudents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {effectiveBranchFilter
                            ? `Chưa có học sinh tại cơ sở "${getBranchName(
                                effectiveBranchFilter
                              )}"`
                            : "Chưa có học sinh"}
                        </div>
                      ) : (
                        apiStudents.map((s) => (
                          <div
                            key={s._id}
                            className="flex items-center justify-between rounded-2xl border-2 border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-2xl">
                                👨‍🎓
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">
                                  {s.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {s.email}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {s.phone || "Chưa có SĐT"} • ID:{" "}
                                  {s._id?.slice(-6)}
                                </p>
                                {isAdmin && (
                                  <p className="text-xs text-blue-600 font-medium mt-1">
                                    🏢 {getBranchName(s.branchId)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {s.createdAt
                                  ? new Date(s.createdAt).toLocaleDateString(
                                      "vi-VN"
                                    )
                                  : ""}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 rounded-lg"
                                onClick={() =>
                                  setSelectedUserDetail(
                                    s as unknown as UserDetail
                                  )
                                }
                              >
                                Chi tiết
                              </Button>
                            </div>
                          </div>
                        ))
                      ))}

                    {activeAccountTab === "parents" &&
                      (apiParents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {effectiveBranchFilter
                            ? `Chưa có phụ huynh tại cơ sở "${getBranchName(
                                effectiveBranchFilter
                              )}"`
                            : "Chưa có phụ huynh"}
                        </div>
                      ) : (
                        apiParents.map((p) => (
                          <div
                            key={p._id}
                            className="flex items-center justify-between rounded-2xl border-2 border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center text-2xl">
                                👨‍👩‍👧
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">
                                  {p.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {p.email}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {p.phone || "Chưa có SĐT"}
                                </p>
                                {isAdmin && (
                                  <p className="text-xs text-emerald-600 font-medium mt-1">
                                    🏢 {getBranchName(p.branchId)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {p.createdAt
                                  ? new Date(p.createdAt).toLocaleDateString(
                                      "vi-VN"
                                    )
                                  : ""}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 rounded-lg"
                                onClick={() =>
                                  setSelectedUserDetail(
                                    p as unknown as UserDetail
                                  )
                                }
                              >
                                Chi tiết
                              </Button>
                            </div>
                          </div>
                        ))
                      ))}

                    {activeAccountTab === "teachers" &&
                      (apiTeachers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {effectiveBranchFilter
                            ? `Chưa có giáo viên tại cơ sở "${getBranchName(
                                effectiveBranchFilter
                              )}"`
                            : "Chưa có giáo viên"}
                        </div>
                      ) : (
                        apiTeachers.map((t) => (
                          <div
                            key={t._id}
                            className="flex items-center justify-between rounded-2xl border-2 border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-2xl">
                                👨‍🏫
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">
                                  {t.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {t.email}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {t.phone || "Chưa có SĐT"}
                                  {t.subjects &&
                                    t.subjects.length > 0 &&
                                    ` • Môn: ${t.subjects.join(", ")}`}
                                  {t.experienceYears &&
                                    ` • ${t.experienceYears} năm KN`}
                                </p>
                                {isAdmin && (
                                  <p className="text-xs text-purple-600 font-medium mt-1">
                                    🏢 {getBranchName(t.branchId)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {t.createdAt
                                  ? new Date(t.createdAt).toLocaleDateString(
                                      "vi-VN"
                                    )
                                  : ""}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 rounded-lg"
                                onClick={() =>
                                  setSelectedUserDetail(
                                    t as unknown as UserDetail
                                  )
                                }
                              >
                                Chi tiết
                              </Button>
                            </div>
                          </div>
                        ))
                      ))}
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Tab Bảng xếp hạng */}
          <TabsContent value="leaderboard" className="mt-6">
            <Card className="p-6 space-y-5 bg-white border-0 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    Bảng Xếp Hạng
                  </p>
                  <p className="text-xs text-gray-500">
                    Vinh danh những nỗ lực xuất sắc
                  </p>
                </div>
              </div>

              {/* Ranking Category Tabs */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
                {Object.entries(leaderboardOptions).map(([key, opt]) => (
                  <button
                    key={key}
                    onClick={() => setRankingView(key as RankingCategory)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                      rankingView === key
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-600 hover:bg-white/50"
                    }`}
                  >
                    <span className="text-base leading-none">
                      {tabIcons[key as RankingCategory]}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Leaderboard List */}
              <div className="space-y-3">
                {leaderboardData[rankingView].map((row) => (
                  <div
                    key={`${rankingView}-${row.rank}-${row.name}`}
                    className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 transition-all duration-300 ${
                      row.rank === 1
                        ? "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-md"
                        : row.rank === 2
                        ? "border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50"
                        : row.rank === 3
                        ? "border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50"
                        : "border-gray-100 bg-white hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                          row.rank === 1
                            ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg"
                            : row.rank === 2
                            ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md"
                            : row.rank === 3
                            ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {row.rank === 1 && "🏆"}
                        {row.rank === 2 && "🥈"}
                        {row.rank === 3 && "🥉"}
                        {row.rank > 3 && (
                          <span className="text-sm font-bold">{row.rank}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{row.name}</p>
                        <p className="text-xs text-gray-500">{row.className}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">
                        {row.metric}
                      </p>
                      <p className="text-xs text-gray-500">{row.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                  <p className="text-2xl font-bold text-blue-600">248</p>
                  <p className="text-xs text-gray-500">Tổng học sinh</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50">
                  <p className="text-2xl font-bold text-emerald-600">8.2</p>
                  <p className="text-xs text-gray-500">Điểm TB</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
                  <p className="text-2xl font-bold text-amber-600">95%</p>
                  <p className="text-xs text-gray-500">Tỷ lệ chuyên cần</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Tab Tài chính */}
          <TabsContent value="finance" className="mt-6">
            {/* Finance Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {financeSummary.map((item) => (
                <Card
                  key={item.label}
                  className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-90`}
                  />
                  <div className="relative p-5 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/80 text-sm font-medium">
                          {item.label}
                        </p>
                        <p className="text-3xl font-bold mt-2">{item.value}</p>
                        <p className="text-white/70 text-xs mt-1">
                          {item.trend}
                        </p>
                      </div>
                      <span className="text-4xl opacity-80">{item.icon}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Finance Charts */}
            <div className="grid gap-6 lg:grid-cols-2 mt-6">
              <Card className="p-6 bg-white border-0 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="font-bold text-gray-900">
                      Doanh thu vs Chi phí
                    </p>
                    <p className="text-xs text-gray-500">So sánh theo tháng</p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financeChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        name="Doanh thu"
                      />
                      <Bar
                        dataKey="cost"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        name="Chi phí"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 bg-white border-0 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-bold text-gray-900">
                      Doanh thu theo khóa học
                    </p>
                    <p className="text-xs text-gray-500">Phân bổ tỷ lệ</p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={pieColors[idx]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Finance Table */}
            <Card className="p-6 mt-6 bg-white border-0 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-bold text-gray-900">
                    Chi tiết tài chính theo tháng
                  </p>
                  <p className="text-xs text-gray-500">
                    Bảng phân tích doanh thu và chi phí
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">
                        Tháng
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">
                        Doanh thu
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">
                        Chi phí
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">
                        Lợi nhuận
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">
                        Tỷ suất
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeChart.map((row) => (
                      <tr
                        key={row.month}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {row.month}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-600 font-semibold">
                          {row.revenue}T
                        </td>
                        <td className="py-3 px-4 text-right text-red-500 font-semibold">
                          {row.cost}T
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                          {row.revenue - row.cost}T
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            {Math.round(
                              ((row.revenue - row.cost) / row.revenue) * 1000
                            ) / 10}
                            %
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Tab Quản lý cơ sở */}
          <TabsContent value="branches" className="mt-6">
            <Card className="p-6 space-y-5 bg-white border-0 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏢</span>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      Quản lý cơ sở
                    </p>
                    <p className="text-xs text-gray-500">
                      Thêm, sửa, xóa các cơ sở của trung tâm
                    </p>
                  </div>
                </div>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-200"
                  onClick={handleAddBranch}
                >
                  ➕ Thêm cơ sở mới
                </Button>
              </div>

              {/* Danh sách cơ sở */}
              <div className="space-y-4">
                {branchesLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    Đang tải...
                  </div>
                ) : branches.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-5xl mb-4 block">🏢</span>
                    <p className="font-medium">Chưa có cơ sở nào</p>
                    <p className="text-sm">Nhấn "Thêm cơ sở mới" để bắt đầu</p>
                  </div>
                ) : (
                  branches.map((branch) => (
                    <div
                      key={branch._id}
                      className="flex items-center justify-between rounded-2xl border-2 border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-2xl">
                          🏢
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {branch.name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            📍 {branch.address}
                          </p>
                          {branch.phone && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              📞 {branch.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            branch.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {branch.status === "active"
                            ? "✅ Hoạt động"
                            : "⏸️ Tạm ngưng"}
                        </span>
                        <Button
                          variant="outline"
                          className="rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => handleEditBranch(branch)}
                        >
                          ✏️ Sửa
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDeleteBranch(branch._id)}
                        >
                          🗑️ Xóa
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Tab Lịch dạy học */}
          <TabsContent value="schedule" className="mt-6">
            <ScheduleManager userRole={user.role} userId={user.id} />
          </TabsContent>

          {/* Tab Điểm danh */}
          <TabsContent value="attendance" className="mt-6">
            <AttendanceManager />
          </TabsContent>

          {/* Tab Sự cố */}
          <TabsContent value="incidents" className="mt-6">
            <IncidentsManager />
          </TabsContent>

          {/* Tab Cài đặt */}
          <TabsContent value="settings" className="mt-6">
            <Card className="p-6 space-y-5 bg-white border-0 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚙️</span>
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    Cài đặt hệ thống
                  </p>
                  <p className="text-xs text-gray-500">
                    Tùy chỉnh thông tin trung tâm
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Tên trung tâm
                  </label>
                  <Input
                    placeholder="Tên trung tâm"
                    defaultValue="Trường Thành Education"
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email hệ thống
                  </label>
                  <Input
                    placeholder="Email hệ thống"
                    defaultValue="admin@daythem.pro"
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Số điện thoại
                  </label>
                  <Input
                    placeholder="Số điện thoại"
                    defaultValue="+84 123 456 789"
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Địa chỉ
                  </label>
                  <Input
                    placeholder="Địa chỉ"
                    defaultValue="123 Đường ABC, Quận 1, TPHCM"
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-200">
                  💾 Lưu thay đổi
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {showModal && (
        <AddModal
          title={showModal.title}
          fields={showModal.fields}
          branches={branches}
          onClose={() => {
            setShowModal(null);
            setAddUserError(null);
          }}
          onSubmit={handleAddUser}
          isLoading={addUserLoading}
          error={addUserError}
        />
      )}

      {/* Import Users Modal */}
      <ImportUsersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        branches={branches}
        onImport={handleImportUsers}
        onDownloadTemplate={handleDownloadTemplate}
      />

      {/* Branch Modal */}
      <BranchModal
        isOpen={showBranchModal}
        branch={editingBranch}
        onClose={() => {
          setShowBranchModal(false);
          setEditingBranch(null);
        }}
        onSave={handleSaveBranch}
      />

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <UserDetailModal
          user={selectedUserDetail}
          branchName={getBranchName(selectedUserDetail.branchId)}
          onClose={() => setSelectedUserDetail(null)}
          onEdit={() => {
            setEditingUser(selectedUserDetail);
            setSelectedUserDetail(null);
          }}
          onDelete={async () => {
            if (
              confirm(
                `Bạn có chắc muốn xóa tài khoản "${selectedUserDetail.name}"?`
              )
            ) {
              try {
                const { deleteUser } = useUsersStore.getState();
                await deleteUser(selectedUserDetail._id);
                setSelectedUserDetail(null);
                await fetchUsers();
              } catch (error) {
                console.error("Error deleting user:", error);
                alert("Lỗi khi xóa tài khoản");
              }
            }
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          branches={branches}
          onClose={() => {
            setEditingUser(null);
            setEditUserError(null);
          }}
          onSave={async (data) => {
            setEditUserLoading(true);
            setEditUserError(null);
            try {
              const { updateUser } = useUsersStore.getState();
              await updateUser(editingUser._id, data);
              setEditingUser(null);
              await fetchUsers();
            } catch (err: any) {
              setEditUserError(err.message || "Lỗi khi cập nhật tài khoản");
            } finally {
              setEditUserLoading(false);
            }
          }}
          isLoading={editUserLoading}
          error={editUserError}
        />
      )}

      {/* Import Students Modal */}
      {showImportStudentsModal && (
        <ImportStudentsModal
          classes={classes}
          branches={branches}
          onClose={() => setShowImportStudentsModal(false)}
          onSuccess={() => {
            fetchClasses();
            fetchUsers();
          }}
        />
      )}

      {/* Class Form Modal */}
      {showClassModal && (
        <ClassFormModal
          classData={editingClass}
          branches={branches}
          teachers={users.filter((u) => u.role === "teacher")}
          onClose={() => {
            setShowClassModal(false);
            setEditingClass(null);
          }}
          onSuccess={() => {
            fetchClasses();
          }}
        />
      )}

      {/* Class Students Modal */}
      {classStudentsModal && (
        <ClassStudentsModal
          classData={classStudentsModal}
          branchId={
            typeof classStudentsModal.branchId === "object" &&
            classStudentsModal.branchId
              ? classStudentsModal.branchId._id
              : classStudentsModal.branchId ||
                classStudentsModal.branch?._id ||
                ""
          }
          onClose={() => setClassStudentsModal(null)}
          onUpdate={() => {
            fetchClasses();
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
