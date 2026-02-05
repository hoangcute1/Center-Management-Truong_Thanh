export interface PaymentResult {
  paymentUrl?: string;
  checkoutUrl?: string; // For fake gateway
  vnpTxnRef?: string;
  paymentId?: string;
  message?: string;
}

export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddr: string;
  requestIds: string[];
}

export interface PaymentGateway {
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;
}
