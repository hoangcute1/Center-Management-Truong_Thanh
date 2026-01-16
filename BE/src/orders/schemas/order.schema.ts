import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Order {
  // ===== Student Info =====
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  studentName: string;

  @Prop()
  studentCode?: string;

  // ===== Order Items (Classes) =====
  @Prop({
    type: [
      {
        classId: { type: Types.ObjectId, ref: 'ClassEntity' },
        className: String,
        classSubject: String,
        classFee: Number,
      },
    ],
    required: true,
  })
  items: {
    classId: Types.ObjectId;
    className: string;
    classSubject?: string;
    classFee: number;
  }[];

  // ===== Pricing =====
  @Prop({ required: true })
  baseAmount: number;

  @Prop({ default: 0 })
  scholarshipPercent: number;

  @Prop()
  scholarshipType?: string;

  @Prop({ default: 0 })
  discountAmount: number;

  @Prop({ required: true })
  finalAmount: number;

  @Prop({ default: 'VND' })
  currency: string;

  // ===== Status =====
  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
  })
  status: OrderStatus;

  @Prop()
  paidAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancelReason?: string;

  @Prop()
  note?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ studentId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
