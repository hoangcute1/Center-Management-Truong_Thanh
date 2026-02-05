import { Injectable } from '@nestjs/common';
import {
  PaymentGateway,
  CreatePaymentParams,
  PaymentResult,
} from './payment.gateway';
import * as crypto from 'crypto';

@Injectable()
export class PayosGateway implements PaymentGateway {
  constructor() {}

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    // PayOS implementation placeholder.
    // Real implementation requires PAYOS_CLIENT_ID, API_KEY, CHECKSUM_KEY
    
    // For now, to stop redirecting to VNPay, we will log error or mock a different behavior.
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
        throw new Error('PayOS Configuration Missing: PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY');
    }

    // TODO: Call PayOS API to create payment link
    // ...
    
    // Temporary: return a fake URL to indicate success but not VNPay
    return {
      paymentUrl: `https://pay.payos.vn/web/checkout?error=PAYOS_NOT_IMPLEMENTED`,
      vnpTxnRef: `PAYOS_${Date.now()}`
    };
  }
}

