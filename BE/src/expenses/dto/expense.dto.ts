import { IsString, IsNumber, IsOptional, Min, IsDateString, IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateExpenseDto {
  @IsMongoId()
  @IsNotEmpty()
  branchId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsDateString()
  expenseDate?: string; // ISO date string, optional (default = today)
}

export class GetExpensesQueryDto {
  @IsMongoId()
  branchId: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
