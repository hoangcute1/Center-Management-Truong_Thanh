import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsArray()
  @IsNotEmpty()
  classIds: string[];

  @IsOptional()
  @IsString()
  note?: string;
}
