import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ClassDocument = HydratedDocument<ClassEntity>;

@Schema({ timestamps: true })
export class ClassEntity {
  @Prop({ required: true })
  name: string;

  @Prop()
  subject?: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  teacherId?: Types.ObjectId;

  @Prop({
    type: [
      {
        dayOfWeek: String,
        startTime: String,
        endTime: String,
        room: String,
      },
    ],
  })
  schedule?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room?: string;
  }[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  studentIds: Types.ObjectId[];

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: 'active' })
  status: 'active' | 'inactive';
}

export const ClassSchema = SchemaFactory.createForClass(ClassEntity);
