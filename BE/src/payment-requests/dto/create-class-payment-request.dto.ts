import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateClassPaymentRequestDto {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  amount?: number; // Nếu không truyền, lấy từ class.fee

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
