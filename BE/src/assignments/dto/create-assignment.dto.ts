import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AssignmentType } from '../schemas/assignment.schema';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsNotEmpty()
  classId: string;

  @IsMongoId()
  @IsOptional()
  subjectId?: string;

  @IsEnum(AssignmentType)
  @IsNotEmpty()
  type: AssignmentType;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  maxScore: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
