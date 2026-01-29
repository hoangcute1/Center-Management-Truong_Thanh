import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AssessmentType } from '../dto/create-assessment.dto';

export type AssessmentDocument = HydratedDocument<Assessment>;

@Schema({ timestamps: true })
export class Assessment {
  @Prop({ type: Types.ObjectId, ref: 'ClassEntity', required: true })
  classId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  teacherId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: String, enum: AssessmentType, required: true })
  type: AssessmentType;

  @Prop()
  score?: number;

  @Prop()
  maxScore?: number;

  @Prop({ type: Number, min: 0, max: 100 })
  weight?: number;

  @Prop()
  dueDate?: Date;

  @Prop()
  submittedAt?: Date;

  @Prop()
  feedback?: string;
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment);
