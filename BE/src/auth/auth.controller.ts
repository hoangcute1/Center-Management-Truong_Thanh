import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterByInviteDto } from './dto/register-by-invite.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản (mặc định role student)' })
  @ApiBody({ type: RegisterDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register/by-invite')
  @ApiOperation({ summary: 'Đăng ký qua invite token (status=PENDING)' })
  @ApiBody({ type: RegisterByInviteDto })
  registerByInvite(@Body() dto: RegisterByInviteDto) {
    return this.authService.registerByInvite(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập, trả về accessToken + refreshToken' })
  @ApiBody({ type: LoginDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Lấy accessToken mới từ refreshToken' })
  @ApiBearerAuth()
  @ApiBody({ type: RefreshDto })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }
}
