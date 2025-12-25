"use client";
import { useMemo, useState } from "react";
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

interface ParentDashboardProps {
  user: { id: string; name: string; email: string; role: string };
  onLogout: () => void;
}

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
  },
  {
    day: "TUE",
    date: "07/01",
    code: "ENG102",
    time: "18:00-19:30",
    room: "Phòng 417",
    teacher: "Thầy Lê Văn E",
    status: "confirmed",
  },
  {
    day: "WED",
    date: "08/01",
    code: "-",
    time: "-",
    room: "",
    teacher: "",
    status: "empty",
  },
  {
    day: "THU",
    date: "09/01",
    code: "PHY103",
    time: "17:00-18:30",
    room: "Phòng 506",
    teacher: "Thầy Nguyễn Văn F",
    status: "pending",
  },
  {
    day: "FRI",
    date: "10/01",
    code: "MATH101",
    time: "17:00-18:30",
    room: "Phòng 604",
    teacher: "Cô Trần Thị B",
    status: "confirmed",
  },
  {
    day: "SAT",
    date: "11/01",
    code: "-",
    time: "-",
    room: "",
    teacher: "",
    status: "empty",
  },
  {
    day: "SUN",
    date: "12/01",
    code: "-",
    time: "-",
    room: "",
    teacher: "",
    status: "empty",
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
            <Button variant="ghost" className="border border-gray-200">
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

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="schedule">Lịch học</TabsTrigger>
            <TabsTrigger value="progress">Tiến độ</TabsTrigger>
            <TabsTrigger value="payment">Thanh toán</TabsTrigger>
            <TabsTrigger value="invoice">Hóa đơn</TabsTrigger>
            <TabsTrigger value="contact">Liên hệ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Con của bạn</p>
                  <p className="font-semibold text-gray-900">{child.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Khối</p>
                  <p className="font-semibold text-gray-900">{child.grade}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Khóa học</p>
                  <p className="font-semibold text-gray-900">
                    {child.classCount}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Điểm TB</p>
                  <p className="font-semibold text-green-700">
                    {child.avgScore}
                  </p>
                </div>
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowDetail(true)}
              >
                Xem chi tiết
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card className="p-5 space-y-4">
              <p className="font-semibold text-gray-900 text-lg">
                Lịch học tuần này
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {weeklySchedule.map((item) => (
                  <div
                    key={item.day}
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
                          <Button
                            className={`w-full text-sm rounded-lg ${
                              item.status === "confirmed"
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-amber-400 hover:bg-amber-500 text-white"
                            }`}
                            variant="solid"
                          >
                            {item.status === "confirmed"
                              ? "Đã xác nhận"
                              : "Chưa xác nhận"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
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

          <TabsContent value="payment">
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

          <TabsContent value="invoice">
            <Card className="p-5">
              <p className="font-semibold text-gray-900 mb-2">
                Danh sách hóa đơn
              </p>
              <p className="text-sm text-gray-500">Chưa có hóa đơn nào</p>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
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
