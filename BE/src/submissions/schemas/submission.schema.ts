import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SubmissionDocument = HydratedDocument<Submission>;

export enum SubmissionStatus {
  Submitted = 'submitted',
  Late = 'late',
}

@Schema({ timestamps: true })
export class Submission {
  @Prop({ type: Types.ObjectId, ref: 'Assignment', required: true })
  assignmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  submittedAt: Date;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ type: String, enum: SubmissionStatus, required: true })
  status: SubmissionStatus;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);

// Index để query nhanh
SubmissionSchema.index({ assignmentId: 1, studentId: 1 });
SubmissionSchema.index({ studentId: 1, submittedAt: -1 });
