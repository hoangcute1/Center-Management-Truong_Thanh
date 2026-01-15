import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';

export type UserDocument = HydratedDocument<User>;

export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

// Loại học bổng
export enum ScholarshipType {
  TeacherChild = 'teacher_child', // Con giáo viên
  PoorFamily = 'poor_family', // Hộ nghèo
  Orphan = 'orphan', // Con mồ côi
}

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
    enum: Gender,
  })
  gender?: Gender;

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.Active,
  })
  status: UserStatus;

  @Prop({ default: false })
  mustChangePassword: boolean;

  // ===== Mã số theo role =====
  // Mã số học sinh: HS0001, HS0002, ...
  @Prop({ unique: true, sparse: true })
  studentCode?: string;

  // Mã số giáo viên: GV0001, GV0002, ...
  @Prop({ unique: true, sparse: true })
  teacherCode?: string;

  // Mã số phụ huynh: PH + mã học sinh con (VD: PH0001)
  @Prop({ unique: true, sparse: true })
  parentCode?: string;

  // Email của học sinh con (dành cho phụ huynh)
  @Prop()
  childEmail?: string;

  // Ngày hết hạn tài khoản (5 năm sau ngày tạo)
  @Prop()
  expiresAt?: Date;

  // ===== Thông tin phụ huynh (của học sinh) =====
  @Prop()
  parentName?: string;

  @Prop()
  parentPhone?: string;

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

  // ===== Thông tin học bổng (dành cho học sinh) =====
  // Có học bổng hay không
  @Prop({ default: false })
  hasScholarship: boolean;

  // Loại học bổng
  @Prop({
    type: String,
    enum: ScholarshipType,
  })
  scholarshipType?: ScholarshipType;

  // Phần trăm học bổng (0-100)
  @Prop({ min: 0, max: 100 })
  scholarshipPercent?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
