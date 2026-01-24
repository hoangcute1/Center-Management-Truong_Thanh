import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GradeDocument = HydratedDocument<Grade>;

@Schema({ timestamps: true })
export class Grade {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ClassEntity', required: true })
  classId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subject' })
  subjectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Assignment', required: true })
  assignmentId: Types.ObjectId;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  maxScore: number;

  @Prop({ default: 'assignment' })
  type: string;

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
