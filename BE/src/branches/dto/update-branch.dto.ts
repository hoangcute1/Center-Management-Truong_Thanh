import { PartialType } from '@nestjs/mapped-types';
import { CreateBranchDto } from './create-branch.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive';
}
