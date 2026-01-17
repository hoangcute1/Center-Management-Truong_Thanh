"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const paymentId = searchParams.get("paymentId");
  const message = searchParams.get("message");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {success ? (
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1
          className={`text-2xl font-bold mb-2 ${
            success ? "text-green-600" : "text-red-600"
          }`}
        >
          {success ? "Thanh toán thành công!" : "Thanh toán thất bại"}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {message
            ? decodeURIComponent(message)
            : success
            ? "Giao dịch của bạn đã được xử lý thành công."
            : "Đã có lỗi xảy ra trong quá trình thanh toán."}
        </p>

        {paymentId && (
          <p className="text-sm text-gray-400 mb-6">
            Mã giao dịch: {paymentId}
          </p>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/payment" className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Quay lại trang thanh toán
            </Button>
          </Link>

          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              Về trang chủ
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
