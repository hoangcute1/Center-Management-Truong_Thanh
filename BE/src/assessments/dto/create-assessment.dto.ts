import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum AssessmentType {
  Assignment = 'assignment',
  Test = 'test',
}

export class CreateAssessmentDto {
  @IsString()
  classId: string;

  @IsString()
  studentId: string;

  @IsString()
  title: string;

  @IsEnum(AssessmentType)
  type: AssessmentType;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  submittedAt?: string;

  @IsOptional()
  @IsString()
  feedback?: string;
}
