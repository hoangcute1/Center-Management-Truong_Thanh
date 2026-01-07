import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}

export class ContactAdminDto {
  @ApiProperty({ description: 'Tên người liên hệ', example: 'Nguyễn Văn A' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email liên hệ', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0901234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Tôi muốn đăng ký tài khoản...',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Loại yêu cầu',
    example: 'register',
    enum: ['register', 'support', 'other'],
  })
  @IsString()
  type: 'register' | 'support' | 'other';
}

export class ValidateLoginDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Vai trò được chọn', example: 'student' })
  @IsString()
  role: string;

  @ApiProperty({
    description: 'ID chi nhánh được chọn',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  branchId: string;
}
