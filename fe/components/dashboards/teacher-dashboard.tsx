"use client";
import { useMemo, useState } from "react";
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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWindow from "@/components/chat-window";
import NotificationCenter from "@/components/notification-center";

interface TeacherDashboardProps {
  user: { id: string; name: string; email: string; role: string };
  onLogout: () => void;
}

type ClassKey = "toan10a" | "toan11b" | "ly10";

type StudentItem = {
  id: string;
  name: string;
  score: number;
  status: string;
  className: string;
};

type RankingCategory = "score" | "diligence" | "attendance";

type DaySession = {
  code: string;
  subject: string;
  center: string;
  room: string;
  time: string;
  status: "confirmed" | "pending";
};

const overviewCards = [
  {
    label: "Lớp dạy",
    value: 5,
    note: "Khóa học",
    icon: "📚",
    color: "from-blue-500 to-blue-600",
  },
  {
    label: "Tổng học sinh",
    value: 45,
    note: "Đang theo học",
    icon: "👨‍🎓",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    label: "Buổi dạy tuần",
    value: 7,
    note: "Tiết học",
    icon: "📅",
    color: "from-amber-500 to-orange-500",
  },
  {
    label: "Điểm TB lớp",
    value: 7.8,
    note: "Kết quả tốt",
    icon: "⭐",
    color: "from-purple-500 to-purple-600",
  },
];

const barData = [
  { day: "Thứ 2", students: 15 },
  { day: "Thứ 3", students: 12 },
  { day: "Thứ 4", students: 18 },
  { day: "Thứ 5", students: 14 },
  { day: "Thứ 6", students: 16 },
];

const classTabs: Record<ClassKey, string> = {
  toan10a: "Toán Lớp 10A",
  toan11b: "Toán Lớp 11B",
  ly10: "Vật Lý Lớp 10",
};

const classInfo: Record<ClassKey, { subject: string; size: number }> = {
  toan10a: { subject: "Toán", size: 3 },
  toan11b: { subject: "Toán", size: 2 },
  ly10: { subject: "Vật lý", size: 2 },
};

const classStudents: Record<ClassKey, StudentItem[]> = {
  toan10a: [
    {
      id: "HS001",
      name: "Nguyễn Văn A",
      score: 82,
      status: "Tốt",
      className: "Toán Lớp 10A",
    },
    {
      id: "HS002",
      name: "Trần Thị B",
      score: 78,
      status: "Khá",
      className: "Toán Lớp 10A",
    },
    {
      id: "HS003",
      name: "Lê Văn C",
      score: 75,
      status: "Khá",
      className: "Toán Lớp 10A",
    },
  ],
  toan11b: [
    {
      id: "HS011",
      name: "Phạm Thị D",
      score: 80,
      status: "Tốt",
      className: "Toán Lớp 11B",
    },
    {
      id: "HS012",
      name: "Hoàng Văn E",
      score: 76,
      status: "Khá",
      className: "Toán Lớp 11B",
    },
  ],
  ly10: [
    {
      id: "HS021",
      name: "Võ Thị F",
      score: 85,
      status: "Tốt",
      className: "Vật Lý Lớp 10",
    },
    {
      id: "HS022",
      name: "Đặng Văn G",
      score: 79,
      status: "Khá",
      className: "Vật Lý Lớp 10",
    },
  ],
};

const leaderboardOptions: Record<
  RankingCategory,
  { label: string; desc: string }
> = {
  score: { label: "Top điểm", desc: "Điểm trung bình cao" },
  diligence: { label: "Top chăm chỉ", desc: "Nộp bài và tham gia đầy đủ" },
  attendance: { label: "Top chuyên cần", desc: "Điểm danh đủ và đúng giờ" },
};

const leaderboardData: Record<
  RankingCategory,
  { name: string; className: string; value: string; trend: string }[]
> = {
  score: [
    {
      name: "Nguyễn Văn A",
      className: "Toán 10A",
      value: "9.2",
      trend: "+0.3 tuần này",
    },
    {
      name: "Phạm Thị D",
      className: "Toán 11B",
      value: "9.0",
      trend: "Giữ phong độ",
    },
    { name: "Võ Thị F", className: "Vật Lý 10", value: "8.9", trend: "+0.1" },
    {
      name: "Hoàng Văn E",
      className: "Toán 11B",
      value: "8.7",
      trend: "Vượt 1 bậc",
    },
  ],
  diligence: [
    {
      name: "Trần Thị B",
      className: "Toán 10A",
      value: "12/12 bài tập",
      trend: "3 tuần liên tiếp",
    },
    {
      name: "Đặng Văn G",
      className: "Vật Lý 10",
      value: "11/12 bài tập",
      trend: "Ổn định",
    },
    {
      name: "Lê Văn C",
      className: "Toán 10A",
      value: "11/12 bài tập",
      trend: "+2 bài tuần này",
    },
    {
      name: "Nguyễn Văn A",
      className: "Toán 10A",
      value: "10/12 bài tập",
      trend: "Cần giữ nhịp",
    },
  ],
  attendance: [
    {
      name: "Phạm Thị D",
      className: "Toán 11B",
      value: "12/12 buổi",
      trend: "3 tuần đủ",
    },
    {
      name: "Nguyễn Văn A",
      className: "Toán 10A",
      value: "11/12 buổi",
      trend: "+1 buổi",
    },
    {
      name: "Hoàng Văn E",
      className: "Toán 11B",
      value: "11/12 buổi",
      trend: "Ổn định",
    },
    {
      name: "Võ Thị F",
      className: "Vật Lý 10",
      value: "10/12 buổi",
      trend: "Cải thiện",
    },
  ],
};

const scheduleWeek: { day: string; date: string; sessions: DaySession[] }[] = [
  {
    day: "THỨ HAI",
    date: "05/01",
    sessions: [
      {
        code: "MATH101",
        subject: "Toán",
        center: "Trung tâm A",
        room: "Phòng 604",
        time: "7:00-9:15",
        status: "confirmed",
      },
    ],
  },
  {
    day: "THỨ BA",
    date: "06/01",
    sessions: [
      {
        code: "PHY101",
        subject: "Vật lý",
        center: "Trung tâm A",
        room: "Phòng 606",
        time: "7:00-9:15",
        status: "pending",
      },
    ],
  },
  {
    day: "THỨ TƯ",
    date: "07/01",
    sessions: [
      {
        code: "MATH102",
        subject: "Toán",
        center: "Trung tâm A",
        room: "Phòng 608",
        time: "8:30-11:45",
        status: "confirmed",
      },
    ],
  },
  {
    day: "THỨ NĂM",
    date: "08/01",
    sessions: [
      {
        code: "MATH101",
        subject: "Toán",
        center: "Trung tâm A",
        room: "Phòng 417",
        time: "7:00-9:15",
        status: "confirmed",
      },
    ],
  },
  {
    day: "THỨ SÁU",
    date: "09/01",
    sessions: [
      {
        code: "PHY101",
        subject: "Vật lý",
        center: "Trung tâm A",
        room: "Phòng 604",
        time: "7:00-9:15",
        status: "pending",
      },
      {
        code: "MATH102",
        subject: "Toán",
        center: "Trung tâm A",
        room: "Phòng 606",
        time: "12:30-14:45",
        status: "confirmed",
      },
    ],
  },
  { day: "THỨ BẢY", date: "10/01", sessions: [] },
  { day: "CHỦ NHẬT", date: "11/01", sessions: [] },
];

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

type AttendanceRow = { id: number; name: string; attended: boolean | null };

const attendanceRows: AttendanceRow[] = [
  { id: 1, name: "Nguyễn Văn A", attended: null },
  { id: 2, name: "Trần Thị B", attended: null },
  { id: 3, name: "Lê Văn C", attended: null },
  { id: 4, name: "Phạm Thị D", attended: null },
  { id: 5, name: "Hoàng Văn E", attended: null },
];

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
              <p className="font-semibold text-gray-900">{student.id}</p>
              <p className="text-xs text-gray-500 mt-2">Môn học</p>
              <p className="text-sm text-gray-800">
                {studentDetailMock.subject}
              </p>
              <p className="text-xs text-gray-500 mt-2">Trạng thái</p>
              <p className="text-sm text-green-700">{student.status}</p>
            </Card>
            <Card className="p-4 bg-purple-50 border-purple-100">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{studentDetailMock.email}</p>
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

function AttendanceModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<AttendanceRow[]>(attendanceRows);
  const attended = rows.filter((r) => r.attended === true).length;
  const absent = rows.filter((r) => r.attended === false).length;

  const update = (id: number, value: boolean | null) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, attended: value } : r)));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-3">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Điểm danh</h2>
            <p className="text-sm text-gray-600">
              Toán Lớp 11B - THỨ TƯ (8:30-11:45)
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

        <div className="space-y-3 mb-4">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
            >
              <div className="space-y-1">
                <p className="font-medium text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-500">
                  Mã học sinh: HS{r.id.toString().padStart(3, "0")}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <Button
                  variant={r.attended === true ? "solid" : "outline"}
                  className={
                    r.attended === true ? "bg-green-600 hover:bg-green-700" : ""
                  }
                  onClick={() => update(r.id, true)}
                >
                  ✓ Có mặt
                </Button>
                <Button
                  variant={r.attended === false ? "solid" : "outline"}
                  className={
                    r.attended === false ? "bg-red-500 hover:bg-red-600" : ""
                  }
                  onClick={() => update(r.id, false)}
                >
                  ✕ Vắng
                </Button>
                <Button variant="outline" onClick={() => update(r.id, null)}>
                  Chưa xác định
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Ghi chú buổi học
          </p>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={3}
            placeholder="Ghi chú về buổi học, nội dung dạy, bài tập giao, v.v..."
          />
        </div>

        <div className="flex gap-3">
          <Button className="flex-1 bg-green-600 hover:bg-green-700">
            Lưu điểm danh
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Hủy
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

export default function TeacherDashboard({
  user,
  onLogout,
}: TeacherDashboardProps) {
  const [chatWith, setChatWith] = useState<{
    name: string;
    role: string;
  } | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassKey>("toan10a");
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(
    null
  );
  const [showAttendance, setShowAttendance] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [rankingView, setRankingView] = useState<RankingCategory>("score");

  const statusStyle = (status: DaySession["status"]) => {
    if (status === "confirmed")
      return {
        label: "Đã xác nhận",
        className: "bg-emerald-500 hover:bg-emerald-600 text-white",
      };
    return {
      label: "Chưa xác nhận",
      className: "bg-amber-400 hover:bg-amber-500 text-white",
    };
  };

  const students = useMemo(() => classStudents[selectedClass], [selectedClass]);
  const classLabel = classTabs[selectedClass];

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
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <NotificationCenter userRole={user.role} />
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
              value="students"
              className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              👨‍🎓 Học sinh
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
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-4">
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
                        <p className="text-3xl font-bold mt-2">{item.value}</p>
                        <p className="text-white/70 text-xs mt-1">
                          {item.note}
                        </p>
                      </div>
                      <span className="text-4xl opacity-80">{item.icon}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4">
              <p className="font-semibold text-gray-900 mb-3">
                Thống kê số học sinh
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
          </TabsContent>

          <TabsContent value="students" className="mt-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(classTabs).map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedClass === key ? "solid" : "outline"}
                  className={
                    selectedClass === key ? "bg-blue-600 hover:bg-blue-700" : ""
                  }
                  onClick={() => setSelectedClass(key as ClassKey)}
                >
                  {label}
                </Button>
              ))}
            </div>

            <Card className="p-4 space-y-3">
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                <p className="font-semibold text-gray-900">{classLabel}</p>
                <p className="text-xs text-gray-600">
                  Môn: {classInfo[selectedClass].subject} | Số học sinh:{" "}
                  {classInfo[selectedClass].size}
                </p>
              </div>

              <Card className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">Bảng xếp hạng</p>
                    <p className="text-xs text-gray-500">
                      Xem top điểm, chăm chỉ, chuyên cần
                    </p>
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {Object.entries(leaderboardOptions).map(([key, opt]) => (
                      <Button
                        key={key}
                        size="sm"
                        variant={rankingView === key ? "solid" : "outline"}
                        className={
                          rankingView === key
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "whitespace-nowrap"
                        }
                        onClick={() => setRankingView(key as RankingCategory)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {leaderboardData[rankingView].map((row, index) => (
                    <div
                      key={`${rankingView}-${row.name}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-full bg-blue-50 text-sm font-bold text-blue-700 flex items-center justify-center">
                          {index + 1}
                        </span>
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
                        <p className="text-sm font-semibold text-gray-900">
                          {row.value}
                        </p>
                        <p className="text-xs text-emerald-600 leading-tight">
                          {row.trend}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">
                        Mã học sinh: {s.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {s.score} điểm
                        </p>
                        <p className="text-xs text-gray-500">{s.status}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedStudent(s)}
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card className="p-5 space-y-4">
              <p className="font-semibold text-gray-900 text-lg">
                Lịch dạy tuần này
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {scheduleWeek.map((day) => (
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

                    {day.sessions.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-sm text-gray-300 py-8">
                        -
                      </div>
                    ) : (
                      <div className="flex-1 p-3 space-y-3">
                        {day.sessions.map((s) => {
                          const style = statusStyle(s.status);

                          return (
                            <div
                              key={s.code + s.time}
                              className="rounded-lg border border-gray-200 bg-white p-3 space-y-2 text-center shadow-sm"
                            >
                              <div className="text-sm font-semibold text-blue-700">
                                {s.code}
                              </div>
                              <div className="text-xs text-gray-600">
                                tại {s.center}
                              </div>
                              <div className="text-xs text-gray-600">
                                {s.room}
                              </div>
                              <div className="text-xs text-gray-800 font-medium">
                                {s.time}
                              </div>
                              <div className="space-y-2 pt-1">
                                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg">
                                  Xem tài liệu
                                </Button>
                                <Button
                                  className={`w-full text-sm rounded-lg ${style.className}`}
                                  variant="solid"
                                >
                                  {style.label}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="w-full text-xs"
                                  onClick={() => setShowAttendance(true)}
                                >
                                  Điểm danh
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                          className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                            doc.type === "PDF"
                              ? "bg-red-100"
                              : doc.type === "DOCX"
                              ? "bg-blue-100"
                              : doc.type === "PPTX"
                              ? "bg-orange-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <FileIcon
                            className={`h-6 w-6 ${
                              doc.type === "PDF"
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
              {Object.values(classStudents)
                .flat()
                .map((s) => (
                  <div
                    key={s.id}
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
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
      {showAttendance && (
        <AttendanceModal onClose={() => setShowAttendance(false)} />
      )}
      {showEvaluation && (
        <TeacherEvaluationModal onClose={() => setShowEvaluation(false)} />
      )}
    </div>
  );
}
