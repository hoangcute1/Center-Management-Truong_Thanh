import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ unique: true, sparse: true, trim: true })
  phone?: string;

  @Prop({ required: false, index: true })
  branchId?: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.Student,
  })
  role: UserRole;

  @Prop()
  avatarUrl?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.Active,
  })
  status: UserStatus;

  @Prop({ default: false })
  mustChangePassword: boolean;

  // ===== Thông tin dành cho Giáo viên =====
  // Danh sách môn học giáo viên có thể dạy
  @Prop({ type: [String], default: [] })
  subjects: string[];

  // Mô tả/ghi chú về giáo viên (kinh nghiệm, chuyên môn...)
  @Prop()
  teacherNote?: string;

  // Trình độ học vấn
  @Prop()
  qualification?: string;

  // Số năm kinh nghiệm
  @Prop()
  experienceYears?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
