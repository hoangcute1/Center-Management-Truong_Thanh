"use client";
import { useState } from "react";
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

const courseList = [
  {
    name: "Toán Cơ Bản",
    teacher: "Cô B",
    students: 20,
    revenue: "5.000.000 VND",
    status: "active",
  },
  {
    name: "Toán Nâng Cao",
    teacher: "Thầy E",
    students: 15,
    revenue: "3.750.000 VND",
    status: "active",
  },
  {
    name: "Anh Văn",
    teacher: "Thầy F",
    students: 18,
    revenue: "4.500.000 VND",
    status: "active",
  },
  {
    name: "Vật Lý",
    teacher: "Cô G",
    students: 12,
    revenue: "3.000.000 VND",
    status: "pending",
  },
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

function AddModal({
  title,
  fields,
  onClose,
}: {
  title: string;
  fields: string[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-3">
      <Card className="w-full max-w-md p-6 bg-white shadow-2xl border-0">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg">
            ➕
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <div className="space-y-3 mb-5">
          {fields.map((f) => (
            <Input
              key={f}
              placeholder={f}
              className="rounded-xl border-gray-200"
            />
          ))}
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-200">
            Thêm
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
          >
            Hủy
          </Button>
        </div>
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
  const [rankingView, setRankingView] = useState<RankingCategory>("score");

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

        <Tabs defaultValue="overview" className="w-full">
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
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-200">
                  ➕ Thêm khóa học
                </Button>
              </div>

              <div className="space-y-3">
                {courseList.map((course) => (
                  <div
                    key={course.name}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border-2 border-gray-100 px-5 py-4 bg-gradient-to-r from-white to-gray-50 hover:border-blue-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl shadow-md">
                        📖
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{course.name}</p>
                        <p className="text-xs text-gray-500">
                          Giáo viên: {course.teacher}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mt-3 sm:mt-0">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Học sinh</p>
                        <p className="font-bold text-gray-900">
                          {course.students}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Doanh thu</p>
                        <p className="font-bold text-blue-600">
                          {course.revenue}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          course.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {course.status === "active" ? "Đang mở" : "Chờ duyệt"}
                      </span>
                      <Button variant="outline" className="rounded-xl">
                        Sửa
                      </Button>
                    </div>
                  </div>
                ))}
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
                    </p>
                  </div>
                </div>
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
                              "Mã học sinh",
                              "Tên phụ huynh",
                            ],
                          }
                        : activeAccountTab === "parents"
                        ? {
                            title: "Thêm phụ huynh",
                            fields: [
                              "Họ và tên",
                              "Email",
                              "Số điện thoại",
                              "Số con",
                            ],
                          }
                        : {
                            title: "Thêm giáo viên",
                            fields: [
                              "Họ và tên",
                              "Email",
                              "Số điện thoại",
                              "Môn dạy",
                              "Năm kinh nghiệm",
                            ],
                          }
                    )
                  }
                >
                  ➕ Thêm mới
                </Button>
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
                  <span>Học sinh ({accounts.students.length})</span>
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
                  <span>Phụ huynh ({accounts.parents.length})</span>
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
                  <span>Giáo viên ({accounts.teachers.length})</span>
                </button>
              </div>

              {/* Account List */}
              <div className="space-y-3">
                {activeAccountTab === "students" &&
                  accounts.students.map((s) => (
                    <div
                      key={s.code}
                      className="flex items-center justify-between rounded-2xl border-2 border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-2xl">
                          {s.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.email}</p>
                          <p className="text-xs text-gray-400">
                            {s.phone} • Mã: {s.code}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{s.date}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 rounded-lg"
                        >
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  ))}

                {activeAccountTab === "parents" &&
                  accounts.parents.map((p) => (
                    <div
                      key={p.email}
                      className="flex items-center justify-between rounded-2xl border-2 border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center text-2xl">
                          {p.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.email}</p>
                          <p className="text-xs text-gray-400">
                            {p.phone} • {p.children}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{p.date}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 rounded-lg"
                        >
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  ))}

                {activeAccountTab === "teachers" &&
                  accounts.teachers.map((t) => (
                    <div
                      key={t.email}
                      className="flex items-center justify-between rounded-2xl border-2 border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-2xl">
                          {t.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-500">{t.email}</p>
                          <p className="text-xs text-gray-400">
                            {t.phone} • Môn: {t.subject} • {t.experience}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{t.date}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 rounded-lg"
                        >
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  ))}
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
          onClose={() => setShowModal(null)}
        />
      )}
    </div>
  );
}
