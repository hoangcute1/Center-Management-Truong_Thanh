import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { InvoiceStatus } from '../dto/create-invoice.dto';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'VND' })
  currency: string;

  @Prop({ type: String, enum: InvoiceStatus, default: InvoiceStatus.Unpaid })
  status: InvoiceStatus;

  @Prop({
    type: [
      {
        label: String,
        amount: Number,
      },
    ],
    default: [],
  })
  items: { label: string; amount: number }[];

  @Prop()
  dueDate?: Date;

  @Prop()
  paidAt?: Date;

  @Prop()
  paymentMethod?: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
