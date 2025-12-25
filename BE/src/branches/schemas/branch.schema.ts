import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BranchDocument = HydratedDocument<Branch>;

@Schema({ timestamps: true })
export class Branch {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ required: false, trim: true })
  phone?: string;

  @Prop({ default: 'active', enum: ['active', 'inactive'], type: String })
  status: 'active' | 'inactive';
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
