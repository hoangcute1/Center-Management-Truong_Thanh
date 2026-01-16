import { IsArray, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsArray()
  @IsNotEmpty()
  requestIds: string[];

  @IsString()
  @IsNotEmpty()
  method: 'vnpay_test' | 'cash';

  @IsOptional()
  @IsString()
  studentId?: string; // Parent truyền studentId của con
}

export class ConfirmCashPaymentDto {
  @IsNotEmpty()
  @IsString()
  paymentId: string;
}
