import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ExpenseDocument = HydratedDocument<Expense>;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // Số tiền chi (VND)

  @Prop({ required: true })
  description: string; // Nội dung chi phí

  @Prop({ required: true, default: () => new Date() })
  expenseDate: Date; // Ngày chi

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId; // Admin/staff tạo
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
ExpenseSchema.index({ branchId: 1, expenseDate: -1 });
