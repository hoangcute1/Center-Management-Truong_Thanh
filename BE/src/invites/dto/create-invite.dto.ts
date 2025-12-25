import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { UserRole } from '../../common/enums/role.enum';

export class CreateInviteDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsDateString()
  expiredAt?: string;
}
