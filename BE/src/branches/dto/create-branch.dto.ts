import { IsString, IsOptional } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
