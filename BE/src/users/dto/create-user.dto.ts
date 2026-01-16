import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { UserRole } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import { Gender, ScholarshipType } from '../schemas/user.schema';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  dateOfBirth?: Date;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  mustChangePassword?: boolean;

  // Email con (dành cho phụ huynh)
  @IsOptional()
  @IsString()
  childEmail?: string;

  // Thông tin phụ huynh (của học sinh)
  @IsOptional()
  @IsString()
  parentName?: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  // ===== Thông tin dành cho Giáo viên =====
  // Danh sách môn học giáo viên có thể dạy
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  // Mô tả/ghi chú về giáo viên
  @IsOptional()
  @IsString()
  teacherNote?: string;

  // Trình độ học vấn
  @IsOptional()
  @IsString()
  qualification?: string;

  // ===== Thông tin học bổng (dành cho học sinh) =====
  @IsOptional()
  @IsBoolean()
  hasScholarship?: boolean;

  @IsOptional()
  @IsEnum(ScholarshipType)
  scholarshipType?: ScholarshipType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  scholarshipPercent?: number;
}
