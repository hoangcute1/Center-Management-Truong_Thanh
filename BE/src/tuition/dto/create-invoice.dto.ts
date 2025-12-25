import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

enum InvoiceStatus {
  Unpaid = 'unpaid',
  Partial = 'partial',
  Paid = 'paid',
}

class InvoiceItemDto {
  @IsString()
  label: string;

  @IsNumber()
  amount: number;
}

export class CreateInvoiceDto {
  @IsString()
  studentId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export { InvoiceStatus, InvoiceItemDto };
