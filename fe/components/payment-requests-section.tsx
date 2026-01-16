"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  usePaymentRequestsStore,
  StudentPaymentRequest,
} from "@/lib/stores/payment-requests-store";
import { Clock, AlertCircle, ArrowRight, Gift, Loader2 } from "lucide-react";

interface PaymentRequestsSectionProps {
  role: "student" | "parent";
}

export default function PaymentRequestsSection({
  role,
}: PaymentRequestsSectionProps) {
  const router = useRouter();
  const {
    myRequests,
    childrenRequests,
    fetchMyRequests,
    fetchChildrenRequests,
    isLoading,
  } = usePaymentRequestsStore();

  useEffect(() => {
    if (role === "student") {
      fetchMyRequests();
    } else {
      fetchChildrenRequests();
    }
  }, [role, fetchMyRequests, fetchChildrenRequests]);

  // Get requests based on role
  let requests: StudentPaymentRequest[] = [];
  if (role === "student") {
    requests = myRequests.filter(
      (r) => r.status === "pending" || r.status === "overdue"
    );
  } else {
    requests = childrenRequests.flatMap((c) =>
      c.requests.filter(
        (r) => r.status === "pending" || r.status === "overdue"
      )
    );
  }

  const totalAmount = requests.reduce((sum, r) => sum + r.finalAmount, 0);

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">💳</span>
          <h2 className="text-lg font-bold text-gray-900">Yêu cầu đóng tiền</h2>
        </div>
        <div className="text-center py-6">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null; // Không hiển thị nếu không có yêu cầu
  }

  return (
    <Card className="p-5 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💳</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Yêu cầu đóng tiền
            </h2>
            <p className="text-sm text-gray-500">
              {requests.length} yêu cầu chưa thanh toán
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Tổng cộng</p>
          <p className="text-xl font-bold text-orange-600">
            {totalAmount.toLocaleString("vi-VN")} đ
          </p>
        </div>
      </div>

      {/* Requests List (max 3) */}
      <div className="space-y-3 mb-4">
        {requests.slice(0, 3).map((req) => {
          const isOverdue =
            req.dueDate &&
            new Date(req.dueDate) < new Date() &&
            req.status === "pending";

          return (
            <div
              key={req._id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border"
            >
              <div className="flex items-center gap-3">
                {isOverdue ? (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {req.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {req.className}
                    {req.dueDate && (
                      <>
                        {" "}
                        • Hạn:{" "}
                        {new Date(req.dueDate).toLocaleDateString("vi-VN")}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {req.finalAmount.toLocaleString("vi-VN")} đ
                </p>
                {req.scholarshipPercent > 0 && (
                  <p className="text-xs text-green-600 flex items-center gap-1 justify-end">
                    <Gift className="w-3 h-3" />
                    -{req.scholarshipPercent}%
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {requests.length > 3 && (
          <p className="text-sm text-gray-500 text-center">
            +{requests.length - 3} yêu cầu khác
          </p>
        )}
      </div>

      {/* CTA */}
      <Button
        onClick={() => router.push("/payment")}
        className="w-full bg-orange-500 hover:bg-orange-600"
      >
        Thanh toán ngay
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </Card>
  );
}
