import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GoalDocument = HydratedDocument<Goal>;

@Schema({ timestamps: true })
export class Goal {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  progress: number;

  @Prop()
  dueDate?: Date;

  @Prop({ default: 'open' })
  status: 'open' | 'completed';
}

export const GoalSchema = SchemaFactory.createForClass(Goal);
