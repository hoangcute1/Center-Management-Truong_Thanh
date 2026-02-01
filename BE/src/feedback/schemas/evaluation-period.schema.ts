import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EvaluationPeriodDocument = HydratedDocument<EvaluationPeriod>;

@Schema({ timestamps: true })
export class EvaluationPeriod {
  @Prop({ required: true })
  name: string; // Ví dụ: "Đánh giá tháng 1/2026"

  @Prop()
  description?: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  // Áp dụng cho cơ sở nào (bắt buộc)
  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  // Áp dụng cho lớp nào ([] = tất cả lớp của cơ sở)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'ClassEntity' }], default: [] })
  classIds: Types.ObjectId[];

  // Áp dụng cho giáo viên nào ([] = tất cả)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  teacherIds: Types.ObjectId[];

  @Prop({ default: 'active', enum: ['draft', 'active', 'closed'] })
  status: 'draft' | 'active' | 'closed';

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const EvaluationPeriodSchema =
  SchemaFactory.createForClass(EvaluationPeriod);
