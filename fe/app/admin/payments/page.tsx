"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePaymentRequestsStore } from "@/lib/stores/payment-requests-store";
import { usePaymentsStore } from "@/lib/stores/payments-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Eye,
  Trash2,
  FileText,
} from "lucide-react";
import api from "@/lib/api";
import { notify } from "@/lib/notify";

interface ClassInfo {
  _id: string;
  name: string;
  subject?: string;
  fee: number;
  studentIds: string[];
}

export default function AdminPaymentRequestsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const {
    classRequests,
    fetchClassRequests,
    createClassPaymentRequest,
    cancelClassRequest,
    getClassRequestStudents,
    isLoading: requestsLoading,
  } = usePaymentRequestsStore();
  const {
    pendingCashPayments,
    allPayments,
    fetchPendingCashPayments,
    fetchAllPayments,
    confirmCashPayment,
  } = usePaymentsStore();

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [viewingRequest, setViewingRequest] = useState<string | null>(null);
  const [studentsData, setStudentsData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "cash" | "history">("requests");

  useEffect(() => {
    // Đợi zustand hydrate từ localStorage
    const timer = setTimeout(() => {
      if (!user) {
        router.push("/");
        return;
      }

      if (user.role !== "admin") {
        router.push("/");
        return;
      }

      fetchClassRequests();
      fetchPendingCashPayments();
      fetchClasses();
      fetchAllPayments();
    }, 100);

    return () => clearTimeout(timer);
  }, [user, router]);

  const fetchClasses = async () => {
    try {
      const response = await api.get("/classes");
      setClasses(response.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedClassId || !title) {
      const msg = "Vui lòng chọn lớp và nhập tiêu đề";
      setError(msg);
      notify.warning(msg);
      return;
    }

    try {
      setError(null);
      const result = await createClassPaymentRequest({
        classId: selectedClassId,
        title,
        description: description || undefined,
        amount: amount ? Number(amount) : undefined,
        dueDate: dueDate || undefined,
      });

      notify.success(
        `Đã tạo yêu cầu đóng tiền cho ${result.studentCount} học sinh!`
      );
      setShowCreateForm(false);
      resetForm();
      fetchClassRequests();
    } catch (err: any) {
      setError(err.message);
      notify.error(err.message);
    }
  };

  const resetForm = () => {
    setSelectedClassId("");
    setTitle("");
    setDescription("");
    setAmount("");
    setDueDate("");
  };

  const handleViewStudents = async (requestId: string) => {
    try {
      const data = await getClassRequestStudents(requestId);
      setStudentsData(data);
      setViewingRequest(requestId);
    } catch (err: any) {
      notify.error(err.message);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!confirm("Bạn có chắc muốn hủy yêu cầu này?\nCác học sinh chưa thanh toán sẽ bị hủy yêu cầu.")) {
      return;
    }

    try {
      await cancelClassRequest(id);
      notify.success("Đã hủy yêu cầu thành công");
      fetchClassRequests();
    } catch (err: any) {
      notify.error(err.message);
    }
  };

  const handleConfirmCash = async (paymentId: string) => {
    if (!confirm("Xác nhận đã thu tiền?")) return;

    try {
      await confirmCashPayment(paymentId);
      notify.success("Đã xác nhận thành công!");
      fetchPendingCashPayments();
    } catch (err: any) {
      notify.error(err.message);
    }
  };

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  // Hiển thị loading khi đang kiểm tra auth hoặc chưa có user
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại
            </Button>
            <h1 className="text-xl font-bold text-gray-900">
              💳 Quản lý yêu cầu đóng tiền
            </h1>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo yêu cầu mới
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${activeTab === "requests"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
              }`}
            onClick={() => setActiveTab("requests")}
          >
            📋 Yêu cầu đóng tiền
          </button>
          <button
            className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === "cash"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
              }`}
            onClick={() => setActiveTab("cash")}
          >
            💵 Chờ xác nhận
            {pendingCashPayments.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingCashPayments.length}
              </span>
            )}
          </button>
          <button
            className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === "history"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
              }`}
            onClick={() => setActiveTab("history")}
          >
            📜 Lịch sử giao dịch
          </button>
        </div>

        {/* Tab: Requests */}
        {activeTab === "requests" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <p className="text-sm opacity-90">Tổng yêu cầu</p>
                <p className="text-2xl font-bold">{classRequests.length}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <p className="text-sm opacity-90">Đã thu</p>
                <p className="text-2xl font-bold">
                  {classRequests
                    .reduce((sum, r) => sum + r.totalCollected, 0)
                    .toLocaleString("vi-VN")}{" "}
                  đ
                </p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                <p className="text-sm opacity-90">Chờ thanh toán</p>
                <p className="text-2xl font-bold">
                  {classRequests.reduce(
                    (sum, r) => sum + r.totalStudents - r.paidCount,
                    0
                  )}
                </p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                <p className="text-sm opacity-90">Lớp học</p>
                <p className="text-2xl font-bold">{classes.length}</p>
              </Card>
            </div>

            {/* Requests List */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">
                  Danh sách yêu cầu đóng tiền
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchClassRequests()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Làm mới
                </Button>
              </div>

              {requestsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
                </div>
              ) : classRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Chưa có yêu cầu đóng tiền nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {classRequests.map((req) => (
                    <div
                      key={req._id}
                      className="p-4 border rounded-xl bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {req.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {req.className}
                            {req.classSubject && ` • ${req.classSubject}`}
                          </p>
                          {req.dueDate && (
                            <p className="text-xs text-gray-400 mt-1">
                              Hạn:{" "}
                              {new Date(req.dueDate).toLocaleDateString("vi-VN")}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {req.amount.toLocaleString("vi-VN")} đ
                          </p>

                          {/* Progress */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{
                                  width: `${req.totalStudents > 0
                                    ? (req.paidCount / req.totalStudents) *
                                    100
                                    : 0
                                    }%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-500">
                              {req.paidCount}/{req.totalStudents}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewStudents(req._id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Chi tiết
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleCancelRequest(req._id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {/* Tab: Cash Pending */}
        {activeTab === "cash" && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">
                Thanh toán tiền mặt chờ xác nhận
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPendingCashPayments()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm mới
              </Button>
            </div>

            {pendingCashPayments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>Không có thanh toán chờ xác nhận</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCashPayments.map((payment: any) => (
                  <div
                    key={payment._id}
                    className="flex items-center justify-between p-4 border rounded-xl"
                  >
                    <div>
                      <p className="font-medium">
                        {payment.studentId?.name || "Học sinh"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {payment.studentId?.studentCode}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(payment.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold">
                        {payment.amount.toLocaleString("vi-VN")} đ
                      </p>
                      <Button
                        onClick={() => handleConfirmCash(payment._id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Xác nhận
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Tab: History */}
        {activeTab === "history" && (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase">
                  <tr>
                    <th className="px-4 py-3">Mã GD</th>
                    <th className="px-4 py-3">Học sinh</th>
                    <th className="px-4 py-3">Cơ sở</th>
                    <th className="px-4 py-3">Môn học</th>
                    <th className="px-4 py-3">Học phí</th>
                    <th className="px-4 py-3">Phương thức</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allPayments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{p._id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{(p.studentId as any)?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{(p.studentId as any)?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.branchName || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{p.subjectName || '—'}</td>
                      <td className="px-4 py-3 font-bold">{p.amount.toLocaleString('vi-VN')} đ</td>
                      <td className="px-4 py-3">
                        {p.method === 'vnpay_test' ? 'VNPay' :
                          p.method === 'cash' ? 'Tiền mặt' : p.method}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'success' ? (
                          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800'>
                            Thành công
                          </span>
                        ) : p.status === 'pending' ? (
                          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800'>
                            Đang xử lý
                          </span>
                        ) : (
                          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800'>
                            {p.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(p.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                  {allPayments.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chưa có giao dịch nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              ➕ Tạo yêu cầu đóng tiền
            </h2>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Class Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn lớp <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    const cls = classes.find((c) => c._id === e.target.value);
                    if (cls && cls.fee > 0 && !amount) {
                      setAmount(cls.fee);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} ({cls.studentIds?.length || 0} học sinh)
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Học phí tháng 1/2026"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="VD: Thanh toán trước ngày 15"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền (VNĐ)
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder={
                    selectedClass?.fee
                      ? `Mặc định: ${selectedClass.fee.toLocaleString("vi-VN")}`
                      : "Nhập số tiền"
                  }
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hạn thanh toán
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              {/* Preview */}
              {selectedClass && (
                <div className="bg-blue-50 rounded-lg p-4 text-sm">
                  <p className="font-medium text-blue-900 mb-2">Preview:</p>
                  <p>• Lớp: {selectedClass.name}</p>
                  <p>
                    • Sẽ tạo{" "}
                    <strong>{selectedClass.studentIds?.length || 0}</strong> yêu
                    cầu cho {selectedClass.studentIds?.length || 0} học sinh
                  </p>
                  <p>• Học bổng sẽ được tự động áp dụng</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateRequest}
                disabled={requestsLoading}
              >
                {requestsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo yêu cầu"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* View Students Modal */}
      {viewingRequest && studentsData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">
              📊 Chi tiết trạng thái đóng tiền
            </h2>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{studentsData.total}</p>
                <p className="text-sm text-gray-500">Tổng</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {studentsData.paid}
                </p>
                <p className="text-sm text-green-600">Đã đóng</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700">
                  {studentsData.pending}
                </p>
                <p className="text-sm text-yellow-600">Chờ đóng</p>
              </div>
            </div>

            {/* Students Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Học sinh</th>
                    <th className="px-4 py-2 text-right">Số tiền</th>
                    <th className="px-4 py-2 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsData.students.map((s: any) => (
                    <tr key={s._id} className="border-t">
                      <td className="px-4 py-2">
                        <p className="font-medium">{s.studentName}</p>
                        <p className="text-xs text-gray-500">{s.studentCode}</p>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {s.finalAmount.toLocaleString("vi-VN")} đ
                        {s.scholarshipPercent > 0 && (
                          <span className="text-xs text-green-600 block">
                            -{s.scholarshipPercent}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {s.status === "paid" ? (
                          <span className="text-green-600">✓ Đã đóng</span>
                        ) : (
                          <span className="text-yellow-600">⏳ Chờ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              className="w-full mt-4"
              onClick={() => {
                setViewingRequest(null);
                setStudentsData(null);
              }}
            >
              Đóng
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
