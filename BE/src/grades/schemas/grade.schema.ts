import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GradeDocument = HydratedDocument<Grade>;

export enum GradeType {
  Assignment = 'assignment',
  Manual = 'manual',
}

export enum GradeCategory {
  Test15Minutes = '15p',
  Test1Period = '1_tiet',
  MidTerm = 'giua_ky',
  FinalTerm = 'cuoi_ky',
  Other = 'khac',
}

@Schema({ timestamps: true })
export class Grade {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ClassEntity', required: true })
  classId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subject' })
  subjectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Assignment' })
  assignmentId?: Types.ObjectId;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  maxScore: number;

  @Prop({ type: String, enum: GradeType, default: GradeType.Assignment })
  type: GradeType;

  @Prop({ type: String, enum: GradeCategory })
  category?: GradeCategory;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  gradedBy: Types.ObjectId;

  @Prop({ required: true })
  gradedAt: Date;

  @Prop()
  feedback?: string;
}

export const GradeSchema = SchemaFactory.createForClass(Grade);

// Indexes
GradeSchema.index({ studentId: 1, assignmentId: 1 });
GradeSchema.index({ assignmentId: 1 });
GradeSchema.index({ studentId: 1, gradedAt: -1 });
