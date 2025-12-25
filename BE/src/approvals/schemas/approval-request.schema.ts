import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ApprovalRequestDocument = HydratedDocument<ApprovalRequest>;

export enum ApprovalType {
  Register = 'register',
  LinkParent = 'link_parent',
}

export enum ApprovalStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

@Schema({ timestamps: true })
export class ApprovalRequest {
  @Prop({ required: true, enum: ApprovalType, type: String })
  type: ApprovalType;

  @Prop({ required: true })
  userId: string;

  @Prop({
    required: true,
    enum: ApprovalStatus,
    type: String,
    default: ApprovalStatus.Pending,
  })
  status: ApprovalStatus;

  @Prop()
  approvedBy?: string;
}

export const ApprovalRequestSchema =
  SchemaFactory.createForClass(ApprovalRequest);
