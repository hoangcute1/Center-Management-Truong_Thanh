import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FeedbackDocument = HydratedDocument<Feedback>;

// Tiêu chí đánh giá
export class EvaluationCriteria {
  @Prop({ required: true, min: 1, max: 5 })
  teachingQuality: number; // Chất lượng giảng dạy

  @Prop({ required: true, min: 1, max: 5 })
  communication: number; // Khả năng giao tiếp

  @Prop({ required: true, min: 1, max: 5 })
  punctuality: number; // Đúng giờ

  @Prop({ required: true, min: 1, max: 5 })
  materialPreparation: number; // Chuẩn bị bài giảng

  @Prop({ required: true, min: 1, max: 5 })
  studentInteraction: number; // Tương tác với học sinh
}

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ClassEntity' })
  classId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EvaluationPeriod' })
  evaluationPeriodId?: Types.ObjectId;

  // Điểm tổng hợp (trung bình của các tiêu chí)
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  // Đánh giá chi tiết theo tiêu chí
  @Prop({ type: Object })
  criteria?: EvaluationCriteria;

  @Prop()
  comment?: string;

  @Prop({ default: true })
  anonymous: boolean;

  @Prop({ default: 'submitted', enum: ['draft', 'submitted'] })
  status: 'draft' | 'submitted';

  @Prop()
  submittedAt?: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
