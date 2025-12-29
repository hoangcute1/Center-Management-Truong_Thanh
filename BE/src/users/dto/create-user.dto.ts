import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  IsNumber,
} from 'class-validator';
import { UserRole } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';

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
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  mustChangePassword?: boolean;

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

  // Số năm kinh nghiệm
  @IsOptional()
  @IsNumber()
  experienceYears?: number;
}
