import {
  PaymentGateway,
  CreatePaymentParams,
  PaymentResult,
} from './payment.gateway';

export class FakeGateway implements PaymentGateway {
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const fakeTxnId = `FAKE_${Date.now()}`;
    
    // Tạo link đến trang fake checkout
    // Format: /payment/fake-checkout?paymentId=...
    const checkoutUrl = `/payment/fake-checkout?paymentId=${params.orderId}&amount=${params.amount}&info=${encodeURIComponent(
      params.orderInfo,
    )}`;

    return {
      checkoutUrl,
      vnpTxnRef: fakeTxnId,
    };
  }
}
