import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../common/enums/role.enum';

export class CreateInviteDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsString()
  branchId: string;

  @IsOptional()
  @IsDateString()
  expiredAt?: string;
}
