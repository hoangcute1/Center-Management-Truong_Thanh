import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IncidentDocument = Incident & Document;

export enum IncidentType {
  BugError = 'bug_error',
  UIIssue = 'ui_issue',
  PerformanceIssue = 'performance_issue',
  FeatureRequest = 'feature_request',
  LoginIssue = 'login_issue',
  DataIssue = 'data_issue',
  PaymentIssue = 'payment_issue',
  Other = 'other',
}

export enum IncidentStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Resolved = 'resolved',
  Rejected = 'rejected',
}

export enum IncidentPlatform {
  Web = 'web',
  Mobile = 'mobile',
}

@Schema({ timestamps: true })
export class Incident {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId: Types.ObjectId;

  @Prop({ required: true })
  reporterName: string;

  @Prop({ required: true })
  reporterEmail: string;

  @Prop()
  reporterPhone: string;

  @Prop({ required: true })
  reporterRole: string;

  @Prop({ required: true, enum: IncidentType })
  type: IncidentType;

  @Prop({ required: true })
  description: string;

  @Prop({ enum: IncidentPlatform, default: IncidentPlatform.Web })
  platform: IncidentPlatform;

  @Prop({ enum: IncidentStatus, default: IncidentStatus.Pending })
  status: IncidentStatus;

  @Prop()
  adminNote: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy: Types.ObjectId;

  @Prop()
  resolvedAt: Date;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
