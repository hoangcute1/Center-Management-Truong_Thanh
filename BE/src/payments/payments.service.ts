import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Payment,
  PaymentDocument,
  PaymentMethod,
  PaymentStatus,
} from './schemas/payment.schema';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
  TransactionType,
} from './schemas/payment-transaction.schema';
import { PaymentRequestsService } from '../payment-requests/payment-requests.service';
import { VnpayService } from './vnpay.service';
import { CreatePaymentDto, ConfirmCashPaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(PaymentTransaction.name)
    private transactionModel: Model<PaymentTransactionDocument>,
    private paymentRequestsService: PaymentRequestsService,
    private vnpayService: VnpayService,
  ) {}

  // ==================== CREATE PAYMENT ====================

  async createPayment(
    dto: CreatePaymentDto,
    userId: string,
    userRole: string,
    ipAddr: string,
  ): Promise<{
    paymentId: string;
    paymentUrl?: string;
    vnpTxnRef?: string;
    message?: string;
  }> {
    // 1. Xác định studentId
    let studentId = userId;
    if (userRole === 'parent' && dto.studentId) {
      studentId = dto.studentId;
    }

    // 2. Validate requests
    const { requests, totalAmount } =
      await this.paymentRequestsService.validateRequestsForPayment(
        dto.requestIds,
        studentId,
      );

    if (totalAmount <= 0) {
      throw new BadRequestException('Tổng số tiền phải lớn hơn 0');
    }

    // 3. Tạo payment record
    const payment = new this.paymentModel({
      requestIds: dto.requestIds.map((id) => new Types.ObjectId(id)),
      paidBy: new Types.ObjectId(userId),
      studentId: new Types.ObjectId(studentId),
      amount: totalAmount,
      method:
        dto.method === 'vnpay_test'
          ? PaymentMethod.VNPAY_TEST
          : PaymentMethod.CASH,
      status: PaymentStatus.PENDING,
    });

    // 4. Xử lý theo payment method
    if (dto.method === 'vnpay_test') {
      // Create VNPay URL
      const orderInfo = `Thanh toan hoc phi - ${requests.length} yeu cau`;
      const { paymentUrl, vnpTxnRef } = this.vnpayService.createPaymentUrl({
        orderId: (payment._id as Types.ObjectId).toString(),
        amount: totalAmount,
        orderInfo,
        ipAddr,
      });

      payment.vnpTxnRef = vnpTxnRef;
      await payment.save();

      await this.logTransaction(
        payment._id as Types.ObjectId,
        TransactionType.CREATE,
        { vnpTxnRef, amount: totalAmount, requestIds: dto.requestIds },
        'Created VNPay payment',
      );

      return {
        paymentId: (payment._id as Types.ObjectId).toString(),
        paymentUrl,
        vnpTxnRef,
      };
    } else {
      // Cash payment
      await payment.save();

      await this.logTransaction(
        payment._id as Types.ObjectId,
        TransactionType.CREATE,
        { amount: totalAmount, requestIds: dto.requestIds },
        'Created cash payment request',
      );

      return {
        paymentId: (payment._id as Types.ObjectId).toString(),
        message: 'Vui lòng đến quầy thu ngân để thanh toán',
      };
    }
  }

  // ==================== VNPAY HANDLERS ====================

  async handleVnpayReturn(
    vnpParams: Record<string, any>,
  ): Promise<{ success: boolean; paymentId: string; message: string }> {
    const result = this.vnpayService.verifyReturnUrl(vnpParams);

    if (!result.isValid) {
      return { success: false, paymentId: '', message: 'Chữ ký không hợp lệ' };
    }

    const payment = await this.paymentModel.findOne({
      vnpTxnRef: result.vnpTxnRef,
    });

    if (!payment) {
      return { success: false, paymentId: '', message: 'Không tìm thấy giao dịch' };
    }

    // Idempotent check
    if (payment.status === PaymentStatus.SUCCESS) {
      return {
        success: true,
        paymentId: (payment._id as Types.ObjectId).toString(),
        message: 'Giao dịch đã được xử lý trước đó',
      };
    }

    // Log transaction
    await this.logTransaction(
      payment._id as Types.ObjectId,
      TransactionType.RETURN_URL,
      vnpParams,
      `Return URL - Code: ${result.responseCode}`,
    );

    // Update payment
    payment.vnpReturnData = vnpParams;
    payment.vnpTransactionNo = result.transactionNo;
    payment.vnpBankCode = result.bankCode;

    if (result.responseCode === '00') {
      payment.status = PaymentStatus.SUCCESS;
      payment.paidAt = new Date();
      await payment.save();

      // Mark requests as paid
      await this.paymentRequestsService.markAsPaid(
        payment.requestIds.map((id) => id.toString()),
        payment._id as Types.ObjectId,
      );

      return {
        success: true,
        paymentId: (payment._id as Types.ObjectId).toString(),
        message: 'Thanh toán thành công',
      };
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.failReason = this.vnpayService.getResponseMessage(
        result.responseCode,
      );
      await payment.save();

      return {
        success: false,
        paymentId: (payment._id as Types.ObjectId).toString(),
        message: payment.failReason,
      };
    }
  }

  async handleVnpayIpn(
    vnpParams: Record<string, any>,
  ): Promise<{ RspCode: string; Message: string }> {
    const result = this.vnpayService.verifyReturnUrl({ ...vnpParams });

    if (!result.isValid) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const payment = await this.paymentModel.findOne({
      vnpTxnRef: result.vnpTxnRef,
    });

    if (!payment) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // Idempotent check
    if (payment.status === PaymentStatus.SUCCESS) {
      return { RspCode: '00', Message: 'Already processed' };
    }

    // Log transaction
    await this.logTransaction(
      payment._id as Types.ObjectId,
      TransactionType.IPN,
      vnpParams,
      `IPN - Code: ${result.responseCode}`,
    );

    // Update payment
    payment.vnpIpnData = vnpParams;
    payment.vnpTransactionNo = result.transactionNo;
    payment.vnpBankCode = result.bankCode;

    if (result.responseCode === '00') {
      payment.status = PaymentStatus.SUCCESS;
      payment.paidAt = new Date();
      await payment.save();

      // Mark requests as paid
      await this.paymentRequestsService.markAsPaid(
        payment.requestIds.map((id) => id.toString()),
        payment._id as Types.ObjectId,
      );
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.failReason = this.vnpayService.getResponseMessage(
        result.responseCode,
      );
      await payment.save();
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  // ==================== CASH HANDLERS ====================

  async confirmCashPayment(
    dto: ConfirmCashPaymentDto,
    adminId: string,
  ): Promise<{ success: boolean; message: string }> {
    const payment = await this.paymentModel.findById(dto.paymentId);

    if (!payment) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }

    if (payment.method !== PaymentMethod.CASH) {
      throw new BadRequestException('Giao dịch này không phải tiền mặt');
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return { success: true, message: 'Giao dịch đã được xác nhận trước đó' };
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Giao dịch không ở trạng thái chờ xác nhận');
    }

    // Update payment
    payment.status = PaymentStatus.SUCCESS;
    payment.confirmedBy = new Types.ObjectId(adminId);
    payment.confirmedAt = new Date();
    payment.paidAt = new Date();
    await payment.save();

    // Mark requests as paid
    await this.paymentRequestsService.markAsPaid(
      payment.requestIds.map((id) => id.toString()),
      payment._id as Types.ObjectId,
    );

    await this.logTransaction(
      payment._id as Types.ObjectId,
      TransactionType.CASH_CONFIRM,
      { adminId },
      'Cash payment confirmed',
      new Types.ObjectId(adminId),
    );

    return { success: true, message: 'Đã xác nhận thanh toán thành công' };
  }

  async findPendingCashPayments(): Promise<Payment[]> {
    return this.paymentModel
      .find({
        method: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
      })
      .populate('studentId', 'name email studentCode')
      .populate('paidBy', 'name email')
      .sort({ createdAt: -1 });
  }

  // ==================== COMMON ====================

  async findByStudent(studentId: string): Promise<Payment[]> {
    return this.paymentModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.paymentModel.findById(id);
    if (!payment) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }
    return payment;
  }

  async getAllPayments(): Promise<Payment[]> {
    return this.paymentModel
      .find()
      .populate('studentId', 'name email studentCode')
      .populate('paidBy', 'name email')
      .sort({ createdAt: -1 });
  }

  private async logTransaction(
    paymentId: Types.ObjectId,
    type: TransactionType,
    rawData: Record<string, any>,
    message: string,
    performedBy?: Types.ObjectId,
  ): Promise<void> {
    const transaction = new this.transactionModel({
      paymentId,
      type,
      rawData,
      message,
      performedBy,
    });
    await transaction.save();
  }
}
