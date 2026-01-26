import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateSubmissionDto {
  @IsMongoId()
  @IsNotEmpty()
  assignmentId: string;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  fileUrl: string;
}
