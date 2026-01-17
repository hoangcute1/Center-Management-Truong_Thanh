import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

export enum PaymentMethod {
  VNPAY_TEST = 'vnpay_test',
  CASH = 'cash',
  SCHOLARSHIP = 'scholarship',
}

export enum PaymentStatus {
  INIT = 'init',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Payment {
  // Liên kết với StudentPaymentRequest (flow mới)
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'StudentPaymentRequest' }],
    required: true,
  })
  requestIds: Types.ObjectId[];

  // Người thanh toán (có thể là student hoặc parent)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  paidBy: Types.ObjectId;

  // Student được thanh toán cho (nếu parent trả cho con)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  method: PaymentMethod;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.INIT })
  status: PaymentStatus;

  // ===== VNPay Fields =====
  @Prop({ unique: true, sparse: true })
  vnpTxnRef?: string;

  @Prop()
  vnpTransactionNo?: string;

  @Prop()
  vnpBankCode?: string;

  @Prop({ type: Object })
  vnpReturnData?: Record<string, any>;

  @Prop({ type: Object })
  vnpIpnData?: Record<string, any>;

  // ===== Cash Fields =====
  @Prop({ type: Types.ObjectId, ref: 'User' })
  confirmedBy?: Types.ObjectId;

  @Prop()
  confirmedAt?: Date;

  // ===== Common =====
  @Prop()
  paidAt?: Date;

  @Prop()
  failReason?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ studentId: 1, createdAt: -1 });
PaymentSchema.index({ vnpTxnRef: 1 }, { unique: true, sparse: true });
