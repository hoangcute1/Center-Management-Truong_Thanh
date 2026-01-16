import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ClassPaymentRequestDocument = HydratedDocument<ClassPaymentRequest>;

export enum ClassPaymentRequestStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class ClassPaymentRequest {
  @Prop({ type: Types.ObjectId, ref: 'ClassEntity', required: true, index: true })
  classId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'VND' })
  currency: string;

  @Prop()
  dueDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: ClassPaymentRequestStatus,
    default: ClassPaymentRequestStatus.ACTIVE,
  })
  status: ClassPaymentRequestStatus;

  // Snapshot class info
  @Prop({ required: true })
  className: string;

  @Prop()
  classSubject?: string;

  // Stats (updated when payments are made)
  @Prop({ default: 0 })
  totalStudents: number;

  @Prop({ default: 0 })
  paidCount: number;

  @Prop({ default: 0 })
  totalCollected: number;
}

export const ClassPaymentRequestSchema =
  SchemaFactory.createForClass(ClassPaymentRequest);
ClassPaymentRequestSchema.index({ classId: 1, createdAt: -1 });
