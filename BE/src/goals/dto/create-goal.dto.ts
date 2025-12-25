import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  studentId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
