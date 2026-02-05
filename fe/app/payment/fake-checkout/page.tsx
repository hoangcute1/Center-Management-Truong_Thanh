"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, QrCode, Loader2, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { notify } from "@/lib/notify";

function FakeCheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Get params
    const paymentId = searchParams.get("paymentId");
    const amount = parseFloat(searchParams.get("amount") || "0");
    const info = searchParams.get("info") || "Thanh toan hoc phi";

    const handlePayment = async (status: "SUCCESS" | "CANCELLED") => {
        if (!paymentId) {
            notify.error("Thiếu thông tin thanh toán");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post("/payments/fake/callback", {
                paymentId,
                status,
            });

            // Redirect to payment result page
            // Format: /payment-result?success=true&paymentId=...&message=...
            const success = status === "SUCCESS";
            const message = encodeURIComponent(
                success ? "Thanh toán thành công" : "Đã huỷ thanh toán"
            );

            router.push(
                `/payment-result?success=${success}&paymentId=${paymentId}&message=${message}`
            );
        } catch (error: any) {
            const msg = error.response?.data?.message || "Lỗi xử lý thanh toán";
            notify.error(msg);
            setLoading(false);
        }
    };

    if (!paymentId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-gray-800">Lỗi tham số</h1>
                <p className="text-gray-500 mb-6">Không tìm thấy mã giao dịch</p>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-xl bg-white overflow-hidden">
                {/* Header */}
                <div className="bg-purple-600 text-white p-6 text-center">
                    <div className="inline-flex bg-white/20 p-3 rounded-full mb-3">
                        <QrCode className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Cổng Thanh Toán </h1>
                    <p className="opacity-90 mt-1 pb-2"> PayOS Demo Output</p>
                </div>

                {/* Info */}
                <div className="p-6 space-y-6">
                    <div className="text-center space-y-1">
                        <p className="text-sm text-gray-500 uppercase tracking-wide">
                            Số tiền thanh toán
                        </p>
                        <p className="text-3xl font-extrabold text-gray-900">
                            {amount.toLocaleString("vi-VN")} đ
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Mã giao dịch:</span>
                            <span className="font-mono font-medium text-gray-700 truncate max-w-[200px]">
                                {paymentId}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Nội dung:</span>
                            <span className="font-medium text-gray-700">{info}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Người thụ hưởng:</span>
                            <span className="font-medium text-gray-700">TRUONG THANH EDU</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-4" />

                    <p className="text-center text-sm text-gray-500 italic">
                        Vui lòng chọn kết quả mong muốn bên dưới.
                    </p>

                    <div className="space-y-3">
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold"
                            onClick={() => handlePayment("SUCCESS")}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Thanh toán Thành công
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full h-12 text-lg font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handlePayment("CANCELLED")}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                            ) : (
                                <>
                                    <XCircle className="w-5 h-5 mr-2" />
                                    Huỷ giao dịch
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function FakeCheckoutPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FakeCheckoutContent />
        </Suspense>
    );
}
