"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Banknote,
  Loader2,
  CheckCircle,
  X,
  Gift,
} from "lucide-react";
import { useOrdersStore, Order } from "@/lib/stores/orders-store";
import { usePaymentsStore } from "@/lib/stores/payments-store";
import { notify } from "@/lib/notify";

interface ClassInfo {
  _id: string;
  name: string;
  subject?: string;
  fee: number;
}

interface StudentInfo {
  hasScholarship: boolean;
  scholarshipPercent: number;
  scholarshipType?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassInfo[];
  student: StudentInfo;
  onSuccess?: (order: Order) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  classes,
  student,
  onSuccess,
}: CheckoutModalProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [step, setStep] = useState<"select" | "payment" | "processing">(
    "select"
  );
  const [paymentMethod, setPaymentMethod] = useState<"vnpay" | "cash" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const { createOrder, isLoading: orderLoading } = useOrdersStore();
  const {
    createPayment,
    isLoading: paymentLoading,
  } = usePaymentsStore();

  const isLoading = orderLoading || paymentLoading;

  // Auto select all classes on open
  useEffect(() => {
    if (isOpen && classes.length > 0) {
      setSelectedClassIds(classes.map((c) => c._id));
      setStep("select");
      setPaymentMethod(null);
      setError(null);
      setCurrentOrder(null);
    }
  }, [isOpen, classes]);

  // Calculate pricing
  const selectedClasses = classes.filter((c) =>
    selectedClassIds.includes(c._id)
  );
  const baseAmount = selectedClasses.reduce((sum, c) => sum + c.fee, 0);
  const scholarshipPercent = student.hasScholarship
    ? student.scholarshipPercent || 0
    : 0;
  const discountAmount = Math.floor((baseAmount * scholarshipPercent) / 100);
  const finalAmount = Math.max(baseAmount - discountAmount, 0);

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const selectAll = () => {
    setSelectedClassIds(classes.map((c) => c._id));
  };

  const deselectAll = () => {
    setSelectedClassIds([]);
  };

  const handleCreateOrder = async () => {
    if (selectedClassIds.length === 0) {
      const msg = "Vui lòng chọn ít nhất 1 lớp học";
      setError(msg);
      notify.warning(msg);
      return;
    }

    try {
      setError(null);
      const order = await createOrder(selectedClassIds);
      setCurrentOrder(order);

      // If free (scholarship 100%), order is auto-paid
      if (order.status === "paid") {
        onSuccess?.(order);
        onClose();
        return;
      }

      setStep("payment");
    } catch (err: any) {
      setError(err.message);
      notify.error(err.message);
    }
  };

  const handlePayment = async () => {
    if (!currentOrder || !paymentMethod) return;

    try {
      setError(null);
      setStep("processing");

      const method = paymentMethod === "vnpay" ? "vnpay_test" : "cash";

      const response = await createPayment({
        requestIds: currentOrder.requestIds || [], // Ensure Order has requestIds
        method,
        studentId: currentOrder.studentId
      });

      if (method === "vnpay_test") {
        // Redirect to VNPay
        if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
        } else {
          throw new Error("Không nhận được link thanh toán VNPay");
        }
      } else {
        notify.success(
          "Đã tạo yêu cầu thanh toán tiền mặt.\nVui lòng đến quầy thu ngân để thanh toán."
        );
        onSuccess?.(currentOrder);
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
      notify.error(err.message);
      setStep("payment");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            💳 Thanh toán học phí
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Select Classes */}
          {step === "select" && (
            <>
              {/* Class Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">
                    Chọn lớp thanh toán
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAll}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {classes.map((cls) => (
                    <label
                      key={cls._id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedClassIds.includes(cls._id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls._id)}
                          onChange={() => toggleClass(cls._id)}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {cls.name}
                          </p>
                          {cls.subject && (
                            <p className="text-sm text-gray-500">
                              {cls.subject}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {cls.fee.toLocaleString("vi-VN")} đ
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Học phí ({selectedClasses.length} lớp):
                  </span>
                  <span className="font-medium">
                    {baseAmount.toLocaleString("vi-VN")} đ
                  </span>
                </div>

                {scholarshipPercent > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      Học bổng ({scholarshipPercent}%):
                    </span>
                    <span className="text-green-600 font-medium">
                      -{discountAmount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                )}

                <hr />

                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                  <span className="font-bold text-blue-600">
                    {finalAmount.toLocaleString("vi-VN")} đ
                  </span>
                </div>

                {finalAmount === 0 && scholarshipPercent === 100 && (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-center">
                    <CheckCircle className="w-5 h-5 inline mr-2" />
                    Miễn phí hoàn toàn (Học bổng 100%)
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleCreateOrder}
                disabled={selectedClassIds.length === 0 || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : finalAmount === 0 ? (
                  "Xác nhận (Miễn phí)"
                ) : (
                  "Tiếp tục thanh toán"
                )}
              </Button>
            </>
          )}

          {/* Step 2: Choose Payment Method */}
          {step === "payment" && currentOrder && (
            <>
              {/* Order Summary */}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">Số tiền thanh toán</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currentOrder.finalAmount.toLocaleString("vi-VN")} đ
                </p>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">
                  Chọn phương thức thanh toán
                </h3>

                {/* VNPay */}
                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "vnpay"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "vnpay"}
                    onChange={() => setPaymentMethod("vnpay")}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      VNPay (Thẻ ATM/Visa/QR)
                    </p>
                    <p className="text-sm text-gray-500">
                      Thanh toán online qua VNPay
                    </p>
                  </div>
                </label>

                {/* Cash */}
                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "cash"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    className="w-5 h-5 text-green-600"
                  />
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Tiền mặt</p>
                    <p className="text-sm text-gray-500">
                      Thanh toán tại quầy thu ngân
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("select")}
                  className="flex-1"
                >
                  Quay lại
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={!paymentMethod || isLoading}
                  className={`flex-1 ${paymentMethod === "vnpay"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                    }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : paymentMethod === "vnpay" ? (
                    "Thanh toán VNPay"
                  ) : (
                    "Xác nhận tiền mặt"
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Processing */}
          {step === "processing" && (
            <div className="py-12 text-center">
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-blue-600 mb-4" />
              <p className="text-lg font-medium text-gray-800">
                Đang chuyển đến trang thanh toán...
              </p>
              <p className="text-gray-500 mt-2">Vui lòng không đóng cửa sổ</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
