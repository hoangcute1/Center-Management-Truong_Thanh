import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { GradeCategory } from '../schemas/grade.schema';

export class CreateManualGradeDto {
  @IsMongoId()
  @IsNotEmpty()
  studentId: string;

  @IsMongoId()
  @IsNotEmpty()
  classId: string;

  @IsMongoId()
  @IsOptional()
  subjectId?: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  score: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  maxScore: number;

  @IsEnum(GradeCategory)
  @IsNotEmpty()
  category: GradeCategory;

  @IsString()
  @IsOptional()
  feedback?: string;
}
