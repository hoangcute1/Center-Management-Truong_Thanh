import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentTransactionDocument = HydratedDocument<PaymentTransaction>;

export enum TransactionType {
  CREATE = 'create',
  RETURN_URL = 'return_url',
  IPN = 'ipn',
  CASH_CONFIRM = 'cash_confirm',
  SYSTEM = 'system',
}

@Schema({ timestamps: true })
export class PaymentTransaction {
  @Prop({ type: Types.ObjectId, ref: 'Payment', required: true, index: true })
  paymentId: Types.ObjectId;

  @Prop({ type: String, enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ type: Object })
  rawData: Record<string, any>;

  @Prop()
  message?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  performedBy?: Types.ObjectId;
}

export const PaymentTransactionSchema =
  SchemaFactory.createForClass(PaymentTransaction);
