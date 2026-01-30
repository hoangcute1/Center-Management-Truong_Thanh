import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { GradeCategory } from './grade.schema';

export type GradingSheetDocument = HydratedDocument<GradingSheet>;

@Schema({ timestamps: true })
export class GradingSheet {
    @Prop({ required: true })
    title: string;

    @Prop()
    description?: string;

    @Prop({ type: Types.ObjectId, ref: 'ClassEntity', required: true })
    classId: Types.ObjectId;

    @Prop({ type: String, enum: GradeCategory, required: true })
    category: GradeCategory;

    @Prop({ required: true, default: 10 })
    maxScore: number;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;
}

export const GradingSheetSchema = SchemaFactory.createForClass(GradingSheet);

// Indexes
GradingSheetSchema.index({ createdBy: 1, createdAt: -1 });
GradingSheetSchema.index({ classId: 1 });
