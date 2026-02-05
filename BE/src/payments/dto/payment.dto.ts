import { IsArray, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsArray()
  @IsNotEmpty()
  requestIds: string[];

  @IsString()
  @IsNotEmpty()
  @IsNotEmpty()
  method: 'PAYOS' | 'CASH' | 'FAKE';

  @IsOptional()
  @IsString()
  studentId?: string; // Parent truyền studentId của con
}

export class ConfirmCashPaymentDto {
  @IsNotEmpty()
  @IsString()
  paymentId: string;
}
