"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  usePaymentRequestsStore,
  StudentPaymentRequest,
} from "@/lib/stores/payment-requests-store";
import { usePaymentsStore } from "@/lib/stores/payments-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  Banknote,
  CheckCircle,
  Clock,
  AlertCircle,
  Gift,
  User,
  Laptop,
} from "lucide-react";
import { notify } from "@/lib/notify";

export default function PaymentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const {
    myRequests,
    childrenRequests,
    fetchMyRequests,
    fetchChildrenRequests,
    isLoading: requestsLoading,
  } = usePaymentRequestsStore();

  const {
    payments,
    fetchMyPayments,
    createPayment,
    isLoading: paymentLoading
  } = usePaymentsStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [error, setError] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const isLoading = authLoading || requestsLoading || paymentLoading;

  useEffect(() => {
    // Đợi zustand hydrate từ localStorage
    const timer = setTimeout(() => {
      if (!user) {
        router.push("/");
        return;
      }

      if (user.role === "student") {
        fetchMyRequests();
        fetchMyPayments();
      } else if (user.role === "parent") {
        fetchChildrenRequests();
        fetchMyPayments();
      } else {
        router.push("/");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, router, fetchMyRequests, fetchChildrenRequests, fetchMyPayments]);

  // Lấy requests dựa trên role
  const getAllRequests = (): StudentPaymentRequest[] => {
    if (user?.role === "student") {
      return myRequests;
    } else if (user?.role === "parent") {
      // Parent: lấy requests của con đầu tiên hoặc con đã chọn
      if (childrenRequests.length === 0) return [];

      if (selectedChildId) {
        const child = childrenRequests.find(
          (c) => c.studentId === selectedChildId
        );
        return child?.requests || [];
      }

      // Mặc định chọn con đầu tiên
      return childrenRequests[0]?.requests || [];
    }
    return [];
  };

  const allRequests = getAllRequests();

  // Filter pending requests
  const pendingRequests = allRequests.filter(
    (r) => r.status === "pending" || r.status === "overdue"
  );

  // Calculate totals
  const selectedRequests = pendingRequests.filter((r) =>
    selectedIds.includes(r._id)
  );
  const totalBase = selectedRequests.reduce((sum, r) => sum + r.baseAmount, 0);
  const totalDiscount = selectedRequests.reduce(
    (sum, r) => sum + r.discountAmount,
    0
  );
  const totalFinal = selectedRequests.reduce((sum, r) => sum + r.finalAmount, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(pendingRequests.map((r) => r._id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handlePayment = async (method: "PAYOS" | "CASH" | "FAKE") => {
    if (selectedIds.length === 0) {
      const msg = "Vui lòng chọn ít nhất 1 yêu cầu";
      setError(msg);
      notify.warning(msg);
      return;
    }

    try {
      setError(null);

      // Nếu là parent, cần truyền studentId
      const studentId =
        user?.role === "parent"
          ? selectedChildId || childrenRequests[0]?.studentId
          : undefined;

      const result = await createPayment({
        requestIds: selectedIds,
        method,
        studentId,
      });

      if (method === "PAYOS" && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else if (method === "FAKE" && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        notify.success(
          result.message ||
          "Đã tạo yêu cầu thanh toán. Vui lòng đến quầy thu ngân."
        );
        // Refresh
        if (user?.role === "student") {
          fetchMyRequests();
        } else {
          fetchChildrenRequests();
        }
        fetchMyPayments();
        setStep("select");
        setSelectedIds([]);
      }
    } catch (err: any) {
      setError(err.message);
      notify.error(err.message);
    }
  };

  const getStatusBadge = (status: string, dueDate?: string) => {
    const isOverdue =
      dueDate && new Date(dueDate) < new Date() && status === "pending";

    if (status === "paid") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          <CheckCircle className="w-3 h-3" /> Đã thanh toán
        </span>
      );
    }
    if (isOverdue || status === "overdue") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          <AlertCircle className="w-3 h-3" /> Quá hạn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
        <Clock className="w-3 h-3" /> Chờ thanh toán
      </span>
    );
  };

  const fmtMoney = (amount: number) => amount.toLocaleString("vi-VN") + " đ";

  // Hiển thị loading khi đang kiểm tra auth hoặc chưa có user
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </Card>
      </div>
    );
  }

  // Tên hiển thị cho loại role
  const pageTitle =
    user.role === "parent"
      ? "💳 Thanh toán học phí cho con"
      : "💳 Thanh toán học phí";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Parent: Child Selector */}
        {user.role === "parent" && childrenRequests.length > 1 && (
          <Card className="p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Chọn con để xem yêu cầu thanh toán:
            </p>
            <div className="flex flex-wrap gap-2">
              {childrenRequests.map((child) => (
                <button
                  key={child.studentId}
                  onClick={() => {
                    setSelectedChildId(child.studentId);
                    setSelectedIds([]);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${(selectedChildId || childrenRequests[0]?.studentId) ===
                    child.studentId
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <User className="w-4 h-4" />
                  {child.studentName}
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    {child.requests.filter((r) => r.status === "pending").length}{" "}
                    chờ
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Cần thanh toán ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Lịch sử giao dịch
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PENDING PAYMENTS */}
          <TabsContent value="pending" className="space-y-6">
            {step === "select" && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Card className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                    <p className="text-sm opacity-90">Chờ thanh toán</p>
                    <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <p className="text-sm opacity-90">Đã chọn</p>
                    <p className="text-2xl font-bold">{selectedIds.length}</p>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white col-span-2 sm:col-span-1">
                    <p className="text-sm opacity-90">Tổng thanh toán</p>
                    <p className="text-2xl font-bold">
                      {totalFinal.toLocaleString("vi-VN")} đ
                    </p>
                  </Card>
                </div>

                {/* Requests List */}
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-800">
                      📋 Yêu cầu đóng tiền
                    </h2>
                    {pendingRequests.length > 0 && (
                      <div className="flex gap-2 text-sm">
                        <button
                          onClick={selectAll}
                          className="text-blue-600 hover:underline"
                        >
                          Chọn tất cả
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={deselectAll}
                          className="text-gray-500 hover:underline"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    )}
                  </div>

                  {requestsLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
                    </div>
                  ) : pendingRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p className="text-lg font-medium">
                        Không có yêu cầu đóng tiền
                      </p>
                      <p className="text-sm mt-1">
                        {user.role === "parent"
                          ? "Con bạn đã thanh toán tất cả hoặc chưa có yêu cầu mới."
                          : "Bạn đã thanh toán tất cả hoặc chưa có yêu cầu mới."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.map((req) => (
                        <label
                          key={req._id}
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedIds.includes(req._id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(req._id)}
                            onChange={() => toggleSelect(req._id)}
                            className="w-5 h-5 mt-1 text-blue-600 rounded"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium text-gray-900">
                                {req.title}
                              </p>
                              {getStatusBadge(req.status, req.dueDate)}
                            </div>

                            <p className="text-sm text-gray-500 mb-2">
                              {req.className}
                              {req.classSubject && ` • ${req.classSubject}`}
                              {user.role === "parent" && (
                                <span className="text-blue-600 ml-2">
                                  (HS: {req.studentName})
                                </span>
                              )}
                            </p>

                            {req.dueDate && (
                              <p className="text-xs text-gray-400 mb-2">
                                Hạn:{" "}
                                {new Date(req.dueDate).toLocaleDateString("vi-VN")}
                              </p>
                            )}

                            {/* Pricing */}
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Học phí:</span>
                                <span>{fmtMoney(req.baseAmount)}</span>
                              </div>
                              {req.scholarshipPercent > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span className="flex items-center gap-1">
                                    <Gift className="w-3 h-3" />
                                    Học bổng ({req.scholarshipPercent}%):
                                  </span>
                                  <span>-{fmtMoney(req.discountAmount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold pt-1 border-t">
                                <span>Thành tiền:</span>
                                <span className="text-blue-600">
                                  {fmtMoney(req.finalAmount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Payment Summary & Actions */}
                {selectedIds.length > 0 && (
                  <Card className="p-5 sticky bottom-4 shadow-lg border-2 border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-gray-600">
                          Đã chọn: <strong>{selectedIds.length}</strong> yêu cầu
                        </p>
                        {totalDiscount > 0 && (
                          <p className="text-sm text-green-600">
                            Học bổng: -{totalDiscount.toLocaleString("vi-VN")} đ
                          </p>
                        )}
                        <p className="text-xl font-bold text-blue-600">
                          Tổng: {fmtMoney(totalFinal)}
                        </p>
                      </div>

                      <Button
                        onClick={() => setStep("confirm")}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        Tiếp tục thanh toán
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Step: Confirm & Pay */}
            {step === "confirm" && (
              <Card className="p-6">
                {/* Summary */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Xác nhận thanh toán
                  </h2>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-4">
                    {selectedRequests.map((req) => (
                      <div key={req._id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {req.title} ({req.className})
                        </span>
                        <span>{fmtMoney(req.finalAmount)}</span>
                      </div>
                    ))}

                    <hr />

                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Tổng tiền:</span>
                      <span className="text-blue-600">
                        {fmtMoney(totalFinal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <h3 className="font-semibold text-gray-800 mb-3">
                  Chọn phương thức thanh toán
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => handlePayment("PAYOS")}
                    disabled={isLoading}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all"
                  >
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">PayOS</p>
                      <p className="text-sm text-gray-500">QR Code / Mobile Banking</p>
                    </div>
                  </button>

                  {/* FAKE PAYOS */}
                  <button
                    onClick={() => handlePayment("FAKE")}
                    disabled={isLoading}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Laptop className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        Thanh toán Online (Demo)
                      </p>
                      <p className="text-sm text-gray-500">
                        Mô phỏng PayOS / Credit Card
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handlePayment("CASH")}
                    disabled={isLoading}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Banknote className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Tiền mặt</p>
                      <p className="text-sm text-gray-500">Đến quầy thu ngân</p>
                    </div>
                  </button>
                </div>

                {/* Back */}
                <Button
                  variant="outline"
                  onClick={() => setStep("select")}
                  className="w-full"
                >
                  Quay lại chọn yêu cầu
                </Button>

                {isLoading && (
                  <div className="text-center py-4">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
                    <p className="mt-2 text-gray-500">Đang xử lý...</p>
                  </div>
                )}
              </Card>
            )}
          </TabsContent>

          {/* TAB 2: HISTORY */}
          <TabsContent value="history">
            <Card className="p-5">
              <h2 className="font-semibold text-gray-800 mb-4">
                📜 Lịch sử giao dịch
              </h2>

              {payments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Chưa có giao dịch nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div
                      key={payment._id}
                      className="border rounded-xl p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">
                              {payment.amount.toLocaleString('vi-VN')} đ
                            </p>
                            <Badge variant={
                              payment.status === 'success' ? 'default' :
                                payment.status === 'pending' ? 'outline' : 'destructive'
                            } className={
                              payment.status === 'success' ? 'bg-green-600 hover:bg-green-600' :
                                payment.status === 'pending' ? 'text-yellow-600 border-yellow-600' : ''
                            }>
                              {payment.status === 'success' ? 'Thành công' :
                                payment.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Mã GD: {payment._id.substring(payment._id.length - 8).toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {payment.method === 'PAYOS'
                              ? 'PayOS'
                              : payment.method === 'FAKE'
                                ? 'Fake Demo'
                                : 'Tiền mặt'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400">
                        Thanh toán cho {payment.requestIds.length} khoản thu
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div >
  );
}
