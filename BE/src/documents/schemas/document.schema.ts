import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DocumentEntityDocument = HydratedDocument<DocumentEntity>;

export enum DocumentVisibility {
  Class = 'class',
  Community = 'community',
}

@Schema({ timestamps: true })
export class DocumentEntity {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop()
  originalFileName?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerTeacherId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'ClassEntity' }], default: [] })
  classIds: Types.ObjectId[];

  @Prop({
    type: String,
    enum: DocumentVisibility,
    default: DocumentVisibility.Class,
  })
  visibility: DocumentVisibility;

  @Prop({ type: Types.ObjectId, ref: 'Branch' })
  branchId?: Types.ObjectId;

  @Prop({ default: 0 })
  downloadCount: number;
}

export const DocumentSchema = SchemaFactory.createForClass(DocumentEntity);

// Indexes for efficient queries
DocumentSchema.index({ ownerTeacherId: 1 });
DocumentSchema.index({ classIds: 1 });
DocumentSchema.index({ visibility: 1 });
DocumentSchema.index({ branchId: 1 });
