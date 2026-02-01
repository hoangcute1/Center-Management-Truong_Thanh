import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EvaluationCriteriaDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  teachingQuality: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  communication: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  punctuality: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  materialPreparation: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  studentInteraction: number;
}

export class CreateFeedbackDto {
  @IsString()
  teacherId: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  evaluationPeriodId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvaluationCriteriaDto)
  criteria?: EvaluationCriteriaDto;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;

  @IsOptional()
  @IsEnum(['draft', 'submitted'])
  status?: 'draft' | 'submitted';
}
