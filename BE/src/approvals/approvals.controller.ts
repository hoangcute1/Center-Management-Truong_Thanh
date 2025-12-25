import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { ApproveUserDto } from './dto/approve-user.dto';
import type { RequestWithUser } from '../common/interfaces/request-with-user';

@ApiTags('admin-approvals')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('approvals')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Danh sách approval pending' })
  list() {
    return this.approvalsService.listPending();
  }

  @Post('approve-user')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Duyệt user đăng ký -> status ACTIVE' })
  approve(@Body() dto: ApproveUserDto, @Req() req: RequestWithUser) {
    return this.approvalsService.approveRegister(
      dto.userId,
      (req.user as any)?._id?.toString(),
    );
  }
}
