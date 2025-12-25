import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../common/enums/role.enum';

export type InviteTokenDocument = HydratedDocument<InviteToken>;

@Schema({ timestamps: true })
export class InviteToken {
  @Prop({ required: true, unique: true, index: true })
  token: string;

  @Prop({ required: true, enum: UserRole, type: String })
  role: UserRole;

  @Prop({ required: false })
  classId?: string;

  @Prop({ required: true })
  expiredAt: Date;

  @Prop({ required: false })
  usedAt?: Date;

  @Prop({ required: true })
  createdBy: string;
}

export const InviteTokenSchema = SchemaFactory.createForClass(InviteToken);
