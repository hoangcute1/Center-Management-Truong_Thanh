import { IsArray, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEvaluationPeriodDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsString()
  branchId: string; // Bắt buộc chọn cơ sở

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teacherIds?: string[];

  @IsOptional()
  @IsEnum(['draft', 'active', 'closed'])
  status?: 'draft' | 'active' | 'closed';
}

export class UpdateEvaluationPeriodDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teacherIds?: string[];

  @IsOptional()
  @IsEnum(['draft', 'active', 'closed'])
  status?: 'draft' | 'active' | 'closed';
}
