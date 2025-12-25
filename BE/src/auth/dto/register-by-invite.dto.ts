import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterByInviteDto {
  @IsString()
  token: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @MinLength(6)
  password: string;
}
