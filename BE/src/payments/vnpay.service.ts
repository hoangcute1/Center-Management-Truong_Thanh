import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface VnpayConfig {
  vnp_TmnCode: string;
  vnp_HashSecret: string;
  vnp_Url: string;
  vnp_ReturnUrl: string;
}

export interface CreatePaymentUrlParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddr: string;
  locale?: string;
}

@Injectable()
export class VnpayService {
  private config: VnpayConfig;

  constructor() {
    // VNPay Sandbox Credentials
    this.config = {
      vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'DEMO1234',
      vnp_HashSecret:
        process.env.VNPAY_HASH_SECRET || 'DEMOSECRET1234567890ABCDEF',
      vnp_Url:
        process.env.VNPAY_URL ||
        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      vnp_ReturnUrl:
        process.env.VNPAY_RETURN_URL ||
        'http://localhost:3000/payments/vnpay-test/return',
    };
  }

  createPaymentUrl(params: CreatePaymentUrlParams): {
    paymentUrl: string;
    vnpTxnRef: string;
  } {
    const date = new Date();
    const vnpTxnRef = `${params.orderId}_${date.getTime()}`;
    const createDate = this.formatDate(date);

    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.config.vnp_TmnCode,
      vnp_Locale: params.locale || 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: vnpTxnRef,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: String(params.amount * 100), // VNPay yêu cầu x100
      vnp_ReturnUrl: this.config.vnp_ReturnUrl,
      vnp_IpAddr: params.ipAddr,
      vnp_CreateDate: createDate,
    };

    // Sort params alphabetically
    const sortedParams = this.sortObject(vnpParams);

    // Build query string
    const signData = new URLSearchParams(sortedParams).toString();

    // Create signature
    const hmac = crypto.createHmac('sha512', this.config.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Add signature to params
    sortedParams['vnp_SecureHash'] = signed;

    // Build full URL
    const paymentUrl = `${this.config.vnp_Url}?${new URLSearchParams(sortedParams).toString()}`;

    return { paymentUrl, vnpTxnRef };
  }

  verifyReturnUrl(vnpParams: Record<string, any>): {
    isValid: boolean;
    vnpTxnRef: string;
    responseCode: string;
    transactionNo: string;
    bankCode: string;
    amount: number;
  } {
    const secureHash = vnpParams['vnp_SecureHash'];

    // Remove hash params for verification
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sort and create signature
    const sortedParams = this.sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', this.config.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValid = secureHash === signed;

    return {
      isValid,
      vnpTxnRef: vnpParams['vnp_TxnRef'] || '',
      responseCode: vnpParams['vnp_ResponseCode'] || '',
      transactionNo: vnpParams['vnp_TransactionNo'] || '',
      bankCode: vnpParams['vnp_BankCode'] || '',
      amount: parseInt(vnpParams['vnp_Amount'] || '0') / 100,
    };
  }

  getResponseMessage(responseCode: string): string {
    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Khách hàng hủy giao dịch',
      '51': 'Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'KH nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Lỗi không xác định',
    };
    return messages[responseCode] || 'Lỗi không xác định';
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return (
      date.getFullYear().toString() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  }

  private sortObject(obj: Record<string, any>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      const value = obj[key];
      if (value !== undefined && value !== null && value !== '') {
        sorted[key] = String(value);
      }
    }
    return sorted;
  }
}
