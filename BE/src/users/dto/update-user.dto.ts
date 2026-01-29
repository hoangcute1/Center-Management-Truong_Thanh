import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { UserRole } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import { Gender, ScholarshipType } from '../schemas/user.schema';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  // Thông tin phụ huynh của học sinh
  @IsOptional()
  @IsString()
  parentName?: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  // Email con (dành cho phụ huynh)
  @IsOptional()
  @IsString()
  childEmail?: string;

  // ===== Thông tin dành cho Giáo viên =====
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsString()
  teacherNote?: string;

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
