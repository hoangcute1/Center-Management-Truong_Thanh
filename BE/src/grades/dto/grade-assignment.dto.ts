import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GradeAssignmentDto {
  @IsMongoId()
  @IsNotEmpty()
  submissionId: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  score: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}
