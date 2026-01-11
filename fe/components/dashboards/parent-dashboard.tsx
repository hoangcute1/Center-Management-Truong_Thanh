"use client";
import { useMemo, useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWindow from "@/components/chat-window";
import NotificationCenter from "@/components/notification-center";
import IncidentReportModal from "@/components/pages/incident-report-modal";
import { useParentDashboardStore } from "@/lib/stores/parent-dashboard-store";
import { useAuthStore } from "@/lib/stores/auth-store";

interface ParentDashboardProps {
  user: { id: string; name: string; email: string; role: string };
  onLogout: () => void;
}

const overviewStats = [
  {
    label: "Khóa học",
    value: 3,
    note: "Đang theo học",
    icon: "📚",
    color: "from-blue-500 to-blue-600",
  },
  {
    label: "Điểm TB",
    value: 8.2,
    note: "Kết quả tốt",
    icon: "⭐",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    label: "Buổi học",
    value: 28,
    note: "Tổng buổi",
    icon: "📅",
    color: "from-amber-500 to-orange-500",
  },
  {
    label: "Xếp loại",
    value: "Tốt",
    note: "Đánh giá chung",
    icon: "🏆",
    color: "from-purple-500 to-purple-600",
  },
];

const child = {
  name: "Nguyễn Thị C",
  grade: "Lớp 10",
  classCount: 3,
  avgScore: 8.2,
  rating: "Tốt",
  tuition: 2_500_000,
  paid: true,
};

const courses = [
  {
    subject: "Toán",
    total: 12,
    attended: 11,
    score: 8.5,
    teacher: "Cô Trần Thị B",
  },
  {
    subject: "Anh văn",
    total: 10,
    attended: 9,
    score: 7.8,
    teacher: "Thầy Lê Văn E",
  },
  {
    subject: "Văn",
    total: 8,
    attended: 8,
    score: 8.2,
    teacher: "Cô Trần Thị B",
  },
];

const progressData = [
  { week: "Tuần 1", score: 7.2 },
  { week: "Tuần 2", score: 7.4 },
  { week: "Tuần 3", score: 7.6 },
  { week: "Tuần 4", score: 7.8 },
];

const weeklySchedule = [
  {
    day: "MON",
    date: "06/01",
    code: "MATH101",
    time: "17:00-18:30",
    room: "Phòng 604",
    teacher: "Cô Trần Thị B",
    status: "confirmed",
    attendanceStatus: "present" as const,
  },
  {
    day: "TUE",
    date: "07/01",
    code: "ENG102",
    time: "18:00-19:30",
    room: "Phòng 417",
    teacher: "Thầy Lê Văn E",
    status: "confirmed",
    attendanceStatus: "present" as const,
  },
  {
    day: "WED",
    date: "08/01",
    code: "-",
    time: "-",
    room: "",
    teacher: "",
    status: "empty",
    attendanceStatus: null,
  },
  {
    day: "THU",
    date: "09/01",
    code: "PHY103",
    time: "17:00-18:30",
    room: "Phòng 506",
    teacher: "Thầy Nguyễn Văn F",
    status: "pending",
    attendanceStatus: "absent" as const,
  },
  {
    day: "FRI",
    date: "10/01",
    code: "MATH101",
    time: "17:00-18:30",
    room: "Phòng 604",
    teacher: "Cô Trần Thị B",
    status: "confirmed",
    attendanceStatus: null, // Chưa diễn ra
  },
  {
    day: "SAT",
    date: "11/01",
    code: "-",
    time: "-",
    room: "",
    teacher: "",
    status: "empty",
    attendanceStatus: null,
  },
  {
    day: "SUN",
    date: "12/01",
    code: "-",
    time: "-",
    room: "",
    teacher: "",
    status: "empty",
    attendanceStatus: null,
  },
];

const teacherNotes = [
  {
    teacher: "Cô Trần Thị B",
    subject: "Toán",
    note: "Em học rất chăm chỉ, có tiến bộ rõ rệt. Kiến thức nền tảng tốt, cần luyện tập thêm các bài toán khó.",
    date: "15/1/2024",
  },
  {
    teacher: "Thầy Lê Văn E",
    subject: "Anh văn",
    note: "Em phát âm tốt, tuy nhiên cần cải thiện kỹ năng viết. Gợi ý luyện tập thêm writing skill.",
    date: "14/1/2024",
  },
];

const contacts = [
  { name: "Cô Trần Thị B", subject: "Dạy môn Toán" },
  { name: "Thầy Lê Văn E", subject: "Dạy môn Anh văn" },
];

function DetailModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-3">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-xl font-bold">{child.name}</p>
            <p className="text-sm opacity-90">{child.grade}</p>
          </div>
          <button onClick={onClose} className="text-lg font-semibold">
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-3 bg-blue-50 border-blue-100">
              <p className="text-xs text-gray-600">Điểm TB</p>
              <p className="text-xl font-bold text-blue-700">8.2</p>
            </Card>
            <Card className="p-3 bg-green-50 border-green-100">
              <p className="text-xs text-gray-600">Khóa học</p>
              <p className="text-xl font-bold text-green-700">
                {child.classCount}
              </p>
            </Card>
            <Card className="p-3 bg-purple-50 border-purple-100">
              <p className="text-xs text-gray-600">Buổi học</p>
              <p className="text-xl font-bold text-purple-700">28</p>
            </Card>
            <Card className="p-3 bg-amber-50 border-amber-100">
              <p className="text-xs text-gray-600">Xếp loại</p>
              <p className="text-xl font-bold text-amber-600">Tốt</p>
            </Card>
          </div>

          <Card className="p-4">
            <p className="font-semibold text-gray-900 mb-3">Tiến độ học tập</p>
            <div className="h-64">
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
                    domain={[0, 12]}
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

          <Card className="p-4 space-y-3">
            <p className="font-semibold text-gray-900">Các khóa học</p>
            {courses.map((course) => (
              <div
                key={course.subject}
                className="rounded-lg border border-gray-200 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">
                    {course.subject}
                  </p>
                  <p className="text-blue-700 text-sm font-semibold">
                    {course.score}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <p>Tổng buổi: {course.total}</p>
                  <p>Tham dự: {course.attended}</p>
                </div>
              </div>
            ))}
          </Card>

          <Card className="p-4 space-y-3">
            <p className="font-semibold text-gray-900">Nhận xét từ giáo viên</p>
            {teacherNotes.map((note) => (
              <Card
                key={note.teacher + note.date}
                className="p-3 bg-blue-50 border-blue-100"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{note.teacher}</p>
                  <p className="text-xs text-gray-600">{note.subject}</p>
                </div>
                <p className="text-sm text-gray-800 mt-2 leading-relaxed">
                  {note.note}
                </p>
                <p className="text-xs text-gray-500 mt-1">{note.date}</p>
              </Card>
            ))}
          </Card>

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

export default function ParentDashboard({
  user,
  onLogout,
}: ParentDashboardProps) {
  const [chatWith, setChatWith] = useState<{
    name: string;
    role: string;
  } | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Fetch real data from API
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    fetchDashboardData,
  } = useParentDashboardStore();
  const { user: authUser } = useAuthStore();

  // Fetch data on mount
  useEffect(() => {
    const parentId = authUser?._id || user.id;
    const childEmail = (authUser as any)?.childEmail;
    if (parentId) {
      fetchDashboardData(parentId, childEmail).catch(console.error);
    }
  }, [authUser, user.id, fetchDashboardData]);

  // Use real data or fallback to mock data
  const childData = dashboardData?.child || child;
  const classesData = dashboardData?.classes?.length
    ? dashboardData.classes.map((c) => ({
        subject: c.name,
        total: 12,
        attended: 10,
        score: 8.0,
        teacher: c.teacherName,
      }))
    : courses;

  const attendanceStats = dashboardData?.attendanceStats || {
    present: 28,
    absent: 2,
    late: 0,
    total: 30,
    rate: 93,
  };

  // Dynamic overview stats
  const dynamicOverviewStats = dashboardData
    ? [
        {
          label: "Khóa học",
          value: dashboardData.classes.length,
          note: "Đang theo học",
          icon: "📚",
          color: "from-blue-500 to-blue-600",
        },
        {
          label: "Điểm TB",
          value:
            dashboardData.recentGrades.length > 0
              ? (
                  dashboardData.recentGrades.reduce(
                    (acc, g) => acc + g.percentage,
                    0
                  ) /
                  dashboardData.recentGrades.length /
                  10
                ).toFixed(1)
              : "N/A",
          note: "Kết quả học tập",
          icon: "⭐",
          color: "from-emerald-500 to-emerald-600",
        },
        {
          label: "Buổi học",
          value: attendanceStats.total,
          note: `${attendanceStats.present} buổi tham dự`,
          icon: "📅",
          color: "from-amber-500 to-orange-500",
        },
        {
          label: "Chuyên cần",
          value: `${attendanceStats.rate}%`,
          note: "Tỉ lệ tham gia",
          icon: "🏆",
          color: "from-purple-500 to-purple-600",
        },
      ]
    : overviewStats;

  // Weekly schedule with attendance
  const scheduleWithAttendance = dashboardData?.upcomingSessions?.length
    ? dashboardData.upcomingSessions.slice(0, 7).map((s, idx) => {
        const sessionDate = new Date(s.date);
        const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        return {
          day: days[sessionDate.getDay()],
          date: sessionDate.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          }),
          code: s.className.substring(0, 7).toUpperCase(),
          time: `${new Date(s.startTime).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}-${new Date(s.endTime).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          room: "Phòng học",
          teacher: "Giáo viên",
          status: s.status === "completed" ? "confirmed" : "pending",
          attendanceStatus: s.attendanceStatus,
        };
      })
    : weeklySchedule;

  const paidBadge = child.paid ? (
    <Badge variant="success">Đã thanh toán</Badge>
  ) : (
    <Badge variant="warning">Chưa thanh toán</Badge>
  );

  const progressAverage = useMemo(
    () => progressData[progressData.length - 1].score,
    []
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Trường Thành Education
            </h1>
            <p className="text-sm text-gray-500">Dashboard Phụ huynh</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter userRole={user.role} />
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-base shadow-md">
                {user.name.charAt(0)}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {user.name}
                </p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout}>
              Đăng xuất
            </Button>
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
                Chào mừng bạn quay trở lại theo dõi việc học của con!
              </p>
            </div>
            <div className="hidden md:block text-6xl opacity-80">👨‍👩‍👧</div>
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
              value="payment"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              💳 Thanh toán
            </TabsTrigger>
            <TabsTrigger
              value="invoice"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              🧾 Hóa đơn
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
            {dashboardLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
              </div>
            ) : (
              <>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                  {dynamicOverviewStats.map((item) => (
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

                <Card className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        Thông tin con
                      </p>
                      <p className="text-sm text-gray-500">
                        {childData.name} - {childData.grade}
                      </p>
                    </div>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowDetail(true)}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {classesData.map((course) => (
                      <Card key={course.subject} className="p-3 bg-gray-50">
                        <p className="font-semibold text-gray-900">
                          {course.subject}
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {course.score}
                        </p>
                        <p className="text-xs text-gray-500">
                          {course.teacher}
                        </p>
                      </Card>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card className="p-5 space-y-4">
              <p className="font-semibold text-gray-900 text-lg">
                Lịch học tuần này
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {scheduleWithAttendance.map((item, idx) => (
                  <div
                    key={`${item.day}-${idx}`}
                    className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col"
                  >
                    <div className="bg-blue-600 text-white px-3 py-2 text-center">
                      <p className="text-xs font-semibold leading-tight">
                        {item.day}
                      </p>
                      <p className="text-[11px] opacity-80 leading-tight">
                        {item.date}
                      </p>
                    </div>

                    {item.status === "empty" ? (
                      <div className="flex-1 flex items-center justify-center text-sm text-gray-300 py-8">
                        -
                      </div>
                    ) : (
                      <div className="flex-1 p-3 space-y-2 text-center">
                        <div className="text-sm font-semibold text-blue-700">
                          {item.code}
                        </div>
                        <div className="text-xs text-gray-600">
                          tại {item.room}
                        </div>
                        <div className="text-xs text-gray-800 font-medium">
                          {item.time}
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.teacher}
                        </div>
                        <div className="space-y-2 pt-1">
                          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg">
                            Xem tài liệu
                          </Button>
                          {/* Attendance Status */}
                          {item.attendanceStatus ? (
                            <div
                              className={`w-full text-sm rounded-lg py-2 px-3 font-medium text-center ${
                                item.attendanceStatus === "present"
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  : item.attendanceStatus === "absent"
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : item.attendanceStatus === "late"
                                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                                  : "bg-blue-100 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {item.attendanceStatus === "present" &&
                                "✅ Đã điểm danh"}
                              {item.attendanceStatus === "absent" &&
                                "❌ Nghỉ học"}
                              {item.attendanceStatus === "late" && "⏰ Đi muộn"}
                              {item.attendanceStatus === "excused" &&
                                "📝 Nghỉ phép"}
                            </div>
                          ) : item.status === "confirmed" ||
                            item.status === "pending" ? (
                            <div className="w-full text-sm rounded-lg py-2 px-3 font-medium text-center bg-gray-100 text-gray-500 border border-gray-200">
                              ⏳ Chưa điểm danh
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <Card className="p-5">
              <p className="font-semibold text-gray-900 mb-3">
                Tiến độ học tập con
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
                      domain={[0, 12]}
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
              <p className="text-sm text-gray-600 mt-2">
                Điểm trung bình tuần gần nhất: {progressAverage}
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="mt-6">
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    Quản lý thanh toán
                  </p>
                  <p className="text-sm text-gray-600">Học phí: 2.5 Tr VND</p>
                </div>
                {paidBadge}
              </div>
              <Button
                variant="outline"
                className="w-full"
                disabled={child.paid}
              >
                Đã thanh toán
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="invoice" className="mt-6">
            <Card className="p-5">
              <p className="font-semibold text-gray-900 mb-2">
                Danh sách hóa đơn
              </p>
              <p className="text-sm text-gray-500">Chưa có hóa đơn nào</p>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Card className="p-5 space-y-3">
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

          <TabsContent value="incidents" className="mt-6">
            <IncidentReportModal
              isOpen={true}
              onClose={() => {}}
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
      {showDetail && <DetailModal onClose={() => setShowDetail(false)} />}
    </div>
  );
}
