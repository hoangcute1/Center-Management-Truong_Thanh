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

const overviewStats = [
  {
    label: "Học sinh",
    value: 248,
    trend: "+12% so với tháng trước",
    positive: true,
  },
  { label: "Giáo viên", value: 18, trend: "Hoạt động", positive: true },
  {
    label: "Doanh thu tháng",
    value: "75 Tr",
    trend: "+29% so với tháng trước",
    positive: true,
  },
  { label: "Khóa học", value: 12, trend: "Đang mở", positive: true },
];

const revenueByMonth = [
  { month: "Tháng 1", revenue: 52 },
  { month: "Tháng 2", revenue: 60 },
  { month: "Tháng 3", revenue: 58 },
  { month: "Tháng 4", revenue: 72 },
];

const financeSummary = [
  {
    label: "Tổng doanh thu",
    value: "720 Tr",
    trend: "+8% so với quý trước",
    color: "text-green-600",
  },
  {
    label: "Chi phí",
    value: "185 Tr",
    trend: "+5% so với quý trước",
    color: "text-red-500",
  },
  {
    label: "Lợi nhuận ròng",
    value: "535 Tr",
    trend: "+10% so với quý trước",
    color: "text-green-600",
  },
];

const financeChart = [
  { month: "Tháng 1", revenue: 50, cost: 20 },
  { month: "Tháng 2", revenue: 62, cost: 22 },
  { month: "Tháng 3", revenue: 58, cost: 20 },
  { month: "Tháng 4", revenue: 75, cost: 25 },
];

const courseList = [
  {
    name: "Toán Cơ Bản",
    teacher: "Cô B",
    students: 20,
    revenue: "5.000.000 VND",
  },
  {
    name: "Toán Nâng Cao",
    teacher: "Thầy E",
    students: 15,
    revenue: "3.750.000 VND",
  },
  {
    name: "Anh Văn",
    teacher: "Thầy F",
    students: 18,
    revenue: "4.500.000 VND",
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
    },
    {
      name: "Trần Thị B",
      email: "tranthib@email.com",
      phone: "+84 987 654 321",
      code: "HS002",
      date: "2025-01-16",
    },
  ],
  parents: [
    {
      name: "Nguyễn Văn Anh",
      email: "nguyenvanh@email.com",
      phone: "+84 111 222 333",
      children: "2 con",
      date: "2025-01-10",
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
    },
    {
      name: "Thầy Trần Văn D",
      email: "thaytrand@email.com",
      phone: "+84 777 888 999",
      subject: "Anh Văn",
      experience: "8 năm kinh nghiệm",
      date: "2025-01-05",
    },
  ],
};

const pieData = [
  { name: "Toán", value: 40 },
  { name: "Anh Văn", value: 35 },
  { name: "Khác", value: 25 },
];

const pieColors = ["#2563eb", "#f97316", "#10b981"];

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-3">
      <Card className="w-full max-w-md p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3 mb-4">
          {fields.map((f) => (
            <Input key={f} placeholder={f} />
          ))}
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700">Thêm</Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Trường Thành Education
            </h1>
            <p className="text-sm text-gray-500">Dashboard Quản trị</p>
          </div>
          <div className="flex items-center gap-2">
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

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 rounded-xl bg-gray-100 p-2">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="courses">Khóa học</TabsTrigger>
            <TabsTrigger value="accounts">Tài khoản</TabsTrigger>
            <TabsTrigger value="report">Báo cáo</TabsTrigger>
            <TabsTrigger value="finance">Tài chính</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-4 items-stretch">
              {overviewStats.map((stat) => (
                <Card
                  key={stat.label}
                  className="p-4 space-y-2 h-full shadow-sm"
                >
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p
                    className={`text-xs ${
                      stat.positive ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    {stat.trend}
                  </p>
                </Card>
              ))}
            </div>
            <Card className="p-5 mt-4 shadow-sm">
              <p className="font-semibold text-gray-900 mb-3">
                Doanh thu theo tháng
              </p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueByMonth}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#4b5563" }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#4b5563" }} />
                    <Tooltip />
                    <Bar
                      dataKey="revenue"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card className="p-5 mt-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">
                  Danh sách khóa học
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Thêm khóa học
                </Button>
              </div>
              <div className="space-y-3">
                {courseList.map((course) => (
                  <div
                    key={course.name}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 bg-white"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {course.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Giáo viên: {course.teacher}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Học sinh</p>
                        <p className="font-semibold text-gray-900">
                          {course.students}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Doanh thu</p>
                        <p className="font-semibold text-blue-700">
                          {course.revenue}
                        </p>
                      </div>
                      <Button variant="outline">Sửa</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <Card className="p-5 mt-4 space-y-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={
                    activeAccountTab === "students" ? "solid" : "outline"
                  }
                  onClick={() => setActiveAccountTab("students")}
                >
                  Học sinh ({accounts.students.length})
                </Button>
                <Button
                  variant={activeAccountTab === "parents" ? "solid" : "outline"}
                  onClick={() => setActiveAccountTab("parents")}
                >
                  Phụ huynh ({accounts.parents.length})
                </Button>
                <Button
                  variant={
                    activeAccountTab === "teachers" ? "solid" : "outline"
                  }
                  onClick={() => setActiveAccountTab("teachers")}
                >
                  Giáo viên ({accounts.teachers.length})
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 ml-auto"
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
                  + Thêm
                </Button>
              </div>

              <div className="space-y-3">
                {activeAccountTab === "students" &&
                  accounts.students.map((s) => (
                    <div
                      key={s.code}
                      className="rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                        <p className="text-xs text-gray-500">{s.phone}</p>
                        <p className="text-xs text-gray-500">Mã HS: {s.code}</p>
                      </div>
                      <p className="text-xs text-gray-500">{s.date}</p>
                    </div>
                  ))}

                {activeAccountTab === "parents" &&
                  accounts.parents.map((p) => (
                    <div
                      key={p.email}
                      className="rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.email}</p>
                        <p className="text-xs text-gray-500">{p.phone}</p>
                        <p className="text-xs text-gray-500">{p.children}</p>
                      </div>
                      <p className="text-xs text-gray-500">{p.date}</p>
                    </div>
                  ))}

                {activeAccountTab === "teachers" &&
                  accounts.teachers.map((t) => (
                    <div
                      key={t.email}
                      className="rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.email}</p>
                        <p className="text-xs text-gray-500">{t.phone}</p>
                        <p className="text-xs text-gray-500">
                          Môn: {t.subject} • {t.experience}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">{t.date}</p>
                    </div>
                  ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="report">
            <Card className="p-5 mt-4 shadow-sm">
              <p className="font-semibold text-gray-900 mb-3">
                Báo cáo doanh thu
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                  <span className="text-gray-700">Tổng doanh thu năm:</span>
                  <span className="font-semibold text-blue-700">
                    720 Triệu VND
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                  <span className="text-gray-700">
                    Doanh thu đã thanh toán:
                  </span>
                  <span className="font-semibold text-green-600">
                    680 Triệu VND
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                  <span className="text-gray-700">Chưa thanh toán:</span>
                  <span className="font-semibold text-orange-500">
                    40 Triệu VND
                  </span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="finance">
            <div className="grid gap-4 md:grid-cols-3 mt-4 items-stretch">
              {financeSummary.map((item) => (
                <Card
                  key={item.label}
                  className="p-4 space-y-2 h-full shadow-sm"
                >
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className={`text-3xl font-bold ${item.color}`}>
                    {item.value}
                  </p>
                  <p className={`text-xs ${item.color}`}>{item.trend}</p>
                </Card>
              ))}
            </div>

            <Card className="p-5 mt-4 shadow-sm">
              <p className="font-semibold text-gray-900 mb-3">
                Doanh thu và chi phí theo tháng
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={financeChart}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#4b5563" }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#4b5563" }} />
                    <Tooltip />
                    <Bar
                      dataKey="revenue"
                      fill="#2563eb"
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

            <div className="grid gap-4 md:grid-cols-2 mt-4 items-stretch">
              <Card className="p-4 shadow-sm">
                <p className="font-semibold text-gray-900 mb-3">
                  Doanh thu theo khóa học
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
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

              <Card className="p-4 space-y-2 shadow-sm">
                <p className="font-semibold text-gray-900">Thống kê chi tiết</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    Tổng số học sinh:{" "}
                    <span className="font-semibold text-gray-900">248</span>
                  </p>
                  <p>
                    Tổng số giáo viên:{" "}
                    <span className="font-semibold text-gray-900">18</span>
                  </p>
                  <p>
                    Số khóa học:{" "}
                    <span className="font-semibold text-gray-900">12</span>
                  </p>
                  <p>
                    Doanh thu trung bình/học sinh:{" "}
                    <span className="font-semibold text-gray-900">2.9 Tr</span>
                  </p>
                  <p>
                    Lợi nhuận trung bình/học sinh:{" "}
                    <span className="font-semibold text-gray-900">2.2 Tr</span>
                  </p>
                </div>
              </Card>
            </div>

            <Card className="p-4 mt-4 shadow-sm">
              <p className="font-semibold text-gray-900 mb-3">
                Phân tích doanh thu theo tháng
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr>
                      <th className="py-2 pr-4">Tháng</th>
                      <th className="py-2 pr-4">Doanh thu</th>
                      <th className="py-2 pr-4">Chi phí</th>
                      <th className="py-2 pr-4">Lợi nhuận</th>
                      <th className="py-2 pr-4">Tỷ suất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeChart.map((row) => (
                      <tr key={row.month} className="border-t border-gray-100">
                        <td className="py-2 pr-4">{row.month}</td>
                        <td className="py-2 pr-4">{row.revenue}T</td>
                        <td className="py-2 pr-4">{row.cost}T</td>
                        <td className="py-2 pr-4">{row.revenue - row.cost}T</td>
                        <td className="py-2 pr-4">
                          {Math.round(
                            ((row.revenue - row.cost) / row.revenue) * 1000
                          ) / 10}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-5 mt-4 space-y-3 shadow-sm">
              <p className="font-semibold text-gray-900">Cài đặt hệ thống</p>
              <Input
                placeholder="Tên trung tâm"
                defaultValue="Trường Thành Education"
              />
              <Input
                placeholder="Email hệ thống"
                defaultValue="admin@daythem.pro"
              />
              <Input
                placeholder="Số điện thoại"
                defaultValue="+84 123 456 789"
              />
              <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                Lưu thay đổi
              </Button>
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
